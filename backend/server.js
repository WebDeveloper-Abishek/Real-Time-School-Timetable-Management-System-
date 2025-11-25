import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import connectDB from './src/config/database.js';
import authRoutes from './src/routes/authroutes.js';
import adminUserRoutes from './src/routes/adminUserRoutes.js';
import adminAcademicRoutes from './src/routes/adminAcademicRoutes.js';
import adminSchoolRoutes from './src/routes/adminSchoolRoutes.js';
import adminTimetableRoutes from './src/routes/adminTimetableRoutes.js';
import adminLeaveRoutes from './src/routes/adminLeaveRoutes.js';
import adminClassRoutes from './src/routes/adminClassRoutes.js';
import adminSubjectRoutes from './src/routes/adminSubjectRoutes.js';
import studentRoutes from './src/routes/studentRoutes.js';
import teacherRoutes from './src/routes/teacherRoutes.js';
import parentRoutes from './src/routes/parentRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import systemNotificationRoutes from './src/routes/systemNotificationRoutes.js';
import Chat from './src/models/Chat.js';

// Connect to MongoDB
connectDB();

// Middleware
const app = express();
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminUserRoutes);
app.use('/api/admin', adminAcademicRoutes);
app.use('/api/admin', adminSchoolRoutes);
app.use('/api/admin', adminTimetableRoutes);
app.use('/api/admin', adminLeaveRoutes);
app.use('/api/admin', adminClassRoutes);
app.use('/api/admin', adminSubjectRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/system-notifications', systemNotificationRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Timetable System API' });
});

const PORT = process.env.PORT || 5000;

// Create HTTP server and Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store connected users
const connectedUsers = new Map();

// Socket.io connection handling
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    socket.userId = decoded.id || decoded.userId; // Support both 'id' and 'userId'
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    console.error('WebSocket auth error:', err);
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  const userIdStr = socket.userId.toString();
  connectedUsers.set(userIdStr, socket.id);
  socket.join(`user_${userIdStr}`);
  
  socket.on('send_message', async (data) => {
    try {
      const { sender_id, receiver_id, message } = data;
      const newMessage = new Chat({
        sender_id,
        receiver_id,
        message,
        read_status: false,
        delivered_status: false
      });
      
      const savedMessage = await newMessage.save();
      const populatedMessage = await Chat.findById(savedMessage._id)
        .populate('sender_id', 'name email role profile_picture')
        .populate('receiver_id', 'name email role profile_picture')
        .lean();
      
      const receiverIdStr = receiver_id.toString();
      io.to(`user_${receiverIdStr}`).emit('receive_message', populatedMessage);
      socket.emit('message_sent', populatedMessage);
    } catch (error) {
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });
  
  // Handle message deletion
  socket.on('delete_message', async (data) => {
    try {
      const { messageId, userId } = data;
      const message = await Chat.findById(messageId);
      
      if (!message) {
        return socket.emit('delete_error', { error: 'Message not found' });
      }
      
      // Check if user is sender or receiver
      if (message.sender_id.toString() !== userId && message.receiver_id.toString() !== userId) {
        return socket.emit('delete_error', { error: 'Unauthorized' });
      }
      
      // Soft delete
      message.is_deleted = true;
      message.deleted_at = new Date();
      message.message = 'This message was deleted';
      await message.save();
      
      // Notify both users
      const senderIdStr = message.sender_id.toString();
      const receiverIdStr = message.receiver_id.toString();
      const userIdStr = userId.toString();
      const otherUserId = senderIdStr === userIdStr ? receiverIdStr : senderIdStr;
      
      io.to(`user_${userIdStr}`).emit('message_deleted', { messageId });
      io.to(`user_${otherUserId}`).emit('message_deleted', { messageId });
    } catch (error) {
      console.error('Error deleting message:', error);
      socket.emit('delete_error', { error: 'Failed to delete message' });
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    const userIdStr = socket.userId.toString();
    connectedUsers.delete(userIdStr);
  });
});

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
