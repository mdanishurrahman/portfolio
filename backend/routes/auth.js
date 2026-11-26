const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const Admin = require('../models/Admin');
const { getSecret, parseCookieToken } = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
});

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a || ''));
  const bufB = Buffer.from(String(b || ''));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const cleanUser = String(username || '').trim().toLowerCase();
    const cleanPass = String(password || '');

    if (!cleanUser || !cleanPass) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const admin = await Admin.findOne({ username: cleanUser });
    let valid = false;

    if (admin) {
      valid = admin.verifyPassword(cleanPass);
    } else {
      // Fallback to env credentials only if no admin document exists yet
      const envUser = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
      const envPass = process.env.ADMIN_PASSWORD || '';
      valid = Boolean(envPass) && safeEqual(cleanUser, envUser) && safeEqual(cleanPass, envPass);
    }

    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ role: 'admin', username: cleanUser }, getSecret(), {
      expiresIn: '24h',
    });

    res.cookie('admin_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ ok: true, username: cleanUser, token });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const token = bearer || parseCookieToken(req.headers.cookie);

  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const decoded = jwt.verify(token, getSecret());
    if (decoded.role !== 'admin') {
      return res.status(403).json({ authenticated: false });
    }
    res.json({ authenticated: true, username: decoded.username });
  } catch {
    res.status(401).json({ authenticated: false });
  }
});

module.exports = router;
