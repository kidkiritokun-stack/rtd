const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload image to Supabase Storage (production)
const uploadToSupabase = async (file, folder = 'posts') => {
  try {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('cms-images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });
      
    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('cms-images')
      .getPublicUrl(fileName);
      
    return publicUrl;
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    throw error;
  }
};

// Upload image to local filesystem (development)
const uploadToLocal = async (file, folder = 'uploads') => {
  try {
    const uploadsDir = path.join(__dirname, '../../public/assets', folder);
    
    // Ensure directory exists
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }
    
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = path.join(uploadsDir, fileName);
    
    await fs.writeFile(filePath, file.buffer);
    
    return `/assets/${folder}/${fileName}`;
  } catch (error) {
    console.error('Error uploading to local filesystem:', error);
    throw error;
  }
};

// Main upload function - chooses storage based on environment
const uploadImage = async (file, folder = 'posts') => {
  if (process.env.NODE_ENV === 'production' && process.env.SUPABASE_URL) {
    return await uploadToSupabase(file, folder);
  } else {
    return await uploadToLocal(file, folder);
  }
};

// Delete image from Supabase Storage
const deleteFromSupabase = async (imageUrl) => {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const folder = urlParts[urlParts.length - 2];
    const filePath = `${folder}/${fileName}`;
    
    const { error } = await supabase.storage
      .from('cms-images')
      .remove([filePath]);
      
    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting from Supabase:', error);
    throw error;
  }
};

// Delete image from local filesystem
const deleteFromLocal = async (imageUrl) => {
  try {
    const filePath = path.join(__dirname, '../../public', imageUrl);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting from local filesystem:', error);
    throw error;
  }
};

// Main delete function
const deleteImage = async (imageUrl) => {
  if (imageUrl.includes('supabase')) {
    return await deleteFromSupabase(imageUrl);
  } else {
    return await deleteFromLocal(imageUrl);
  }
};

module.exports = {
  upload,
  uploadImage,
  deleteImage,
  uploadToSupabase,
  uploadToLocal
};