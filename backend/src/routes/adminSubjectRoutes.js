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
  removeSubjectFromTerm
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

export default router;
