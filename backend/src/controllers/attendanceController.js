import Attendance from "../models/Attendance.js";
import UserClassAssignment from "../models/UserClassAssignment.js";
import TeacherSubjectAssignment from "../models/TeacherSubjectAssignment.js";
import TimetableSlot from "../models/TimetableSlot.js";
import ClassTimetable from "../models/ClassTimetable.js";
import Notification from "../models/Notification.js";
import StudentParentLink from "../models/StudentParentLink.js";
import User from "../models/User.js";

// Mark attendance for a class period (Class Teacher)
export const markAttendance = async (req, res) => {
  try {
    const { class_id, term_id, date, period_index, attendance_data } = req.body;
    const teacher_id = req.user?.id || req.user?._id;

    // Validate input
    if (!class_id || !term_id || !date || !period_index || !attendance_data) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Verify that this teacher is the class teacher for this class
    const classTeacherAssignment = await UserClassAssignment.findOne({
      user_id: teacher_id,
      class_id: class_id,
      is_class_teacher: true
    });

    if (!classTeacherAssignment) {
      return res.status(403).json({ 
        message: "You are not authorized to mark attendance for this class. Only the class teacher can mark attendance." 
      });
    }

    // Find or get the timetable slot for this period
    const slot = await TimetableSlot.findOne({ 
      slot_number: parseInt(period_index),
      is_active: true 
    });

    if (!slot) {
      return res.status(400).json({ message: `Period ${period_index} slot not found. Please ensure timetable slots are initialized.` });
    }

    const results = [];
    const markedDate = new Date(date);

    // Mark attendance for each student
    for (const studentAttendance of attendance_data) {
      const { student_id, status } = studentAttendance;

      // Check if attendance already exists for this student, date, and slot (class teacher attendance)
      const existingAttendance = await Attendance.findOne({
        student_id,
        slot_id: slot._id,
        date: markedDate,
        attendance_type: 'class_teacher'
      });

      if (existingAttendance) {
        // Update existing attendance
        existingAttendance.status = status;
        existingAttendance.marked_by = teacher_id;
        await existingAttendance.save();
        results.push({ student_id, status: 'updated', attendance: existingAttendance });
      } else {
        // Create new attendance record
        const newAttendance = await Attendance.create({
          student_id,
          slot_id: slot._id,
          class_id: class_id,
          date: markedDate,
          status,
          marked_by: teacher_id,
          attendance_type: 'class_teacher'
        });
        results.push({ student_id, status: 'created', attendance: newAttendance });
      }

      // Send notification for absent/late students
      if (status === 'Absent' || status === 'Late') {
        await sendAbsenceNotification(student_id, markedDate, slot.slot_number, status);
      }
    }

    res.json({ 
      success: true, 
      message: 'Attendance marked successfully',
      results 
    });

  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark attendance for a subject (Subject Teacher)
export const markSubjectAttendance = async (req, res) => {
  try {
    const { class_id, subject_id, term_id, date, period_index, attendance_data } = req.body;
    const teacher_id = req.user?.id || req.user?._id;

    // Validate input
    if (!class_id || !subject_id || !term_id || !date || !period_index || !attendance_data) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Verify that this teacher is assigned to teach this subject for this class
    const subjectAssignment = await TeacherSubjectAssignment.findOne({
      user_id: teacher_id,
      class_id: class_id,
      subject_id: subject_id
    });

    if (!subjectAssignment) {
      return res.status(403).json({ 
        message: "You are not authorized to mark attendance for this subject. You must be assigned to teach this subject for this class." 
      });
    }

    // Get the day of week from the date
    const markedDate = new Date(date);
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][markedDate.getDay()];

    // Find the timetable slot for this period
    const slot = await TimetableSlot.findOne({ 
      slot_number: parseInt(period_index),
      is_active: true 
    });

    if (!slot) {
      return res.status(400).json({ message: `Period ${period_index} slot not found. Please ensure timetable slots are initialized.` });
    }

    // Verify this subject is scheduled for this class, slot, and day
    const classTimetable = await ClassTimetable.findOne({
      class_id: class_id,
      slot_id: slot._id,
      subject_id: subject_id,
      day_of_week: dayOfWeek,
      term_id: term_id
    });

    if (!classTimetable) {
      return res.status(400).json({ 
        message: `This subject is not scheduled for ${dayOfWeek} period ${period_index} for this class.` 
      });
    }

    const results = [];

    // Mark attendance for each student
    for (const studentAttendance of attendance_data) {
      const { student_id, status } = studentAttendance;

      // Check if attendance already exists for this student, date, slot, and subject
      const existingAttendance = await Attendance.findOne({
        student_id,
        slot_id: slot._id,
        date: markedDate,
        subject_id: subject_id,
        attendance_type: 'subject_teacher'
      });

      if (existingAttendance) {
        // Update existing attendance
        existingAttendance.status = status;
        existingAttendance.marked_by = teacher_id;
        await existingAttendance.save();
        results.push({ student_id, status: 'updated', attendance: existingAttendance });
      } else {
        // Create new attendance record
        const newAttendance = await Attendance.create({
          student_id,
          slot_id: slot._id,
          class_id: class_id,
          subject_id: subject_id,
          date: markedDate,
          status,
          marked_by: teacher_id,
          attendance_type: 'subject_teacher'
        });
        results.push({ student_id, status: 'created', attendance: newAttendance });
      }

      // Send notification for absent/late students
      if (status === 'Absent' || status === 'Late') {
        await sendAbsenceNotification(student_id, markedDate, slot.slot_number, status);
      }
    }

    res.json({ 
      success: true, 
      message: 'Subject attendance marked successfully',
      results 
    });

  } catch (error) {
    console.error('Error marking subject attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get teacher's subject assignments for attendance marking
export const getTeacherSubjectAssignments = async (req, res) => {
  try {
    const teacher_id = req.user?.id || req.user?._id;

    if (!teacher_id) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    // Get all subject assignments for this teacher
    const assignments = await TeacherSubjectAssignment.find({ user_id: teacher_id })
      .populate('class_id', 'class_name grade section term_id')
      .populate('subject_id', 'subject_name')
      .populate({
        path: 'class_id',
        populate: {
          path: 'term_id',
          select: 'term_number academic_year_id',
          populate: {
            path: 'academic_year_id',
            select: 'year_label'
          }
        }
      })
      .sort({ 'class_id.class_name': 1, 'subject_id.subject_name': 1 });

    // Format the response
    const formattedAssignments = assignments.map(assignment => ({
      id: assignment._id,
      class_id: assignment.class_id._id,
      class_name: assignment.class_id.class_name,
      grade: assignment.class_id.grade,
      section: assignment.class_id.section,
      subject_id: assignment.subject_id._id,
      subject_name: assignment.subject_id.subject_name,
      term: assignment.class_id.term_id
    }));

    res.json(formattedAssignments);

  } catch (error) {
    console.error('Error getting teacher subject assignments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get students for subject attendance marking
export const getSubjectClassStudents = async (req, res) => {
  try {
    const { class_id, teacher_id } = req.query;
    const teacherId = teacher_id || req.user?.id || req.user?._id;

    if (!class_id) {
      return res.status(400).json({ message: "Class ID is required" });
    }

    if (!teacherId) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    // Get all students in this class
    const studentAssignments = await UserClassAssignment.find({ 
      class_id: class_id,
      is_class_teacher: false // Students are not class teachers
    })
      .populate({
        path: 'user_id',
        match: { role: 'Student', is_deleted: { $ne: true } },
        select: 'name _id'
      });

    // Filter out null users and format students
    const validStudents = studentAssignments
      .filter(assignment => assignment.user_id !== null)
      .map((assignment, index) => {
        return {
          id: assignment.user_id._id,
          name: assignment.user_id.name,
          rollNumber: String(index + 1).padStart(3, '0')
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json(validStudents);

  } catch (error) {
    console.error('Error getting subject class students:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get attendance for a class on a specific date
export const getClassAttendance = async (req, res) => {
  try {
    const { class_id, date, period_index, subject_id } = req.query;

    if (!class_id || !date) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    const query = {
      class_id,
      date: new Date(date)
    };

    if (period_index) {
      // Find slot by period number
      const slot = await TimetableSlot.findOne({ 
        slot_number: parseInt(period_index),
        is_active: true 
      });
      if (slot) {
        query.slot_id = slot._id;
      }
    }

    if (subject_id) {
      query.subject_id = subject_id;
    }

    const attendance = await Attendance.find(query)
      .populate('student_id', 'name')
      .populate('subject_id', 'subject_name')
      .populate('slot_id', 'slot_number')
      .populate('marked_by', 'name')
      .sort({ 'student_id.name': 1 });

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

    if (!student_id) {
      return res.status(400).json({ message: "Missing required parameters: student_id" });
    }

    const query = {
      student_id
    };

    // If term_id is provided, filter by class_id that belongs to that term
    if (term_id) {
      // Get student's class assignment to find class_id
      const studentClass = await UserClassAssignment.findOne({ 
        user_id: student_id,
        is_class_teacher: false 
      }).populate('class_id');
      
      if (studentClass && studentClass.class_id) {
        // Verify the class belongs to the specified term
        const classTermId = studentClass.class_id.term_id?.toString() || studentClass.class_id.term_id;
        if (classTermId === term_id.toString()) {
          query.class_id = studentClass.class_id._id;
        }
      }
    }

    if (start_date && end_date) {
      query.date = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('subject_id', 'subject_name')
      .populate('slot_id', 'slot_number')
      .populate('marked_by', 'name')
      .populate('class_id', 'class_name')
      .sort({ date: -1 });

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

    if (!parent_id || !child_id) {
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
      student_id: child_id
    };

    // If term_id is provided, filter by class_id that belongs to that term
    if (term_id) {
      // Get student's class assignment to find class_id
      const studentClass = await UserClassAssignment.findOne({ 
        user_id: child_id,
        is_class_teacher: false 
      }).populate('class_id');
      
      if (studentClass && studentClass.class_id) {
        // Verify the class belongs to the specified term
        const classTermId = studentClass.class_id.term_id?.toString() || studentClass.class_id.term_id;
        if (classTermId === term_id.toString()) {
          query.class_id = studentClass.class_id._id;
        }
      }
    }

    if (start_date && end_date) {
      query.date = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('subject_id', 'subject_name')
      .populate('slot_id', 'slot_number')
      .populate('marked_by', 'name')
      .populate('class_id', 'class_name')
      .sort({ date: -1 });

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
