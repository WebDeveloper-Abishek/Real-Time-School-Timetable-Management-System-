import User from '../models/User.js';
import ClassTimetable from '../models/ClassTimetable.js';
import TeacherTimetable from '../models/TeacherTimetable.js';
import LeaveRecord from '../models/LeaveRecord.js';
import ReplacementAssignment from '../models/ReplacementAssignment.js';
import Notification from '../models/Notification.js';
import TeacherSubjectAssignment from '../models/TeacherSubjectAssignment.js';
import TimetableSlot from '../models/TimetableSlot.js';

/**
 * Real-time Teacher Replacement System
 * Handles leave requests and finds replacement teachers automatically
 */

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/**
 * Process a leave request and find replacements
 */
export const processLeaveRequest = async (leaveId) => {
  try {
    console.log(`🔄 Processing leave request: ${leaveId}`);
    
    // Get the leave record
    const leave = await LeaveRecord.findById(leaveId)
      .populate('teacher_id', 'name email')
      .populate('class_id', 'class_name grade section');
    
    if (!leave || leave.status !== 'Approved') {
      throw new Error('Leave not found or not approved');
    }

    // Get affected periods
    const affectedPeriods = await getAffectedPeriods(leave);
    console.log(`📅 Found ${affectedPeriods.length} affected periods`);

    // Find replacement teachers for each period
    const replacements = [];
    for (const period of affectedPeriods) {
      const replacement = await findReplacementTeacher(period, leave);
      if (replacement) {
        replacements.push({
          ...replacement,
          period: period,
          leave_id: leaveId
        });
      }
    }

    // Send replacement prompts to teachers
    await sendReplacementPrompts(replacements, leave);

    return {
      success: true,
      message: 'Replacement process initiated',
      affectedPeriods: affectedPeriods.length,
      replacementPrompts: replacements.length
    };

  } catch (error) {
    console.error('❌ Error processing leave request:', error);
    throw error;
  }
};

/**
 * Get all periods affected by a leave
 */
async function getAffectedPeriods(leave) {
  const { teacher_id, class_id, leave_date, leave_type } = leave;
  
  // Get all periods for this teacher on this date
  const teacherPeriods = await ClassTimetable.find({
    teacher_id: teacher_id,
    class_id: class_id
  }).populate('slot_id');

  // Filter by date and leave type
  const affectedPeriods = teacherPeriods.filter(period => {
    const periodDate = new Date(period.createdAt);
    const leaveDate = new Date(leave_date);
    
    // Check if it's the same date
    if (periodDate.toDateString() !== leaveDate.toDateString()) {
      return false;
    }

    // Check leave type (full day, first half, second half)
    if (leave_type === 'Full Day') {
      return true;
    } else if (leave_type === 'First Half') {
      return period.slot_id.slot_number <= 4; // First 4 periods
    } else if (leave_type === 'Second Half') {
      return period.slot_id.slot_number > 4; // Last 4 periods
    }
    
    return false;
  });

  return affectedPeriods;
}

/**
 * Find replacement teacher for a specific period
 */
async function findReplacementTeacher(period, leave) {
  const { class_id, subject_id, slot_id, day_of_week } = period;
  
  console.log(`🔍 Finding replacement for ${subject_id.subject_name} in ${class_id.class_name}`);

  // Priority 1: Teachers already teaching this class on this day
  const sameClassTeachers = await findTeachersTeachingSameClass(class_id, day_of_week, slot_id._id);
  if (sameClassTeachers.length > 0) {
    const bestTeacher = await selectBestReplacement(sameClassTeachers, subject_id);
    if (bestTeacher) {
      console.log(`✅ Found same-class teacher: ${bestTeacher.name}`);
      return {
        teacher: bestTeacher,
        priority: 1,
        reason: 'Already teaching this class'
      };
    }
  }

  // Priority 2: Teachers free during this slot who teach this subject
  const subjectTeachers = await findTeachersForSubject(subject_id, day_of_week, slot_id._id);
  if (subjectTeachers.length > 0) {
    const bestTeacher = await selectBestReplacement(subjectTeachers, subject_id);
    if (bestTeacher) {
      console.log(`✅ Found subject teacher: ${bestTeacher.name}`);
      return {
        teacher: bestTeacher,
        priority: 2,
        reason: 'Teaches this subject and is free'
      };
    }
  }

  // Priority 3: Any teacher free during this slot
  const freeTeachers = await findFreeTeachers(day_of_week, slot_id._id);
  if (freeTeachers.length > 0) {
    const bestTeacher = freeTeachers[0]; // Take first available
    console.log(`✅ Found free teacher: ${bestTeacher.name}`);
    return {
      teacher: bestTeacher,
      priority: 3,
      reason: 'Available during this slot'
    };
  }

  console.log(`❌ No replacement found for this period`);
  return null;
}

/**
 * Find teachers already teaching the same class
 */
async function findTeachersTeachingSameClass(classId, dayOfWeek, slotId) {
  const teachers = await ClassTimetable.find({
    class_id: classId,
    day_of_week: dayOfWeek,
    slot_id: slotId
  }).populate('teacher_id', 'name email role');

  return teachers.map(ct => ct.teacher_id);
}

/**
 * Find teachers who teach this subject and are free
 */
