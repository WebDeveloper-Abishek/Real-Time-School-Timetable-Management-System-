import express from "express";
import { createSubject, listSubjects, createClass, listClasses, assignTeacher, listAssignments } from "../controllers/schoolController.js";

const router = express.Router();

router.post('/subjects', createSubject);
router.get('/subjects', listSubjects);

router.post('/classes', createClass);
router.get('/classes', listClasses);

router.post('/assignments', assignTeacher);
router.get('/assignments', listAssignments);

export default router;


