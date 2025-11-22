import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Account from "../models/Account.js";
import generateToken from "../utils/generateToken.js";
import jwt from "jsonwebtoken";
import { createProfileUpdateNotification, createUserCreatedNotification } from "../services/notificationService.js";

export const registerAdmin = async (req, res) => {
  try {
    const { name, username, password, email } = req.body;
    // Check if user already exists
    const existingAccount = await Account.findOne({ username });
    if (existingAccount) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      role: "Admin",
      date_of_birth: new Date(),
      gender: "Other"
    });

    // Create account
    const account = await Account.create({
      user_id: user._id,
      username,
      password: hashedPassword,
      email,
      is_active: true
    });

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        username: account.username,
        email: account.email
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  } 
}; // ONLY handles admin registration logic

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find account by username
    const account = await Account.findOne({ username }).populate("user_id");
    if (!account) {
      return res.status(401).json({ message: "Invalid credentials - Username" });
    }
    // Check if account is active
    if (!account.is_active) {
      return res.status(401).json({ message: "Account is deactivated" });
    }
    // Check password
    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials - Password" });
    }

    // Generate token
    const token = generateToken(account.user_id._id, account.user_id.role);

    res.json({
      token,
      user: {
        id: account.user_id._id,
        name: account.user_id.name,
        role: account.user_id.role,
        username: account.username,
        email: account.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
}; // ONLY handles user login logic

// Simple user creation for testing
export const createTestUser = async (req, res) => {
  try {
    const { name, username, password, email, role } = req.body;

    // Get creator's ID from token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    let createdByUserId = null;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        createdByUserId = decoded.id;
      } catch (tokenError) {
        console.log('Token verification failed for user creation:', tokenError.message);
      }
    }

    // Check if user already exists
    const existingAccount = await Account.findOne({ username });
    if (existingAccount) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      role: role || "Student",
      date_of_birth: new Date(),
      gender: "Other"
    });

    // Create account
    const account = await Account.create({
      user_id: user._id,
      username,
      password: hashedPassword,
      email,
      is_active: true
    });

    // Create notifications for user creation
    if (createdByUserId) {
      try {
        await createUserCreatedNotification(user._id, createdByUserId);
        console.log('User creation notifications created successfully');
      } catch (notificationError) {
        console.error('Error creating user creation notifications:', notificationError);
        // Don't fail the user creation if notifications fail
      }
    }

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        username: account.username,
        email: account.email
      }
    });
  } catch (error) {
    console.error("User creation error:", error);
    res.status(500).json({ message: "Server error" });
  }
}; // ONLY handles create test user logicc

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Get profile - Token received:', token ? 'Yes' : 'No');
    
    if (!token) {
      console.log('Get profile - No token provided');
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.id; // Changed from decoded.userId to decoded.id
    console.log('Get profile - Decoded userId:', userId);

    // Find user with account details
    const user = await User.findById(userId).populate('accounts');
    console.log('Get profile - User found:', user ? 'Yes' : 'No');
    if (!user) {
      console.log('Get profile - User not found in database');
      return res.status(404).json({ message: "User not found" });
    }

    const account = await Account.findOne({ user_id: userId });
    console.log('Get profile - Account found:', account ? 'Yes' : 'No');
    if (!account) {
      console.log('Get profile - Account not found in database');
      return res.status(404).json({ message: "Account not found" });
    }

    const profileData = {
      user: {
        id: user._id,
        name: user.name,
        nic_number: user.nic_number,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        role: user.role,
        profile_picture: user.profile_picture,
        username: account.username,
        email: account.email,
        phone: account.phone
      }
    };
    
    console.log('Get profile - Returning data:', profileData);
    res.json(profileData);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
}; // ONLY handles profile retrieval logic

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Update profile - Token received:', token ? 'Yes' : 'No');
    
    if (!token) {
      console.log('Update profile - No token provided');
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.id; // Changed from decoded.userId to decoded.id
    console.log('Update profile - Decoded userId:', userId);
    console.log('Update profile - Request body:', req.body);

    const { 
      name, 
      nic_number, 
      date_of_birth, 
      gender, 
      username, 
      email, 
      phone, 
      currentPassword, 
      newPassword 
    } = req.body;

    // Find user and account
    const user = await User.findById(userId);
    const account = await Account.findOne({ user_id: userId });
    
    console.log('Update profile - User found:', user ? 'Yes' : 'No');
    console.log('Update profile - Account found:', account ? 'Yes' : 'No');

    if (!user || !account) {
      console.log('Update profile - User or account not found');
      return res.status(404).json({ message: "User or account not found" });
    }

    // Update user fields
    if (name) user.name = name;
    if (nic_number) user.nic_number = nic_number;
    if (date_of_birth) user.date_of_birth = new Date(date_of_birth);
    if (gender) user.gender = gender;

    // Update account fields
    if (username) {
      // Check if username is already taken by another user
      const existingAccount = await Account.findOne({ 
        username, 
        _id: { $ne: account._id } 
      });
      if (existingAccount) {
        return res.status(400).json({ message: "Username already taken" });
      }
      account.username = username;
    }

    if (email) {
      // Check if email is already taken by another user
      const existingAccount = await Account.findOne({ 
        email, 
        _id: { $ne: account._id } 
      });
      if (existingAccount) {
        return res.status(400).json({ message: "Email already taken" });
      }
      account.email = email;
    }

    if (phone) account.phone = phone;

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to change password" });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, account.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      account.password = await bcrypt.hash(newPassword, salt);
    }

    // Save changes
    await user.save();
    await account.save();
    
    console.log('Update profile - Changes saved successfully');

    // Create notifications for profile update
    try {
      const updatedFields = {};
      if (name) updatedFields.name = name;
      if (username) updatedFields.username = username;
      if (email) updatedFields.email = email;
      if (phone) updatedFields.phone = phone;
      if (newPassword) updatedFields.password = 'updated';
      if (nic_number) updatedFields.nic_number = nic_number;
      if (date_of_birth) updatedFields.date_of_birth = date_of_birth;
      if (gender) updatedFields.gender = gender;

      await createProfileUpdateNotification(userId, updatedFields);
      console.log('Update profile - Notifications created successfully');
    } catch (notificationError) {
      console.error('Update profile - Error creating notifications:', notificationError);
      // Don't fail the profile update if notifications fail
    }

    const responseData = {
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        nic_number: user.nic_number,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        role: user.role,
        profile_picture: user.profile_picture,
        username: account.username,
        email: account.email,
        phone: account.phone
      }
    };
    
    console.log('Update profile - Returning response:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
}; // ONLY handles update profile logic
