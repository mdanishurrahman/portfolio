const express = require('express');
const Media = require('../models/Media');

const router = express.Router();

// GET /api/media/:id - Decode Base64 image stored in MongoDB and serve with proper Content-Type
router.get('/:id', async (req, res) => {
  try {
    const doc = await Media.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Image not found' });
    }
    const buf = Buffer.from(doc.base64, 'base64');
    res.set('Content-Type', doc.mimetype);
    res.set('Cache-Control', 'public, max-age=31536000');
    res.send(buf);
  } catch {
    res.status(404).json({ error: 'Invalid media ID' });
  }
});

module.exports = router;
