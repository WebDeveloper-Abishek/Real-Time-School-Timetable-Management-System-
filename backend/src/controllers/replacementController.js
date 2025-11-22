import {
  processLeaveRequest,
  acceptReplacement,
  declineReplacement,
  getReplacementStatus
} from '../services/replacementService.js';

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