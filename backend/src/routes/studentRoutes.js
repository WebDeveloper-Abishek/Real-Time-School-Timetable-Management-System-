import express from "express";
import { getStudentTimetable, getStudentNotifications, markNotificationRead } from "../controllers/studentController.js";

const router = express.Router();

router.get('/timetable', getStudentTimetable);
router.get('/notifications', getStudentNotifications);
router.put('/notifications/:id/read', markNotificationRead);

export default router;
