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
      .populate('user_id', 'name email role')
      .populate('class_id', 'class_name grade section');
    
    if (!leave || !leave.approved) {
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
 * Handles multi-day leaves and calculates affected days based on start_date and end_date
 */
async function getAffectedPeriods(leave) {
  // LeaveRecord uses user_id, not teacher_id
  const teacherId = leave.user_id?._id || leave.user_id || leave.teacher_id?._id || leave.teacher_id;
  const { start_date, end_date, leave_type, half_day_type } = leave;
  
  if (!teacherId) {
    console.log(`⚠️ No teacher ID found in leave record`);
    return [];
  }
  
  // Get all periods for this teacher across all classes
  const teacherPeriods = await ClassTimetable.find({
    teacher_id: teacherId
  })
    .populate('slot_id')
    .populate('subject_id', 'subject_name')
    .populate('class_id', 'class_name grade section');

  if (teacherPeriods.length === 0) {
    console.log(`⚠️ No periods found for teacher ${teacherId}`);
    return [];
  }

  // Calculate affected days (excluding weekends)
  const affectedDays = getAffectedDays(start_date, end_date);
  console.log(`📅 Affected days: ${affectedDays.map(d => d.toDateString()).join(', ')}`);

  // Map day names to dates
  const dayNameMap = {
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5
  };

  // Filter periods by affected days and leave type
  const affectedPeriods = teacherPeriods.filter(period => {
    // Get day of week number (0 = Sunday, 1 = Monday, etc.)
    const periodDayNumber = dayNameMap[period.day_of_week];
    if (!periodDayNumber) return false;

    // Check if this period's day falls on any affected date
    const isAffectedDay = affectedDays.some(affectedDate => {
      const dayOfWeek = affectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      // Convert to Monday=1 format
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
      return adjustedDay === periodDayNumber;
    });

    if (!isAffectedDay) return false;

    // Check leave type (Full, Half with First/Second)
    if (leave_type === 'Full') {
      return true;
    } else if (leave_type === 'Half') {
      if (half_day_type === 'First') {
        // First half: periods 1-4
        return period.slot_id.slot_number <= 4;
      } else if (half_day_type === 'Second') {
        // Second half: periods 5-8
        return period.slot_id.slot_number > 4 && period.slot_id.slot_number <= 8;
      }
    }
    
    return false;
  });

  console.log(`📚 Found ${affectedPeriods.length} affected periods`);
  return affectedPeriods;
}

/**
 * Get all affected days between start_date and end_date (excluding weekends)
 */
function getAffectedDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const affectedDays = [];

  // Set time to start of day
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const currentDate = new Date(start);
  
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    // Exclude weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      affectedDays.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return affectedDays;
}

/**
 * Find replacement teacher for a specific period
 * Priority: 1) Same class teachers with free periods, 2) Subject teachers with free periods, 3) Any free teacher
 */
async function findReplacementTeacher(period, leave) {
  const classId = typeof period.class_id === 'object' ? period.class_id._id : period.class_id;
  const subjectId = typeof period.subject_id === 'object' ? period.subject_id._id : period.subject_id;
  const slotId = typeof period.slot_id === 'object' ? period.slot_id._id : period.slot_id;
  const dayOfWeek = period.day_of_week;
  const originalTeacherId = leave.user_id?._id || leave.user_id || leave.teacher_id?._id || leave.teacher_id;
  
  const className = period.class_id?.class_name || 'Unknown';
  const subjectName = period.subject_id?.subject_name || 'Unknown';
  
  // Check if this is a double period
  const isDoublePeriod = period.is_double_period || false;
  
  console.log(`🔍 Finding replacement for ${subjectName} in ${className} on ${dayOfWeek}, slot ${period.slot_id?.slot_number || 'N/A'}${isDoublePeriod ? ' (Double Period)' : ''}`);

  // Priority 1: Teachers already teaching this class on this day (different slot) with free periods
  const sameClassTeachers = await findTeachersTeachingSameClass(classId, dayOfWeek, slotId, originalTeacherId, isDoublePeriod);
  if (sameClassTeachers.length > 0) {
    const bestTeacher = await selectBestReplacement(sameClassTeachers, subjectId, classId);
    if (bestTeacher) {
      console.log(`✅ Found same-class teacher: ${bestTeacher.name}`);
      return {
        teacher: bestTeacher,
        period: period,
        priority: 1,
        reason: 'Already teaching this class on this day'
      };
    }
  }

  // Priority 2: Teachers free during this slot who teach this subject for this class
  const subjectTeachers = await findTeachersForSubject(subjectId, classId, dayOfWeek, slotId, originalTeacherId, isDoublePeriod);
  if (subjectTeachers.length > 0) {
    const bestTeacher = await selectBestReplacement(subjectTeachers, subjectId, classId);
    if (bestTeacher) {
      console.log(`✅ Found subject teacher: ${bestTeacher.name}`);
      return {
        teacher: bestTeacher,
        period: period,
        priority: 2,
        reason: 'Teaches this subject for this class and is free'
      };
    }
  }

  // Priority 3: Any teacher free during this slot
  const freeTeachers = await findFreeTeachers(dayOfWeek, slotId, originalTeacherId, isDoublePeriod);
  if (freeTeachers.length > 0) {
    // Sort by course limit for this subject if available
    const sortedTeachers = await sortTeachersByCourseLimit(freeTeachers, subjectId, classId);
    const bestTeacher = sortedTeachers[0];
    console.log(`✅ Found free teacher: ${bestTeacher.name}`);
    return {
      teacher: bestTeacher,
      period: period,
      priority: 3,
      reason: 'Available during this slot'
    };
  }

  console.log(`❌ No replacement found for this period`);
  return null;
}

