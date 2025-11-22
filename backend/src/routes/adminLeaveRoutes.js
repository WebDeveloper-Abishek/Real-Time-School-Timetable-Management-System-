import express from "express";
import { requestLeave, approveLeave, listLeaves } from "../controllers/leaveController.js";

const router = express.Router();

router.post('/leaves', requestLeave);
router.put('/leaves/:id/approve', approveLeave);
router.get('/leaves', listLeaves);

export default router;


