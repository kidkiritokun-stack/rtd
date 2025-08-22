const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readData, writeData, generateSlug } = require('../utils/dataStore');
const { validatePost, validatePostQuery } = require('../middleware/validation');
const { authenticateToken, requireAdmin, requireAuthorOrAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { sanitizeHTML, sanitizeCustomHTML, sanitizeCSS, sanitizeJS, validateContentSize } = require('../utils/sanitizer');

const router = express.Router();

// Get posts (public and authenticated)
router.get('/', validatePostQuery, asyncHandler(async (req, res) => {
  const { 
    offset = 0, 
    limit = 6, 
    contentType, 
    serviceCategory, 
    status, 
    q,
    authorId 
  } = req.query;

  const posts = await readData('posts');
  const authors = await readData('authors');

  let filteredPosts = posts;

  // Filter by status (public only sees approved)
  if (!req.user) {
    filteredPosts = filteredPosts.filter(post => post.status === 'approved');
  } else if (status) {
    filteredPosts = filteredPosts.filter(post => post.status === status);
  }

  // Filter by author (for author dashboard)
  if (authorId) {
    filteredPosts = filteredPosts.filter(post => post.authorId === authorId);
  }

  // Filter by content type
  if (contentType) {
    filteredPosts = filteredPosts.filter(post => post.contentType === contentType);
  }

  // Filter by service category
  if (serviceCategory) {
    filteredPosts = filteredPosts.filter(post => post.serviceCategory === serviceCategory);
  }

  // Search filter
  if (q) {
    const searchTerm = q.toLowerCase();
    filteredPosts = filteredPosts.filter(post => 
      post.title.toLowerCase().includes(searchTerm) ||
      post.excerpt.toLowerCase().includes(searchTerm) ||
      (post.template.defaultFields?.body && 
       post.template.defaultFields.body.toLowerCase().includes(searchTerm))
    );
  }

  // Sort by publishedAt (newest first) for approved posts, updatedAt for others
  filteredPosts.sort((a, b) => {
    const dateA = a.status === 'approved' ? a.publishedAt : a.updatedAt;
    const dateB = b.status === 'approved' ? b.publishedAt : b.updatedAt;
    return new Date(dateB) - new Date(dateA);
  });

  // Pagination
  const total = filteredPosts.length;
  const paginatedPosts = filteredPosts.slice(
    parseInt(offset), 
    parseInt(offset) + parseInt(limit)
  );

  // Add author information
  const postsWithAuthors = paginatedPosts.map(post => {
    const author = authors.find(a => a.id === post.authorId);
    return {
      ...post,
      author: author ? {
        id: author.id,
        fullName: author.fullName,
        avatarUrl: author.avatarUrl,
        bio: author.bio,
        social: author.social
      } : null
    };
  });

  res.json({
    posts: postsWithAuthors,
    pagination: {
      offset: parseInt(offset),
      limit: parseInt(limit),
      total,
      hasMore: parseInt(offset) + parseInt(limit) < total
    }
  });
}));

// Get single post by slug
router.get('/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const posts = await readData('posts');
  const authors = await readData('authors');
  
  const post = posts.find(p => p.slug === slug);

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // Check if user can view this post
  if (post.status !== 'approved' && !req.user) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (post.status !== 'approved' && req.user) {
    // Authors can only see their own non-approved posts
    if (req.user.role === 'author' && post.authorId !== req.user.id) {
      return res.status(404).json({ error: 'Post not found' });
    }
  }

  // Add author information
  const author = authors.find(a => a.id === post.authorId);
  const postWithAuthor = {
    ...post,
    author: author ? {
      id: author.id,
      fullName: author.fullName,
      avatarUrl: author.avatarUrl,
      bio: author.bio,
      social: author.social
    } : null
  };

  // Get related posts
  const relatedPosts = posts
    .filter(p => 
      p.status === 'approved' && 
      p.id !== post.id && 
      (post.relatedIds?.includes(p.id) || 
       p.contentType === post.contentType ||
       p.serviceCategory === post.serviceCategory)
    )
    .slice(0, 3)
    .map(p => {
      const relatedAuthor = authors.find(a => a.id === p.authorId);
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        banner: p.banner,
        contentType: p.contentType,
        serviceCategory: p.serviceCategory,
        publishedAt: p.publishedAt,
        author: relatedAuthor ? {
          fullName: relatedAuthor.fullName,
          avatarUrl: relatedAuthor.avatarUrl
        } : null
      };
    });

  res.json({
    post: postWithAuthor,
    relatedPosts
  });
}));