/**
 * Find teachers already teaching the same class on this day (different slots) who are free during the required slot
 */
async function findTeachersTeachingSameClass(classId, dayOfWeek, slotId, excludeTeacherId, isDoublePeriod = false) {
  // Get all teachers teaching this class on this day (any slot)
  const classTeachers = await ClassTimetable.find({
    class_id: classId,
    day_of_week: dayOfWeek,
    teacher_id: { $ne: excludeTeacherId }
  })
    .populate('teacher_id', 'name email role')
    .distinct('teacher_id');

  // Filter to only those who are free during the required slot
  const availableTeachers = [];
  for (const teacher of classTeachers) {
    const isFree = await isTeacherFree(teacher._id, dayOfWeek, slotId, isDoublePeriod);
    if (isFree) {
      availableTeachers.push(teacher);
    }
  }

  return availableTeachers;
}

/**
 * Find teachers who teach this subject for this class and are free during the slot
 */
async function findTeachersForSubject(subjectId, classId, dayOfWeek, slotId, excludeTeacherId, isDoublePeriod = false) {
  // Get teachers assigned to this subject for this class
  const subjectAssignments = await TeacherSubjectAssignment.find({
    subject_id: subjectId,
    class_id: classId,
    user_id: { $ne: excludeTeacherId }
  }).populate('user_id', 'name email role');

  // Check which ones are free during this slot
  const freeTeachers = [];
  for (const assignment of subjectAssignments) {
    const teacherId = assignment.user_id._id;
    const isFree = await isTeacherFree(teacherId, dayOfWeek, slotId, isDoublePeriod);
    if (isFree) {
      freeTeachers.push(assignment.user_id);
    }
  }

  return freeTeachers;
}

/**
 * Find any teachers free during this slot (excluding the absent teacher)
 */
async function findFreeTeachers(dayOfWeek, slotId, excludeTeacherId, isDoublePeriod = false) {
  // Get all teachers except the absent one
  const teachers = await User.find({ 
    role: 'Teacher',
    _id: { $ne: excludeTeacherId }
  });

  const freeTeachers = [];
  for (const teacher of teachers) {
    const isFree = await isTeacherFree(teacher._id, dayOfWeek, slotId, isDoublePeriod);
    if (isFree) {
      freeTeachers.push(teacher);
    }
  }

  return freeTeachers;
}

/**
 * Sort teachers by course limit for the subject/class (highest first)
 */
async function sortTeachersByCourseLimit(teachers, subjectId, classId) {
  const teachersWithLimits = await Promise.all(
    teachers.map(async (teacher) => {
      const assignment = await TeacherSubjectAssignment.findOne({
        user_id: teacher._id,
        subject_id: subjectId,
        class_id: classId
      });
      return {
        teacher,
        courseLimit: assignment?.course_limit || 0
      };
    })
  );

  return teachersWithLimits
    .sort((a, b) => b.courseLimit - a.courseLimit)
    .map(item => item.teacher);
}

/**
 * Check if teacher is free during specific slot
 * Also checks for double period requirements
 */
async function isTeacherFree(teacherId, dayOfWeek, slotId, isDoublePeriod = false) {
  // Check if teacher has an assignment in this slot
  const existingAssignment = await ClassTimetable.findOne({
    teacher_id: teacherId,
    day_of_week: dayOfWeek,
    slot_id: slotId
  });

  if (existingAssignment) {
    return false;
  }

  // If this is a double period, check if teacher is free for the next slot too
  if (isDoublePeriod) {
    const slot = await TimetableSlot.findById(slotId);
    if (slot) {
      // Find the next slot (slot_number + 1)
      const nextSlot = await TimetableSlot.findOne({
        slot_number: slot.slot_number + 1,
        slot_type: 'Period'
      });

      if (nextSlot) {
        const nextSlotAssignment = await ClassTimetable.findOne({
          teacher_id: teacherId,
          day_of_week: dayOfWeek,
          slot_id: nextSlot._id
        });

        if (nextSlotAssignment) {
          return false; // Teacher is busy in next slot
        }
      }
    }
  }

  return true;
}

