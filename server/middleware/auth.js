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

// Optional authentication - populates req.user if valid token exists, but doesn't fail if not
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies[process.env.COOKIE_NAME || 'cms_auth'];

    if (!token) {
      // No token, continue as unauthenticated user
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await findOne('authors', 'id', decoded.userId);

    if (user && user.active) {
      req.user = {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role
      };
    }

    next();
  } catch (error) {
    // Token invalid, continue as unauthenticated user
    console.log('Optional auth failed:', error.message);
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAuthorOrAdmin,
  optionalAuth
};