// Create new post
router.post('/', authenticateToken, requireAuthorOrAdmin, validatePost, asyncHandler(async (req, res) => {
  const {
    title,
    slug,
    excerpt,
    banner,
    contentType,
    serviceCategory,
    template,
    tags,
    relatedIds,
    seo
  } = req.body;

  const posts = await readData('posts');
  
  // Generate unique slug
  const finalSlug = slug || generateSlug(title, posts);
  
  // Check if slug is unique
  if (posts.some(post => post.slug === finalSlug)) {
    return res.status(400).json({ error: 'Slug already exists' });
  }

  // Validate and sanitize content based on template mode
  let sanitizedTemplate = { ...template };
  
  if (template.mode === 'default') {
    if (template.defaultFields?.body) {
      sanitizedTemplate.defaultFields.body = sanitizeHTML(template.defaultFields.body);
    }
  } else if (template.mode === 'custom') {
    const { html, css, js } = template.customFields || {};
    
    // Validate content sizes
    if (html && !validateContentSize(html, 'html')) {
      return res.status(400).json({ error: 'HTML content too large (max 100KB)' });
    }
    if (css && !validateContentSize(css, 'css')) {
      return res.status(400).json({ error: 'CSS content too large (max 50KB)' });
    }
    if (js && !validateContentSize(js, 'js')) {
      return res.status(400).json({ error: 'JavaScript content too large (max 25KB)' });
    }

    sanitizedTemplate.customFields = {
      html: html ? sanitizeCustomHTML(html) : '',
      css: css ? sanitizeCSS(css) : '',
      js: js ? sanitizeJS(js) : ''
    };
  }

  const newPost = {
    id: uuidv4(),
    title,
    slug: finalSlug,
    excerpt,
    banner,
    contentType,
    serviceCategory,
    status: 'draft',
    authorId: req.user.id,
    publishedAt: null,
    views: 0,
    template: sanitizedTemplate,
    tags: tags || [],
    relatedIds: relatedIds || [],
    seo: {
      title: seo?.title || title,
      description: seo?.description || excerpt,
      canonical: seo?.canonical || null
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  posts.push(newPost);
  await writeData('posts', posts);

  res.status(201).json(newPost);
}));

// Update post
router.put('/:id', authenticateToken, requireAuthorOrAdmin, validatePost, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const posts = await readData('posts');
  const postIndex = posts.findIndex(post => post.id === id);

  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const post = posts[postIndex];

  // Check permissions
  if (req.user.role === 'author') {
    // Authors can only edit their own posts
    if (post.authorId !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own posts' });
    }
    
    // Authors cannot edit approved posts
    if (post.status === 'approved') {
      return res.status(403).json({ error: 'Cannot edit approved posts' });
    }
  }

  // Check if slug is unique (if changed)
  if (updateData.slug && updateData.slug !== post.slug) {
    if (posts.some(p => p.slug === updateData.slug && p.id !== id)) {
      return res.status(400).json({ error: 'Slug already exists' });
    }
  }

  // Sanitize content
  let sanitizedTemplate = { ...updateData.template };
  
  if (updateData.template.mode === 'default') {
    if (updateData.template.defaultFields?.body) {
      sanitizedTemplate.defaultFields.body = sanitizeHTML(updateData.template.defaultFields.body);
    }
  } else if (updateData.template.mode === 'custom') {
    const { html, css, js } = updateData.template.customFields || {};
    
    // Validate content sizes
    if (html && !validateContentSize(html, 'html')) {
      return res.status(400).json({ error: 'HTML content too large (max 100KB)' });
    }
    if (css && !validateContentSize(css, 'css')) {
      return res.status(400).json({ error: 'CSS content too large (max 50KB)' });
    }
    if (js && !validateContentSize(js, 'js')) {
      return res.status(400).json({ error: 'JavaScript content too large (max 25KB)' });
    }

    sanitizedTemplate.customFields = {
      html: html ? sanitizeCustomHTML(html) : '',
      css: css ? sanitizeCSS(css) : '',
      js: js ? sanitizeJS(js) : ''
    };
  }

  // Update post
  const updatedPost = {
    ...post,
    ...updateData,
    template: sanitizedTemplate,
    seo: {
      title: updateData.seo?.title || updateData.title,
      description: updateData.seo?.description || updateData.excerpt,
      canonical: updateData.seo?.canonical || null
    },
    updatedAt: new Date().toISOString()
  };

  posts[postIndex] = updatedPost;
  await writeData('posts', posts);

  res.json(updatedPost);
}));

