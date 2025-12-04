import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  addExamMarks,
  getStudentExamMarks,
  getClassExamMarks,
  getChildExamMarks,
  getTeacherExamSummary,
  getExamAnalytics
} from "../controllers/examController.js";

const router = express.Router();

// Add exam marks (Teacher)
router.post('/marks', authenticateToken, addExamMarks);

// Get student exam marks (Student)
router.get('/student', authenticateToken, getStudentExamMarks);

// Get class exam marks (Teacher)
router.get('/class', authenticateToken, getClassExamMarks);

// Get child exam marks (Parent)
router.get('/child', authenticateToken, getChildExamMarks);

// Get teacher exam summary (Teacher)
router.get('/teacher/summary', authenticateToken, getTeacherExamSummary);

// Get exam analytics (Admin)
router.get('/analytics', authenticateToken, getExamAnalytics);

export default router;

