import express from "express";
import {
  createSlot,
  listClassDay,
  generateTimetable,
  checkConflicts,
  requestReplacement,
  suggestReplacement,
  listTeacherDay,
  decideReplacement,
  getTeacherTimetable,
  getStudentTimetable
} from "../controllers/timetableController.js";
import {
  initSlots,
  getSlots,
  getAcademicPeriods,
  updateSlot
} from "../controllers/timeslotController.js";

const router = express.Router();

// Timetable CRUD
router.post('/slots', createSlot);
router.get('/slots', listClassDay);

// AI Timetable Generation
router.post('/timetable/generate', generateTimetable);
router.get('/timetable/conflicts', checkConflicts);
router.get('/teacher/timetable', getTeacherTimetable);
router.get('/student/timetable', getStudentTimetable);

// Replacement Management
router.post('/replacements', requestReplacement);
router.get('/replacements/suggest', suggestReplacement);
router.put('/replacements/:id/decide', decideReplacement);

// Teacher Timetable
router.get('/teacher/slots', listTeacherDay);

// Time Slot Management
router.post('/timeslots/init', initSlots);
router.get('/timeslots', getSlots);
router.get('/timeslots/academic', getAcademicPeriods);
router.put('/timeslots/:id', updateSlot);

export default router;
