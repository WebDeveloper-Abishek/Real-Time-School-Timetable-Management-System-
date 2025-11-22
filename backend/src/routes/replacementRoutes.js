import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  processLeave,
  acceptReplacementRequest,
  declineReplacementRequest,
  getReplacementStatusController
} from '../controllers/replacementController.js';

const router = express.Router();

// Process leave request and find replacements
router.post('/process-leave', authenticateToken, processLeave);

// Teacher accepts replacement
router.post('/accept-replacement', authenticateToken, acceptReplacementRequest);

// Teacher declines replacement
router.post('/decline-replacement', authenticateToken, declineReplacementRequest);

// Get replacement status
router.get('/status/:leave_id', authenticateToken, getReplacementStatusController);

export default router;