async function findTeachersForSubject(subjectId, dayOfWeek, slotId) {
  // Get teachers assigned to this subject
  const subjectAssignments = await TeacherSubjectAssignment.find({
    subject_id: subjectId
  }).populate('user_id', 'name email role');

  const teacherIds = subjectAssignments.map(sa => sa.user_id._id);

  // Check which ones are free during this slot
  const freeTeachers = [];
  for (const teacherId of teacherIds) {
    const isFree = await isTeacherFree(teacherId, dayOfWeek, slotId);
    if (isFree) {
      freeTeachers.push(subjectAssignments.find(sa => sa.user_id._id.toString() === teacherId.toString()).user_id);
    }
  }

  return freeTeachers;
}

/**
 * Find any teachers free during this slot
 */
async function findFreeTeachers(dayOfWeek, slotId) {
  // Get all teachers
  const teachers = await User.find({ role: 'Teacher' });

  const freeTeachers = [];
  for (const teacher of teachers) {
    const isFree = await isTeacherFree(teacher._id, dayOfWeek, slotId);
    if (isFree) {
      freeTeachers.push(teacher);
    }
  }

  return freeTeachers;
}

/**
 * Check if teacher is free during specific slot
 */
async function isTeacherFree(teacherId, dayOfWeek, slotId) {
  const existingAssignment = await ClassTimetable.findOne({
    teacher_id: teacherId,
    day_of_week: dayOfWeek,
    slot_id: slotId
  });

  return !existingAssignment;
}

/**
 * Select best replacement teacher based on course limits
 */
async function selectBestReplacement(teachers, subjectId) {
  let bestTeacher = null;
  let highestCourseLimit = -1;

  for (const teacher of teachers) {
    const assignment = await TeacherSubjectAssignment.findOne({
      user_id: teacher._id,
      subject_id: subjectId
    });

    if (assignment && assignment.course_limit > highestCourseLimit) {
      highestCourseLimit = assignment.course_limit;
      bestTeacher = teacher;
    }
  }

  return bestTeacher;
}

/**
 * Send replacement prompts to teachers
 */
async function sendReplacementPrompts(replacements, leave) {
  for (const replacement of replacements) {
    // Create notification for the teacher
    await Notification.create({
      user_id: replacement.teacher._id,
      type: 'replacement_request',
      title: 'Replacement Request',
      message: `You are requested to replace ${leave.teacher_id.name} for ${leave.class_id.class_name} - ${replacement.period.subject_id.subject_name} on ${replacement.period.day_of_week}`,
      data: {
        leave_id: leave._id,
        period_id: replacement.period._id,
        replacement_teacher_id: replacement.teacher._id,
        priority: replacement.priority,
        reason: replacement.reason
      },
      is_read: false
    });

    console.log(`📤 Sent replacement prompt to ${replacement.teacher.name}`);
  }
}

/**
 * Teacher accepts replacement request
 */
export const acceptReplacement = async (notificationId, teacherId) => {
  try {
    const notification = await Notification.findById(notificationId);
    if (!notification || notification.user_id.toString() !== teacherId.toString()) {
      throw new Error('Notification not found or unauthorized');
    }

    const { leave_id, period_id, replacement_teacher_id } = notification.data;

    // Create replacement assignment
    await ReplacementAssignment.create({
      leave_id: leave_id,
      period_id: period_id,
      replacement_teacher_id: replacement_teacher_id,
      status: 'Accepted',
      accepted_at: new Date()
    });

    // Update notification
    notification.is_read = true;
    await notification.save();

    // Send confirmation to admin
    await Notification.create({
      user_id: 'admin', // Assuming admin has a specific ID
      type: 'replacement_accepted',
      title: 'Replacement Accepted',
      message: `${notification.user_id.name} has accepted the replacement request`,
      is_read: false
    });

    console.log(`✅ Replacement accepted by ${teacherId}`);

    return { success: true, message: 'Replacement accepted successfully' };

  } catch (error) {
    console.error('❌ Error accepting replacement:', error);
    throw error;
  }
};

/**
 * Teacher declines replacement request
 */
export const declineReplacement = async (notificationId, teacherId) => {
  try {
    const notification = await Notification.findById(notificationId);
    if (!notification || notification.user_id.toString() !== teacherId.toString()) {
      throw new Error('Notification not found or unauthorized');
    }

    // Mark notification as read
    notification.is_read = true;
    await notification.save();

    // Find next available teacher
    const { leave_id, period_id } = notification.data;
    const leave = await LeaveRecord.findById(leave_id);
    const period = await ClassTimetable.findById(period_id);

    // Try to find another replacement
    const nextReplacement = await findReplacementTeacher(period, leave);
    if (nextReplacement) {
      await sendReplacementPrompts([nextReplacement], leave);
    } else {
      // No more replacements available - notify admin
      await Notification.create({
        user_id: 'admin',
        type: 'replacement_failed',
        title: 'Replacement Failed',
        message: `No replacement found for ${leave.class_id.class_name} - ${period.subject_id.subject_name}`,
        is_read: false
      });
    }

    console.log(`❌ Replacement declined by ${teacherId}`);

    return { success: true, message: 'Replacement declined' };

  } catch (error) {
    console.error('❌ Error declining replacement:', error);
    throw error;
  }
};

/**
 * Get replacement status for a leave
 */
export const getReplacementStatus = async (leaveId) => {
  try {
    const replacements = await ReplacementAssignment.find({ leave_id: leaveId })
      .populate('replacement_teacher_id', 'name')
      .populate('period_id')
      .populate('leave_id');

    return {
      success: true,
      replacements: replacements
    };

  } catch (error) {
    console.error('❌ Error getting replacement status:', error);
    throw error;
  }
};
