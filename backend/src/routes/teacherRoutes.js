import express from "express";
import { getTeacherTimetable } from "../controllers/timetableController.js";
import { requestLeave, listLeaves } from "../controllers/leaveController.js";

const router = express.Router();

// Teacher Timetable
router.get('/timetable', getTeacherTimetable);

// Teacher Leave Routes
router.post('/leaves', requestLeave);
router.get('/leaves', listLeaves);

export default router;

