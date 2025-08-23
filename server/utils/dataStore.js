const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Read data from Supabase table
const readData = async (tableName) => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error reading ${tableName}:`, error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error(`Error reading ${tableName}:`, error);
    return [];
  }
};

// Write data to Supabase table
const writeData = async (tableName, data) => {
  try {
    const { error } = await supabase
      .from(tableName)
      .insert(data);

    if (error) {
      console.error(`Error writing to ${tableName}:`, error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error(`Error writing to ${tableName}:`, error);
    throw error;
  }
};

// Update data in Supabase table
const updateData = async (tableName, id, data) => {
  try {
    const { error } = await supabase
      .from(tableName)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error(`Error updating ${tableName}:`, error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error(`Error updating ${tableName}:`, error);
    throw error;
  }
};

// Delete data from Supabase table
const deleteData = async (tableName, id) => {
  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting from ${tableName}:`, error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error(`Error deleting from ${tableName}:`, error);
    throw error;
  }
};

// Find single record
const findOne = async (tableName, field, value) => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq(field, value)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error(`Error finding ${tableName}:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error finding ${tableName}:`, error);
    return null;
  }
};

// Generate unique slug
const generateSlug = async (title, tableName = 'posts') => {
  let baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await findOne(tableName, 'slug', slug);
    if (!existing) break;
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

// Get Supabase client (for direct queries)
const getSupabaseClient = () => supabase;

module.exports = {
  readData,
  writeData,
  updateData,
  deleteData,
  findOne,
  generateSlug,
  getSupabaseClient,
  uuidv4
};