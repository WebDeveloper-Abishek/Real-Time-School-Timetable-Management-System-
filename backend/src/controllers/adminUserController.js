import User from "../models/User.js";
import Account from "../models/Account.js";
import StudentParentLink from "../models/StudentParentLink.js";
import UserClassAssignment from "../models/UserClassAssignment.js";
import TeacherSubjectAssignment from "../models/TeacherSubjectAssignment.js";
import bcrypt from "bcryptjs";
import { createSystemAnnouncement, createAccountStatusNotification } from '../services/notificationService.js';
import { createUserDeletionNotification, createUsernameChangeNotification } from './notificationController.js';

export const listUsers = async (req, res) => {
  try {
    // Build query filter
    const filter = { is_deleted: false };
    
    // Add role filter if provided
    if (req.query.role) {
      filter.role = req.query.role;
    }
    
    const users = await User.find(filter)
      .sort({ createdAt: -1 });

    // Get accounts and class assignments for each user
    const usersWithAccounts = await Promise.all(
      users.map(async (user) => {
        const accounts = await Account.find({ 
          user_id: user._id, 
          is_deleted: { $ne: true } 
        }).select('username email phone is_active createdAt');

        // Get class assignments for this user
        const classAssignments = await UserClassAssignment.find({ 
          user_id: user._id 
        }).populate('class_id', 'class_name grade section');

        // Get subject assignments for teachers
        let subjectAssignments = [];
        if (user.role === 'Teacher') {
          subjectAssignments = await TeacherSubjectAssignment.find({ 
            user_id: user._id 
          }).populate('subject_id', 'subject_name')
            .populate('class_id', 'class_name grade section');
        }

        // Get the most recent active account
        const activeAccount = accounts && accounts.length > 0 
          ? accounts.find(acc => acc.is_active) || accounts[0]
          : null;

        return {
          _id: user._id,
          name: user.name,
          nic_number: user.nic_number,
          role: user.role,
          gender: user.gender,
          date_of_birth: user.date_of_birth,
          profile_picture: user.profile_picture,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          account: activeAccount, // Single account for backward compatibility
          accounts: accounts || [], // All accounts
          totalAccounts: accounts ? accounts.length : 0,
          class_assignments: classAssignments || [],
          subject_assignments: subjectAssignments.map(sa => ({
            subject_name: sa.subject_id?.subject_name,
            class_name: sa.class_id?.class_name,
            course_limit: sa.course_limit
          }))
        };
      })
    );

    return res.json({ users: usersWithAccounts });
  } catch (error) {
    console.error("listUsers error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    const account = await Account.findOne({ user_id: id }).select("username email phone is_active createdAt updatedAt");
    
    // Get additional user details based on role
    let additionalData = {};
    if (user.role === 'Student') {
      // Get linked parents through StudentParentLink
      const parentLinks = await StudentParentLink.find({ student_id: id })
        .populate('parent_id', 'name role');
      additionalData = { linkedParents: parentLinks.map(link => link.parent_id) };
    } else if (user.role === 'Parent') {
      // Get linked students through StudentParentLink
      const studentLinks = await StudentParentLink.find({ parent_id: id })
        .populate('student_id', 'name role');
      additionalData = { linkedStudents: studentLinks.map(link => link.student_id) };
    }
    
    return res.json({ 
      user, 
      account,
      additionalData 
    });
  } catch (error) {
    console.error("getUser error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, role, username, email, phone, password, dateOfBirth, gender, profilePicture, nic_number } = req.body;
    
    if (!name || !role || !username || !password || !nic_number) {
      return res.status(400).json({ message: "Missing required fields: name, role, username, password, and NIC number are required" });
    }
    const existingUserByName = await User.findOne({ name: name.trim() });
        if (existingUserByName) {
      // User with same name exists, now check NIC
      if (existingUserByName.nic_number === nic_number.toUpperCase()) {
        // Same user (name + NIC match), create new account
        // Check if username already exists
        const existingUsername = await Account.findOne({ username });
        if (existingUsername) {
          return res.status(400).json({ message: "Username already in use" });
        }
        
        // Check if email already exists (only if email is provided)
        if (email) {
          const existingEmail = await Account.findOne({ email });
          if (existingEmail) {
            return res.status(400).json({ message: "Email already in use" });
          }
        }

        // Create new account for existing user
        const hashedPassword = await bcrypt.hash(password, 10);
        const account = await Account.create({ 
          user_id: existingUserByName._id, 
          username, 
          email, 
          phone, 
          password: hashedPassword,
          is_active: true
        });

        return res.status(201).json({ 
          message: "User created successfully", 
          user: existingUserByName, 
          account: { 
            username: account.username, 
            email: account.email, 
            phone: account.phone, 
            is_active: account.is_active 
          }
        });
      } else {
        // Different NIC, create new user
        // Check if username already exists
        const existingUsername = await Account.findOne({ username });
        if (existingUsername) {
          return res.status(400).json({ message: "Username already in use" });
        }
        
        // Check if email already exists (only if email is provided)
        if (email) {
          const existingEmail = await Account.findOne({ email });
          if (existingEmail) {
            return res.status(400).json({ message: "Email already in use" });
          }
        }

        // Check if NIC already exists
        const existingUserByNIC = await User.findOne({ nic_number: nic_number.toUpperCase() });
        if (existingUserByNIC) {
          return res.status(400).json({ message: "User with this NIC number already exists" });
        }

        // Create new user with additional fields
        const userData = { 
          name, 
          role, 
          nic_number: nic_number.toUpperCase()
        };
        if (dateOfBirth) userData.date_of_birth = dateOfBirth;
        if (gender) userData.gender = gender;
        if (profilePicture) userData.profile_picture = profilePicture;
        
        const user = await User.create(userData);
        
        // Create account
        const hashedPassword = await bcrypt.hash(password, 10);
        const account = await Account.create({ 
          user_id: user._id, 
          username, 
          email, 
          phone, 
          password: hashedPassword,
          is_active: true
        });

        return res.status(201).json({ 
          message: "User created successfully", 
          user, 
          account: { 
            username: account.username, 
            email: account.email, 
            phone: account.phone, 
            is_active: account.is_active 
          }
        });
      }
    } else {
      // No user with same name, check if NIC exists
      const existingUserByNIC = await User.findOne({ nic_number: nic_number.toUpperCase() });
      
      if (existingUserByNIC) {
        return res.status(400).json({ message: "User with this NIC number already exists" });
      }

      // New user, create both user and account
    // Check if username already exists
    const existingUsername = await Account.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already in use" });
    }
    
    // Check if email already exists (only if email is provided)
    if (email) {
      const existingEmail = await Account.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

      // Create new user with additional fields
      const userData = { 
        name, 
        role, 
        nic_number: nic_number.toUpperCase()
      };
    if (dateOfBirth) userData.date_of_birth = dateOfBirth;
    if (gender) userData.gender = gender;
    if (profilePicture) userData.profile_picture = profilePicture;
    
    const user = await User.create(userData);
    
    // Create account
    const hashedPassword = await bcrypt.hash(password, 10);
    const account = await Account.create({ 
      user_id: user._id, 
      username, 
      email, 
      phone, 
      password: hashedPassword,
      is_active: true
    });

    return res.status(201).json({ 
      message: "User created successfully", 
      user, 
      account: { 
        username: account.username, 
        email: account.email, 
        phone: account.phone, 
        is_active: account.is_active 
      } 
    });
    }
  } catch (error) {
    console.error("createUser error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, email, phone, password, is_active, dateOfBirth, gender, profilePicture, nic_number } = req.body;
    const adminId = req.user?.id;
    const adminUser = adminId ? await User.findById(adminId) : null;
    const adminName = adminUser ? adminUser.name : 'System Administrator';
    
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Store original name for notification
    const originalName = user.name;

    // Check if NIC number is being changed and if it conflicts with existing users
    if (nic_number && nic_number !== user.nic_number) {
      const existingUser = await User.findOne({ 
        nic_number: nic_number.toUpperCase(),
        _id: { $ne: id } // Exclude current user
      });
      if (existingUser) {
        return res.status(400).json({ message: "Another user with this NIC number already exists" });
      }
    }

    // Update user fields
    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (nic_number !== undefined) user.nic_number = nic_number.toUpperCase();
    if (dateOfBirth !== undefined) user.date_of_birth = dateOfBirth;
    if (gender !== undefined) user.gender = gender;
    if (profilePicture !== undefined) user.profile_picture = profilePicture;
    
    await user.save();

    // Create notification if name was changed
    if (name !== undefined && name !== originalName) {
      try {
        await createUsernameChangeNotification(originalName, name, user.role, adminName);
      } catch (notificationError) {
        console.error("Error creating username change notification:", notificationError);
        // Don't fail the user update if notification fails
      }
    }

    // Update account
    const account = await Account.findOne({ user_id: id });
    if (account) {
      try {
        if (email !== undefined) account.email = email;
        if (phone !== undefined) account.phone = phone;
        if (typeof is_active === "boolean") account.is_active = is_active;
        if (password) account.password = await bcrypt.hash(password, 10);
        await account.save();
      } catch (accountError) {
        console.error("Error updating account:", accountError);
        return res.status(500).json({ 
          message: "User updated but account update failed", 
          error: accountError.message 
        });
      }
    }

    return res.json({ 
      message: "User updated successfully", 
      user, 
      account: account ? { 
        username: account.username, 
        email: account.email, 
        phone: account.phone, 
        is_active: account.is_active 
      } : null 
    });
  } catch (error) {
    console.error("updateUser error", error);
    return res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;
    const adminId = req.user?.id; // Get admin user ID from token
    const adminUser = adminId ? await User.findById(adminId) : null;
    const adminName = adminUser ? adminUser.name : 'System Administrator';
    
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    if (permanent === 'true') {
      // Permanent delete - only for admin use
      await User.findByIdAndDelete(id);
      await Account.findOneAndDelete({ user_id: id });
      
      // Also remove any StudentParentLink records
      await StudentParentLink.deleteMany({
        $or: [{ student_id: id }, { parent_id: id }]
      });
      
      // Create system-wide notification about user deletion
      await createUserDeletionNotification(user.name, user.role, adminName);
      
      return res.json({ message: "User permanently deleted" });
    } else {
      // Soft delete - mark user as deleted and delete account
      user.is_deleted = true;
      await user.save();
      
      // Delete the account so user cannot log in
      await Account.findOneAndDelete({ user_id: id });
      
      // Create system-wide notification about user deletion
      await createUserDeletionNotification(user.name, user.role, adminName);
      
      return res.json({ message: "User deleted successfully - account removed and user cannot log in" });
    }
  } catch (error) {
    console.error("deleteUser error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const restoreUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, email, phone } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required to restore user" });
    }
    
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    if (!user.is_deleted) {
      return res.status(400).json({ message: "User is not deleted" });
    }
    
    // Check if username already exists
    const existingAccount = await Account.findOne({ username });
    if (existingAccount) {
      return res.status(400).json({ message: "Username already in use" });
    }
    
    // Restore user
    user.is_deleted = false;
    await user.save();
    
    // Recreate account with new credentials
    const hashedPassword = await bcrypt.hash(password, 10);
    const account = await Account.create({
      user_id: id,
      username,
      password: hashedPassword,
      email: email || '',
      phone: phone || '',
      is_active: true
    });
    
    // Create system notification about user restoration
    await createSystemAnnouncement(
      `User Account Restored`,
      `User ${user.name} (${user.email}) has been restored and can now access the system again.`,
      'all'
    );
    
    return res.json({ 
      message: "User restored successfully with new account", 
      account: {
        username: account.username,
        email: account.email,
        phone: account.phone
      }
    });
  } catch (error) {
    console.error("restoreUser error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const bulkDeleteUsers = async (req, res) => {
  try {
    const { userIds, permanent = false } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "Invalid user IDs" });
    }
    
    if (permanent) {
      await User.deleteMany({ _id: { $in: userIds } });
      await Account.deleteMany({ user_id: { $in: userIds } });
      
      // Remove StudentParentLink records
      await StudentParentLink.deleteMany({
        $or: [
          { student_id: { $in: userIds } },
          { parent_id: { $in: userIds } }
        ]
      });
      
      return res.json({ message: `${userIds.length} users permanently deleted` });
    } else {
      await User.updateMany(
        { _id: { $in: userIds } },
        { is_deleted: true }
      );
      
      // Delete accounts so users cannot log in
      await Account.deleteMany({ user_id: { $in: userIds } });
      
      return res.json({ message: `${userIds.length} users deleted successfully - accounts removed and users cannot log in` });
    }
  } catch (error) {
    console.error("bulkDeleteUsers error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const bulkRestoreUsers = async (req, res) => {
  try {
    const { userIds, accountData } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "Invalid user IDs" });
    }
    
    if (!accountData || !Array.isArray(accountData) || accountData.length !== userIds.length) {
      return res.status(400).json({ message: "Account data required for each user being restored" });
    }
    
    // Restore users
    await User.updateMany(
      { _id: { $in: userIds } },
      { is_deleted: false }
    );
    
    // Recreate accounts for each user
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const account = accountData[i];
      
      if (!account.username || !account.password) {
        continue; // Skip if missing required fields
      }
      
      // Check if username already exists
      const existingAccount = await Account.findOne({ username: account.username });
      if (existingAccount) {
        continue; // Skip if username already exists
      }
      
      // Create new account
      const hashedPassword = await bcrypt.hash(account.password, 10);
      await Account.create({
        user_id: userId,
        username: account.username,
        password: hashedPassword,
        email: account.email || '',
        phone: account.phone || '',
        is_active: true
      });
    }
    
    return res.json({ message: `${userIds.length} users restored successfully` });
  } catch (error) {
    console.error("bulkRestoreUsers error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const assignParentToStudent = async (req, res) => {
  try {
    const { parentId, studentId } = req.body;
    
    if (!parentId || !studentId) {
      return res.status(400).json({ message: "Parent ID and Student ID are required" });
    }
    
    const parent = await User.findById(parentId);
    const student = await User.findById(studentId);
    
    if (!parent || parent.role !== 'Parent') {
      return res.status(400).json({ message: "Invalid parent user" });
    }
    
    if (!student || student.role !== 'Student') {
      return res.status(400).json({ message: "Invalid student user" });
    }
    
    // Check if link already exists
    const existingLink = await StudentParentLink.findOne({
      student_id: studentId,
      parent_id: parentId
    });
    
    if (existingLink) {
      return res.status(400).json({ message: "Parent is already assigned to this student" });
    }
    
    // Create the link
    await StudentParentLink.create({
      student_id: studentId,
      parent_id: parentId
    });
    
    return res.json({ message: "Parent assigned to student successfully" });
  } catch (error) {
    console.error("assignParentToStudent error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const removeParentFromStudent = async (req, res) => {
  try {
    const { parentId, studentId } = req.body;
    
    if (!parentId || !studentId) {
      return res.status(400).json({ message: "Parent ID and Student ID are required" });
    }
    
    const result = await StudentParentLink.deleteOne({
      student_id: studentId,
      parent_id: parentId
    });
    
    if (result.deletedCount === 0) {
      return res.status(400).json({ message: "No such parent-student link found" });
    }
    
    return res.json({ message: "Parent removed from student successfully" });
  } catch (error) {
    console.error("removeParentFromStudent error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $match: { is_deleted: false } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalUsers = await User.countDocuments({ is_deleted: false });
    const deletedUsers = await User.countDocuments({ is_deleted: true });
    
    return res.json({
      roleStats: stats,
      totalUsers,
      deletedUsers
    });
  } catch (error) {
    console.error("getUserStats error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Create additional account for existing user
export const createAdditionalAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, phone, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if username already exists
    const existingUsername = await Account.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already in use" });
    }
    
    // Check if email already exists (only if email is provided)
    if (email) {
      const existingEmail = await Account.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Create new account for existing user
    const hashedPassword = await bcrypt.hash(password, 10);
    const account = await Account.create({ 
      user_id: user._id, 
      username, 
      email, 
      phone, 
      password: hashedPassword,
      is_active: true
    });

    return res.status(201).json({ 
      message: "Additional account created successfully", 
      user: {
        _id: user._id,
        name: user.name,
        nic_number: user.nic_number,
        role: user.role
      },
      account: { 
        username: account.username, 
        email: account.email, 
        phone: account.phone, 
        is_active: account.is_active 
      } 
    });
  } catch (error) {
    console.error("createAdditionalAccount error", error);
    return res.status(500).json({ message: "Server error" });
  }
};
// Test endpoint to check database connection
export const testUsers = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const accountCount = await Account.countDocuments();
    
    return res.json({ 
      message: "Database connection working",
      userCount,
      accountCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("testUsers error", error);
    return res.status(500).json({ message: "Database connection failed", error: error.message });
  }
};

// Get all accounts for a specific user
export const getUserAccounts = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all accounts for this user (including inactive ones)
    const accounts = await Account.find({ user_id: userId }).sort({ createdAt: -1 });

    return res.json({ 
      user: {
        _id: user._id,
        name: user.name,
        nic_number: user.nic_number,
        role: user.role,
        gender: user.gender,
        date_of_birth: user.date_of_birth
      },
      accounts: accounts.map(account => ({
        _id: account._id,
        username: account.username,
        email: account.email,
        phone: account.phone,
        is_active: account.is_active,
        is_deleted: account.is_deleted,
        deleted_at: account.deleted_at,
        deleted_reason: account.deleted_reason,
        createdAt: account.createdAt
      })),
      totalAccounts: accounts.length,
      activeAccounts: accounts.filter(acc => acc.is_active && !acc.is_deleted).length
    });
  } catch (error) {
    console.error("getUserAccounts error", error);
    return res.status(500).json({ message: "Server error" });
  }
};


