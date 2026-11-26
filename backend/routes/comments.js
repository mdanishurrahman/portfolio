const crypto = require('crypto');
const express = require('express');
const rateLimit = require('express-rate-limit');
const Comment = require('../models/Comment');

const router = express.Router();

// Very strict rate limiting for anonymous/unauthenticated comments:
// 1) Burst cooldown: max 1 comment every 60 seconds per IP
const commentCooldownLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Please wait 60 seconds before posting another comment.',
  },
});

// 2) Window cap: max 2 comments every 15 minutes per IP
const commentWindowLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Rate limit reached: maximum 2 comments allowed per 15 minutes.',
  },
});

function hashIp(req) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

// GET /api/comments - Fetch approved visitor comments
router.get('/', async (req, res) => {
  try {
    const comments = await Comment.find({ approved: { $ne: false } })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('name role comment createdAt');
    res.json(comments);
  } catch {
    res.status(500).json({ error: 'Failed to load comments' });
  }
});

// POST /api/comments - Public comment (no account required, strictly rate-limited)
router.post('/', commentCooldownLimiter, commentWindowLimiter, async (req, res) => {
  try {
    const { name, role, comment } = req.body || {};
    const cleanName = String(name || '').trim();
    const cleanRole = String(role || '').trim() || 'Visitor';
    const cleanComment = String(comment || '').trim();

    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ error: 'Please enter a valid name (at least 2 characters).' });
    }
    if (!cleanComment || cleanComment.length < 3) {
      return res.status(400).json({ error: 'Comment must be at least 3 characters.' });
    }

    const ipHash = hashIp(req);
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const duplicate = await Comment.findOne({
      ipHash,
      comment: cleanComment,
      createdAt: { $gte: tenMinAgo },
    });
    if (duplicate) {
      return res.status(429).json({ error: 'Duplicate comment detected. Please wait before posting again.' });
    }

    const created = await Comment.create({
      name: cleanName,
      role: cleanRole,
      comment: cleanComment,
      approved: true,
      ipHash,
    });

    res.status(201).json({
      _id: created._id,
      name: created.name,
      role: created.role,
      comment: created.comment,
      createdAt: created.createdAt,
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to save comment' });
  }
});

module.exports = router;
