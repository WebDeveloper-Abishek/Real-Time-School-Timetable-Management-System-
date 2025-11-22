import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getCourseLimits,
  updateCourseLimit,
  getCourseLimitStats
} from '../controllers/courseLimitController.js';

const router = express.Router();

// Get course limits for a subject
router.get('/:subject_id/course-limits', authenticateToken, getCourseLimits);

// Update course limit
router.post('/course-limits', authenticateToken, updateCourseLimit);

// Get course limit statistics
router.get('/stats', authenticateToken, getCourseLimitStats);

export default router;
