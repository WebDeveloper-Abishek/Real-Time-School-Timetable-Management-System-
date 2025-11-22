import {
  createSystemAnnouncement,
  createAccountStatusNotification,
  createTimetableChangeNotification,
  createExamNotification,
  createAttendanceNotification,
  createLeaveRequestNotification,
  createMentalHealthNotification,
  createFeePaymentNotification,
  createBulkNotificationByRole
} from '../services/notificationService.js';

// Create system announcement
export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, targetUsers } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const result = await createSystemAnnouncement(title, message, targetUsers);
    res.status(201).json({ message: 'Announcement sent successfully', result });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Error creating announcement', error: error.message });
  }
};

// Create account status alert
export const createAccountStatusAlert = async (req, res) => {
  try {
    const { userId, status, details } = req.body;
    
    if (!userId || !status) {
      return res.status(400).json({ message: 'User ID and status are required' });
    }

    const notification = await createAccountStatusNotification(userId, status, details);
    res.status(201).json({ message: 'Account status notification created', notification });
  } catch (error) {
    console.error('Error creating account status alert:', error);
    res.status(500).json({ message: 'Error creating account status alert', error: error.message });
  }
};

// Create timetable alert
export const createTimetableAlert = async (req, res) => {
  try {
    const { classId, changeType, details } = req.body;
    
    if (!classId || !changeType) {
      return res.status(400).json({ message: 'Class ID and change type are required' });
    }

    const result = await createTimetableChangeNotification(classId, changeType, details);
    res.status(201).json({ message: 'Timetable notification created', result });
  } catch (error) {
    console.error('Error creating timetable alert:', error);
    res.status(500).json({ message: 'Error creating timetable alert', error: error.message });
  }
};

// Create exam alert
export const createExamAlert = async (req, res) => {
  try {
    const { classId, examType, examDate, details } = req.body;
    
    if (!classId || !examType || !examDate) {
      return res.status(400).json({ message: 'Class ID, exam type, and exam date are required' });
    }

    const result = await createExamNotification(classId, examType, examDate, details);
    res.status(201).json({ message: 'Exam notification created', result });
  } catch (error) {
    console.error('Error creating exam alert:', error);
    res.status(500).json({ message: 'Error creating exam alert', error: error.message });
  }
};

// Create attendance notification
export const createAttendanceAlert = async (req, res) => {
  try {
    const { userId, attendanceType, details } = req.body;
    
    if (!userId || !attendanceType) {
      return res.status(400).json({ message: 'User ID and attendance type are required' });
    }

    const notification = await createAttendanceNotification(userId, attendanceType, details);
    res.status(201).json({ message: 'Attendance notification created', notification });
  } catch (error) {
    console.error('Error creating attendance notification:', error);
    res.status(500).json({ message: 'Error creating attendance notification', error: error.message });
  }
};

// Create leave request notification
export const createLeaveAlert = async (req, res) => {
  try {
    const { userId, leaveType, status, details } = req.body;
    
    if (!userId || !leaveType || !status) {
      return res.status(400).json({ message: 'User ID, leave type, and status are required' });
    }

    const notification = await createLeaveRequestNotification(userId, leaveType, status, details);
    res.status(201).json({ message: 'Leave request notification created', notification });
  } catch (error) {
    console.error('Error creating leave notification:', error);
    res.status(500).json({ message: 'Error creating leave notification', error: error.message });
  }
};

// Create mental health notification
export const createMentalHealthAlert = async (req, res) => {
  try {
    const { userId, counselorName, appointmentDate, details } = req.body;
    
    if (!userId || !counselorName || !appointmentDate) {
      return res.status(400).json({ message: 'User ID, counselor name, and appointment date are required' });
    }

    const notification = await createMentalHealthNotification(userId, counselorName, appointmentDate, details);
    res.status(201).json({ message: 'Mental health notification created', notification });
  } catch (error) {
    console.error('Error creating mental health notification:', error);
    res.status(500).json({ message: 'Error creating mental health notification', error: error.message });
  }
};

// Create fee payment alert
export const createFeePaymentAlert = async (req, res) => {
  try {
    const { userId, amount, dueDate, status } = req.body;
    
    if (!userId || !amount) {
      return res.status(400).json({ message: 'User ID and amount are required' });
    }

    const notification = await createFeePaymentNotification(userId, amount, dueDate, status);
    res.status(201).json({ message: 'Fee payment notification created', notification });
  } catch (error) {
    console.error('Error creating fee payment alert:', error);
    res.status(500).json({ message: 'Error creating fee payment alert', error: error.message });
  }
};

// Create bulk alert
export const createBulkAlert = async (req, res) => {
  try {
    const { role, title, message } = req.body;
    
    if (!role || !title || !message) {
      return res.status(400).json({ message: 'Role, title, and message are required' });
    }

    const result = await createBulkNotificationByRole(role, title, message);
    res.status(201).json({ message: 'Bulk notification sent successfully', result });
  } catch (error) {
    console.error('Error creating bulk alert:', error);
    res.status(500).json({ message: 'Error creating bulk alert', error: error.message });
  }
};
