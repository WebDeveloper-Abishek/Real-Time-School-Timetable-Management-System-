import express from "express";
import { 
  createAcademicYear, 
  getAcademicYears, 
  getAcademicYear,
  updateAcademicYear, 
  deleteAcademicYear,
  createTerm, 
  getTerms,
  getTerm,
  updateTerm,
  deleteTerm
} from "../controllers/academicController.js";

const router = express.Router();

// Academic Year Routes
router.post('/academic-years', createAcademicYear);
router.get('/academic-years', getAcademicYears);
router.get('/academic-years/:id', getAcademicYear);
router.put('/academic-years/:id', updateAcademicYear);
router.delete('/academic-years/:id', deleteAcademicYear);

// Term Routes
router.post('/terms', createTerm);
router.get('/terms', getTerms);
router.get('/terms/:id', getTerm);
router.put('/terms/:id', updateTerm);
router.delete('/terms/:id', deleteTerm);

// Test endpoint for terms
router.get('/terms/test', (req, res) => {
  res.json({ 
    message: 'Terms API is working', 
    timestamp: new Date().toISOString(),
    endpoint: '/api/admin/terms'
  });
});

export default router;


