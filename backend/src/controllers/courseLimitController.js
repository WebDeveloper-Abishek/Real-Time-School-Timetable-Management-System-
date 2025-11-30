import TeacherSubjectAssignment from '../models/TeacherSubjectAssignment.js';
import Subject from '../models/Subject.js';
import Class from '../models/Class.js';
import Term from '../models/Term.js';

/**
 * Get course limits for a specific subject and term
 */
export const getCourseLimits = async (req, res) => {
  try {
    const { subject_id } = req.params;
    const { term_id } = req.query;

    if (!subject_id) {
      return res.status(400).json({ message: "Subject ID is required" });
    }

    // Get all classes for this term
    const classes = term_id ? await Class.find({ term_id: term_id }) : await Class.find();
    const classIds = classes.map(c => c._id);

    // Get course limits for this subject in these classes
    const courseLimits = await TeacherSubjectAssignment.find({
      subject_id: subject_id,
      class_id: { $in: classIds }
    }).populate('class_id', 'class_name grade section');

    // Create a map of class_id to course_limit
    const limitMap = {};
    courseLimits.forEach(limit => {
      limitMap[limit.class_id._id.toString()] = {
        class_id: limit.class_id._id,
        class_name: limit.class_id.class_name,
        grade: limit.class_id.grade,
        course_limit: limit.course_limit
      };
    });

    // Ensure all classes have an entry
    const result = classes.map(cls => ({
      class_id: cls._id,
      class_name: cls.class_name,
      grade: cls.grade,
      course_limit: limitMap[cls._id.toString()]?.course_limit || 0
    }));

    return res.json({ success: true, courseLimits: result });

  } catch (error) {
    console.error('Get course limits error:', error);
    return res.status(500).json({
      message: "Error fetching course limits",
      error: error.message
    });
  }
};

// Helper function to calculate maximum course limit per subject for a class
const calculateMaxCourseLimitPerSubject = async (class_id) => {
  const subjectCount = await TeacherSubjectAssignment.distinct('subject_id', { class_id });
  const numberOfSubjects = subjectCount.length;
  
  if (numberOfSubjects === 0) {
    return 160;
  }
  
  return Math.floor(160 / numberOfSubjects);
};

/**
 * Update course limit for a specific class and subject
 */
export const updateCourseLimit = async (req, res) => {
  try {
    const { class_id, subject_id, term_id, course_limit } = req.body;

    if (!class_id || !subject_id || !course_limit) {
      return res.status(400).json({ 
        message: "Class ID, Subject ID, and Course Limit are required" 
      });
    }

    if (course_limit < 1) {
      return res.status(400).json({ 
        message: "Course limit must be at least 1" 
      });
    }

    // Calculate maximum allowed course limit for this class
    const maxLimit = await calculateMaxCourseLimitPerSubject(class_id);
    
    if (parseInt(course_limit) > maxLimit) {
      const subjectCount = await TeacherSubjectAssignment.distinct('subject_id', { class_id });
      return res.status(400).json({ 
        message: `Course limit cannot exceed ${maxLimit} periods per subject. Maximum allowed: ${maxLimit} (160 periods / ${subjectCount.length} subjects = ${maxLimit} per subject)` 
      });
    }

    // Check if assignment already exists
    let assignment = await TeacherSubjectAssignment.findOne({
      class_id: class_id,
      subject_id: subject_id
    });

    if (assignment) {
      // Update existing assignment
      assignment.course_limit = parseInt(course_limit);
      await assignment.save();
    } else {
      // Get or create unassigned teacher
      const User = (await import('../models/User.js')).default;
      let unassignedTeacher = await User.findOne({ 
        name: "Unassigned", 
        role: "Teacher",
        nic_number: "UNASSIGNED_SYSTEM"
      });
      
      if (!unassignedTeacher) {
        unassignedTeacher = await User.create({
          name: "Unassigned",
          role: "Teacher",
          nic_number: "UNASSIGNED_SYSTEM",
          is_deleted: false
        });
      }
      
      // Create new assignment (without teacher initially)
      assignment = await TeacherSubjectAssignment.create({
        class_id: class_id,
        subject_id: subject_id,
        course_limit: parseInt(course_limit),
        user_id: unassignedTeacher._id
      });
    }

    return res.json({ 
      success: true, 
      message: `Course limit updated successfully. Maximum allowed for this class: ${maxLimit} periods per subject (160 periods / ${await TeacherSubjectAssignment.distinct('subject_id', { class_id }).then(count => count.length)} subjects)`,
      assignment: assignment,
      max_course_limit_per_subject: maxLimit
    });

  } catch (error) {
    console.error('Update course limit error:', error);
    return res.status(500).json({
      message: "Error updating course limit",
      error: error.message
    });
  }
};

/**
 * Get course limit statistics for a term
 */
export const getCourseLimitStats = async (req, res) => {
  try {
    const { term_id } = req.query;

    if (!term_id) {
      return res.status(400).json({ message: "Term ID is required" });
    }

    // Get all classes for this term
    const classes = await Class.find({ term_id: term_id });
    const classIds = classes.map(c => c._id);

    // Get all course limits for classes in this term
    const courseLimits = await TeacherSubjectAssignment.find({ class_id: { $in: classIds } })
      .populate('class_id', 'class_name grade')
      .populate('subject_id', 'subject_name');

    // Calculate statistics
    const stats = {
      totalClasses: await Class.countDocuments({ term_id: term_id }),
      totalSubjects: await Subject.countDocuments(),
      totalCourseLimits: courseLimits.length,
      averageCourseLimit: 0,
      classStats: {},
      subjectStats: {}
    };

    if (courseLimits.length > 0) {
      const totalLimits = courseLimits.reduce((sum, limit) => sum + limit.course_limit, 0);
      stats.averageCourseLimit = Math.round(totalLimits / courseLimits.length);

      // Group by class
      courseLimits.forEach(limit => {
        const classId = limit.class_id._id.toString();
        if (!stats.classStats[classId]) {
          stats.classStats[classId] = {
            class_name: limit.class_id.class_name,
            grade: limit.class_id.grade,
            total_limits: 0,
            subject_count: 0
          };
        }
        stats.classStats[classId].total_limits += limit.course_limit;
        stats.classStats[classId].subject_count += 1;
      });

      // Group by subject
      courseLimits.forEach(limit => {
        const subjectId = limit.subject_id._id.toString();
        if (!stats.subjectStats[subjectId]) {
          stats.subjectStats[subjectId] = {
            subject_name: limit.subject_id.subject_name,
            total_limits: 0,
            class_count: 0
          };
        }
        stats.subjectStats[subjectId].total_limits += limit.course_limit;
        stats.subjectStats[subjectId].class_count += 1;
      });
    }

    return res.json({ success: true, stats: stats });

  } catch (error) {
    console.error('Get course limit stats error:', error);
    return res.status(500).json({
      message: "Error fetching course limit statistics",
      error: error.message
    });
  }
};
