import Attendance from "../models/Attendance.js";
import UserClassAssignment from "../models/UserClassAssignment.js";
import TimetableSlot from "../models/TimetableSlot.js";
import Notification from "../models/Notification.js";
import StudentParentLink from "../models/StudentParentLink.js";

// Mark attendance for a class period
export const markAttendance = async (req, res) => {
  try {
    const { class_id, term_id, date, period_index, attendance_data } = req.body;
    const teacher_id = req.user.id; // From JWT token

    // Validate input
    if (!class_id || !term_id || !date || !period_index || !attendance_data) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const results = [];
    const markedDate = new Date(date);

    // Mark attendance for each student
    for (const studentAttendance of attendance_data) {
      const { student_id, status, remarks } = studentAttendance;

      // Check if attendance already exists for this student, date, and period
      const existingAttendance = await Attendance.findOne({
        student_id,
        date: markedDate,
        period_index
      });

      if (existingAttendance) {
        // Update existing attendance
        existingAttendance.status = status;
        existingAttendance.remarks = remarks;
        existingAttendance.marked_by = teacher_id;
        await existingAttendance.save();
        results.push({ student_id, status: 'updated', attendance: existingAttendance });
      } else {
        // Create new attendance record
        const newAttendance = await Attendance.create({
          student_id,
          class_id,
          term_id,
          date: markedDate,
          period_index,
          status,
          remarks,
          marked_by: teacher_id
        });
        results.push({ student_id, status: 'created', attendance: newAttendance });
      }

      // Send notification for absent/late students
      if (status === 'Absent' || status === 'Late') {
        await sendAbsenceNotification(student_id, markedDate, period_index, status);
      }
    }

    res.json({ 
      success: true, 
      message: 'Attendance marked successfully',
      results 
    });

  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get attendance for a class on a specific date
export const getClassAttendance = async (req, res) => {
  try {
    const { class_id, date, period_index } = req.query;

    if (!class_id || !date) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    const query = {
      class_id,
      date: new Date(date)
    };

    if (period_index) {
      query.period_index = parseInt(period_index);
    }

    const attendance = await Attendance.find(query)
      .populate('student_id', 'name')
      .populate('subject_id', 'subject_name')
      .populate('teacher_id', 'name')
      .populate('marked_by', 'name')
      .sort({ period_index: 1, 'student_id.name': 1 });

    res.json({ success: true, attendance });

  } catch (error) {
    console.error('Error getting class attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get student attendance report
export const getStudentAttendance = async (req, res) => {
  try {
    const { student_id, term_id, start_date, end_date, view_type } = req.query;

    if (!student_id || !term_id) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    const query = {
      student_id,
      term_id
    };

    if (start_date && end_date) {
      query.date = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('subject_id', 'subject_name')
      .populate('teacher_id', 'name')
      .sort({ date: -1, period_index: 1 });

    // Process data based on view type
    let processedData = attendance;

    if (view_type === 'daily') {
      processedData = processDailyView(attendance);
    } else if (view_type === 'weekly') {
      processedData = processWeeklyView(attendance);
    } else if (view_type === 'monthly') {
      processedData = processMonthlyView(attendance);
    } else if (view_type === 'course') {
      processedData = processCourseView(attendance);
    }

    // Calculate statistics
    const stats = calculateAttendanceStats(attendance);

    res.json({ 
      success: true, 
      attendance: processedData,
      statistics: stats
    });

  } catch (error) {
    console.error('Error getting student attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get teacher's class attendance summary
export const getTeacherAttendanceSummary = async (req, res) => {
  try {
    const { teacher_id, term_id, class_id, date } = req.query;
    const teacherId = teacher_id || req.user.id;

    const query = {
      marked_by: teacherId,
      term_id
    };

    if (class_id) query.class_id = class_id;
    if (date) query.date = new Date(date);

    const attendance = await Attendance.find(query)
      .populate('student_id', 'name')
      .populate('class_id', 'class_name')
      .populate('subject_id', 'subject_name')
      .sort({ date: -1, period_index: 1 });

    // Group by date and class
    const summary = attendance.reduce((acc, record) => {
      const dateKey = record.date.toISOString().split('T')[0];
      const classKey = record.class_id.class_name;
      
      if (!acc[dateKey]) acc[dateKey] = {};
      if (!acc[dateKey][classKey]) {
        acc[dateKey][classKey] = {
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          periods: {}
        };
      }

      const classData = acc[dateKey][classKey];
      classData.total++;
      
      if (record.status === 'Present') classData.present++;
      else if (record.status === 'Absent') classData.absent++;
      else if (record.status === 'Late') classData.late++;

      // Period-wise breakdown
      if (!classData.periods[record.period_index]) {
        classData.periods[record.period_index] = {
          total: 0,
          present: 0,
          absent: 0,
          late: 0
        };
      }

      const periodData = classData.periods[record.period_index];
      periodData.total++;
      if (record.status === 'Present') periodData.present++;
      else if (record.status === 'Absent') periodData.absent++;
      else if (record.status === 'Late') periodData.late++;

      return acc;
    }, {});

    res.json({ success: true, summary });

  } catch (error) {
    console.error('Error getting teacher attendance summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get parent's child attendance
export const getChildAttendance = async (req, res) => {
  try {
    const { parent_id, child_id, term_id, start_date, end_date, view_type } = req.query;

    if (!parent_id || !child_id || !term_id) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    // Verify parent-child relationship
    const parentLink = await StudentParentLink.findOne({
      parent_id,
      student_id: child_id
    });

    if (!parentLink) {
      return res.status(403).json({ message: "Access denied" });
    }

    const query = {
      student_id: child_id,
      term_id
    };

    if (start_date && end_date) {
      query.date = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('subject_id', 'subject_name')
      .populate('teacher_id', 'name')
      .populate('class_id', 'class_name')
      .sort({ date: -1, period_index: 1 });

    // Process data based on view type
    let processedData = attendance;

    if (view_type === 'daily') {
      processedData = processDailyView(attendance);
    } else if (view_type === 'weekly') {
      processedData = processWeeklyView(attendance);
    } else if (view_type === 'monthly') {
      processedData = processMonthlyView(attendance);
    } else if (view_type === 'course') {
      processedData = processCourseView(attendance);
    }

    // Calculate statistics
    const stats = calculateAttendanceStats(attendance);

    res.json({ 
      success: true, 
      attendance: processedData,
      statistics: stats
    });

  } catch (error) {
    console.error('Error getting child attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper functions for data processing
const processDailyView = (attendance) => {
  return attendance.reduce((acc, record) => {
    const dateKey = record.date.toISOString().split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(record);
    return acc;
  }, {});
};

const processWeeklyView = (attendance) => {
  return attendance.reduce((acc, record) => {
    const weekStart = getWeekStart(record.date);
    const weekKey = weekStart.toISOString().split('T')[0];
    if (!acc[weekKey]) acc[weekKey] = [];
    acc[weekKey].push(record);
    return acc;
  }, {});
};

const processMonthlyView = (attendance) => {
  return attendance.reduce((acc, record) => {
    const monthKey = `${record.date.getFullYear()}-${String(record.date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(record);
    return acc;
  }, {});
};

const processCourseView = (attendance) => {
  return attendance.reduce((acc, record) => {
    const subjectKey = record.subject_id ? record.subject_id.subject_name : 'Unknown';
    if (!acc[subjectKey]) acc[subjectKey] = [];
    acc[subjectKey].push(record);
    return acc;
  }, {});
};

const calculateAttendanceStats = (attendance) => {
  const total = attendance.length;
  const present = attendance.filter(a => a.status === 'Present').length;
  const absent = attendance.filter(a => a.status === 'Absent').length;
  const late = attendance.filter(a => a.status === 'Late').length;

  return {
    total,
    present,
    absent,
    late,
    presentPercentage: total > 0 ? ((present / total) * 100).toFixed(2) : 0,
    absentPercentage: total > 0 ? ((absent / total) * 100).toFixed(2) : 0,
    latePercentage: total > 0 ? ((late / total) * 100).toFixed(2) : 0
  };
};

const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

// Send absence notification to parents
const sendAbsenceNotification = async (student_id, date, period_index, status) => {
  try {
    // Find parent links
    const parentLinks = await StudentParentLink.find({ student_id })
      .populate('parent_id', 'name')
      .populate('student_id', 'name');

    for (const link of parentLinks) {
      await Notification.create({
        user_id: link.parent_id._id,
        title: `Child ${status} Alert`,
        body: `${link.student_id.name} was ${status.toLowerCase()} on ${date.toLocaleDateString()} during period ${period_index}.`,
        type: 'ATTENDANCE',
        is_read: false
      });
    }
  } catch (error) {
    console.error('Error sending absence notification:', error);
  }
};

// Get attendance analytics for admin
export const getAttendanceAnalytics = async (req, res) => {
  try {
    const { term_id, class_id, start_date, end_date } = req.query;

    const query = { term_id };
    if (class_id) query.class_id = class_id;
    if (start_date && end_date) {
      query.date = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('student_id', 'name')
      .populate('class_id', 'class_name')
      .populate('subject_id', 'subject_name');

    // Calculate analytics
    const analytics = {
      totalRecords: attendance.length,
      byClass: {},
      bySubject: {},
      byDate: {},
      byStatus: {
        Present: 0,
        Absent: 0,
        Late: 0
      }
    };

    attendance.forEach(record => {
      // By status
      analytics.byStatus[record.status]++;

      // By class
      const className = record.class_id ? record.class_id.class_name : 'Unknown';
      if (!analytics.byClass[className]) analytics.byClass[className] = { total: 0, present: 0, absent: 0, late: 0 };
      analytics.byClass[className].total++;
      analytics.byClass[className][record.status.toLowerCase()]++;

      // By subject
      const subjectName = record.subject_id ? record.subject_id.subject_name : 'Unknown';
      if (!analytics.bySubject[subjectName]) analytics.bySubject[subjectName] = { total: 0, present: 0, absent: 0, late: 0 };
      analytics.bySubject[subjectName].total++;
      analytics.bySubject[subjectName][record.status.toLowerCase()]++;

      // By date
      const dateKey = record.date.toISOString().split('T')[0];
      if (!analytics.byDate[dateKey]) analytics.byDate[dateKey] = { total: 0, present: 0, absent: 0, late: 0 };
      analytics.byDate[dateKey].total++;
      analytics.byDate[dateKey][record.status.toLowerCase()]++;
    });

    res.json({ success: true, analytics });

  } catch (error) {
    console.error('Error getting attendance analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
