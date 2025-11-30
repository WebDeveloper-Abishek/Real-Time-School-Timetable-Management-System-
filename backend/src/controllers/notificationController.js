import Notification from '../models/Notification.js';
import User from '../models/User.js';

// Create system-wide notification for all users
export const createSystemWideNotification = async (req, res) => {
  try {
    const { title, body, type = 'system', priority = 'medium', category = 'system', metadata = {} } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ message: 'Title and body are required' });
    }

    // Get all active users
    const users = await User.find({ is_deleted: { $ne: true } }, '_id');
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    }

    // Create notifications for all users
    const notifications = users.map(user => ({
      user_id: user._id,
      title,
      body,
      type,
      priority,
      category,
      is_system: true,
      metadata: {
        ...metadata,
        system_wide: true,
        created_at: new Date()
      }
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    res.json({
      message: 'System-wide notification created successfully',
      notificationsCreated: createdNotifications.length,
      totalUsers: users.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating system-wide notification', error: error.message });
  }
};

// Create notification for user deletion
export const createUserDeletionNotification = async (deletedUserName, deletedUserRole, adminName) => {
  try {
    // Get all active users except the deleted one
    const users = await User.find({ is_deleted: { $ne: true } }, '_id');
    
    if (users.length === 0) return;

    const notifications = users.map(user => ({
      user_id: user._id,
      title: 'User Account Deleted',
      body: `User "${deletedUserName}" (${deletedUserRole}) has been deleted from the system by ${adminName}.`,
      type: 'warning',
      priority: 'high',
      category: 'system',
      is_system: true,
      metadata: {
        action: 'user_deletion',
        deleted_user: deletedUserName,
        deleted_user_role: deletedUserRole,
        admin_name: adminName,
        system_wide: true,
        created_at: new Date()
      }
    }));

    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Error creating user deletion notification:', error);
  }
};

// Create notification for new term addition
export const createTermAdditionNotification = async (termName, termDetails, adminName) => {
  try {
    // Get all active users
    const users = await User.find({ is_deleted: { $ne: true } }, '_id');
    
    if (users.length === 0) return;

    const notifications = users.map(user => ({
      user_id: user._id,
      title: 'New Academic Term Added',
      body: `A new academic term "${termName}" has been added to the system by ${adminName}. ${termDetails || ''}`,
      type: 'info',
      priority: 'medium',
      category: 'academic',
      is_system: true,
      metadata: {
        action: 'term_addition',
        term_name: termName,
        term_details: termDetails,
        admin_name: adminName,
        system_wide: true,
        created_at: new Date()
      }
    }));

    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Error creating term addition notification:', error);
  }
};

// Create notification for username change
export const createUsernameChangeNotification = async (oldName, newName, userRole, adminName) => {
  try {
    // Get all active users
    const users = await User.find({ is_deleted: { $ne: true } }, '_id');
    
    if (users.length === 0) return;

    const notifications = users.map(user => ({
      user_id: user._id,
      title: 'User Profile Updated',
      body: `User profile has been updated: "${oldName}" is now "${newName}" (${userRole}). Updated by ${adminName}.`,
      type: 'info',
      priority: 'medium',
      category: 'system',
      is_system: true,
      metadata: {
        action: 'username_change',
        old_name: oldName,
        new_name: newName,
        user_role: userRole,
        admin_name: adminName,
        system_wide: true,
        created_at: new Date()
      }
    }));

    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Error creating username change notification:', error);
  }
};

// Get all notifications for a user
export const getAllNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const notifications = await Notification.find({ 
      user_id: userId,
      is_deleted: { $ne: true }
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user_id', 'name email role');

    const total = await Notification.countDocuments({ 
      user_id: userId,
      is_deleted: { $ne: true }
    });

    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await Notification.countDocuments({ 
      user_id: userId, 
      read_status: false,
      is_deleted: { $ne: true }
    });
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread count', error: error.message });
  }
};

// Mark a specific notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read_status: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification', error: error.message });
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await Notification.updateMany(
      { user_id: userId, read_status: false },
      { read_status: true }
    );

    res.json({ 
      message: 'All notifications marked as read', 
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notifications', error: error.message });
  }
};

// Create a new notification
export const createNotification = async (req, res) => {
  try {
    const { 
      user_id, 
      title, 
      body, 
      type = 'info',
      priority = 'medium',
      category = 'general',
      action_url,
      action_text,
      action_data,
      scheduled_at,
      expires_at,
      is_system = false,
      sender_id,
      related_entity_type,
      related_entity_id,
      metadata
    } = req.body;

    if (!user_id || !title || !body) {
      return res.status(400).json({ message: 'user_id, title, and body are required' });
    }

    const notification = new Notification({
      user_id,
      title,
      body,
      type,
      priority,
      category,
      action_url,
      action_text,
      action_data,
      scheduled_at,
      expires_at,
      is_system,
      sender_id,
      related_entity_type,
      related_entity_id,
      metadata,
      read_status: false
    });

    await notification.save();
    await notification.populate('user_id', 'name email role');
    if (sender_id) {
      await notification.populate('sender_id', 'name email role');
    }

    res.status(201).json({ message: 'Notification created', notification });
  } catch (error) {
    res.status(500).json({ message: 'Error creating notification', error: error.message });
  }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { 
        is_deleted: true, 
        deleted_at: new Date() 
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted', notification });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notification', error: error.message });
  }
};

// Get notifications by category
export const getNotificationsByCategory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { category, page = 1, limit = 20 } = req.query;

    const notifications = await Notification.find({ 
      user_id: userId, 
      category: category,
      is_deleted: { $ne: true }
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user_id', 'name email role')
      .populate('sender_id', 'name email role');

    const total = await Notification.countDocuments({ 
      user_id: userId, 
      category: category,
      is_deleted: { $ne: true }
    });

    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications by category', error: error.message });
  }
};

// Get notifications by priority
export const getNotificationsByPriority = async (req, res) => {
  try {
    const { userId } = req.params;
    const { priority, page = 1, limit = 20 } = req.query;

    const notifications = await Notification.find({ 
      user_id: userId, 
      priority: priority,
      is_deleted: { $ne: true }
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user_id', 'name email role')
      .populate('sender_id', 'name email role');

    const total = await Notification.countDocuments({ 
      user_id: userId, 
      priority: priority,
      is_deleted: { $ne: true }
    });

    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications by priority', error: error.message });
  }
};

// Search notifications
export const searchNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { query, page = 1, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const notifications = await Notification.find({
      user_id: userId,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { body: { $regex: query, $options: 'i' } }
      ],
      is_deleted: { $ne: true }
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user_id', 'name email role')
      .populate('sender_id', 'name email role');

    const total = await Notification.countDocuments({
      user_id: userId,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { body: { $regex: query, $options: 'i' } }
      ],
      is_deleted: { $ne: true }
    });

    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error searching notifications', error: error.message });
  }
};

// Get notification statistics
export const getNotificationStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await Notification.aggregate([
      { $match: { user_id: userId, is_deleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ['$read_status', false] }, 1, 0] } },
          byType: {
            $push: {
              type: '$type',
              read: '$read_status'
            }
          },
          byPriority: {
            $push: {
              priority: '$priority',
              read: '$read_status'
            }
          },
          byCategory: {
            $push: {
              category: '$category',
              read: '$read_status'
            }
          }
        }
      }
    ]);

    // Process the aggregated data
    const result = stats[0] || { total: 0, unread: 0, byType: {}, byPriority: {}, byCategory: {} };
    
    // Count by type
    const typeStats = {};
    result.byType?.forEach(item => {
      if (!typeStats[item.type]) {
        typeStats[item.type] = { total: 0, unread: 0 };
      }
      typeStats[item.type].total++;
      if (!item.read) typeStats[item.type].unread++;
    });

    // Count by priority
    const priorityStats = {};
    result.byPriority?.forEach(item => {
      if (!priorityStats[item.priority]) {
        priorityStats[item.priority] = { total: 0, unread: 0 };
      }
      priorityStats[item.priority].total++;
      if (!item.read) priorityStats[item.priority].unread++;
    });

    // Count by category
    const categoryStats = {};
    result.byCategory?.forEach(item => {
      if (!categoryStats[item.category]) {
        categoryStats[item.category] = { total: 0, unread: 0 };
      }
      categoryStats[item.category].total++;
      if (!item.read) categoryStats[item.category].unread++;
    });

    res.json({
      total: result.total,
      unread: result.unread,
      read: result.total - result.unread,
      byType: typeStats,
      byPriority: priorityStats,
      byCategory: categoryStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notification statistics', error: error.message });
  }
};

// Create bulk notifications
export const createBulkNotifications = async (req, res) => {
  try {
    const { notifications } = req.body;

    if (!notifications || !Array.isArray(notifications)) {
      return res.status(400).json({ message: 'notifications array is required' });
    }

    const createdNotifications = await Notification.insertMany(notifications);
    
    res.status(201).json({ 
      message: 'Bulk notifications created', 
      count: createdNotifications.length,
      notifications: createdNotifications 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating bulk notifications', error: error.message });
  }
};

// Get scheduled notifications
export const getScheduledNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const notifications = await Notification.find({ 
      user_id: userId, 
      scheduled_at: { $exists: true, $ne: null },
      is_deleted: { $ne: true }
    })
      .sort({ scheduled_at: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user_id', 'name email role')
      .populate('sender_id', 'name email role');

    const total = await Notification.countDocuments({ 
      user_id: userId, 
      scheduled_at: { $exists: true, $ne: null },
      is_deleted: { $ne: true }
    });

    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching scheduled notifications', error: error.message });
  }
};