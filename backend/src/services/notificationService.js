import Notification from "../models/Notification.js";
import User from "../models/User.js";

// =============================================================================
// USER ACCOUNT & PROFILE NOTIFICATIONS
// =============================================================================

/**
 * Creates a notification when a new user account is created
 * @param {String} userId - The ID of the newly created user
 * @param {String} createdByUserId - The ID of the admin/user who created this account
 */
export const createUserCreatedNotification = async (userId, createdByUserId) => {
  try {
    const newUser = await User.findById(userId);
    const createdByUser = await User.findById(createdByUserId);

    if (!newUser) {
      console.error("User not found for notification creation");
      return;
    }

    // Create notification for the newly created user
    await Notification.create({
      user_id: userId,
      title: "Welcome to the System!",
      body: `Your account has been created successfully${createdByUser ? ` by ${createdByUser.name}` : ""}. You can now access your dashboard and explore the system.`,
      read_status: false
    });

    // Create notification for the creator (if exists)
    if (createdByUser) {
      await Notification.create({
        user_id: createdByUserId,
        title: "User Created Successfully",
        body: `You have successfully created an account for ${newUser.name} (${newUser.role}).`,
        read_status: false
      });
    }

    console.log(`✅ User creation notifications created for userId: ${userId}`);
  } catch (error) {
    console.error("❌ Error creating user creation notifications:", error);
    throw error;
  }
};

/**
 * Creates a notification when a user updates their profile
 * @param {String} userId - The ID of the user who updated their profile
 * @param {Object} updatedFields - Object containing the fields that were updated
 */
export const createProfileUpdateNotification = async (userId, updatedFields) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      console.error("User not found for notification creation");
      return;
    }

    // Build the message showing what was updated
    const fieldNames = Object.keys(updatedFields);
    let updateMessage = "Your profile has been updated. Changes made to: ";
    
    const fieldLabels = {
      name: "Name",
      username: "Username",
      email: "Email",
      phone: "Phone Number",
      password: "Password",
      nic_number: "NIC Number",
      date_of_birth: "Date of Birth",
      gender: "Gender"
    };

    const updatedFieldLabels = fieldNames.map(field => fieldLabels[field] || field);
    updateMessage += updatedFieldLabels.join(", ") + ".";

    // Create notification for the user
    await Notification.create({
      user_id: userId,
      title: "Profile Updated",
      body: updateMessage,
      read_status: false
    });

    console.log(`✅ Profile update notification created for userId: ${userId}`);
  } catch (error) {
    console.error("❌ Error creating profile update notification:", error);
    throw error;
  }
};

/**
 * Creates a notification for account status changes
 * @param {String} userId - The ID of the user
 * @param {String} status - The new account status
 * @param {String} details - Additional details about the status change
 */
