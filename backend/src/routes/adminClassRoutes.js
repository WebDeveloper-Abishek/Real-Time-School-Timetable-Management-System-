import express from "express";
import { 
  createClass, 
  getClasses, 
  getClass,
  updateClass, 
  deleteClass,
  assignClassTeacher,
  assignTeacherToSubject,
  getClassTeachers,
  updateCourseLimit,
  updateTeacherAssignment,
  assignStudentToClass,
  removeStudentFromClass,
  removeTeacherFromClass,
  getAllTeacherAssignments
} from "../controllers/classController.js";
import { getSubjectsForClass } from "../controllers/subjectController.js";

const router = express.Router();

// Class Routes
router.post('/classes', createClass);
router.get('/classes', getClasses);

// Specific routes must come BEFORE parameterized routes
// Class Teacher Assignment Routes
router.post('/classes/assign-teacher', assignClassTeacher);
router.post('/classes/assign-subject', assignTeacherToSubject);
router.post('/classes/assign-student', assignStudentToClass);
router.post('/classes/remove-student', removeStudentFromClass);
router.delete('/classes/remove-teacher', removeTeacherFromClass);

// Specific class routes (must come before /:id route)
router.get('/classes/teacher-assignments', getAllTeacherAssignments); // Must come before /:id
router.get('/classes/:class_id/subjects', getSubjectsForClass);
router.get('/classes/:class_id/teachers', getClassTeachers);

// Parameterized routes come after specific routes
router.get('/classes/:id', getClass);
router.put('/classes/:id', updateClass);
router.delete('/classes/:id', deleteClass);
router.put('/assignments/:id/course-limit', updateCourseLimit);
router.put('/assignments/:id', updateTeacherAssignment);

export default router;