/**
 * Select best replacement teacher based on course limits for the subject/class
 */
async function selectBestReplacement(teachers, subjectId, classId) {
  let bestTeacher = null;
  let highestCourseLimit = -1;

  for (const teacher of teachers) {
    const assignment = await TeacherSubjectAssignment.findOne({
      user_id: teacher._id,
      subject_id: subjectId,
      class_id: classId
    });

    const courseLimit = assignment?.course_limit || 0;
    if (courseLimit > highestCourseLimit) {
      highestCourseLimit = courseLimit;
      bestTeacher = teacher;
    }
  }

  return bestTeacher;
}

/**
 * Send replacement prompts to teachers
 */
async function sendReplacementPrompts(replacements, leave) {
  // LeaveRecord uses user_id, not teacher_id
  const teacherId = leave.user_id?._id || leave.user_id || (typeof leave.teacher_id === 'object' ? leave.teacher_id._id : leave.teacher_id);
  const teacherName = leave.user_id?.name || leave.teacher_id?.name || 'Teacher';
  
  for (const replacement of replacements) {
    const period = replacement.period;
    const classId = typeof period.class_id === 'object' ? period.class_id._id : period.class_id;
    const subjectId = typeof period.subject_id === 'object' ? period.subject_id._id : period.subject_id;
    const slotId = typeof period.slot_id === 'object' ? period.slot_id._id : period.slot_id;
    const className = period.class_id?.class_name || 'Unknown';
    const subjectName = period.subject_id?.subject_name || 'Unknown';
    const slotNumber = period.slot_id?.slot_number || 'N/A';
    
    // Create replacement assignment record
    const replacementAssignment = await ReplacementAssignment.create({
      original_teacher_id: teacherId, // This is correct - ReplacementAssignment uses original_teacher_id
      replacement_teacher_id: replacement.teacher._id,
      class_id: classId,
      subject_id: subjectId,
      slot_id: slotId,
      date: leave.start_date, // Use start date
      accepted: false
    });

    // Create notification for the teacher
    await Notification.create({
      user_id: replacement.teacher._id,
      type: 'info', // Using valid enum value
      category: 'academic',
      title: 'Replacement Request',
      body: `You are requested to replace ${teacherName} for ${className} - ${subjectName} on ${period.day_of_week} (Period ${slotNumber})`,
      priority: replacement.priority === 'high' ? 'high' : replacement.priority === 'urgent' ? 'urgent' : 'medium',
      action_data: {
        leave_id: leave._id,
        replacement_assignment_id: replacementAssignment._id,
        period_id: period._id,
        class_id: classId,
        subject_id: subjectId,
        slot_id: slotId,
        day_of_week: period.day_of_week,
        slot_number: slotNumber,
        priority: replacement.priority,
        reason: replacement.reason,
        class_name: className,
        subject_name: subjectName
      },
      read_status: false
    });

    console.log(`📤 Sent replacement prompt to ${replacement.teacher.name} for ${className} - ${subjectName}`);
  }
}

/**
 * Teacher accepts replacement request
 * Updates the ClassTimetable to reflect the replacement
 */
