const express = require('express');
const { writeData, getSupabaseClient, uuidv4 } = require('../utils/dataStore');
const { validateContact, validateChallenge, validateInquiry, validateNewsletter } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
const supabase = getSupabaseClient();

// Submit contact form
router.post('/', validateContact, asyncHandler(async (req, res) => {
  const { name, email, phone, company, message } = req.body;

  const newSubmission = {
    id: uuidv4(),
    name,
    email,
    phone: phone || null,
    company: company || null,
    message: message || null,
    submission_type: 'contact_form',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('contact_submissions')
    .insert(newSubmission);

  if (error) {
    throw error;
  }

  res.status(201).json({
    success: true,
    message: 'Thank you for your message. We\'ll get back to you soon!'
  });
}));

// Submit challenge form
router.post('/challenge', validateChallenge, asyncHandler(async (req, res) => {
  const { name, email, company, challenge } = req.body;

  const newSubmission = {
    id: uuidv4(),
    name,
    email,
    company,
    message: challenge,
    submission_type: 'challenge_form',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('contact_submissions')
    .insert(newSubmission);

  if (error) {
    throw error;
  }

  res.status(201).json({
    success: true,
    message: 'Thank you for sharing your challenge. We\'ll analyze it and get back to you soon!'
  });
}));

// Submit general inquiry
router.post('/inquiry', validateInquiry, asyncHandler(async (req, res) => {
  const { name, email, phone, company, subject, message } = req.body;

  const newSubmission = {
    id: uuidv4(),
    name,
    email,
    phone: phone || null,
    company: company || null,
    subject: subject || null,
    message,
    submission_type: 'general_inquiry',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('contact_submissions')
    .insert(newSubmission);

  if (error) {
    throw error;
  }

  res.status(201).json({
    success: true,
    message: 'Thank you for your inquiry. We\'ll respond as soon as possible!'
  });
}));

// Subscribe to newsletter
router.post('/newsletter', validateNewsletter, asyncHandler(async (req, res) => {
  const { email, name } = req.body;

  // Check if email already exists
  const { data: existing } = await supabase
    .from('newsletter_subscriptions')
    .select('*')
    .eq('email', email)
    .single();

  if (existing) {
    if (existing.is_active) {
      return res.status(400).json({ error: 'Email is already subscribed' });
    } else {
      // Reactivate subscription
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .update({
          is_active: true,
          unsubscribed_at: null,
          name: name || existing.name
        })
        .eq('id', existing.id);

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        message: 'Welcome back! Your subscription has been reactivated.'
      });
    }
  }

  const newSubscription = {
    id: uuidv4(),
    email,
    name: name || null,
    is_active: true,
    subscribed_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('newsletter_subscriptions')
    .insert(newSubscription);

  if (error) {
    throw error;
  }

  res.status(201).json({
    success: true,
    message: 'Thank you for subscribing! You\'ll receive our latest updates.'
  });
}));

// Admin: Get all contact submissions
router.get('/admin/submissions', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { data: submissions, error } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  res.json(submissions);
}));

// Admin: Get all newsletter subscriptions
router.get('/admin/newsletter', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { data: subscriptions, error } = await supabase
    .from('newsletter_subscriptions')
    .select('*')
    .order('subscribed_at', { ascending: false });

  if (error) {
    throw error;
  }

  res.json(subscriptions);
}));

// Admin: Unsubscribe user from newsletter
router.put('/admin/newsletter/:id/unsubscribe', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: subscription, error: findError } = await supabase
    .from('newsletter_subscriptions')
    .select('*')
    .eq('id', id)
    .single();

  if (findError || !subscription) {
    return res.status(404).json({ error: 'Subscription not found' });
  }

  const { error } = await supabase
    .from('newsletter_subscriptions')
    .update({
      is_active: false,
      unsubscribed_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    throw error;
  }

  res.json({ success: true, message: 'User unsubscribed successfully' });
}));

module.exports = router;