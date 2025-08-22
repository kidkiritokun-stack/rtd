const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/dataStore');
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

    if (!username || !fullName || !password) {
      console.log('❌ Username, full name, and password are required');
      process.exit(1);
    }

    const authors = await readData('authors');
    
    // Check if username already exists
    if (authors.some(author => author.username === username)) {
      console.log('❌ Username already exists');
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    const newAdmin = {
      id: uuidv4(),
      username,
      passwordHash,
      fullName,
      bio: 'Site Administrator',
      avatarUrl: null,
      role: 'admin',
      social: {
        instagram: null,
        youtube: null,
        x: null,
        facebook: null,
        snapchat: null,
        linkedin: null,
        website: null,
        email: email || null
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      active: true
    };

    authors.push(newAdmin);
    await writeData('authors', authors);

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