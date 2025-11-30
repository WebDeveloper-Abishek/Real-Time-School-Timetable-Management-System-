import {
  processLeaveRequest,
  acceptReplacement,
  declineReplacement,
  getReplacementStatus
} from '../services/replacementService.js';
import ReplacementAssignment from '../models/ReplacementAssignment.js';
import LeaveRecord from '../models/LeaveRecord.js';

/**
 * Process a leave request and initiate replacement
 */
export const processLeave = async (req, res) => {
  try {
    const { leave_id } = req.body;
    
    if (!leave_id) {
      return res.status(400).json({ message: "Leave ID is required" });
    }

    const result = await processLeaveRequest(leave_id);
    
    return res.status(200).json(result);

  } catch (error) {
    console.error('Process leave error:', error);
    return res.status(500).json({
      message: "Error processing leave request",
      error: error.message
    });
  }
};

/**
 * Teacher accepts a replacement request
 */
export const acceptReplacementRequest = async (req, res) => {
  try {
    const { notification_id } = req.body;
    const teacher_id = req.user.id; // From JWT token

    if (!notification_id) {
      return res.status(400).json({ message: "Notification ID is required" });
    }

    const result = await acceptReplacement(notification_id, teacher_id);
    
    return res.status(200).json(result);

  } catch (error) {
    console.error('Accept replacement error:', error);
    return res.status(500).json({
      message: "Error accepting replacement",
      error: error.message
    });
  }
};

/**
 * Teacher declines a replacement request
 */
export const declineReplacementRequest = async (req, res) => {
  try {
    const { notification_id } = req.body;
    const teacher_id = req.user.id; // From JWT token

    if (!notification_id) {
      return res.status(400).json({ message: "Notification ID is required" });
    }

    const result = await declineReplacement(notification_id, teacher_id);
    
    return res.status(200).json(result);

  } catch (error) {
    console.error('Decline replacement error:', error);
    return res.status(500).json({
      message: "Error declining replacement",
      error: error.message
    });
  }
};

/**
 * Get replacement status for a leave
 */
export const getReplacementStatusController = async (req, res) => {
  try {
    const { leave_id } = req.params;

    if (!leave_id) {
      return res.status(400).json({ message: "Leave ID is required" });
    }

    const result = await getReplacementStatus(leave_id);
    
    return res.status(200).json(result);

  } catch (error) {
    console.error('Get replacement status error:', error);
    return res.status(500).json({
      message: "Error getting replacement status",
      error: error.message
    });
  }
};

/**
 * Get all replacements for admin view
 */
export const listAllReplacements = async (req, res) => {
  try {
    const { status, date_from, date_to } = req.query;
    
    // Build filter
    const filter = {};
    
    if (status === 'accepted') {
      filter.accepted = true;
    } else if (status === 'pending') {
      filter.accepted = { $ne: true };
      filter.reason_declined = { $exists: false };
    } else if (status === 'declined') {
      filter.accepted = false;
      filter.reason_declined = { $exists: true };
    }
    
    if (date_from || date_to) {
      filter.date = {};
      if (date_from) {
        filter.date.$gte = new Date(date_from);
      }
      if (date_to) {
        filter.date.$lte = new Date(date_to);
      }
    }
    
    // Get all replacements with populated data
    const replacements = await ReplacementAssignment.find(filter)
      .populate('original_teacher_id', 'name email')
      .populate('replacement_teacher_id', 'name email')
      .populate('class_id', 'class_name grade section')
      .populate('subject_id', 'subject_name')
      .populate('slot_id', 'start_time end_time slot_number day_of_week')
      .sort({ date: -1, createdAt: -1 });
    
    // Get related leave records
    const replacementsWithLeaves = await Promise.all(
      replacements.map(async (replacement) => {
        // Find the leave record that caused this replacement
        const leave = await LeaveRecord.findOne({
          user_id: replacement.original_teacher_id._id,
          start_date: { $lte: replacement.date },
          end_date: { $gte: replacement.date },
          approved: true
        })
          .populate('user_id', 'name')
          .populate('term_id', 'term_number academic_year_id');
        
        return {
          ...replacement.toObject(),
          leave: leave || null
        };
      })
    );
    
    res.json({
      replacements: replacementsWithLeaves,
      count: replacementsWithLeaves.length
    });
  } catch (error) {
    console.error('Error listing replacements:', error);
    return res.status(500).json({
      message: "Error fetching replacements",
      error: error.message
    });
  }
};
