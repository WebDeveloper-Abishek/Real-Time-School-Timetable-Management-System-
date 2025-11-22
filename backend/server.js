import 'dotenv/config';

import express from 'express';
import cors from 'cors';
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
