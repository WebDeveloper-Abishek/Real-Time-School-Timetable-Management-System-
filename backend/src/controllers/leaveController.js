import LeaveRecord from "../models/LeaveRecord.js";
import TimetableSlot from "../models/TimetableSlot.js";
import mongoose from "mongoose";
import Term from "../models/Term.js";
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
    // If term_id is provided, validate it exists
    if (term_id) {
      if (mongoose.Types.ObjectId.isValid(term_id)) {
        // Verify term exists
        const term = await Term.findById(term_id);
        if (!term) {
          return res.status(400).json({ message: "Term not found" });
        }
        leaveData.term_id = term_id;
      } else {
        return res.status(400).json({ message: "Invalid term_id format" });
      }
    } else {
      // If no term_id provided, get current active term
      const currentTerm = await Term.findOne({ is_active: true }).sort({ createdAt: -1 });
      if (currentTerm) {
        leaveData.term_id = currentTerm._id;
      }
    }
    
    // Validate user_id exists
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ message: "Invalid user_id format" });
    }
    
    const doc = await LeaveRecord.create(leaveData);
    
    // Populate user and term for response
    await doc.populate({
      path: 'user_id',
      select: 'name role email'
    });
    
    if (doc.term_id) {
      await doc.populate({
        path: 'term_id',
        select: 'term_number academic_year_id start_date end_date is_active',
        populate: {
          path: 'academic_year_id',
          select: 'year_label'
        }
      });
    }
    
    return res.status(201).json({
      ...doc.toObject(),
      status: 'PENDING'
    });
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
      await leave.populate({
        path: 'term_id',
        select: 'term_number academic_year_id',
        populate: {
          path: 'academic_year_id',
          select: 'year_label'
        }
      });
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
      status: 'APPROVED',
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
    const { reason: rejectionReason } = req.body || {};
    const leave = await LeaveRecord.findById(id);
    if (!leave) return res.status(404).json({ message: "Not found" });
    
    // Set approved to false and add rejection reason to the reason field
    leave.approved = false;
    if (rejectionReason) {
      leave.reason = leave.reason + ` [REJECTED: ${rejectionReason}]`;
    }
    await leave.save();
    
    // Populate before returning
    await leave.populate('user_id', 'name role');
    if (leave.term_id) {
      await leave.populate({
        path: 'term_id',
        select: 'term_number academic_year_id',
        populate: {
          path: 'academic_year_id',
          select: 'year_label'
        }
      });
    }
    
    return res.json({
      ...leave.toObject(),
      status: 'REJECTED'
    });
  } catch (e) { 
    console.error('Reject leave error:', e);
    return res.status(500).json({ message: "Server error", error: e.message }); 
  }
};

export const listLeaves = async (req, res) => {
  try {
    const { user_id, approved, role } = req.query;
    const filter = {};
    
    // Validate user_id if provided
    if (user_id) {
      // Check if it's a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(user_id)) {
        return res.status(400).json({ message: "Invalid user_id format" });
      }
      filter.user_id = user_id;
    }
    
    if (approved !== undefined) {
      filter.approved = approved === 'true';
    }
    
    // Get all leaves - simpler populate without match to avoid filtering issues
    let list = await LeaveRecord.find(filter)
      .populate('user_id', 'name role email')
      .sort({ createdAt: -1 })
      .lean();
    
    // Populate term_id separately and handle errors gracefully
    const populatedList = await Promise.all(list.map(async (leave) => {
      try {
        if (leave.term_id) {
          const term = await Term.findById(leave.term_id)
            .populate({
              path: 'academic_year_id',
              select: 'year_label'
            })
            .lean();
          if (term) {
            leave.term_id = term;
          } else {
            leave.term_id = null;
          }
        }
      } catch (err) {
        console.error('Error populating term for leave:', leave._id, err);
        leave.term_id = null;
      }
      return leave;
    }));
    
    // Filter out leaves with deleted users and filter by role if provided
    // Also add status field based on approved boolean and check for rejected marker
    const filteredList = populatedList.filter(leave => {
      // Skip if user is deleted or doesn't exist
      if (!leave.user_id || (leave.user_id.is_deleted === true)) {
        return false;
      }
      // Filter by role if provided
      if (role && leave.user_id.role !== role) {
        return false;
      }
      
      // Add status field based on approved and reason
      if (leave.approved === true) {
        leave.status = 'APPROVED';
      } else if (leave.reason && leave.reason.includes('[REJECTED:')) {
        leave.status = 'REJECTED';
      } else {
        leave.status = 'PENDING';
      }
      
      return true;
    });
    
    return res.json(filteredList);
  } catch (e) { 
    console.error('List leaves error:', e);
    return res.status(500).json({ message: "Server error", error: e.message }); 
  }
};

export const deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // Get user from token
    
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid leave ID format" });
    }
    
    const leave = await LeaveRecord.findById(id);
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }
    
    // Check if user owns this leave request (for teachers) or is admin
    // Convert both to strings for comparison
    const leaveUserId = leave.user_id.toString();
    const currentUserId = userId.toString();
    const userRole = req.user?.role;
    
    // Only allow deletion if user owns the leave or is admin
    if (leaveUserId !== currentUserId && userRole !== 'Admin') {
      return res.status(403).json({ message: "You can only delete your own leave requests" });
    }
    
    // Delete the leave record
    await LeaveRecord.findByIdAndDelete(id);
    
    return res.json({ message: "Leave request deleted successfully" });
  } catch (e) {
    console.error('Delete leave error:', e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};
