const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readData } = require('../utils/dataStore');
const { validateLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Login
router.post('/login', validateLogin, asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const authors = await readData('authors');
  const user = authors.find(author => 
    author.username === username && author.active
  );

  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie(process.env.COOKIE_NAME || 'cms_auth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role
    }
  });
}));

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie(process.env.COOKIE_NAME || 'cms_auth');
  res.json({ success: true });
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: req.user
  });
});

module.exports = router;