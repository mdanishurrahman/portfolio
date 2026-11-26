const express = require('express');
const Project = require('../models/Project');
const BlogPost = require('../models/BlogPost');
const SiteSettings = require('../models/SiteSettings');
const Album = require('../models/Album');
const Photo = require('../models/Photo');

const router = express.Router();

// GET /api/public/data - Public portfolio projects, blog posts, settings/profile, and gallery
router.get('/data', async (req, res) => {
  try {
    const [projects, blogs, settings, albums, photos] = await Promise.all([
      Project.find().sort({ order: 1, createdAt: -1 }),
      BlogPost.find().sort({ featured: -1, createdAt: -1 }),
      SiteSettings.findOne({ key: 'main' }),
      Album.find().sort({ order: 1, createdAt: -1 }),
      Photo.find().populate('albumId', 'title').sort({ createdAt: -1 }),
    ]);
    res.json({ projects, blogs, settings, albums, photos });
  } catch {
    res.status(500).json({ error: 'Failed to load public data' });
  }
});

// GET /api/public/gallery - Albums and Photos (optionally filtered by albumId)
router.get('/gallery', async (req, res) => {
  try {
    const filter = req.query.albumId ? { albumId: req.query.albumId } : {};
    const [albums, photos, settings] = await Promise.all([
      Album.find().sort({ order: 1, createdAt: -1 }),
      Photo.find(filter).populate('albumId', 'title').sort({ createdAt: -1 }),
      SiteSettings.findOne({ key: 'main' }),
    ]);
    res.json({ albums, photos, profile: settings });
  } catch {
    res.status(500).json({ error: 'Failed to load gallery' });
  }
});

// GET /api/public/blogs/:idOrSlug - Single blog article + related posts
router.get('/blogs/:idOrSlug', async (req, res) => {
  try {
    const key = req.params.idOrSlug;
    let post = null;
    if (/^[0-9a-fA-F]{24}$/.test(key)) {
      post = await BlogPost.findById(key);
    }
    if (!post) {
      post = await BlogPost.findOne({ slug: key.toLowerCase() });
    }
    if (!post) {
      const all = await BlogPost.find();
      post = all.find(
        (b) =>
          b.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') === key.toLowerCase()
      );
    }
    if (!post) return res.status(404).json({ error: 'Blog post not found' });

    const related = await BlogPost.find({ _id: { $ne: post._id } })
      .sort({ createdAt: -1 })
      .limit(3);

    res.json({ post, related });
  } catch {
    res.status(500).json({ error: 'Failed to load blog post' });
  }
});

module.exports = router;