// Delete post (admin only)
router.delete('/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const posts = await readData('posts');
  const postIndex = posts.findIndex(post => post.id === id);

  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  posts.splice(postIndex, 1);
  await writeData('posts', posts);

  res.json({ success: true });
}));

// Submit post for approval
router.post('/:id/submit', authenticateToken, requireAuthorOrAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const posts = await readData('posts');
  const postIndex = posts.findIndex(post => post.id === id);

  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const post = posts[postIndex];

  // Check permissions
  if (req.user.role === 'author' && post.authorId !== req.user.id) {
    return res.status(403).json({ error: 'You can only submit your own posts' });
  }

  if (post.status !== 'draft' && post.status !== 'rejected') {
    return res.status(400).json({ error: 'Only draft or rejected posts can be submitted' });
  }

  post.status = 'pending_approval';
  post.updatedAt = new Date().toISOString();

  posts[postIndex] = post;
  await writeData('posts', posts);

  res.json(post);
}));

// Approve post (admin only)
router.post('/:id/approve', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const posts = await readData('posts');
  const postIndex = posts.findIndex(post => post.id === id);

  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const post = posts[postIndex];

  if (post.status !== 'pending_approval') {
    return res.status(400).json({ error: 'Only pending posts can be approved' });
  }

  post.status = 'approved';
  post.publishedAt = new Date().toISOString();
  post.updatedAt = new Date().toISOString();

  posts[postIndex] = post;
  await writeData('posts', posts);

  res.json(post);
}));

// Reject post (admin only)
router.post('/:id/reject', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const posts = await readData('posts');
  const postIndex = posts.findIndex(post => post.id === id);

  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const post = posts[postIndex];

  if (post.status !== 'pending_approval') {
    return res.status(400).json({ error: 'Only pending posts can be rejected' });
  }

  post.status = 'rejected';
  post.rejectionReason = reason || 'No reason provided';
  post.updatedAt = new Date().toISOString();

  posts[postIndex] = post;
  await writeData('posts', posts);

  res.json(post);
}));

// Increment view count
router.post('/:id/view', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const posts = await readData('posts');
  const postIndex = posts.findIndex(post => post.id === id);

  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const post = posts[postIndex];
  
  // Only count views for approved posts
  if (post.status !== 'approved') {
    return res.status(400).json({ error: 'Can only track views for approved posts' });
  }

  post.views = (post.views || 0) + 1;
  post.updatedAt = new Date().toISOString();

  posts[postIndex] = post;
  await writeData('posts', posts);

  res.json({ views: post.views });
}));

module.exports = router;