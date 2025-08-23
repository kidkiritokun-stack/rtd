require('dotenv').config();

const bcrypt = require('bcryptjs');
const { writeData, uuidv4 } = require('../utils/dataStore');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const createAdmin = async () => {
  try {
    console.log('🔧 Creating new admin user...\n');

    const username = await question('Username: ');
    const fullName = await question('Full Name: ');
    const password = await question('Password: ');
    const email = await question('Email (optional): ');
    const designation = await question('Work Designation (optional): ');

    if (!username || !fullName || !password) {
      console.log('❌ Username, full name, and password are required');
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    const newAdmin = {
      id: uuidv4(),
      username,
      password_hash: passwordHash,
      full_name: fullName,
      designation: designation || 'Site Administrator',
      bio: 'Site Administrator',
      avatar_url: null,
      role: 'admin',
      social: {
        instagram: null,
        youtube: null,
        x: null,
        facebook: null,
        linkedin: null,
        website: null,
        email: email || null
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      active: true
    };

    await writeData('authors', newAdmin);

    console.log('\n✅ Admin user created successfully!');
    console.log(`Username: ${username}`);
    console.log(`Full Name: ${fullName}`);
    console.log(`Role: admin`);

  } catch (error) {
    console.error('❌ Failed to create admin:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
};

// Run if called directly
if (require.main === module) {
  createAdmin();
}

module.exports = { createAdmin };