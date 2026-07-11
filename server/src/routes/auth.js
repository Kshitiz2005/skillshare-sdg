const express = require('express');
const router = express.Router();
const admin = require('../config/firebaseAdmin');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Called right after Firebase client-side sign up.
 * Verifies the ID token, then creates (or fetches) the matching Mongo profile.
 */
router.post('/register', async (req, res) => {
  try {
    const { token, role, displayName, timezone } = req.body;
    if (!token || !role || !displayName) {
      return res.status(400).json({ error: 'token, role, and displayName are required' });
    }
    if (!['mentor', 'mentee'].includes(role)) {
      return res.status(400).json({ error: 'role must be mentor or mentee' });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    let user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid,
        email: decoded.email,
        displayName,
        role,
        timezone: timezone || 'UTC',
      });
    }

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * GET /api/auth/me
 * Returns the logged-in user's own profile.
 */
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

module.exports = router;
