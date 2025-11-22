/**
 * AI-Powered Timetable Generation Service
 * 
 * This service implements an intelligent algorithm to automatically generate
 * timetables based on:
 * - Course limits (subject periods required per term)
 * - Teacher availability and assignments
 * - Class schedules and constraints
 * - Double/triple period requirements
 * - Teacher workload balancing
 */

import TimetableSlot from '../models/TimetableSlot.js';
import ClassTimetable from '../models/ClassTimetable.js';
import TeacherTimetable from '../models/TeacherTimetable.js';
import TeacherSubjectAssignment from '../models/TeacherSubjectAssignment.js';
import UserClassAssignment from '../models/UserClassAssignment.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const ACADEMIC_PERIODS = 8; // Periods 1-8 are academic
const TOTAL_PERIODS = 10; // Periods 9-10 for assembly, anthem, etc.

// Time slots configuration (45 minutes each)
const TIME_SLOTS = [
  { period: 1, start: '07:30', end: '08:15', type: 'Period' },
  { period: 2, start: '08:15', end: '09:00', type: 'Period' },
  { period: 3, start: '09:00', end: '09:45', type: 'Period' },
  { period: 4, start: '09:45', end: '10:30', type: 'Period' },
  { period: 5, start: '10:45', end: '11:30', type: 'Period' }, // After break
  { period: 6, start: '11:30', end: '12:15', type: 'Period' },
  { period: 7, start: '12:15', end: '13:00', type: 'Period' },
  { period: 8, start: '13:00', end: '13:45', type: 'Period' },
  { period: 9, start: '07:00', end: '07:30', type: 'Assembly' },
  { period: 10, start: '10:30', end: '10:45', type: 'Break' }
];

/**
 * Main AI Timetable Generation Function
 * @param {String} termId - Term ID
 * @param {String} classId - Class ID
 * @returns {Object} - Generated timetable data
 */
export const generateAITimetable = async (termId, classId) => {
  try {
    console.log('🤖 Starting AI Timetable Generation...');
    console.log('Term:', termId, 'Class:', classId);

    // Step 1: Fetch class and term information
    const classData = await Class.findById(classId).populate('term_id');
    if (!classData) {
      throw new Error('Class not found');
    }

    // Step 2: Fetch teacher-subject assignments for this class
    const teacherAssignments = await TeacherSubjectAssignment.find({
      class_id: classId
    })
      .populate('user_id', 'name role')
      .populate('subject_id', 'subject_name course_limit')
      .populate('class_id', 'class_name grade section');

    if (teacherAssignments.length === 0) {
      throw new Error('No teacher-subject assignments found for this class. Please assign teachers first.');
    }

    console.log('📚 Found', teacherAssignments.length, 'subject assignments');

    // Step 3: Clear existing timetable for this class and term
    await ClassTimetable.deleteMany({ class_id: classId, term_id: termId });
    
    // Step 4: Prepare subject distribution data
    const subjectDistribution = teacherAssignments.map(assignment => ({
      subjectId: assignment.subject_id._id,
      subjectName: assignment.subject_id.subject_name,
      teacherId: assignment.user_id._id,
      teacherName: assignment.user_id.name,
      courseLimit: assignment.course_limit,
      periodsScheduled: 0,
      isLab: isLabSubject(assignment.subject_id.subject_name) // Science, Computer Science, etc.
    }));

    // Step 5: Calculate total periods needed
    const totalPeriodsNeeded = subjectDistribution.reduce((sum, sub) => sum + sub.courseLimit, 0);
    const totalPeriodsAvailable = DAYS.length * ACADEMIC_PERIODS; // 5 days * 8 periods = 40

    console.log('📊 Total periods needed:', totalPeriodsNeeded);
    console.log('📊 Total periods available:', totalPeriodsAvailable);

    if (totalPeriodsNeeded > totalPeriodsAvailable) {
      throw new Error(`Course limits exceed available periods. Needed: ${totalPeriodsNeeded}, Available: ${totalPeriodsAvailable}`);
    }

    // Step 6: Generate timetable using AI algorithm
    const generatedTimetable = await generateOptimalDistribution(
      subjectDistribution,
      classId,
      termId,
      teacherAssignments
    );

    // Step 7: Save to database (ClassTimetable entries)
    await saveGeneratedTimetable(generatedTimetable);

    // Step 8: Generate teacher timetables
    await generateTeacherTimetables(termId, teacherAssignments);

    console.log('✅ Timetable generation completed successfully');

    return {
      success: true,
      message: 'Timetable generated successfully',
      stats: {
        totalSlots: generatedTimetable.length,
        subjects: subjectDistribution.length,
        teachers: teacherAssignments.length
      }
    };

  } catch (error) {
    console.error('❌ Timetable generation error:', error);
    throw error;
  }
};

