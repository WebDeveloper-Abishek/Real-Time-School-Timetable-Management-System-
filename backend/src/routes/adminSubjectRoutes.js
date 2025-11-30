import express from "express";
import { 
  createSubject, 
  getSubjects, 
  getSubject,
  updateSubject, 
  deleteSubject,
  getAvailableTerms,
  getAvailableTeachers,
  assignSubjectToTerm,
  removeSubjectFromTerm,
  assignSubjectToClasses,
  assignSubjectsToClass,
  updateClassSubjectCourseLimit,
  removeSubjectFromClass
} from "../controllers/subjectController.js";

const router = express.Router();

// Test endpoint
router.get('/subjects/test', (req, res) => {
  res.json({ message: 'Subject API is working', timestamp: new Date().toISOString() });
});

// Subject CRUD Routes
router.post('/subjects', createSubject);
router.get('/subjects', getSubjects);
router.get('/subjects/:id', getSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);


// Additional Routes
router.get('/subjects/:id/available-terms', getAvailableTerms);
router.get('/subjects/available-teachers', getAvailableTeachers);
router.post('/subjects/assign-to-term', assignSubjectToTerm);
router.post('/subjects/remove-from-term', removeSubjectFromTerm);
router.post('/subjects/assign-to-classes', assignSubjectToClasses);

// Assign subjects to class with course limits (preparation - actual assignment happens via teacher assignment)
router.post('/classes/assign-subjects', assignSubjectsToClass);

// Update course limit for class-subject assignment (updates TeacherSubjectAssignment)
router.put('/classes/subject-assignments/update', updateClassSubjectCourseLimit);

// Remove subject from class
router.post('/classes/subject-assignments/remove', removeSubjectFromClass);

export default router;
