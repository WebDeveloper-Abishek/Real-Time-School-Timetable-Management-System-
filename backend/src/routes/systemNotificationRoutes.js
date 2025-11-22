import express from 'express';
import {
  createAnnouncement,
  createAccountStatusAlert,
  createTimetableAlert,
  createExamAlert,
  createAttendanceAlert,
  createLeaveAlert,
  createMentalHealthAlert,
  createFeePaymentAlert,
  createBulkAlert
} from '../controllers/systemNotificationController.js';

const router = express.Router();

// System announcements
router.post('/announcement', createAnnouncement);

// Account status notifications
router.post('/account-status', createAccountStatusAlert);

// Timetable change notifications
router.post('/timetable-change', createTimetableAlert);

// Exam notifications
router.post('/exam', createExamAlert);

// Attendance notifications
router.post('/attendance', createAttendanceAlert);

// Leave request notifications
router.post('/leave-request', createLeaveAlert);

// Mental health notifications
router.post('/mental-health', createMentalHealthAlert);

// Fee payment notifications
router.post('/fee-payment', createFeePaymentAlert);

// Bulk notifications
router.post('/bulk', createBulkAlert);

export default router;
