import LeaveRecord from "../models/LeaveRecord.js";
import TimetableSlot from "../models/TimetableSlot.js";
import { processLeaveRequest } from "../services/replacementService.js";
// ReplacementSlot model removed - no longer needed

// Request leave - supports both old format (leave_type, half_day_type) and new format (type)
export const requestLeave = async (req, res) => {
  try {
    const { user_id, start_date, end_date, leave_type, half_day_type, type, reason, term_id } = req.body;
    
    if (!user_id || !start_date || !end_date) {
      return res.status(400).json({ message: "Missing required fields: user_id, start_date, end_date" });
    }
    
    // Build leave data - model uses leave_type and half_day_type
    const leaveData = {
      user_id,
      start_date,
      end_date,
      reason: reason || '',
      approved: false
    };
    
    // Handle new format (type: FULL_DAY, FIRST_HALF, SECOND_HALF) - convert to old format
    if (type) {
      if (type === 'FULL_DAY') {
        leaveData.leave_type = 'Full';
      } else if (type === 'FIRST_HALF' || type === 'SECOND_HALF') {
        leaveData.leave_type = 'Half';
        leaveData.half_day_type = type === 'FIRST_HALF' ? 'First' : 'Second';
      }
    } 
    // Handle old format (leave_type: Full/Half, half_day_type: First/Second)
    else if (leave_type) {
      leaveData.leave_type = leave_type;
      if (half_day_type) {
        leaveData.half_day_type = half_day_type;
      }
    } 
    // Default to Full day if neither format provided
    else {
      leaveData.leave_type = 'Full';
    }
    
    // term_id is optional but can be stored if provided
    if (term_id) {
      leaveData.term_id = term_id;
    }
    
    const doc = await LeaveRecord.create(leaveData);
    
    // Populate user and term for response
    await doc.populate('user_id', 'name role');
    if (doc.term_id) {
      await doc.populate('term_id', 'term_number academic_year_id');
    }
    
    return res.status(201).json(doc);
  } catch (e) { 
    console.error('Request leave error:', e);
    return res.status(500).json({ message: "Server error", error: e.message }); 
  }
};

export const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await LeaveRecord.findById(id);
    if (!leave) return res.status(404).json({ message: "Not found" });
    
    // Approve the leave
    leave.approved = true;
    await leave.save();
    
    // Populate before processing
    await leave.populate('user_id', 'name role');
    if (leave.term_id) {
      await leave.populate('term_id', 'term_number academic_year_id');
    }
    
    // Automatically trigger replacement process
    try {
      console.log(`🔄 Auto-triggering replacement for approved leave: ${leave._id}`);
      await processLeaveRequest(leave._id);
      console.log(`✅ Replacement process initiated for leave: ${leave._id}`);
    } catch (replacementError) {
      console.error('⚠️ Error processing replacement (leave still approved):', replacementError);
      // Don't fail the approval if replacement fails - admin can handle manually
    }
    
    return res.json({
      ...leave.toObject(),
      replacementInitiated: true
    });
  } catch (e) { 
    console.error('Approve leave error:', e);
    return res.status(500).json({ message: "Server error", error: e.message }); 
  }
};

export const rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await LeaveRecord.findById(id);
    if (!leave) return res.status(404).json({ message: "Not found" });
    leave.approved = false;
    await leave.save();
    
    // Populate before returning
    await leave.populate('user_id', 'name role');
    if (leave.term_id) {
      await leave.populate('term_id', 'term_number academic_year_id');
    }
    
    return res.json(leave);
  } catch (e) { 
    console.error('Reject leave error:', e);
    return res.status(500).json({ message: "Server error", error: e.message }); 
  }
};

export const listLeaves = async (req, res) => {
  try {
    const { user_id, approved, role } = req.query;
    const filter = {};
    if (user_id) filter.user_id = user_id;
    if (approved !== undefined) filter.approved = approved === 'true';
    
    // First get all leaves
    let list = await LeaveRecord.find(filter)
      .populate('user_id', 'name role email')
      .populate('term_id', 'term_number academic_year_id')
      .sort({ createdAt: -1 });
    
    // Filter by role if provided (for admin to see only teacher leaves)
    if (role) {
      list = list.filter(leave => leave.user_id && leave.user_id.role === role);
    }
    
    return res.json(list);
  } catch (e) { 
    console.error('List leaves error:', e);
    return res.status(500).json({ message: "Server error", error: e.message }); 
  }
};


