const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/dataStore');
const { validateAuthor } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

// Get all authors
router.get('/', asyncHandler(async (req, res) => {
  const authors = await readData('authors');
  
  // Remove password hashes from response
  const safeAuthors = authors.map(author => {
    const { passwordHash, ...safeAuthor } = author;
    return safeAuthor;
  });

  res.json(safeAuthors);
}));

// Create new author
router.post('/', validateAuthor, asyncHandler(async (req, res) => {
  const { username, fullName, password, bio, avatarUrl, role, social } = req.body;

  const authors = await readData('authors');
  
  // Check if username already exists
  if (authors.some(author => author.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  
  const newAuthor = {
    id: uuidv4(),
    username,
    passwordHash,
    fullName,
    designation: req.body.designation || '',
    bio: bio || '',
    avatarUrl: avatarUrl || null,
    role,
    social: {
      instagram: social?.instagram || null,
      youtube: social?.youtube || null,
      x: social?.x || null,
      facebook: social?.facebook || null,
      linkedin: social?.linkedin || null,
      website: social?.website || null,
      email: social?.email || null
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    active: true
  };

  authors.push(newAuthor);
  await writeData('authors', authors);

  // Remove password hash from response
  const { passwordHash: _, ...safeAuthor } = newAuthor;
  res.status(201).json(safeAuthor);
}));

// Update author
router.put('/:id', validateAuthor, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username, fullName, password, bio, avatarUrl, role, social, active } = req.body;

  const authors = await readData('authors');
  const authorIndex = authors.findIndex(author => author.id === id);

  if (authorIndex === -1) {
    return res.status(404).json({ error: 'Author not found' });
  }

  // Check if username is taken by another author
  if (authors.some(author => author.username === username && author.id !== id)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const author = authors[authorIndex];
  
  // Update fields
  author.username = username;
  author.fullName = fullName;
  author.designation = req.body.designation || '';
  author.bio = bio || '';
  author.avatarUrl = avatarUrl || null;
  author.role = role;
  author.social = {
    instagram: social?.instagram || null,
    youtube: social?.youtube || null,
    x: social?.x || null,
    facebook: social?.facebook || null,
    linkedin: social?.linkedin || null,
    website: social?.website || null,
    email: social?.email || null
  };
  author.active = active !== undefined ? active : author.active;
  author.updatedAt = new Date().toISOString();

  // Update password if provided
  if (password) {
    author.passwordHash = await bcrypt.hash(password, 12);
  }

  await writeData('authors', authors);

  // Remove password hash from response
  const { passwordHash: _, ...safeAuthor } = author;
  res.json(safeAuthor);
}));

// Delete author
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const authors = await readData('authors');
  const authorIndex = authors.findIndex(author => author.id === id);

  if (authorIndex === -1) {
    return res.status(404).json({ error: 'Author not found' });
  }

  // Prevent deleting yourself if you're the only admin
  const author = authors[authorIndex];
  if (author.id === req.user.id) {
    const adminCount = authors.filter(a => a.role === 'admin' && a.active).length;
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last active admin' });
    }
  }

  // Check if author has posts
  const posts = await readData('posts');
  const authorPosts = posts.filter(post => post.authorId === id);
  
  if (authorPosts.length > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete author with existing posts',
      postCount: authorPosts.length
    });
  }

  authors.splice(authorIndex, 1);
  await writeData('authors', authors);

  res.json({ success: true });
}));

module.exports = router;