/**
 * Check if subject requires lab/double periods
 */
function isLabSubject(subjectName) {
  const labSubjects = ['Science', 'Computer Science', 'Physics', 'Chemistry', 'Biology', 'IT', 'Lab'];
  return labSubjects.some(lab => subjectName.toLowerCase().includes(lab.toLowerCase()));
}

/**
 * AI Algorithm: Generate optimal distribution using existing TimetableSlot structure
 * Handles different grade levels with varying subject counts and course limits
 */
async function generateOptimalDistribution(subjectDistribution, classId, termId, teacherAssignments) {
  const generatedClassTimetables = [];
  const teacherSchedule = {}; // Track teacher availability
  
  // Get predefined time slots (should exist in TimetableSlot collection)
  let timeSlots = await TimetableSlot.find({ is_active: true }).sort({ slot_number: 1 });
  
  // If no slots exist, create default ones
  if (timeSlots.length === 0) {
    console.log('📝 Creating default time slots...');
    const defaultSlots = TIME_SLOTS.map(slot => ({
      slot_number: slot.period,
      start_time: slot.start,
      end_time: slot.end,
      slot_type: slot.type,
      is_active: true
    }));
    timeSlots = await TimetableSlot.insertMany(defaultSlots);
  }
  
  // Get only academic period slots (Period type) - 8 periods per day
  const academicSlots = timeSlots.filter(slot => slot.slot_type === 'Period');
  
  // Initialize teacher schedule
  teacherAssignments.forEach(assignment => {
    const teacherId = assignment.user_id._id.toString();
    if (!teacherSchedule[teacherId]) {
      teacherSchedule[teacherId] = {};
      DAYS.forEach(day => {
        teacherSchedule[teacherId][day] = {};
        academicSlots.forEach(slot => {
          teacherSchedule[teacherId][day][slot.slot_number] = false;
        });
      });
    }
  });

  // Sort subjects by course limit (high demand first) for better distribution
  const sortedSubjects = [...subjectDistribution].sort((a, b) => b.courseLimit - a.courseLimit);

  console.log(`🎯 Generating timetable for ${sortedSubjects.length} subjects with total ${sortedSubjects.reduce((sum, s) => sum + s.courseLimit, 0)} periods needed`);

  // Distribute subjects across week using TimetableSlot references
  for (const subject of sortedSubjects) {
    let periodsToSchedule = subject.courseLimit;
    let scheduledThisSubject = 0;
    
    console.log(`📚 Scheduling ${subject.subjectName}: ${periodsToSchedule} periods needed`);
    
    // Try to distribute evenly across days
    const periodsPerDay = Math.ceil(periodsToSchedule / DAYS.length);
    
    for (let dayIndex = 0; dayIndex < DAYS.length && periodsToSchedule > 0; dayIndex++) {
      const day = DAYS[dayIndex];
      let dailyScheduled = 0;
      
      // For lab subjects, try to schedule double periods
      if (subject.isLab && periodsToSchedule >= 2) {
        // Try to find consecutive free slots
        for (let slotIndex = 0; slotIndex < academicSlots.length - 1 && periodsToSchedule >= 2 && dailyScheduled < periodsPerDay; slotIndex++) {
          const timeSlot1 = academicSlots[slotIndex];
          const timeSlot2 = academicSlots[slotIndex + 1];
          const teacherId = subject.teacherId.toString();
          
          // Check if teacher is free for consecutive periods
          if (!teacherSchedule[teacherId][day][timeSlot1.slot_number] && 
              !teacherSchedule[teacherId][day][timeSlot2.slot_number]) {
            
            // Schedule double period
            generatedClassTimetables.push({
              class_id: classId,
              slot_id: timeSlot1._id,
              subject_id: subject.subjectId,
              teacher_id: subject.teacherId,
              day_of_week: day,
              is_double_period: true
            });
            
            generatedClassTimetables.push({
              class_id: classId,
              slot_id: timeSlot2._id,
              subject_id: subject.subjectId,
              teacher_id: subject.teacherId,
              day_of_week: day,
              is_double_period: true
            });
            
            // Mark teacher as busy
            teacherSchedule[teacherId][day][timeSlot1.slot_number] = true;
            teacherSchedule[teacherId][day][timeSlot2.slot_number] = true;
            
            periodsToSchedule -= 2;
            dailyScheduled += 2;
            scheduledThisSubject += 2;
            
            break; // Move to next day after scheduling double period
          }
        }
      }

      // Schedule remaining single periods
      for (let slotIndex = 0; slotIndex < academicSlots.length && dailyScheduled < periodsPerDay && periodsToSchedule > 0; slotIndex++) {
        const timeSlot = academicSlots[slotIndex];
        const teacherId = subject.teacherId.toString();
        
        // Check if teacher is free
        if (!teacherSchedule[teacherId][day][timeSlot.slot_number]) {
          // Create ClassTimetable entry referencing the TimetableSlot
          generatedClassTimetables.push({
            class_id: classId,
            slot_id: timeSlot._id,
            subject_id: subject.subjectId,
            teacher_id: subject.teacherId,
            day_of_week: day,
            is_double_period: false
          });
          
          // Mark teacher as busy
          teacherSchedule[teacherId][day][timeSlot.slot_number] = true;
          
          periodsToSchedule--;
          dailyScheduled++;
          scheduledThisSubject++;
        }
      }
    }
    
    console.log(`✅ ${subject.subjectName}: Scheduled ${scheduledThisSubject}/${subject.courseLimit} periods`);
    
    if (periodsToSchedule > 0) {
      console.log(`⚠️ Warning: ${periodsToSchedule} periods not scheduled for ${subject.subjectName}`);
    }
  }

  console.log(`🎉 Generated ${generatedClassTimetables.length} timetable entries`);
  return generatedClassTimetables;
}

