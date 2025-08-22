const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/dataStore');
const { validateContact } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Submit contact form
router.post('/', validateContact, asyncHandler(async (req, res) => {
  const { name, email, phone, message } = req.body;

  const inbox = await readData('inbox');

  const newSubmission = {
    id: uuidv4(),
    name,
    email,
    phone: phone || null,
    message,
    submittedAt: new Date().toISOString(),
    read: false
  };

  inbox.push(newSubmission);
  await writeData('inbox', inbox);

  res.status(201).json({
    success: true,
    message: 'Thank you for your message. We\'ll get back to you soon!'
  });
}));

module.exports = router;