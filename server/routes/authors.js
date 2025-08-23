const express = require('express');
const bcrypt = require('bcryptjs');
const { readData, writeData, updateData, deleteData, findOne, uuidv4, getSupabaseClient } = require('../utils/dataStore');
const { validateAuthor } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
const supabase = getSupabaseClient();

// All routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

// Get all authors
router.get('/', asyncHandler(async (req, res) => {
  const { data: authors, error } = await supabase
    .from('authors')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }
  
  // Remove password hashes from response
  const safeAuthors = authors.map(author => {
    const { password_hash, ...safeAuthor } = author;
    return safeAuthor;
  });

  res.json(safeAuthors);
}));

// Create new author
router.post('/', validateAuthor, asyncHandler(async (req, res) => {
  const { 
    username, 
    fullName, 
    password, 
    designation,
    bio, 
    avatarUrl, 
    role, 
    social 
  } = req.body;

  // Check if username already exists
  const existingUser = await findOne('authors', 'username', username);
  if (existingUser) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  
  const newAuthor = {
    id: uuidv4(),
    username,
    password_hash: passwordHash,
    full_name: fullName,
    designation: designation || '',
    bio: bio || '',
    avatar_url: avatarUrl || null,
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    active: true
  };

  await writeData('authors', newAuthor);

  // Remove password hash from response
  const { password_hash: _, ...safeAuthor } = newAuthor;
  res.status(201).json(safeAuthor);
}));

// Update author
router.put('/:id', validateAuthor, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    username, 
    fullName, 
    password, 
    designation,
    bio, 
    avatarUrl, 
    role, 
    social, 
    active 
  } = req.body;

  // Check if author exists
  const { data: existingAuthor, error: findError } = await supabase
    .from('authors')
    .select('*')
    .eq('id', id)
    .single();

  if (findError || !existingAuthor) {
    return res.status(404).json({ error: 'Author not found' });
  }

  // Check if username is taken by another author
  const { data: usernameCheck } = await supabase
    .from('authors')
    .select('id')
    .eq('username', username)
    .neq('id', id)
    .single();

  if (usernameCheck) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  // Prepare update data
  const updateFields = {
    username,
    full_name: fullName,
    designation: designation || '',
    bio: bio || '',
    avatar_url: avatarUrl || null,
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
    active: active !== undefined ? active : existingAuthor.active,
    updated_at: new Date().toISOString()
  };

  // Update password if provided
  if (password) {
    updateFields.password_hash = await bcrypt.hash(password, 12);
  }

  const { error } = await supabase
    .from('authors')
    .update(updateFields)
    .eq('id', id);

  if (error) {
    throw error;
  }

  // Get updated author
  const { data: updatedAuthor } = await supabase
    .from('authors')
    .select('*')
    .eq('id', id)
    .single();

  // Remove password hash from response
  const { password_hash: _, ...safeAuthor } = updatedAuthor;
  res.json(safeAuthor);
}));

// Delete author
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if author exists
  const { data: author, error: findError } = await supabase
    .from('authors')
    .select('*')
    .eq('id', id)
    .single();

  if (findError || !author) {
    return res.status(404).json({ error: 'Author not found' });
  }

  // Prevent deleting yourself if you're the only admin
  if (author.id === req.user.id) {
    const { data: admins } = await supabase
      .from('authors')
      .select('id')
      .eq('role', 'admin')
      .eq('active', true);

    if (admins.length <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last active admin' });
    }
  }

  // Check if author has posts
  const { data: authorPosts } = await supabase
    .from('posts')
    .select('id')
    .eq('author_id', id);
  
  if (authorPosts && authorPosts.length > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete author with existing posts',
      postCount: authorPosts.length
    });
  }

  const { error } = await supabase
    .from('authors')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }

  res.json({ success: true });
}));

module.exports = router;