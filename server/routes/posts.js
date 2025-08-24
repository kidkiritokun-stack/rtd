const express = require('express');
const { writeData, updateData, deleteData, findOne, generateSlug, uuidv4, getSupabaseClient } = require('../utils/dataStore');
const { validatePost, validatePostQuery } = require('../middleware/validation');
const { authenticateToken, requireAdmin, requireAuthorOrAdmin, optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { sanitizeHTML, sanitizeCustomHTML, sanitizeCSS, sanitizeJS, validateContentSize } = require('../utils/sanitizer');

const router = express.Router();
const supabase = getSupabaseClient();

// Get posts (public and authenticated)
router.get('/', optionalAuth, validatePostQuery, asyncHandler(async (req, res) => {
  const { 
    offset = 0, 
    limit = 6, 
    contentType, 
    serviceCategory, 
    status, 
    q,
    authorId 
  } = req.query;

  let query = supabase
    .from('posts')
    .select(`
      *,
      authors!posts_author_id_fkey (
        id,
        full_name,
        avatar_url,
        bio,
        social,
        designation
      )
    `);

  // Filter by status (public only sees approved)
  if (!req.user) {
    query = query.eq('status', 'approved');
  } else if (status) {
    query = query.eq('status', status);
  }

  // Filter by author (for author dashboard)
  if (authorId) {
    query = query.eq('author_id', authorId);
  }

  // Filter by content type
  if (contentType) {
    query = query.eq('content_type', contentType);
  }

  // Filter by service category
  if (serviceCategory) {
    query = query.eq('service_category', serviceCategory);
  }

  // Search filter
  if (q) {
    query = query.or(`title.ilike.%${q}%, excerpt.ilike.%${q}%`);
  }

  // Order by published date for approved posts, updated date for others
  if (!req.user || status !== 'approved') {
    query = query.order('updated_at', { ascending: false });
  } else {
    query = query.order('published_at', { ascending: false });
  }

  // Get total count for pagination
  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });

  // Apply pagination
  query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

  const { data: posts, error } = await query;

  if (error) {
    throw error;
  }

  // Transform data to match frontend expectations
  const transformedPosts = posts.map(post => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    banner: post.banner,
    contentType: post.content_type,
    serviceCategory: post.service_category,
    status: post.status,
    authorId: post.author_id,
    publishedAt: post.published_at,
    views: post.views,
    template: post.template,
    tags: post.tags,
    relatedIds: post.related_ids,
    seo: post.seo,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    author: post.authors ? {
      id: post.authors.id,
      fullName: post.authors.full_name,
      avatarUrl: post.authors.avatar_url,
      bio: post.authors.bio,
      social: post.authors.social,
      designation: post.authors.designation
    } : null
  }));

  res.json({
    posts: transformedPosts,
    pagination: {
      offset: parseInt(offset),
      limit: parseInt(limit),
      total: count || 0,
      hasMore: parseInt(offset) + parseInt(limit) < (count || 0)
    }
  });
}));

