import LeaveRecord from "../models/LeaveRecord.js";
import TimetableSlot from "../models/TimetableSlot.js";
// ReplacementSlot model removed - no longer needed

export const requestLeave = async (req, res) => {
  try {
    const { user_id, start_date, end_date, leave_type, reason } = req.body;
    if (!user_id || !start_date || !end_date || !leave_type) return res.status(400).json({ message: "Missing fields" });
    const doc = await LeaveRecord.create({ user_id, start_date, end_date, leave_type, reason, approved: false });
    return res.status(201).json(doc);
  } catch (e) { return res.status(500).json({ message: "Server error" }); }
};

export const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await LeaveRecord.findById(id);
    if (!leave) return res.status(404).json({ message: "Not found" });
    leave.approved = true;
    await leave.save();
    return res.json(leave);
  } catch (e) { return res.status(500).json({ message: "Server error" }); }
};

export const listLeaves = async (req, res) => {
  try {
    const { user_id, approved } = req.query;
    const filter = {};
    if (user_id) filter.user_id = user_id;
    if (approved !== undefined) filter.approved = approved === 'true';
    const list = await LeaveRecord.find(filter).sort({ createdAt: -1 });
    return res.json(list);
  } catch (e) { return res.status(500).json({ message: "Server error" }); }
};


