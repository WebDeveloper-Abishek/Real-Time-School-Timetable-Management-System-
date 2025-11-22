import Chat from '../models/Chat.js';
import User from '../models/User.js';

// Get all users for chat selection (excluding current user)
export const getAllUsersForChat = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get all users except the current user and exclude deleted users
    const users = await User.find(
      { 
        _id: { $ne: userId },
        is_deleted: { $ne: true } // Exclude deleted users
      }, 
      'name email role profile_picture'
    ).sort({ name: 1 });

    // Group users by role for better organization
    const groupedUsers = {
      Admin: users.filter(user => user.role === 'Admin'),
      Teacher: users.filter(user => user.role === 'Teacher'),
      Student: users.filter(user => user.role === 'Student'),
      Parent: users.filter(user => user.role === 'Parent'),
      Counsellor: users.filter(user => user.role === 'Counsellor')
    };

    res.json({ 
      users: groupedUsers,
      totalUsers: users.length 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users for chat', error: error.message });
  }
};

// Get chat list for a user (conversations)
export const getChatList = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get all messages involving this user (excluding deleted messages)
    const messages = await Chat.find({
      $or: [
        { sender_id: userId },
        { receiver_id: userId }
      ],
      is_deleted: { $ne: true }
    })
    .populate('sender_id', 'name email role')
    .populate('receiver_id', 'name email role')
    .sort({ sent_at: -1 });

    // Group messages by conversation partner
    const conversationsMap = new Map();

    messages.forEach(message => {
      const partnerId = message.sender_id._id.toString() === userId 
        ? message.receiver_id._id.toString() 
        : message.sender_id._id.toString();
      
      const partner = message.sender_id._id.toString() === userId 
        ? message.receiver_id 
        : message.sender_id;

      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          _id: partnerId,
          user: {
            _id: partner._id,
            name: partner.name,
            email: partner.email,
            role: partner.role
          },
          lastMessage: {
            _id: message._id,
            message: message.message,
            sent_at: message.sent_at,
            read_status: message.read_status
          },
          unreadCount: 0
        });
      }

      // Count unread messages
      if (message.receiver_id._id.toString() === userId && !message.read_status) {
        const conversation = conversationsMap.get(partnerId);
        conversation.unreadCount++;
      }
    });

    const conversations = Array.from(conversationsMap.values());

    res.json({ conversations });
  } catch (error) {
    console.error('Error fetching chat list:', error);
    res.status(500).json({ message: 'Error fetching chat list', error: error.message });
  }
};

// Get messages between two users
export const getChatMessages = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Chat.find({
      $or: [
        { sender_id: userId, receiver_id: otherUserId },
        { sender_id: otherUserId, receiver_id: userId }
      ],
      is_deleted: { $ne: true }
    })
      .sort({ sent_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('sender_id', 'name email role')
      .populate('receiver_id', 'name email role');

    const total = await Chat.countDocuments({
      $or: [
        { sender_id: userId, receiver_id: otherUserId },
        { sender_id: otherUserId, receiver_id: userId }
      ],
      is_deleted: { $ne: true }
    });

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { 
      sender_id, 
      receiver_id, 
      message, 
      message_type = 'text',
      file_url,
      file_name,
      file_size,
      reply_to 
    } = req.body;

    if (!sender_id || !receiver_id || !message) {
      return res.status(400).json({ message: 'sender_id, receiver_id, and message are required' });
    }

    const newMessage = new Chat({
      sender_id,
      receiver_id,
      message,
      message_type,
      file_url,
      file_name,
      file_size,
      reply_to,
      read_status: false,
      delivered_status: false
    });

    await newMessage.save();
    
    // Populate sender and receiver info
    await newMessage.populate('sender_id', 'name email role profile_picture');
    await newMessage.populate('receiver_id', 'name email role profile_picture');
    
    if (reply_to) {
      await newMessage.populate('reply_to', 'message sender_id');
    }

    res.status(201).json({ message: 'Message sent', chat: newMessage });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    const result = await Chat.updateMany(
      { 
        sender_id: otherUserId, 
        receiver_id: userId, 
        read_status: false 
      },
      { read_status: true }
    );

    res.json({ 
      message: 'Messages marked as read', 
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating messages', error: error.message });
  }
};

// Get unread message count for a user
export const getUnreadMessageCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await Chat.countDocuments({ 
      receiver_id: userId, 
      read_status: false 
    });
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread count', error: error.message });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Chat.findByIdAndUpdate(
      messageId,
      { 
        is_deleted: true, 
        deleted_at: new Date(),
        message: 'This message was deleted'
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ message: 'Message deleted', chat: message });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting message', error: error.message });
  }
};