// Get single post by slug
router.get('/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      authors!posts_author_id_fkey (
        id,
        full_name,
        avatar_url,
        bio,
        social,
        designation
      )
    `)
    .eq('slug', slug)
    .single();

  if (error || !post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // Check if user can view this post
  if (post.status !== 'approved' && !req.user) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (post.status !== 'approved' && req.user) {
    // Authors can only see their own non-approved posts
    if (req.user.role === 'author' && post.author_id !== req.user.id) {
      return res.status(404).json({ error: 'Post not found' });
    }
  }

  // Get related posts
  const { data: relatedPosts } = await supabase
    .from('posts')
    .select(`
      id, title, slug, excerpt, banner, content_type, service_category, published_at,
      authors!posts_author_id_fkey (full_name, avatar_url)
    `)
    .eq('status', 'approved')
    .neq('id', post.id)
    .limit(3);

  // Transform post data
  const transformedPost = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    banner: post.banner,
    contentType: post.content_type,
    serviceCategory: post.service_category,
    status: post.status,
    authorId: post.author_id,
    publishedAt: post.published_at,
    views: post.views,
    template: post.template,
    tags: post.tags,
    relatedIds: post.related_ids,
    seo: post.seo,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    author: post.authors ? {
      id: post.authors.id,
      fullName: post.authors.full_name,
      avatarUrl: post.authors.avatar_url,
      bio: post.authors.bio,
      social: post.authors.social,
      designation: post.authors.designation
    } : null
  };

  // Transform related posts
  const transformedRelatedPosts = relatedPosts ? relatedPosts.map(p => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    banner: p.banner,
    contentType: p.content_type,
    serviceCategory: p.service_category,
    publishedAt: p.published_at,
    author: p.authors ? {
      fullName: p.authors.full_name,
      avatarUrl: p.authors.avatar_url
    } : null
  })) : [];

  res.json({
    post: transformedPost,
    relatedPosts: transformedRelatedPosts
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

  // Generate unique slug
  const finalSlug = slug || await generateSlug(title, 'posts');
  
  // Check if slug is unique
  const existingPost = await findOne('posts', 'slug', finalSlug);
  if (existingPost) {
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
    content_type: contentType,
    service_category: serviceCategory,
    status: 'draft',
    author_id: req.user.id,
    published_at: null,
    views: 0,
    template: sanitizedTemplate,
    tags: tags || [],
    related_ids: relatedIds || [],
    seo: {
      title: seo?.title || title,
      description: seo?.description || excerpt,
      canonical: seo?.canonical || null
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  await writeData('posts', newPost);

  res.status(201).json(newPost);
}));

// Update post
router.put('/:id', authenticateToken, requireAuthorOrAdmin, validatePost, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // Check permissions
  if (req.user.role === 'author') {
    // Authors can only edit their own posts
    if (post.author_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own posts' });
    }
    
    // Authors cannot edit approved posts
    if (post.status === 'approved') {
      return res.status(403).json({ error: 'Cannot edit approved posts' });
    }
  }

  // Check if slug is unique (if changed)
  if (updateData.slug && updateData.slug !== post.slug) {
    const existingPost = await findOne('posts', 'slug', updateData.slug);
    if (existingPost && existingPost.id !== id) {
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
  const updateFields = {
    title: updateData.title,
    slug: updateData.slug || post.slug,
    excerpt: updateData.excerpt,
    banner: updateData.banner,
    content_type: updateData.contentType,
    service_category: updateData.serviceCategory,
    template: sanitizedTemplate,
    tags: updateData.tags || [],
    related_ids: updateData.relatedIds || [],
    seo: {
      title: updateData.seo?.title || updateData.title,
      description: updateData.seo?.description || updateData.excerpt,
      canonical: updateData.seo?.canonical || null
    },
    updated_at: new Date().toISOString()
  };

  const { error: updateError } = await supabase
    .from('posts')
    .update(updateFields)
    .eq('id', id);

  if (updateError) {
    throw updateError;
  }

  // Get updated post
  const { data: updatedPost } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  res.json(updatedPost);
}));

// Delete post (admin only)
router.delete('/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: post, error: findError } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (findError || !post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }

  res.json({ success: true });
}));

// Submit post for approval
router.post('/:id/submit', authenticateToken, requireAuthorOrAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // Check permissions
  if (req.user.role === 'author' && post.author_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only submit your own posts' });
  }

  if (post.status !== 'draft' && post.status !== 'rejected') {
    return res.status(400).json({ error: 'Only draft or rejected posts can be submitted' });
  }

  const { error: updateError } = await supabase
    .from('posts')
    .update({ 
      status: 'pending_approval',
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (updateError) {
    throw updateError;
  }

  // Get updated post
  const { data: updatedPost } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  res.json(updatedPost);
}));

// Approve post (admin only)
router.post('/:id/approve', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (post.status !== 'pending_approval') {
    return res.status(400).json({ error: 'Only pending posts can be approved' });
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('posts')
    .update({ 
      status: 'approved',
      published_at: now,
      updated_at: now
    })
    .eq('id', id);

  if (updateError) {
    throw updateError;
  }

  // Get updated post
  const { data: updatedPost } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  res.json(updatedPost);
}));

// Reject post (admin only)
router.post('/:id/reject', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (post.status !== 'pending_approval') {
    return res.status(400).json({ error: 'Only pending posts can be rejected' });
  }

  const { error: updateError } = await supabase
    .from('posts')
    .update({ 
      status: 'rejected',
      rejection_reason: reason || 'No reason provided',
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (updateError) {
    throw updateError;
  }

  // Get updated post
  const { data: updatedPost } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  res.json(updatedPost);
}));

// Toggle post approval status (admin only)
router.post('/:id/toggle-approval', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // Toggle between approved and draft status
  const newStatus = post.status === 'approved' ? 'draft' : 'approved';
  const now = new Date().toISOString();

  const updateData = {
    status: newStatus,
    updated_at: now
  };

  // Set published_at when approving, clear it when moving to draft
  if (newStatus === 'approved') {
    updateData.published_at = post.published_at || now;
  } else {
    updateData.published_at = null;
  }

  const { error: updateError } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', id);

  if (updateError) {
    throw updateError;
  }

  // Get updated post
  const { data: updatedPost } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  res.json(updatedPost);
}));

// Increment view count
router.post('/:id/view', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  // Only count views for approved posts
  if (post.status !== 'approved') {
    return res.status(400).json({ error: 'Can only track views for approved posts' });
  }

  const { error: updateError } = await supabase
    .from('posts')
    .update({ 
      views: (post.views || 0) + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (updateError) {
    throw updateError;
  }

  res.json({ views: (post.views || 0) + 1 });
}));

module.exports = router;