/**
 * Save generated timetable using ClassTimetable (links to TimetableSlot)
 */
async function saveGeneratedTimetable(classTimetableEntries) {
  // Batch insert for better performance
  if (classTimetableEntries.length > 0) {
    await ClassTimetable.insertMany(classTimetableEntries);
  }
}

/**
 * Generate teacher timetables based on class timetables
 */
async function generateTeacherTimetables(termId, teacherAssignments) {
  // Get unique teacher IDs
  const teacherIds = [...new Set(teacherAssignments.map(a => a.user_id._id))];
  
  // Clear existing teacher timetables for these teachers in this term
  await TeacherTimetable.deleteMany({
    teacher_id: { $in: teacherIds }
  });

  // Get all class timetables with these teachers
  const classTimetables = await ClassTimetable.find({
    teacher_id: { $in: teacherIds }
  })
    .populate('slot_id')
    .populate('subject_id', 'subject_name')
    .populate('class_id', 'class_name grade section');

  // Create teacher timetable entries
  const teacherTimetableEntries = classTimetables.map(ct => ({
    teacher_id: ct.teacher_id,
    slot_id: ct.slot_id._id,
    class_id: ct.class_id._id,
    subject_id: ct.subject_id._id,
    day_of_week: ct.day_of_week
  }));

  if (teacherTimetableEntries.length > 0) {
    await TeacherTimetable.insertMany(teacherTimetableEntries);
  }

  console.log('✅ Teacher timetables generated for', teacherIds.length, 'teachers');
}

/**
 * Check for timetable conflicts
 */
export const checkTimetableConflicts = async (termId, classId) => {
  const conflicts = [];

  // Get all class timetable entries for this class
  const classTimetables = await ClassTimetable.find({ class_id: classId })
    .populate('slot_id')
    .populate('subject_id', 'subject_name')
    .populate('teacher_id', 'name')
    .populate('class_id', 'class_name');

  // Check for teacher conflicts (same teacher, same slot, same day, different class)
  for (const ct of classTimetables) {
    if (ct.teacher_id) {
      const teacherId = ct.teacher_id._id;
      
      const conflictingEntries = await ClassTimetable.find({
        teacher_id: teacherId,
        slot_id: ct.slot_id._id,
        day_of_week: ct.day_of_week,
        class_id: { $ne: classId }
      }).populate('class_id', 'class_name');

      if (conflictingEntries.length > 0) {
        conflicts.push({
          type: 'TEACHER_CONFLICT',
          teacher: ct.teacher_id.name,
          day: ct.day_of_week,
          slot: ct.slot_id.slot_number,
          time: `${ct.slot_id.start_time} - ${ct.slot_id.end_time}`,
          classes: [ct.class_id.class_name, ...conflictingEntries.map(s => s.class_id.class_name)]
        });
      }
    }
  }

  return conflicts;
};

/**
 * Validate timetable before generation
 */
