import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { 
  markAttendance, 
  markSubjectAttendance,
  getClassAttendance, 
  getStudentAttendance, 
  getTeacherAttendanceSummary,
  getChildAttendance,
  getAttendanceAnalytics,
  getTeacherSubjectAssignments,
  getSubjectClassStudents
} from "../controllers/attendanceController.js";

const router = express.Router();

// Mark attendance (for class teachers)
router.post('/mark', authenticateToken, markAttendance);

// Mark subject attendance (for subject teachers)
router.post('/mark-subject', authenticateToken, markSubjectAttendance);

// Get class attendance
router.get('/class', authenticateToken, getClassAttendance);

// Get student attendance
router.get('/student', authenticateToken, getStudentAttendance);

// Get teacher attendance summary
router.get('/teacher/summary', authenticateToken, getTeacherAttendanceSummary);

// Get child attendance (for parents)
router.get('/child', authenticateToken, getChildAttendance);

// Get attendance analytics (for admin)
router.get('/analytics', authenticateToken, getAttendanceAnalytics);

export default router;

