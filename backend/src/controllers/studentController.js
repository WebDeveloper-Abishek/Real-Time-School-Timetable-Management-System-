import UserClassAssignment from "../models/UserClassAssignment.js";
import ClassTimetable from "../models/ClassTimetable.js";
import Notification from "../models/Notification.js";
import Chat from "../models/Chat.js";

export const getStudentTimetable = async (req, res) => {
  try {
    const { student_id, class_id, term_id, day_of_week } = req.query;
    
    let classIdToUse = class_id;
    
    // If student_id provided, get their class assignment
    if (student_id && !class_id) {
      const studentClass = await UserClassAssignment.findOne({ user_id: student_id }).populate("class_id");
      if (!studentClass) return res.status(404).json({ message: "Student not enrolled" });
      classIdToUse = studentClass.class_id._id;
    }
    
    if (!classIdToUse) return res.status(400).json({ message: "class_id or student_id is required" });
    
    // Get class timetable from ClassTimetable model
    const filter = { class_id: classIdToUse };
    if (term_id) filter.term_id = term_id; // IMPORTANT: Filter by term_id
    if (day_of_week) filter.day_of_week = day_of_week;
    
    const timetable = await ClassTimetable.find(filter)
      .populate('subject_id', 'subject_name')
      .populate('teacher_id', 'name')
      .populate('slot_id', 'start_time end_time slot_number slot_type')
      .populate('term_id', 'term_number')
      .sort({ day_of_week: 1, 'slot_id.slot_number': 1 });
    
    return res.json({ timetable });
  } catch (e) { 
    console.error('Error in getStudentTimetable:', e);
    return res.status(500).json({ message: "Server error" }); 
  }
};

export const getStudentNotifications = async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ message: "Missing user_id" });
    
    const notifications = await Notification.find({ user_id }).sort({ createdAt: -1 }).limit(20);
    return res.json(notifications);
  } catch (e) { return res.status(500).json({ message: "Server error" }); }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);
    if (!notification) return res.status(404).json({ message: "Not found" });
    
    notification.is_read = true;
    await notification.save();
    return res.json(notification);
  } catch (e) { return res.status(500).json({ message: "Server error" }); }
};
