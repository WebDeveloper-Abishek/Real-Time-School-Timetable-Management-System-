import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Import models
import User from './src/models/User.js';
import Account from './src/models/Account.js';

const createAdminOnly = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Account.deleteMany({})
    ]);

    console.log('Cleared existing data');

    // Create Admin User with NIC
    const adminUser = await User.create({
      name: 'Admin User',
      nic_number: 'ADMIN001',
      date_of_birth: new Date('1980-01-01'),
      gender: 'Other',
      role: 'Admin'
    });

    // Create Admin Account
    const adminSalt = await bcrypt.genSalt(10);
    const adminHashedPassword = await bcrypt.hash('admin123', adminSalt);

    const adminAccount = await Account.create({
      user_id: adminUser._id,
      username: 'admin',
      password: adminHashedPassword,
      email: 'admin@school.com',
      phone: '+1234567890',
      is_active: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('\n📋 Admin Account:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: Admin');
    console.log('NIC: ADMIN001');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminOnly();
