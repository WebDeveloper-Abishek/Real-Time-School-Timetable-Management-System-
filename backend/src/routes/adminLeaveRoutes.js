import express from "express";
import { requestLeave, approveLeave, rejectLeave, listLeaves } from "../controllers/leaveController.js";
import { listAllReplacements } from "../controllers/replacementController.js";

const router = express.Router();

router.post('/leaves', requestLeave);
router.put('/leaves/:id/approve', approveLeave);
router.put('/leaves/:id/reject', rejectLeave);
router.get('/leaves', listLeaves);

// Replacements
router.get('/replacements', listAllReplacements);

export default router;


