import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { getStudentTimetable, getStudentNotifications, markNotificationRead } from "../controllers/studentController.js";

const router = express.Router();

router.get('/timetable', authenticateToken, getStudentTimetable);
router.get('/notifications', authenticateToken, getStudentNotifications);
router.put('/notifications/:id/read', authenticateToken, markNotificationRead);

export default router;