export const validateTimetableRequirements = async (termId, classId) => {
  const errors = [];

  // Check if class exists
  const classData = await Class.findById(classId);
  if (!classData) {
    errors.push('Class not found');
    return { valid: false, errors };
  }

  // Check if there are teacher assignments
  const assignments = await TeacherSubjectAssignment.find({ class_id: classId });
  if (assignments.length === 0) {
    errors.push('No subjects assigned to this class. Please assign subjects and teachers first.');
  }

  // Check if all subjects have teachers
  for (const assignment of assignments) {
    if (!assignment.user_id) {
      const subject = await Subject.findById(assignment.subject_id);
      errors.push(`Subject "${subject?.subject_name}" has no teacher assigned`);
    }
  }

  // Check if total course limits are reasonable
  const totalCourseLimit = assignments.reduce((sum, a) => sum + (a.course_limit || 0), 0);
  if (totalCourseLimit > DAYS.length * ACADEMIC_PERIODS) {
    errors.push(`Total course limits (${totalCourseLimit}) exceed available periods (${DAYS.length * ACADEMIC_PERIODS})`);
  }

  return {
    valid: errors.length === 0,
    errors,
    stats: {
      totalSubjects: assignments.length,
      totalPeriods: totalCourseLimit,
      availablePeriods: DAYS.length * ACADEMIC_PERIODS
    }
  };
};

/**
 * Get timetable for a specific class and day
 */
export const getClassTimetable = async (termId, classId, dayOfWeek = null) => {
  const query = { class_id: classId };
  
  if (dayOfWeek) {
    query.day_of_week = dayOfWeek;
  }

  const timetable = await ClassTimetable.find(query)
    .populate('slot_id')
    .populate('subject_id', 'subject_name course_limit')
    .populate('teacher_id', 'name')
    .populate('class_id', 'class_name grade section')
    .sort({ day_of_week: 1, 'slot_id.slot_number': 1 });

  return timetable;
};

/**
 * Get timetable for a specific teacher
 */
export const getTeacherTimetable = async (termId, teacherId, dayOfWeek = null) => {
  const query = { teacher_id: teacherId };
  
  if (dayOfWeek) {
    query.day_of_week = dayOfWeek;
  }

  const timetable = await TeacherTimetable.find(query)
    .populate('slot_id')
    .populate('subject_id', 'subject_name')
    .populate('class_id', 'class_name grade section')
    .sort({ day_of_week: 1, 'slot_id.slot_number': 1 });

  return timetable;
};


/**
 * Update course limit after a period is taught
 */
export const reduceCourseLimitAfterPeriod = async (classId, subjectId, termId) => {
  try {
    const assignment = await TeacherSubjectAssignment.findOne({
      class_id: classId,
      subject_id: subjectId,
      term_id: termId
    });
    
    if (!assignment) {
      console.log(`⚠️ No assignment found for class ${classId}, subject ${subjectId}, term ${termId}`);
      return { success: false, message: 'Assignment not found' };
    }

    if (assignment.course_limit > 0) {
      assignment.course_limit -= 1;
      await assignment.save();
      
      console.log(`📉 Course limit reduced: ${assignment.course_limit} remaining for ${subjectId} in ${classId}`);
      
      // Check if course limit is now 0
      if (assignment.course_limit === 0) {
        console.log(`✅ Course completed for ${subjectId} in ${classId}`);
        
        // Send notification to admin
        await Notification.create({
          user_id: 'admin', // Assuming admin has a specific ID
          type: 'course_completed',
          title: 'Course Completed',
          message: `Course has been completed for this class`,
          data: {
            class_id: classId,
            subject_id: subjectId,
            term_id: termId
          },
          is_read: false
        });
      }
    }

    return { 
      success: true, 
      remainingLimit: assignment.course_limit,
      isCompleted: assignment.course_limit === 0
    };

  } catch (error) {
    console.error('❌ Error reducing course limit:', error);
    throw error;
  }
};

/**
 * Get remaining course limits for a class
 */
export const getRemainingCourseLimits = async (classId, termId) => {
  try {
    const assignments = await TeacherSubjectAssignment.find({
      class_id: classId,
      term_id: termId
    }).populate('subject_id', 'subject_name')
      .populate('user_id', 'name');

    const remainingLimits = assignments.map(assignment => ({
      subject_id: assignment.subject_id._id,
      subject_name: assignment.subject_id.subject_name,
      teacher_name: assignment.user_id?.name || 'Not Assigned',
      course_limit: assignment.course_limit,
      is_completed: assignment.course_limit === 0
    }));

    return {
      success: true,
      remainingLimits: remainingLimits,
      totalSubjects: assignments.length,
      completedSubjects: assignments.filter(a => a.course_limit === 0).length
    };

  } catch (error) {
    console.error('❌ Error getting remaining course limits:', error);
    throw error;
  }
};

