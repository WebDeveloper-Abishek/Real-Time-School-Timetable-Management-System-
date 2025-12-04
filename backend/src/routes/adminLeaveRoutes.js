import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { requestLeave, approveLeave, rejectLeave, listLeaves } from "../controllers/leaveController.js";
import { listAllReplacements } from "../controllers/replacementController.js";

const router = express.Router();

router.post('/leaves', authenticateToken, requestLeave);
router.put('/leaves/:id/approve', authenticateToken, approveLeave);
router.put('/leaves/:id/reject', authenticateToken, rejectLeave);
router.get('/leaves', authenticateToken, listLeaves);

// Replacements
router.get('/replacements', listAllReplacements);

export default router;


