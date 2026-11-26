const express = require('express');
const Contact = require('../models/Contact');

const router = express.Router();

// POST /api/contact - Save contact form submission
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !name.trim() || !email || !email.trim() || !message || !message.trim()) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const saved = await Contact.create({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });

    res.status(201).json({
      ok: true,
      message: 'Message received successfully',
      data: saved,
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to submit contact form' });
  }
});

module.exports = router;
