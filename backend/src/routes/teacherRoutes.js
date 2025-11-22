import express from "express";
import { getTeacherTimetable } from "../controllers/timetableController.js";

const router = express.Router();

// Teacher Timetable
router.get('/timetable', getTeacherTimetable);

export default router;

