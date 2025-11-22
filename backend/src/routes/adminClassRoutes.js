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
  removeTeacherFromClass
} from "../controllers/classController.js";

const router = express.Router();

// Class Routes
router.post('/classes', createClass);
router.get('/classes', getClasses);
router.get('/classes/:id', getClass);
router.put('/classes/:id', updateClass);
router.delete('/classes/:id', deleteClass);

// Class Teacher Assignment Routes
router.post('/classes/assign-teacher', assignClassTeacher);
router.post('/classes/assign-subject', assignTeacherToSubject);
router.get('/classes/:class_id/teachers', getClassTeachers);
router.put('/assignments/:id/course-limit', updateCourseLimit);
router.put('/assignments/:id', updateTeacherAssignment);

// Student Assignment Routes
router.post('/classes/assign-student', assignStudentToClass);
router.delete('/classes/remove-student', removeStudentFromClass);

// Teacher Assignment Routes  
router.delete('/classes/remove-teacher', removeTeacherFromClass);

export default router;
