import Notification from '../models/Notification.js';
import { acceptReplacement, declineReplacement } from '../services/replacementService.js';
import ReplacementAssignment from '../models/ReplacementAssignment.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';

/**
 * Get all replacement requests for a teacher (from notifications)
 */
export const getTeacherReplacementRequests = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.user_id;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Get all replacement request notifications for this teacher
    // Check for notifications with replacement_assignment_id in action_data
    const notifications = await Notification.find({
      user_id: userId,
      read_status: false,
      is_deleted: false,
      $or: [
        { 'action_data.replacement_assignment_id': { $exists: true } },
        { category: 'academic', title: { $regex: /replacement/i } }
      ]
    })
      .populate('user_id', 'name')
      .sort({ createdAt: -1 });

    // Enrich notifications with replacement assignment details
    const enrichedRequests = await Promise.all(
      notifications.map(async (notification) => {
        // Check both action_data and metadata fields
        const actionData = notification.action_data || notification.metadata || {};
        const replacementAssignmentId = actionData.replacement_assignment_id;
        
        let replacementAssignment = null;
        let classData = null;
        let subjectData = null;
        
        if (replacementAssignmentId) {
          replacementAssignment = await ReplacementAssignment.findById(replacementAssignmentId)
            .populate('original_teacher_id', 'name')
            .populate('class_id', 'class_name grade section')
            .populate('subject_id', 'subject_name')
            .populate('slot_id', 'start_time end_time slot_number day_of_week');
          
          if (replacementAssignment) {
            classData = replacementAssignment.class_id;
            subjectData = replacementAssignment.subject_id;
          }
        }

        return {
          _id: notification._id,
          notification_id: notification._id,
          title: notification.title || 'Replacement Request',
          message: notification.body || '',
          createdAt: notification.createdAt,
          replacement_assignment_id: replacementAssignmentId,
          replacement_assignment: replacementAssignment,
          class_id: classData?._id || actionData.class_id,
          class_name: classData?.class_name || actionData.class_name || 'Unknown Class',
          subject_id: subjectData?._id || actionData.subject_id,
          subject_name: subjectData?.subject_name || actionData.subject_name || 'Unknown Subject',
          original_teacher: replacementAssignment?.original_teacher_id?.name || 'Unknown Teacher',
          date: replacementAssignment?.date || actionData.date,
          day_of_week: replacementAssignment?.slot_id?.day_of_week || actionData.day_of_week,
          slot_number: replacementAssignment?.slot_id?.slot_number || actionData.slot_number,
          start_time: replacementAssignment?.slot_id?.start_time || actionData.start_time,
          end_time: replacementAssignment?.slot_id?.end_time || actionData.end_time,
          priority: actionData.priority || 'medium',
          reason: actionData.reason || ''
        };
      })
    );

    return res.json({
      requests: enrichedRequests,
      count: enrichedRequests.length
    });
  } catch (error) {
    console.error('Error fetching teacher replacement requests:', error);
    return res.status(500).json({
      message: "Error fetching replacement requests",
      error: error.message
    });
  }
};

/**
 * Teacher accepts a replacement request
 */
export const acceptTeacherReplacement = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const teacherId = req.user?.id || req.body.teacher_id;
    
    if (!teacherId) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    if (!notificationId) {
      return res.status(400).json({ message: "Notification ID is required" });
    }

    // Accept the replacement
    const result = await acceptReplacement(notificationId, teacherId);
    
    return res.status(200).json({
      message: "Replacement request accepted successfully",
      ...result
    });
  } catch (error) {
    console.error('Error accepting replacement:', error);
    return res.status(500).json({
      message: "Error accepting replacement request",
      error: error.message
    });
  }
};

/**
 * Teacher declines a replacement request
 */
export const declineTeacherReplacement = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { reason } = req.body;
    const teacherId = req.user?.id || req.body.teacher_id;
    
    if (!teacherId) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    if (!notificationId) {
      return res.status(400).json({ message: "Notification ID is required" });
    }

    // Decline the replacement
    const result = await declineReplacement(notificationId, teacherId, reason);
    
    return res.status(200).json({
      message: "Replacement request declined",
      ...result
    });
  } catch (error) {
    console.error('Error declining replacement:', error);
    return res.status(500).json({
      message: "Error declining replacement request",
      error: error.message
    });
  }
};

