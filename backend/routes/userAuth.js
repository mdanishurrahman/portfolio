const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { getSecret } = require('../middleware/auth');

const router = express.Router();

const userAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again after 15 minutes.' },
});

function parseUserCookie(cookieHeader) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === 'user_token') return decodeURIComponent(v.join('='));
  }
  return null;
}

// POST /api/user/register
router.post('/register', userAuthLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPass = String(password || '');

    if (cleanName.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (cleanPass.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const exists = await User.findOne({ email: cleanEmail });
    if (exists) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      passwordHash: User.hashPassword(cleanPass),
    });

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: 'user' },
      getSecret(),
      { expiresIn: '7d' }
    );

    res.cookie('user_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      ok: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

// POST /api/user/login
router.post('/login', userAuthLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPass = String(password || '');

    const user = await User.findOne({ email: cleanEmail });
    if (!user || !user.verifyPassword(cleanPass)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: 'user' },
      getSecret(),
      { expiresIn: '7d' }
    );

    res.cookie('user_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      ok: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/user/logout
router.post('/logout', (req, res) => {
  res.clearCookie('user_token');
  res.json({ ok: true });
});

// GET /api/user/me
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const token = bearer || parseUserCookie(req.headers.cookie);

  if (!token) {
    return res.status(401).json({ authenticated: false });
  }
  try {
    const decoded = jwt.verify(token, getSecret());
    res.json({
      authenticated: true,
      user: { id: decoded.id, name: decoded.name, email: decoded.email },
    });
  } catch {
    res.status(401).json({ authenticated: false });
  }
});

module.exports = router;
