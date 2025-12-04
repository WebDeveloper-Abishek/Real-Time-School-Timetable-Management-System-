import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { getTeacherTimetable } from "../controllers/timetableController.js";
import { requestLeave, listLeaves, deleteLeave } from "../controllers/leaveController.js";
import { getTerms, getCurrentTerm } from "../controllers/academicController.js";
import { getTeacherReplacementRequests, acceptTeacherReplacement, declineTeacherReplacement } from "../controllers/teacherReplacementController.js";
import { getTeacherClasses, getTeacherClassTeacherClasses, getClassStudents } from "../controllers/teacherController.js";
import { getTeacherSubjectAssignments, getSubjectClassStudents } from "../controllers/attendanceController.js";

const router = express.Router();

// Teacher Terms - Allow teachers to view terms for leave requests
router.get('/terms', authenticateToken, getTerms);
router.get('/terms/current', authenticateToken, getCurrentTerm); // Get current active term

// Teacher Classes - Get teacher's assigned classes
router.get('/classes', authenticateToken, getTeacherClasses);

// Teacher Class Teacher Classes - Get classes where teacher is class teacher
router.get('/class-teacher-classes', authenticateToken, getTeacherClassTeacherClasses);

// Get students for a class (only for class teacher)
router.get('/class-students', authenticateToken, getClassStudents);

// Teacher Subject Assignments - Get subject assignments for attendance marking
router.get('/subject-assignments', authenticateToken, getTeacherSubjectAssignments);

// Get students for subject attendance marking
router.get('/subject-class-students', authenticateToken, getSubjectClassStudents);

// Teacher Timetable
router.get('/timetable', authenticateToken, getTeacherTimetable);

// Teacher Leave Routes
router.post('/leaves', authenticateToken, requestLeave);
router.get('/leaves', authenticateToken, listLeaves); // Allow query params for user_id
router.delete('/leaves/:id', authenticateToken, deleteLeave); // Delete leave request

// Teacher Replacement Routes
router.get('/replacement-requests', authenticateToken, getTeacherReplacementRequests);
router.post('/replacement-requests/:notificationId/accept', authenticateToken, acceptTeacherReplacement);
router.post('/replacement-requests/:notificationId/decline', authenticateToken, declineTeacherReplacement);

export default router;

