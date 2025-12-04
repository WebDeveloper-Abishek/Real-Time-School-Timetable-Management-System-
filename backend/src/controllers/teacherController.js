import TeacherSubjectAssignment from "../models/TeacherSubjectAssignment.js";
import UserClassAssignment from "../models/UserClassAssignment.js";
import User from "../models/User.js";

// Get teacher's assigned classes
export const getTeacherClasses = async (req, res) => {
  try {
    const { teacher_id } = req.query;
    // Support both query param and authenticated user
    const teacherId = teacher_id || req.user?.id || req.user?._id;

    if (!teacherId) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    // Get all teacher-subject-class assignments for this teacher
    const assignments = await TeacherSubjectAssignment.find({ user_id: teacherId })
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

    // Group assignments by class to avoid duplicates
    const classMap = new Map();

    for (const assignment of assignments) {
      const classId = assignment.class_id._id.toString();
      const className = assignment.class_id.class_name;
      const subjectName = assignment.subject_id.subject_name;

      if (!classMap.has(classId)) {
        // Count students in this class
        const studentCount = await UserClassAssignment.countDocuments({ 
          class_id: classId 
        });

        classMap.set(classId, {
          _id: assignment.class_id._id,
          class_name: className,
          grade: assignment.class_id.grade,
          section: assignment.class_id.section,
          term: assignment.class_id.term_id,
          students: studentCount,
          subjects: [subjectName] // Array to store all subjects for this class
        });
      } else {
        // Add subject to existing class if not already present
        const classData = classMap.get(classId);
        if (!classData.subjects.includes(subjectName)) {
          classData.subjects.push(subjectName);
        }
      }
    }

    // Convert map to array and format the response
    const classes = Array.from(classMap.values()).map(classData => ({
      id: classData._id,
      class_name: classData.class_name,
      grade: classData.grade,
      section: classData.section,
      subjects: classData.subjects.join(', '), // Combine all subjects
      students: classData.students,
      term: classData.term
    }));

    res.json(classes);

  } catch (error) {
    console.error('Error getting teacher classes:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get classes where teacher is assigned as class teacher
export const getTeacherClassTeacherClasses = async (req, res) => {
  try {
    const { teacher_id } = req.query;
    const teacherId = teacher_id || req.user?.id || req.user?._id;

    if (!teacherId) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    // Get all classes where this teacher is the class teacher
    const classTeacherAssignments = await UserClassAssignment.find({ 
      user_id: teacherId,
      is_class_teacher: true 
    })
      .populate('class_id', 'class_name grade section term_id')
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
      .sort({ 'class_id.class_name': 1 });

    // Format the response
    const classes = classTeacherAssignments.map(assignment => {
      if (!assignment.class_id) return null;
      
      return {
        id: assignment.class_id._id,
        class_name: assignment.class_id.class_name,
        grade: assignment.class_id.grade,
        section: assignment.class_id.section,
        term: assignment.class_id.term_id
      };
    }).filter(Boolean);

    res.json(classes);

  } catch (error) {
    console.error('Error getting teacher class teacher classes:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get students in a class (for class teacher to mark attendance)
export const getClassStudents = async (req, res) => {
  try {
    const { class_id, teacher_id } = req.query;
    const teacherId = teacher_id || req.user?.id || req.user?._id;

    if (!class_id) {
      return res.status(400).json({ message: "Class ID is required" });
    }

    if (!teacherId) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    // Verify that this teacher is the class teacher for this class
    const classTeacherAssignment = await UserClassAssignment.findOne({
      user_id: teacherId,
      class_id: class_id,
      is_class_teacher: true
    });

    if (!classTeacherAssignment) {
      return res.status(403).json({ 
        message: "You are not authorized to view students for this class. Only the class teacher can access this." 
      });
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

    // Filter out null users (in case role check failed) and format students
    const validStudents = studentAssignments
      .filter(assignment => assignment.user_id !== null)
      .map((assignment, index) => {
        return {
          id: assignment.user_id._id,
          name: assignment.user_id.name,
          rollNumber: String(index + 1).padStart(3, '0') // Sequential number as roll number
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

    res.json(validStudents);

  } catch (error) {
    console.error('Error getting class students:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

