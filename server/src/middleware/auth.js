const admin = require('../config/firebaseAdmin');
const User = require('../models/User');

/**
 * Verifies the Firebase ID token sent in the Authorization header
 * ("Bearer <token>") and attaches the corresponding Mongo user
 * document to req.user. Rejects with 401 if invalid/missing.
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing authentication token' });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const user = await User.findOne({ firebaseUid: decoded.uid });

    if (!user) {
      return res.status(401).json({ error: 'User not registered in database' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Restricts a route to specific roles, e.g. requireRole('mentor')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
