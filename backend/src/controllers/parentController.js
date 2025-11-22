import StudentParentLink from "../models/StudentParentLink.js";
import UserClassAssignment from "../models/UserClassAssignment.js";
import TimetableSlot from "../models/TimetableSlot.js";
import Notification from "../models/Notification.js";

export const getParentChildren = async (req, res) => {
  try {
    const { parent_id } = req.query;
    if (!parent_id) return res.status(400).json({ message: "Missing parent_id" });
    
    const children = await StudentParentLink.find({ parent_id })
      .populate("student_id", "name date_of_birth gender");
    
    return res.json(children);
  } catch (e) { return res.status(500).json({ message: "Server error" }); }
};

export const getChildTimetable = async (req, res) => {
  try {
    const { student_id, term_id, day_of_week } = req.query;
    if (!student_id || !term_id) return res.status(400).json({ message: "Missing params" });
    
    // Get student's class
    const studentClass = await UserClassAssignment.findOne({ user_id: student_id }).populate("class_id");
    if (!studentClass) return res.status(404).json({ message: "Student not enrolled" });
    
    // Get class timetable
    const filter = { class_id: studentClass.class_id._id, term_id };
    if (day_of_week) filter.day_of_week = day_of_week;
    
    const slots = await TimetableSlot.find(filter).sort({ period_index: 1 })
      .populate("subject_id", "subject_name")
      .populate("teacher_id", "name");
    
    return res.json(slots);
  } catch (e) { return res.status(500).json({ message: "Server error" }); }
};

export const getParentNotifications = async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ message: "Missing user_id" });
    
    const notifications = await Notification.find({ user_id }).sort({ createdAt: -1 }).limit(20);
    return res.json(notifications);
  } catch (e) { return res.status(500).json({ message: "Server error" }); }
};
