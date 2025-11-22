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
    const classes = await Class.find({ term_id: term_id });

    // Get course limits for this subject
    const courseLimits = await TeacherSubjectAssignment.find({
      subject_id: subject_id,
      term_id: term_id
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

/**
 * Update course limit for a specific class and subject
 */
export const updateCourseLimit = async (req, res) => {
  try {
    const { class_id, subject_id, term_id, course_limit } = req.body;

    if (!class_id || !subject_id || !term_id || !course_limit) {
      return res.status(400).json({ 
        message: "Class ID, Subject ID, Term ID, and Course Limit are required" 
      });
    }

    if (course_limit < 1 || course_limit > 50) {
      return res.status(400).json({ 
        message: "Course limit must be between 1 and 50" 
      });
    }

    // Check if assignment already exists
    let assignment = await TeacherSubjectAssignment.findOne({
      class_id: class_id,
      subject_id: subject_id,
      term_id: term_id
    });

    if (assignment) {
      // Update existing assignment
      assignment.course_limit = course_limit;
      await assignment.save();
    } else {
      // Create new assignment (without teacher initially)
      assignment = await TeacherSubjectAssignment.create({
        class_id: class_id,
        subject_id: subject_id,
        term_id: term_id,
        course_limit: course_limit,
        user_id: null // Will be assigned when teacher is assigned
      });
    }

    return res.json({ 
      success: true, 
      message: "Course limit updated successfully",
      assignment: assignment
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

    // Get all course limits for this term
    const courseLimits = await TeacherSubjectAssignment.find({ term_id: term_id })
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
