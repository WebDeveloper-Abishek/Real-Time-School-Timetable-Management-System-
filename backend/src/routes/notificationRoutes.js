import express from 'express';
import { 
  getAllNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  createNotification,
  deleteNotification,
  getUnreadNotificationCount,
  getNotificationsByCategory,
  getNotificationsByPriority,
  searchNotifications,
  getNotificationStats,
  createBulkNotifications,
  getScheduledNotifications,
  createSystemWideNotification,
  createUserDeletionNotification,
  createTermAdditionNotification,
  createUsernameChangeNotification
} from '../controllers/notificationController.js';

const router = express.Router();

// Get all notifications for a user
router.get('/:userId', getAllNotifications);

// Get unread notification count
router.get('/:userId/unread-count', getUnreadNotificationCount);

// Get notification statistics
router.get('/:userId/stats', getNotificationStats);

// Get notifications by category
router.get('/:userId/category/:category', getNotificationsByCategory);

// Get notifications by priority
router.get('/:userId/priority/:priority', getNotificationsByPriority);

// Search notifications
router.get('/:userId/search', searchNotifications);

// Get scheduled notifications
router.get('/:userId/scheduled', getScheduledNotifications);

// Mark a specific notification as read
router.put('/:notificationId/read', markNotificationAsRead);

// Mark all notifications as read for a user
router.put('/:userId/mark-all-read', markAllNotificationsAsRead);

// Create a new notification (admin/system use)
router.post('/', createNotification);

// Create bulk notifications
router.post('/bulk', createBulkNotifications);

// Create system-wide notification
router.post('/system-wide', createSystemWideNotification);

// Delete a notification
router.delete('/:notificationId', deleteNotification);

export default router;