// Edit a message
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message: newMessage } = req.body;

    if (!newMessage) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = await Chat.findByIdAndUpdate(
      messageId,
      { 
        message: newMessage,
        is_edited: true,
        edited_at: new Date()
      },
      { new: true }
    ).populate('sender_id', 'name email role')
     .populate('receiver_id', 'name email role');

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ message: 'Message edited', chat: message });
  } catch (error) {
    res.status(500).json({ message: 'Error editing message', error: error.message });
  }
};

// Add reaction to a message
export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { user_id, emoji } = req.body;

    if (!user_id || !emoji) {
      return res.status(400).json({ message: 'user_id and emoji are required' });
    }

    const message = await Chat.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(
      reaction => reaction.user_id.toString() !== user_id
    );

    // Add new reaction
    message.reactions.push({
      user_id,
      emoji,
      created_at: new Date()
    });

    await message.save();
    await message.populate('reactions.user_id', 'name');

    res.json({ message: 'Reaction added', chat: message });
  } catch (error) {
    res.status(500).json({ message: 'Error adding reaction', error: error.message });
  }
};

// Remove reaction from a message
export const removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: 'user_id is required' });
    }

    const message = await Chat.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Remove reaction from this user
    message.reactions = message.reactions.filter(
      reaction => reaction.user_id.toString() !== user_id
    );

    await message.save();
    await message.populate('reactions.user_id', 'name');

    res.json({ message: 'Reaction removed', chat: message });
  } catch (error) {
    res.status(500).json({ message: 'Error removing reaction', error: error.message });
  }
};

// Search messages
export const searchMessages = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    const { query, page = 1, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const messages = await Chat.find({
      $or: [
        { sender_id: userId, receiver_id: otherUserId },
        { sender_id: otherUserId, receiver_id: userId }
      ],
      message: { $regex: query, $options: 'i' },
      is_deleted: { $ne: true }
    })
      .sort({ sent_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('sender_id', 'name email role')
      .populate('receiver_id', 'name email role');

    const total = await Chat.countDocuments({
      $or: [
        { sender_id: userId, receiver_id: otherUserId },
        { sender_id: otherUserId, receiver_id: userId }
      ],
      message: { $regex: query, $options: 'i' },
      is_deleted: { $ne: true }
    });

    res.json({
      messages: messages.reverse(),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error searching messages', error: error.message });
  }
};

// Mark message as delivered
export const markMessageAsDelivered = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Chat.findByIdAndUpdate(
      messageId,
      { 
        delivered_status: true,
        delivered_at: new Date()
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ message: 'Message marked as delivered', chat: message });
  } catch (error) {
    res.status(500).json({ message: 'Error updating delivery status', error: error.message });
  }
};

// Get typing status
export const updateTypingStatus = async (req, res) => {
  try {
    const { userId, otherUserId, isTyping } = req.body;
    
    // This would typically be handled by WebSocket in a real-time system
    // For now, we'll just return success
    res.json({ 
      message: 'Typing status updated', 
      userId, 
      otherUserId, 
      isTyping 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating typing status', error: error.message });
  }
};