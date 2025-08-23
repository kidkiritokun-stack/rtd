const { body, query, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Auth validation
const validateLogin = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

// Author validation
const validateAuthor = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-50 characters, alphanumeric and underscore only'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be 2-100 characters'),
  body('designation')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Designation must be less than 100 characters'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('avatarUrl')
    .optional()
    .isURL()
    .withMessage('Avatar URL must be valid'),
  body('role')
    .isIn(['admin', 'author'])
    .withMessage('Role must be admin or author'),
  body('social.instagram')
    .optional()
    .isURL()
    .withMessage('Instagram URL must be valid'),
  body('social.youtube')
    .optional()
    .isURL()
    .withMessage('YouTube URL must be valid'),
  body('social.x')
    .optional()
    .isURL()
    .withMessage('X URL must be valid'),
  body('social.facebook')
    .optional()
    .isURL()
    .withMessage('Facebook URL must be valid'),
  body('social.linkedin')
    .optional()
    .isURL()
    .withMessage('LinkedIn URL must be valid'),
  body('social.website')
    .optional()
    .isURL()
    .withMessage('Website URL must be valid'),
  body('social.email')
    .optional()
    .isEmail()
    .withMessage('Email must be valid'),
  handleValidationErrors
];

// Post validation
const validatePost = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be 5-200 characters'),
  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('excerpt')
    .trim()
    .isLength({ min: 10, max: 300 })
    .withMessage('Excerpt must be 10-300 characters'),
  body('banner.url')
    .isURL()
    .withMessage('Banner URL must be valid'),
  body('banner.alt')
    .trim()
    .isLength({ min: 5, max: 125 })
    .withMessage('Banner alt text must be 5-125 characters'),
  body('contentType')
    .isIn(['Blog Posts', 'Case Studies', 'User Interview', 'Quantitative Research', 'Competitors Research'])
    .withMessage('Invalid content type'),
  body('serviceCategory')
    .isIn(['Meta & Google Ads', 'First Party Data', 'CRO', 'High Performing Creatives', 'Retention Marketing', 'Other'])
    .withMessage('Invalid service category'),
  body('template.mode')
    .isIn(['default', 'custom'])
    .withMessage('Template mode must be default or custom'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Each tag must be 2-30 characters'),
  body('seo.title')
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage('SEO title must be less than 60 characters'),
  body('seo.description')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('SEO description must be less than 160 characters'),
  handleValidationErrors
];

// Contact validation
const validateContact = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Invalid phone number format'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Company name must be less than 255 characters'),
  body('message')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be 10-1000 characters'),
  handleValidationErrors
];

// Challenge validation
const validateChallenge = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('company')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Company name must be 2-255 characters'),
  body('challenge')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Challenge must be 10-1000 characters'),
  handleValidationErrors
];

// Inquiry validation
const validateInquiry = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Invalid phone number format'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Company name must be less than 255 characters'),
  body('subject')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Subject must be less than 255 characters'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be 10-1000 characters'),
  handleValidationErrors
];

// Newsletter validation
const validateNewsletter = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),
  handleValidationErrors
];

// Query validation
const validatePostQuery = [
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('contentType')
    .optional()
    .isIn(['Blog Posts', 'Case Studies', 'User Interview', 'Quantitative Research', 'Competitors Research'])
    .withMessage('Invalid content type'),
  query('serviceCategory')
    .optional()
    .isIn(['Meta & Google Ads', 'First Party Data', 'CRO', 'High Performing Creatives', 'Retention Marketing', 'Other'])
    .withMessage('Invalid service category'),
  query('status')
    .optional()
    .isIn(['draft', 'pending_approval', 'approved', 'rejected'])
    .withMessage('Invalid status'),
  query('q')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query must be less than 100 characters'),
  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateAuthor,
  validatePost,
  validateContact,
  validateChallenge,
  validateInquiry,
  validateNewsletter,
  validatePostQuery,
  handleValidationErrors
};