const jwt = require('jsonwebtoken');
const { findOne } = require('../utils/dataStore');

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies[process.env.COOKIE_NAME || 'cms_auth'];
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await findOne('authors', 'id', decoded.userId);

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireAuthorOrAdmin = (req, res, next) => {
  if (!['admin', 'author'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Author or admin access required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAuthorOrAdmin
};