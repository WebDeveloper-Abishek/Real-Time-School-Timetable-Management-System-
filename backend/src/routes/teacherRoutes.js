import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { getTeacherTimetable } from "../controllers/timetableController.js";
import { requestLeave, listLeaves } from "../controllers/leaveController.js";
import { getTeacherReplacementRequests, acceptTeacherReplacement, declineTeacherReplacement } from "../controllers/teacherReplacementController.js";

const router = express.Router();

// Teacher Timetable
router.get('/timetable', authenticateToken, getTeacherTimetable);

// Teacher Leave Routes
router.post('/leaves', authenticateToken, requestLeave);
router.get('/leaves', listLeaves); // Allow query params for user_id

// Teacher Replacement Routes
router.get('/replacement-requests', getTeacherReplacementRequests); // Allow query params
router.post('/replacement-requests/:notificationId/accept', acceptTeacherReplacement);
router.post('/replacement-requests/:notificationId/decline', declineTeacherReplacement);

export default router;