/**
 * Check if a subject can be taught (has remaining course limit)
 */
export const canTeachSubject = async (classId, subjectId, termId) => {
  try {
    const assignment = await TeacherSubjectAssignment.findOne({
      class_id: classId,
      subject_id: subjectId,
      term_id: termId
    });

    if (!assignment) {
      return { canTeach: false, reason: 'Subject not assigned to this class' };
    }

    if (assignment.course_limit <= 0) {
      return { canTeach: false, reason: 'Course limit reached' };
    }

    if (!assignment.user_id) {
      return { canTeach: false, reason: 'No teacher assigned' };
    }

    return { 
      canTeach: true, 
      remainingLimit: assignment.course_limit,
      teacher_id: assignment.user_id
    };

  } catch (error) {
    console.error('❌ Error checking if subject can be taught:', error);
    throw error;
  }
};

/**
 * Update timetable when teacher replacement happens
 */
export const updateTimetableForReplacement = async (classId, slotId, newTeacherId, dayOfWeek) => {
  try {
    console.log(`🔄 Updating timetable for replacement: Class ${classId}, Slot ${slotId}, New Teacher ${newTeacherId}`);
    
    // Update ClassTimetable entry
    const classTimetable = await ClassTimetable.findOneAndUpdate(
      { 
        class_id: classId, 
        slot_id: slotId, 
        day_of_week: dayOfWeek 
      },
      { 
        teacher_id: newTeacherId,
        updated_at: new Date()
      },
      { new: true }
    );

    if (!classTimetable) {
      throw new Error('ClassTimetable entry not found');
    }

    // Update TeacherTimetable entry
    await TeacherTimetable.findOneAndUpdate(
      { 
        teacher_id: newTeacherId, 
        slot_id: slotId, 
        day_of_week: dayOfWeek 
      },
      { 
        class_id: classTimetable.class_id,
        subject_id: classTimetable.subject_id,
        updated_at: new Date()
      },
      { upsert: true }
    );

    // Remove old teacher's timetable entry if exists
    await TeacherTimetable.deleteMany({
      slot_id: slotId,
      day_of_week: dayOfWeek,
      class_id: classId
    });

    console.log(`✅ Timetable updated successfully for replacement`);

    return {
      success: true,
      message: 'Timetable updated for replacement',
      classTimetable: classTimetable
    };

  } catch (error) {
    console.error('❌ Error updating timetable for replacement:', error);
    throw error;
  }
};

/**
 * Get weekly timetable summary for a class
 */
export const getWeeklyTimetableSummary = async (classId, termId) => {
  try {
    const classTimetables = await ClassTimetable.find({ class_id: classId })
      .populate('slot_id')
      .populate('subject_id', 'subject_name')
      .populate('teacher_id', 'name')
      .populate('class_id', 'class_name grade');

    // Group by day
    const weeklySchedule = {};
    DAYS.forEach(day => {
      weeklySchedule[day] = [];
    });

    classTimetables.forEach(ct => {
      weeklySchedule[ct.day_of_week].push({
        slot_number: ct.slot_id.slot_number,
        start_time: ct.slot_id.start_time,
        end_time: ct.slot_id.end_time,
        subject_name: ct.subject_id.subject_name,
        teacher_name: ct.teacher_id.name,
        is_double_period: ct.is_double_period || false
      });
    });

    // Sort by slot number
    Object.keys(weeklySchedule).forEach(day => {
      weeklySchedule[day].sort((a, b) => a.slot_number - b.slot_number);
    });

    return {
      success: true,
      class_name: classTimetables[0]?.class_id?.class_name || 'Unknown',
      weekly_schedule: weeklySchedule,
      total_periods: classTimetables.length
    };

  } catch (error) {
    console.error('❌ Error getting weekly timetable summary:', error);
    throw error;
  }
};

export default {
  generateAITimetable,
  checkTimetableConflicts,
  validateTimetableRequirements,
  getClassTimetable,
  getTeacherTimetable,
  reduceCourseLimitAfterPeriod,
  getRemainingCourseLimits,
  canTeachSubject,
  updateTimetableForReplacement,
  getWeeklyTimetableSummary
};

