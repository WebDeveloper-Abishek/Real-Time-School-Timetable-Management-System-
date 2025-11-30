import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { getTeacherTimetable } from "../controllers/timetableController.js";
import { requestLeave, listLeaves } from "../controllers/leaveController.js";
import { getTerms } from "../controllers/academicController.js";
import { getTeacherReplacementRequests, acceptTeacherReplacement, declineTeacherReplacement } from "../controllers/teacherReplacementController.js";

const router = express.Router();

// Teacher Terms - Allow teachers to view terms for leave requests
router.get('/terms', authenticateToken, getTerms);

// Teacher Timetable
router.get('/timetable', authenticateToken, getTeacherTimetable);

// Teacher Leave Routes
router.post('/leaves', authenticateToken, requestLeave);
router.get('/leaves', authenticateToken, listLeaves); // Allow query params for user_id

// Teacher Replacement Routes
router.get('/replacement-requests', authenticateToken, getTeacherReplacementRequests);
router.post('/replacement-requests/:notificationId/accept', authenticateToken, acceptTeacherReplacement);
router.post('/replacement-requests/:notificationId/decline', authenticateToken, declineTeacherReplacement);

export default router;

