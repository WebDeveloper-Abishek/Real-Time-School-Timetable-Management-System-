import MentalHealthReport from "../models/MentalHealthReport.js";
import Meeting from "../models/Meeting.js";
import CounsellorSlot from "../models/CounsellorSlot.js";
import Notification from "../models/Notification.js";
import StudentParentLink from "../models/StudentParentLink.js";
import User from "../models/User.js";

// Submit mental health report
export const submitMentalHealthReport = async (req, res) => {
  try {
    const { student_id, reported_to, issue_type, description, severity, is_confidential } = req.body;

    // Validate input
    if (!student_id || !reported_to || !issue_type || !description) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Verify reported_to is a teacher or counsellor
    const reportedUser = await User.findById(reported_to);
    if (!reportedUser || (reportedUser.role !== 'Teacher' && reportedUser.role !== 'Counsellor')) {
      return res.status(400).json({ message: "Invalid reported_to user" });
    }

    // Create mental health report
    const report = await MentalHealthReport.create({
      student_id,
      reported_to,
      issue_type,
      description,
      severity,
      is_confidential: is_confidential || true,
      status: 'Reported'
    });

    // Send notification to reported user
    await Notification.create({
      user_id: reported_to,
      title: 'New Mental Health Report',
      body: `A student has submitted a mental health report. Issue type: ${issue_type}, Severity: ${severity}`,
      type: 'MENTAL_HEALTH',
      is_read: false
    });

    // Send notification to admin if severity is high or critical
    if (severity === 'High' || severity === 'Critical') {
      const admins = await User.find({ role: 'Admin' });
      for (const admin of admins) {
        await Notification.create({
          user_id: admin._id,
          title: 'High Priority Mental Health Report',
          body: `A student has submitted a ${severity.toLowerCase()} priority mental health report. Immediate attention required.`,
          type: 'MENTAL_HEALTH',
          is_read: false
        });
      }
    }

    res.json({ 
      success: true, 
      message: 'Mental health report submitted successfully',
      report 
    });

  } catch (error) {
    console.error('Error submitting mental health report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get mental health reports for a user (student, teacher, counsellor, admin)
export const getMentalHealthReports = async (req, res) => {
  try {
    const { user_id, role, status, severity, priority } = req.query;
    const userId = user_id || req.user.id;

    let query = {};

    // Filter based on user role
    if (role === 'Student') {
      query.student_id = userId;
    } else if (role === 'Teacher' || role === 'Counsellor') {
      query.reported_to = userId;
    } else if (role === 'Admin') {
      // Admin can see all reports
      query = {};
    } else if (role === 'Parent') {
      // Parent can see reports for their children
      const parentLinks = await StudentParentLink.find({ parent_id: userId });
      const childIds = parentLinks.map(link => link.student_id);
      query.student_id = { $in: childIds };
    }

    // Additional filters
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (priority) query.priority = priority;

    const reports = await MentalHealthReport.find(query)
      .populate('student_id', 'name')
      .populate('reported_to', 'name role')
      .sort({ createdAt: -1 });

    res.json({ success: true, reports });

  } catch (error) {
    console.error('Error getting mental health reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update mental health report status
export const updateMentalHealthReport = async (req, res) => {
  try {
    const { report_id } = req.params;
    const { status, priority, parent_notified, admin_notified, remarks } = req.body;
    const userId = req.user.id;

    const report = await MentalHealthReport.findById(report_id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Update fields
    if (status) report.status = status;
    if (priority) report.priority = priority;
    if (parent_notified !== undefined) report.parent_notified = parent_notified;
    if (admin_notified !== undefined) report.admin_notified = admin_notified;

    await report.save();

    // Send notifications based on status change
    if (status === 'Meeting Scheduled') {
      await Notification.create({
        user_id: report.student_id,
        title: 'Mental Health Meeting Scheduled',
        body: 'A meeting has been scheduled to discuss your mental health report.',
        type: 'MENTAL_HEALTH',
        is_read: false
      });
    }

    res.json({ 
      success: true, 
      message: 'Mental health report updated successfully',
      report 
    });

  } catch (error) {
    console.error('Error updating mental health report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Schedule counsellor slot
export const scheduleCounsellorSlot = async (req, res) => {
  try {
    const { counsellor_id, date, start_time, end_time, max_duration, is_recurring, day_of_week, notes } = req.body;

    // Validate input
    if (!counsellor_id || !date || !start_time || !end_time) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Verify counsellor exists
    const counsellor = await User.findById(counsellor_id);
    if (!counsellor || counsellor.role !== 'Counsellor') {
      return res.status(400).json({ message: "Invalid counsellor" });
    }

    // Check for conflicts
    const slotDate = new Date(date);
    const existingSlot = await CounsellorSlot.findOne({
      counsellor_id,
      date: slotDate,
      start_time,
      end_time
    });

    if (existingSlot) {
      return res.status(400).json({ message: "Slot already exists for this time" });
    }

    // Create counsellor slot
    const slot = await CounsellorSlot.create({
      counsellor_id,
      date: slotDate,
      start_time,
      end_time,
      max_duration: max_duration || 45,
      is_recurring: is_recurring || false,
      day_of_week,
      notes,
      slot_type: 'Available'
    });

    res.json({ 
      success: true, 
      message: 'Counsellor slot scheduled successfully',
      slot 
    });

  } catch (error) {
    console.error('Error scheduling counsellor slot:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get available counsellor slots
export const getAvailableCounsellorSlots = async (req, res) => {
  try {
    const { counsellor_id, date, start_date, end_date } = req.query;

    const query = { slot_type: 'Available' };

    if (counsellor_id) query.counsellor_id = counsellor_id;
    if (date) query.date = new Date(date);
    if (start_date && end_date) {
      query.date = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    const slots = await CounsellorSlot.find(query)
      .populate('counsellor_id', 'name')
      .sort({ date: 1, start_time: 1 });

    res.json({ success: true, slots });

  } catch (error) {
    console.error('Error getting counsellor slots:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Schedule meeting with counsellor
export const scheduleCounsellorMeeting = async (req, res) => {
  try {
    const { slot_id, initiator_id, participant_ids, subject, description, duration } = req.body;

    // Validate input
    if (!slot_id || !initiator_id || !participant_ids || !subject) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Get slot details
    const slot = await CounsellorSlot.findById(slot_id);
    if (!slot || slot.slot_type !== 'Available') {
      return res.status(400).json({ message: "Slot not available" });
    }

    // Check if slot is still available
    const existingMeeting = await Meeting.findOne({
      slot_id,
      status: { $in: ['Scheduled', 'Accepted'] }
    });

    if (existingMeeting) {
      return res.status(400).json({ message: "Slot already booked" });
    }

    // Create meeting
    const meeting = await Meeting.create({
      initiator_id,
      participant_ids,
      meeting_type: 'Student-Counsellor',
      subject,
      description,
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      duration: duration || slot.max_duration,
      location: 'School Office',
      status: 'Scheduled',
      slot_source: 'CounsellorSlot'
    });

    // Update slot status
    slot.slot_type = 'Booked';
    await slot.save();

    // Send notifications to participants
    for (const participantId of participant_ids) {
      await Notification.create({
        user_id: participantId,
        title: 'Counsellor Meeting Scheduled',
        body: `A meeting has been scheduled with the counsellor on ${slot.date.toLocaleDateString()} at ${slot.start_time}.`,
        type: 'MEETING',
        is_read: false
      });
    }

    res.json({ 
      success: true, 
      message: 'Meeting scheduled successfully',
      meeting 
    });

  } catch (error) {
    console.error('Error scheduling counsellor meeting:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get counsellor meetings
export const getCounsellorMeetings = async (req, res) => {
  try {
    const { counsellor_id, status, start_date, end_date } = req.query;
    const counsellorId = counsellor_id || req.user.id;

    const query = {
      participant_ids: counsellorId,
      meeting_type: { $in: ['Student-Counsellor', 'Parent-Counsellor'] }
    };

    if (status) query.status = status;
    if (start_date && end_date) {
      query.date = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    const meetings = await Meeting.find(query)
      .populate('initiator_id', 'name')
      .populate('participant_ids', 'name role')
      .sort({ date: 1, start_time: 1 });

    res.json({ success: true, meetings });

  } catch (error) {
    console.error('Error getting counsellor meetings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Provide feedback for mental health report
export const provideMentalHealthFeedback = async (req, res) => {
  try {
    const { report_id } = req.params;
    const { feedback, status, parent_notified, admin_notified } = req.body;
    const userId = req.user.id;

    const report = await MentalHealthReport.findById(report_id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Verify user is authorized to provide feedback
    if (report.reported_to.toString() !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to provide feedback' });
    }

    // Update report
    report.status = status || report.status;
    report.parent_notified = parent_notified || report.parent_notified;
    report.admin_notified = admin_notified || report.admin_notified;
    await report.save();

    // Create feedback meeting record
    const meeting = await Meeting.create({
      initiator_id: userId,
      participant_ids: [report.student_id, report.reported_to],
      meeting_type: 'Student-Counsellor',
      subject: `Feedback: ${report.issue_type}`,
      description: feedback,
      date: new Date(),
      start_time: new Date().toTimeString().slice(0, 5),
      end_time: new Date(Date.now() + 45 * 60000).toTimeString().slice(0, 5),
      duration: 45,
      status: 'Completed',
      slot_source: 'Custom',
      related_mental_health_report: report_id,
      feedback: feedback,
      feedback_shared_with_parent: parent_notified || false
    });

    // Send notifications
    await Notification.create({
      user_id: report.student_id,
      title: 'Mental Health Feedback Available',
      body: 'Feedback has been provided for your mental health report.',
      type: 'MENTAL_HEALTH',
      is_read: false
    });

    if (parent_notified) {
      const parentLinks = await StudentParentLink.find({ student_id: report.student_id });
      for (const link of parentLinks) {
        await Notification.create({
          user_id: link.parent_id,
          title: 'Child Mental Health Feedback',
          body: 'Feedback has been provided for your child\'s mental health report.',
          type: 'MENTAL_HEALTH',
          is_read: false
        });
      }
    }

    res.json({ 
      success: true, 
      message: 'Feedback provided successfully',
      report,
      meeting 
    });

  } catch (error) {
    console.error('Error providing mental health feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get mental health analytics for admin
export const getMentalHealthAnalytics = async (req, res) => {
  try {
    const { start_date, end_date, counsellor_id } = req.query;

    const query = {};
    if (start_date && end_date) {
      query.createdAt = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    const reports = await MentalHealthReport.find(query)
      .populate('student_id', 'name')
      .populate('reported_to', 'name role');

    // Calculate analytics
    const analytics = {
      totalReports: reports.length,
      byIssueType: {},
      bySeverity: {},
      byStatus: {},
      byCounsellor: {},
      byMonth: {},
      resolutionTime: {
        average: 0,
        total: 0
      }
    };

    reports.forEach(report => {
      // By issue type
      if (!analytics.byIssueType[report.issue_type]) analytics.byIssueType[report.issue_type] = 0;
      analytics.byIssueType[report.issue_type]++;

      // By severity
      if (!analytics.bySeverity[report.severity]) analytics.bySeverity[report.severity] = 0;
      analytics.bySeverity[report.severity]++;

      // By status
      if (!analytics.byStatus[report.status]) analytics.byStatus[report.status] = 0;
      analytics.byStatus[report.status]++;

      // By counsellor
      const counsellorName = report.reported_to ? report.reported_to.name : 'Unknown';
      if (!analytics.byCounsellor[counsellorName]) analytics.byCounsellor[counsellorName] = 0;
      analytics.byCounsellor[counsellorName]++;

      // By month
      const monthKey = `${report.createdAt.getFullYear()}-${String(report.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (!analytics.byMonth[monthKey]) analytics.byMonth[monthKey] = 0;
      analytics.byMonth[monthKey]++;
    });

    res.json({ success: true, analytics });

  } catch (error) {
    console.error('Error getting mental health analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
