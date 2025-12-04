import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  submitMentalHealthReport,
  getMentalHealthReports,
  updateMentalHealthReport,
  scheduleCounsellorSlot,
  getAvailableCounsellorSlots,
  scheduleCounsellorMeeting,
  getCounsellorMeetings,
  provideMentalHealthFeedback
} from "../controllers/mentalHealthController.js";

const router = express.Router();

// Submit mental health report (Student)
router.post('/reports', authenticateToken, submitMentalHealthReport);

// Get mental health reports
router.get('/reports', authenticateToken, getMentalHealthReports);

// Update mental health report
router.put('/reports/:id', authenticateToken, updateMentalHealthReport);

// Schedule counsellor slot (Counsellor/Admin)
router.post('/counsellor-slots', authenticateToken, scheduleCounsellorSlot);

// Get available counsellor slots
router.get('/counsellor-slots', authenticateToken, getAvailableCounsellorSlots);

// Schedule meeting with counsellor (Student)
router.post('/meetings', authenticateToken, scheduleCounsellorMeeting);

// Get counsellor meetings
router.get('/meetings', authenticateToken, getCounsellorMeetings);

// Provide feedback for mental health report
router.post('/reports/:id/feedback', authenticateToken, provideMentalHealthFeedback);

export default router;

