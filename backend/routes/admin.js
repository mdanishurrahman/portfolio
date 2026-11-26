const express = require('express');
const multer = require('multer');
const { requireAdmin } = require('../middleware/auth');
const Project = require('../models/Project');
const BlogPost = require('../models/BlogPost');
const Comment = require('../models/Comment');
const Contact = require('../models/Contact');
const SiteSettings = require('../models/SiteSettings');
const Album = require('../models/Album');
const Photo = require('../models/Photo');
const Media = require('../models/Media');

const router = express.Router();

// Store uploaded images in memory and persist as Base64 in MongoDB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max per image for MongoDB Base64
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files (JPG, PNG, WEBP, GIF, SVG) are allowed'));
  },
});

router.use(requireAdmin);

// POST /api/admin/upload - Store image as Base64 in MongoDB Media collection
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    const base64 = req.file.buffer.toString('base64');
    const saved = await Media.create({
      filename: req.file.originalname || 'upload.png',
      mimetype: req.file.mimetype,
      size: req.file.size,
      base64,
    });
    res.status(201).json({
      ok: true,
      id: saved._id,
      url: `/api/media/${saved._id}`,
      filename: saved.filename,
      size: saved.size,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to save image to database' });
  }
});

// GET /api/admin/dashboard - Full snapshot for Control Center
router.get('/dashboard', async (req, res) => {
  try {
    const [projects, blogs, comments, contacts, settings, albums, photos] = await Promise.all([
      Project.find().sort({ order: 1, createdAt: -1 }),
      BlogPost.find().sort({ featured: -1, createdAt: -1 }),
      Comment.find().sort({ createdAt: -1 }),
      Contact.find().sort({ createdAt: -1 }),
      SiteSettings.findOne({ key: 'main' }),
      Album.find().sort({ order: 1, createdAt: -1 }),
      Photo.find().populate('albumId', 'title').sort({ createdAt: -1 }),
    ]);

    const unreadContacts = contacts.filter((c) => c.status === 'unread').length;

    res.json({
      stats: {
        projects: projects.length,
        blogs: blogs.length,
        comments: comments.length,
        contacts: contacts.length,
        unreadContacts,
        albums: albums.length,
        photos: photos.length,
      },
      projects,
      blogs,
      comments,
      contacts,
      settings,
      albums,
      photos,
    });
  } catch {
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// ---- PROJECTS CRUD ----
router.post('/projects', async (req, res) => {
  try {
    const { title, category, image, description, order } = req.body;
    const created = await Project.create({ title, category, image, description, order: order || 0 });
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/projects/:id', async (req, res) => {
  try {
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Project not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/projects/:id', async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Project not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---- BLOG POSTS CRUD ----
router.post('/blogs', async (req, res) => {
  try {
    const { title, excerpt, image, dateLabel, featured } = req.body;
    const created = await BlogPost.create({ title, excerpt, image, dateLabel, featured: Boolean(featured) });
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/blogs/:id', async (req, res) => {
  try {
    const updated = await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Blog post not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/blogs/:id', async (req, res) => {
  try {
    const deleted = await BlogPost.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Blog post not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---- ALBUMS & PHOTOS CRUD ----
router.post('/albums', async (req, res) => {
  try {
    const { title, category, description, coverImage, order } = req.body;
    const created = await Album.create({ title, category, description, coverImage, order: order || 0 });
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/albums/:id', async (req, res) => {
  try {
    const deleted = await Album.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Album not found' });
    await Photo.deleteMany({ albumId: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/photos', async (req, res) => {
  try {
    const { albumId, title, caption, imageUrl } = req.body;
    const created = await Photo.create({ albumId, title, caption, imageUrl });
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/photos/:id', async (req, res) => {
  try {
    const deleted = await Photo.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Photo not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---- COMMENTS MODERATION ----
router.patch('/comments/:id', async (req, res) => {
  try {
    const updated = await Comment.findByIdAndUpdate(
      req.params.id,
      { approved: Boolean(req.body.approved) },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Comment not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/comments/:id', async (req, res) => {
  try {
    const deleted = await Comment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Comment not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---- CONTACTS MANAGEMENT ----
router.patch('/contacts/:id', async (req, res) => {
  try {
    const updated = await Contact.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Message not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/contacts/:id', async (req, res) => {
  try {
    const deleted = await Contact.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Message not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---- SITE SETTINGS & USER PROFILE ----
router.put('/settings', async (req, res) => {
  try {
    const updated = await SiteSettings.findOneAndUpdate(
      { key: 'main' },
      { $set: req.body },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
