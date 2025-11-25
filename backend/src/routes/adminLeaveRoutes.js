import express from "express";
import { requestLeave, approveLeave, rejectLeave, listLeaves } from "../controllers/leaveController.js";

const router = express.Router();

router.post('/leaves', requestLeave);
router.put('/leaves/:id/approve', approveLeave);
router.put('/leaves/:id/reject', rejectLeave);
router.get('/leaves', listLeaves);

export default router;