export const createAccountStatusNotification = async (userId, status, details = '') => {
  try {
    const title = `Account ${status}`;
    const body = `Your account has been ${status.toLowerCase()}. ${details}`;
    
    const notification = new Notification({
      user_id: userId,
      title,
      body,
      read_status: false
    });

    await notification.save();
    console.log(`✅ Account status notification created for user ${userId}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating account status notification:', error);
    throw error;
  }
};

// =============================================================================
// SYSTEM-WIDE NOTIFICATIONS
// =============================================================================

/**
 * Creates a system announcement notification for multiple users
 * @param {String} title - The notification title
 * @param {String} message - The notification message
 * @param {String|Array} targetUsers - 'all' for all users, or array of user IDs
 */
export const createSystemAnnouncement = async (title, message, targetUsers = 'all') => {
  try {
    let userIds = [];
    
    if (targetUsers === 'all') {
      const users = await User.find({}, '_id');
      userIds = users.map(user => user._id);
    } else if (Array.isArray(targetUsers)) {
      userIds = targetUsers;
    } else {
      userIds = [targetUsers];
    }

    const notifications = userIds.map(userId => ({
      user_id: userId,
      title,
      body: message,
      read_status: false
    }));

    await Notification.insertMany(notifications);
    console.log(`✅ System announcement sent to ${userIds.length} users`);
    return { success: true, count: userIds.length };
  } catch (error) {
    console.error('❌ Error creating system announcement:', error);
    throw error;
  }
};

/**
 * Creates bulk notifications for users with specific roles
 * @param {String} role - The user role (Admin, Teacher, Student, Parent)
 * @param {String} title - The notification title
 * @param {String} message - The notification message
 */
export const createBulkNotificationByRole = async (role, title, message) => {
  try {
    const users = await User.find({ role }, '_id');
    const userIds = users.map(user => user._id);
    
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title,
      body: message,
      read_status: false
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`✅ Bulk notification sent to ${userIds.length} ${role}s`);
    }
    
    return { success: true, count: userIds.length };
  } catch (error) {
    console.error('❌ Error creating bulk notification:', error);
    throw error;
  }
};

// =============================================================================
// ACADEMIC NOTIFICATIONS
// =============================================================================

/**
 * Creates timetable change notifications for students in a class
 * @param {String} classId - The ID of the class
 * @param {String} changeType - The type of change (Updated, Changed, etc.)
 * @param {String} details - Additional details about the change
 */
export const createTimetableChangeNotification = async (classId, changeType, details = '') => {
  try {
    // Get all students in the class
    const UserClassAssignment = (await import('../models/UserClassAssignment.js')).default;
    const studentAssignments = await UserClassAssignment.find({ class_id: classId })
      .populate('user_id', '_id name');
    
    const studentIds = studentAssignments.map(sa => sa.user_id._id);
    
    const title = `Timetable ${changeType}`;
    const body = `Your class timetable has been ${changeType.toLowerCase()}. ${details}`;
    
    const notifications = studentIds.map(userId => ({
      user_id: userId,
      title,
      body,
      read_status: false
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`✅ Timetable change notification sent to ${studentIds.length} students`);
    }
    
    return { success: true, count: studentIds.length };
  } catch (error) {
    console.error('❌ Error creating timetable change notification:', error);
    throw error;
  }
};

/**
 * Creates exam notifications for students in a class
 * @param {String} classId - The ID of the class
 * @param {String} examType - The type of exam
 * @param {String} examDate - The exam date
 * @param {String} details - Additional details about the exam
 */
export const createExamNotification = async (classId, examType, examDate, details = '') => {
  try {
    // Get all students in the class
    const UserClassAssignment = (await import('../models/UserClassAssignment.js')).default;
    const studentAssignments = await UserClassAssignment.find({ class_id: classId })
      .populate('user_id', '_id name');
    
    const studentIds = studentAssignments.map(sa => sa.user_id._id);
    
    const title = `${examType} Exam Scheduled`;
    const body = `Your ${examType.toLowerCase()} exam is scheduled for ${examDate}. ${details}`;
    
    const notifications = studentIds.map(userId => ({
      user_id: userId,
      title,
      body,
      read_status: false
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`✅ Exam notification sent to ${studentIds.length} students`);
    }
    
    return { success: true, count: studentIds.length };
  } catch (error) {
    console.error('❌ Error creating exam notification:', error);
    throw error;
  }
};

/**
 * Creates attendance notifications for individual students
 * @param {String} userId - The ID of the student
 * @param {String} attendanceType - The attendance status
 * @param {String} details - Additional details about attendance
 */
export const createAttendanceNotification = async (userId, attendanceType, details = '') => {
  try {
    const title = `Attendance ${attendanceType}`;
    const body = `Your attendance has been marked as ${attendanceType.toLowerCase()}. ${details}`;
    
    const notification = new Notification({
      user_id: userId,
      title,
      body,
      read_status: false
    });

    await notification.save();
    console.log(`✅ Attendance notification created for user ${userId}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating attendance notification:', error);
    throw error;
  }
};

// =============================================================================
// LEAVE & MENTAL HEALTH NOTIFICATIONS
// =============================================================================

/**
 * Creates leave request notifications
 * @param {String} userId - The ID of the user
 * @param {String} leaveType - The type of leave
 * @param {String} status - The status of the leave request
 * @param {String} details - Additional details
 */
export const createLeaveRequestNotification = async (userId, leaveType, status, details = '') => {
  try {
    const title = `Leave Request ${status}`;
    const body = `Your ${leaveType.toLowerCase()} leave request has been ${status.toLowerCase()}. ${details}`;
    
    const notification = new Notification({
      user_id: userId,
      title,
      body,
      read_status: false
    });

    await notification.save();
    console.log(`✅ Leave request notification created for user ${userId}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating leave request notification:', error);
    throw error;
  }
};

/**
 * Creates mental health support notifications
 * @param {String} userId - The ID of the student
 * @param {String} counselorName - The name of the counselor
 * @param {String} appointmentDate - The appointment date
 * @param {String} details - Additional details
 */
export const createMentalHealthNotification = async (userId, counselorName, appointmentDate, details = '') => {
  try {
    const title = 'Mental Health Support';
    const body = `You have been assigned to counselor ${counselorName}. Appointment scheduled for ${appointmentDate}. ${details}`;
    
    const notification = new Notification({
      user_id: userId,
      title,
      body,
      read_status: false
    });

    await notification.save();
    console.log(`✅ Mental health notification created for user ${userId}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating mental health notification:', error);
    throw error;
  }
};

// =============================================================================
// FINANCIAL NOTIFICATIONS
// =============================================================================

/**
 * Creates fee payment notifications
 * @param {String} userId - The ID of the student/parent
 * @param {Number} amount - The fee amount
 * @param {String} dueDate - The due date
 * @param {String} status - The payment status (due, received, etc.)
 */
export const createFeePaymentNotification = async (userId, amount, dueDate, status = 'due') => {
  try {
    const title = status === 'due' ? 'Fee Payment Due' : 'Fee Payment Received';
    const body = status === 'due' 
      ? `Your fee payment of $${amount} is due on ${dueDate}. Please make payment to avoid late fees.`
      : `Your fee payment of $${amount} has been received. Thank you!`;
    
    const notification = new Notification({
      user_id: userId,
      title,
      body,
      read_status: false
    });

    await notification.save();
    console.log(`✅ Fee payment notification created for user ${userId}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating fee payment notification:', error);
    throw error;
  }
};

// =============================================================================
// EXPORT ALL FUNCTIONS
// =============================================================================

export default {
  // User Account & Profile
  createUserCreatedNotification,
  createProfileUpdateNotification,
  createAccountStatusNotification,
  
  // System-wide
  createSystemAnnouncement,
  createBulkNotificationByRole,
  
  // Academic
  createTimetableChangeNotification,
  createExamNotification,
  createAttendanceNotification,
  
  // Leave & Mental Health
  createLeaveRequestNotification,
  createMentalHealthNotification,
  
  // Financial
  createFeePaymentNotification
};