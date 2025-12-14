import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { processWeeklyReduction, getWeekNumber } from "../controllers/weeklyTrackingController.js";

const router = express.Router();

// Process weekly course limit reduction (Admin only)
router.post('/process-weekly', authenticateToken, processWeeklyReduction);

// Get current week number for a term
router.get('/week-number', authenticateToken, getWeekNumber);

export default router;

