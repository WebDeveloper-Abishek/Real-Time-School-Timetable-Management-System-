import express from 'express';
import { 
  getAllUsersForChat,
  getChatMessages, 
  sendMessage, 
  getChatList,
  markMessagesAsRead,
  getUnreadMessageCount,
  deleteMessage,
  editMessage,
  addReaction,
  removeReaction,
  searchMessages,
  markMessageAsDelivered,
  updateTypingStatus,
  deleteConversation
} from '../controllers/chatController.js';

const router = express.Router();

// Get all users for chat selection
router.get('/users/:userId', getAllUsersForChat);

// Get chat list for a user (conversations)
router.get('/conversations/:userId', getChatList);

// Get messages between two users
router.get('/messages/:userId/:otherUserId', getChatMessages);

// Search messages between two users
router.get('/search/:userId/:otherUserId', searchMessages);

// Send a message
router.post('/send', sendMessage);

// Edit a message
router.put('/edit/:messageId', editMessage);

// Mark messages as read
router.put('/:userId/:otherUserId/mark-read', markMessagesAsRead);

// Mark message as delivered
router.put('/delivered/:messageId', markMessageAsDelivered);

// Add reaction to message
router.post('/reaction/:messageId', addReaction);

// Remove reaction from message
router.delete('/reaction/:messageId', removeReaction);

// Update typing status
router.post('/typing', updateTypingStatus);

// Get unread message count for a user
router.get('/:userId/unread-count', getUnreadMessageCount);

// Delete a message
router.delete('/:messageId', deleteMessage);

// Delete entire conversation between two users
router.delete('/conversation/:userId/:otherUserId', deleteConversation);

export default router;