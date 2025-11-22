import express from "express";
import { getParentChildren, getChildTimetable, getParentNotifications } from "../controllers/parentController.js";

const router = express.Router();

router.get('/children', getParentChildren);
router.get('/child-timetable', getChildTimetable);
router.get('/notifications', getParentNotifications);

export default router;