export const acceptReplacement = async (notificationId, teacherId) => {
  try {
    const notification = await Notification.findById(notificationId);
    if (!notification || notification.user_id.toString() !== teacherId.toString()) {
      throw new Error('Notification not found or unauthorized');
    }

    const { 
      replacement_assignment_id, 
      period_id, 
      class_id, 
      subject_id, 
      slot_id, 
      day_of_week 
    } = notification.data;

    if (!replacement_assignment_id) {
      throw new Error('Replacement assignment ID not found in notification');
    }

    // Update replacement assignment
    const replacementAssignment = await ReplacementAssignment.findById(replacement_assignment_id);
    if (!replacementAssignment) {
      throw new Error('Replacement assignment not found');
    }

    replacementAssignment.accepted = true;
    await replacementAssignment.save();

    // Update ClassTimetable to reflect the replacement teacher
    const classTimetable = await ClassTimetable.findById(period_id)
      .populate('slot_id');
    
    if (classTimetable) {
      // Check if this is part of a double period
      if (classTimetable.is_double_period) {
        // Update all periods in the double period block for this subject/class/day
        const updated = await ClassTimetable.updateMany(
          {
            class_id: classTimetable.class_id,
            day_of_week: classTimetable.day_of_week,
            subject_id: classTimetable.subject_id,
            is_double_period: true
          },
          {
            teacher_id: teacherId
          }
        );
        console.log(`✅ Updated ${updated.modifiedCount} periods in double period block for replacement`);
      } else {
        // Single period replacement
        classTimetable.teacher_id = teacherId;
        await classTimetable.save();
        console.log(`✅ Updated ClassTimetable for replacement`);
      }
    }

    // Update TeacherTimetable
    await TeacherTimetable.findOneAndUpdate(
      {
        teacher_id: teacherId,
        slot_id: slot_id,
        day_of_week: day_of_week
      },
      {
        class_id: class_id,
        subject_id: subject_id,
        slot_id: slot_id,
        day_of_week: day_of_week
      },
      { upsert: true, new: true }
    );

    // Update notification
    notification.is_read = true;
    await notification.save();

    // Send confirmation to admin
    const admin = await User.findOne({ role: 'Admin' });
    if (admin) {
      await Notification.create({
        user_id: admin._id,
        type: 'replacement_accepted',
        title: 'Replacement Accepted',
        message: `${notification.user_id.name} has accepted the replacement request`,
        data: {
          replacement_assignment_id: replacement_assignment_id,
          class_id: class_id,
          subject_id: subject_id
        },
        is_read: false
      });
    }

    console.log(`✅ Replacement accepted by ${teacherId}`);

    return { 
      success: true, 
      message: 'Replacement accepted successfully',
      replacement_assignment: replacementAssignment
    };

  } catch (error) {
    console.error('❌ Error accepting replacement:', error);
    throw error;
  }
};

/**
 * Teacher declines replacement request
 * Finds next available replacement or notifies admin
 */
export const declineReplacement = async (notificationId, teacherId, reason) => {
  try {
    const notification = await Notification.findById(notificationId);
    if (!notification || notification.user_id.toString() !== teacherId.toString()) {
      throw new Error('Notification not found or unauthorized');
    }

    const { 
      replacement_assignment_id, 
      leave_id, 
      period_id 
    } = notification.data;

    // Update replacement assignment with decline reason
    if (replacement_assignment_id) {
      const replacementAssignment = await ReplacementAssignment.findById(replacement_assignment_id);
      if (replacementAssignment) {
        replacementAssignment.accepted = false;
        replacementAssignment.reason_declined = reason || 'Declined by teacher';
        await replacementAssignment.save();
      }
    }

    // Mark notification as read
    notification.is_read = true;
    await notification.save();

    // Get leave and period details
    const leave = await LeaveRecord.findById(leave_id)
      .populate('user_id', 'name');
    
    if (!leave) {
      throw new Error('Leave record not found');
    }

    const period = await ClassTimetable.findById(period_id)
      .populate('class_id', 'class_name')
      .populate('subject_id', 'subject_name')
      .populate('slot_id');

    if (!period) {
      throw new Error('Period not found');
    }

    // Try to find another replacement (excluding the one who declined)
    const nextReplacement = await findReplacementTeacher(period, leave);
    
    if (nextReplacement && nextReplacement.teacher._id.toString() !== teacherId.toString()) {
      // Found another replacement - send prompt
      await sendReplacementPrompts([nextReplacement], leave);
      console.log(`📤 Sent replacement prompt to next available teacher: ${nextReplacement.teacher.name}`);
    } else {
      // No more replacements available - notify admin
      const admin = await User.findOne({ role: 'Admin' });
      if (admin) {
        const className = period.class_id?.class_name || 'Unknown';
        const subjectName = period.subject_id?.subject_name || 'Unknown';
        const slotNumber = period.slot_id?.slot_number || 'N/A';
        
        await Notification.create({
          user_id: admin._id,
          type: 'replacement_failed',
          title: 'Replacement Needed - Manual Assignment Required',
          message: `No replacement found for ${className} - ${subjectName} on ${period.day_of_week} (Period ${slotNumber}). Manual assignment required.`,
          data: {
            leave_id: leave_id,
            period_id: period_id,
            class_id: period.class_id?._id,
            subject_id: period.subject_id?._id,
            slot_id: period.slot_id?._id,
            day_of_week: period.day_of_week
          },
          is_read: false
        });
        console.log(`📢 Notified admin: Manual replacement needed`);
      }
    }

    console.log(`❌ Replacement declined by ${teacherId}`);

    return { 
      success: true, 
      message: 'Replacement declined',
      nextReplacementFound: !!nextReplacement
    };

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
