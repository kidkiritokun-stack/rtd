const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Read data from a Supabase table
 * @param {string} table - Supabase table name
 * @param {object} filters - Optional key/value filters
 * @returns {Promise<Array>} - Array of rows
 */
const readData = async (table, filters = {}) => {
  try {
    let query = supabase.from(table).select('*');

    // Apply filters if provided
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`❌ Error reading from ${table}:`, error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error(`❌ Unexpected error reading from ${table}:`, err);
    return [];
  }
};

/**
 * Write (insert or update) data into a Supabase table
 * Uses upsert so existing rows are updated if they share the same primary key
 * @param {string} table - Supabase table name
 * @param {object|Array} data - Single object or array of objects
 * @returns {Promise<boolean>}
 */
const writeData = async (table, data) => {
  try {
    const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error writing to ${table}:`, error);
      throw error;
    }

    return true;
  } catch (err) {
    console.error(`❌ Unexpected error writing to ${table}:`, err);
    throw err;
  }
};

/**
 * Generate a unique slug from a title
 * Ensures slug does not conflict with existing posts in DB
 * @param {string} title
 * @param {Array} existingPosts
 * @returns {string} unique slug
 */
const generateSlug = (title, existingPosts = []) => {
  let baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  let slug = baseSlug;
  let counter = 1;

  while (existingPosts.some(post => post.slug === slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

module.exports = {
  readData,
  writeData,
  generateSlug,
  uuidv4
};
