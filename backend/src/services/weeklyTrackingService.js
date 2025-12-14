/**
 * Weekly Tracking Service
 * Automatically reduces course limits when weeks complete
 * Marks slots as free when course limits reach 0
 */

import TeacherSubjectAssignment from '../models/TeacherSubjectAssignment.js';
import ClassTimetable from '../models/ClassTimetable.js';
import Class from '../models/Class.js';
import Term from '../models/Term.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Process weekly course limit reduction for all active terms
 * This should be called at the end of each week (Friday evening or Sunday)
 */
export const processWeeklyCourseLimitReduction = async () => {
  try {
    console.log('📅 Starting weekly course limit reduction process...');
    
    // Get all active terms
    const activeTerms = await Term.find({ is_active: true });
    
    if (activeTerms.length === 0) {
      console.log('⚠️ No active terms found');
      return { success: true, message: 'No active terms found' };
    }

    let totalReduced = 0;
    let totalCompleted = 0;
    const results = [];

    for (const term of activeTerms) {
      console.log(`\n📚 Processing term: Term ${term.term_number} (${term.start_date} to ${term.end_date})`);
      
      // Get all teacher-subject assignments for this term
      // Note: TeacherSubjectAssignment doesn't have term_id field directly,
      // so we need to get assignments based on classes in this term
      const classes = await Class.find({ term_id: term._id });
      const classIds = classes.map(c => c._id);
      
      const assignments = await TeacherSubjectAssignment.find({
        class_id: { $in: classIds }
      })
        .populate('class_id', 'class_name')
        .populate('subject_id', 'subject_name')
        .populate('user_id', 'name');
      
      console.log(`📊 Found ${assignments.length} assignments to process`);
      
      for (const assignment of assignments) {
        if (assignment.course_limit > 0) {
          // Count how many periods this subject has per week in the timetable
          const weeklyPeriods = await ClassTimetable.countDocuments({
            class_id: assignment.class_id._id,
            subject_id: assignment.subject_id._id,
            term_id: term._id
          });
          
          // Reduce course limit by weekly periods (minimum 1 period per week if scheduled)
          if (weeklyPeriods > 0) {
            const reductionAmount = weeklyPeriods;
            const oldLimit = assignment.course_limit;
            assignment.course_limit = Math.max(0, assignment.course_limit - reductionAmount);
            await assignment.save();
            
            totalReduced += reductionAmount;
            
            console.log(`  📉 ${assignment.subject_id.subject_name} in ${assignment.class_id.class_name}: ${oldLimit} → ${assignment.course_limit} periods`);
            
            // If course limit reached 0, mark slots as free
            if (assignment.course_limit === 0) {
              await markSlotsAsFree(assignment.class_id._id, assignment.subject_id._id, assignment.user_id._id, term._id);
              totalCompleted++;
              
              // Notify admin
              const admins = await User.find({ role: 'Admin', is_deleted: { $ne: true } });
              for (const admin of admins) {
                await Notification.create({
                  user_id: admin._id,
                  title: 'Course Completed',
                  body: `${assignment.subject_id.subject_name} course completed for ${assignment.class_id.class_name}`,
                  type: 'COURSE_COMPLETED',
                  data: {
                    class_id: assignment.class_id._id,
                    subject_id: assignment.subject_id._id,
                    teacher_id: assignment.user_id._id,
                    term_id: term._id
                  },
                  is_read: false
                });
              }
              
              results.push({
                class_name: assignment.class_id.class_name,
                subject_name: assignment.subject_id.subject_name,
                teacher_name: assignment.user_id.name,
                status: 'completed'
              });
            }
          }
        }
      }
    }
    
    console.log(`\n✅ Weekly processing completed:`);
    console.log(`   - Total periods reduced: ${totalReduced}`);
    console.log(`   - Courses completed: ${totalCompleted}`);
    
    return {
      success: true,
      totalReduced,
      totalCompleted,
      results
    };
    
  } catch (error) {
    console.error('❌ Error in weekly course limit reduction:', error);
    throw error;
  }
};

/**
 * Mark timetable slots as free when course limit reaches 0
 * This removes the ClassTimetable entries for that subject, making slots free for the teacher
 */
async function markSlotsAsFree(classId, subjectId, teacherId, termId) {
  try {
    // Remove ClassTimetable entries for this subject in this class/term
    // This makes the slots "free" for the teacher
    const deleted = await ClassTimetable.deleteMany({
      class_id: classId,
      subject_id: subjectId,
      teacher_id: teacherId,
      term_id: termId
    });
    
    console.log(`  🆓 Marked ${deleted.deletedCount} slots as free for ${teacherId}`);
    
    return deleted.deletedCount;
  } catch (error) {
    console.error('❌ Error marking slots as free:', error);
    throw error;
  }
}

/**
 * Get current week number within a term
 */
export const getCurrentWeekNumber = async (termId) => {
  try {
    const term = await Term.findById(termId);
    if (!term) {
      throw new Error('Term not found');
    }
    
    const today = new Date();
    const termStart = new Date(term.start_date);
    
    // Calculate weeks passed (assuming weeks start on Monday)
    const daysPassed = Math.floor((today - termStart) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(daysPassed / 7) + 1;
    
    return weekNumber;
  } catch (error) {
    console.error('❌ Error getting current week number:', error);
    throw error;
  }
};

/**
 * Check if it's the end of the week (Friday)
 */
export const isEndOfWeek = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 5 = Friday
  return dayOfWeek === 5; // Friday
};

