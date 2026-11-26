const jwt = require('jsonwebtoken');

function getSecret() {
  return process.env.JWT_SECRET || 'fallback_dev_secret_change_in_env';
}

function parseCookieToken(cookieHeader) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [k, ...v] = part.trim().split('=');
    if (k === 'admin_token') {
      return decodeURIComponent(v.join('='));
    }
  }
  return null;
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const token = bearer || parseCookieToken(req.headers.cookie);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, getSecret());
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

module.exports = { requireAdmin, getSecret, parseCookieToken };
