import mongoose from "mongoose";
import Class from "../models/Class.js";
import Term from "../models/Term.js";
import UserClassAssignment from "../models/UserClassAssignment.js";
import TeacherSubjectAssignment from "../models/TeacherSubjectAssignment.js";
import User from "../models/User.js";
import Subject from "../models/Subject.js";
import Notification from "../models/Notification.js";

// Helper function to create class creation notification
const createClassCreationNotification = async (className, grade, section, termName, adminName, action = 'created') => {
  try {
    // Get all active users
    const users = await User.find({ is_deleted: { $ne: true } }, '_id');
    
    if (users.length === 0) return;

    const actionText = action === 'created' ? 'created' : action === 'updated' ? 'updated' : 'deleted';
    const titleText = action === 'created' ? 'New Class Created' : action === 'updated' ? 'Class Updated' : 'Class Deleted';

    const notifications = users.map(user => ({
      user_id: user._id,
      title: titleText,
      body: `Class "${className}" (Grade ${grade}, Section ${section})${termName ? ` for ${termName}` : ''} has been ${actionText} by ${adminName}.`,
      type: 'info',
      priority: 'medium',
      category: 'academic',
      is_system: true,
      metadata: {
        action: `class_${action}`,
        class_name: className,
        grade: grade,
        section: section,
        term_name: termName,
        admin_name: adminName,
        system_wide: true,
        created_at: new Date()
      }
    }));

    await Notification.insertMany(notifications);
    console.log(`Class ${action} notification created for ${users.length} users`);
  } catch (error) {
    console.error(`Error creating class ${action} notification:`, error);
  }
};

// Class CRUD Operations
export const createClass = async (req, res) => {
  try {
    const { term_id, grade, section, class_name } = req.body;
    
    if (!term_id || !grade || !section || !class_name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if term exists and populate academic year
    const term = await Term.findById(term_id).populate('academic_year_id', 'year_label');
    if (!term) {
      return res.status(404).json({ message: "Term not found" });
    }

    // Check if class already exists for this term
    const existingClass = await Class.findOne({ 
      term_id, 
      class_name 
    });
    if (existingClass) {
      return res.status(400).json({ message: "Class already exists for this term" });
    }

    const newClass = await Class.create({ 
      term_id, 
      grade, 
      section, 
      class_name 
    });

    // Get admin name from request (assuming it's passed in the request)
    const adminName = req.user?.name || 'System Administrator';
    
    // Create term display name
    const termNames = {
      1: 'First Term',
      2: 'Second Term', 
      3: 'Third Term'
    };
    const termNumber = term.term_number;
    const yearLabel = term.academic_year_id?.year_label || 'Unknown Year';
    const termDisplayName = `${termNames[termNumber] || `Term ${termNumber}`} - ${yearLabel}`;

    // Create notification for class creation
    await createClassCreationNotification(class_name, grade, section, termDisplayName, adminName);

    res.status(201).json({
      message: "Class created successfully",
      class: newClass
    });
  } catch (error) {
    console.error("Create class error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getClasses = async (req, res) => {
  try {
    const { term_id } = req.query;
    const filter = {};
    
    if (term_id) {
      if (!mongoose.Types.ObjectId.isValid(term_id)) {
        return res.status(400).json({ message: "Invalid term ID" });
      }
      filter.term_id = term_id;
    }
    
    const classes = await Class.find(filter)
      .populate('term_id', 'term_number academic_year_id')
      .populate({
        path: 'term_id',
        populate: {
          path: 'academic_year_id',
          select: 'year_label'
        }
      })
      .sort({ grade: 1, section: 1 });
    
    
    // Get teacher assignments, students, and teachers for each class
    const classesWithAssignments = await Promise.all(
      classes.map(async (classData) => {
        const teacherAssignments = await TeacherSubjectAssignment.find({ class_id: classData._id })
          .populate('user_id', 'name')
          .populate('subject_id', 'subject_name');
        
        const students = await UserClassAssignment.find({ 
          class_id: classData._id, 
          is_class_teacher: false 
        }).populate('user_id', 'name role');

        const teachers = await UserClassAssignment.find({ 
          class_id: classData._id, 
          is_class_teacher: true 
        }).populate('user_id', 'name role');

        const classTeacher = await UserClassAssignment.findOne({ 
          class_id: classData._id, 
          is_class_teacher: true 
        }).populate('user_id', 'name role');
        
        return {
          ...classData.toObject(),
          students: students.map(s => s.user_id),
          teachers: teachers.map(t => t.user_id),
          class_teacher: classTeacher,
          teacher_assignments: teacherAssignments
        };
      })
    );
    
    res.json(classesWithAssignments);
  } catch (error) {
    console.error("Get classes error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getClass = async (req, res) => {
  try {
    const { id } = req.params;
    const classData = await Class.findById(id)
      .populate('term_id', 'term_number academic_year_id')
      .populate({
        path: 'term_id',
        populate: {
          path: 'academic_year_id',
          select: 'year_label'
        }
      });
    
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Get class teacher
    const classTeacher = await UserClassAssignment.findOne({ 
      class_id: id, 
      is_class_teacher: true 
    }).populate('user_id', 'name role');

    // Get all students assigned to this class
    const students = await UserClassAssignment.find({ 
      class_id: id, 
      is_class_teacher: false 
    }).populate('user_id', 'name role');

    // Get all teachers assigned to this class
    const teachers = await UserClassAssignment.find({ 
      class_id: id, 
      is_class_teacher: true 
    }).populate('user_id', 'name role');

    // Get all subject teacher assignments for this class
    const teacherAssignments = await TeacherSubjectAssignment.find({ class_id: id })
      .populate('user_id', 'name role')
      .populate('subject_id', 'subject_name');

    res.json({
      ...classData.toObject(),
      class_teacher: classTeacher,
      students: students.map(s => s.user_id),
      teachers: teachers.map(t => t.user_id),
      teacher_assignments: teacherAssignments
    });
  } catch (error) {
    console.error("Get class error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { term_id, grade, section, class_name } = req.body;

    const classData = await Class.findById(id);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // If term_id is being changed, validate it exists
    if (term_id && term_id !== classData.term_id.toString()) {
      const term = await Term.findById(term_id);
      if (!term) {
        return res.status(404).json({ message: "Term not found" });
      }
    }

    // Check for duplicate class name if changing
    if (class_name && class_name !== classData.class_name) {
      const checkTermId = term_id || classData.term_id;
      const existingClass = await Class.findOne({
        term_id: checkTermId,
        class_name,
        _id: { $ne: id }
      });
      if (existingClass) {
        return res.status(400).json({ message: "Class name already exists for this term" });
      }
    }

    // Update fields
    if (term_id) classData.term_id = term_id;
    if (grade) classData.grade = grade;
    if (section) classData.section = section;
    if (class_name) classData.class_name = class_name;

    await classData.save();

    // Populate the updated class data before sending response
    const updatedClass = await Class.findById(classData._id)
      .populate('term_id', 'term_number academic_year_id')
      .populate({
        path: 'term_id',
        populate: {
          path: 'academic_year_id',
          select: 'year_label'
        }
      });

    // Get admin name from request
    const adminName = req.user?.name || 'System Administrator';
    
    // Get term display name for notification
    let termDisplayName = 'Unknown Term';
    if (updatedClass.term_id) {
      const termNames = {
        1: 'First Term',
        2: 'Second Term', 
        3: 'Third Term'
      };
      const termNumber = updatedClass.term_id.term_number;
      const yearLabel = updatedClass.term_id.academic_year_id?.year_label || 'Unknown Year';
      termDisplayName = `${termNames[termNumber] || `Term ${termNumber}`} - ${yearLabel}`;
    }

    // Create notification for class update
    await createClassCreationNotification(classData.class_name, classData.grade, classData.section, termDisplayName, adminName, 'updated');

    res.json({
      message: "Class updated successfully",
      class: updatedClass
    });
  } catch (error) {
    console.error("Update class error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    const classData = await Class.findById(id).populate('term_id', 'term_number academic_year_id').populate('term_id.academic_year_id', 'year_label');
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Get admin name from request
    const adminName = req.user?.name || 'System Administrator';

    // Get term display name for notification
    let termDisplayName = 'Unknown Term';
    if (classData.term_id) {
      const termNames = {
        1: 'First Term',
        2: 'Second Term', 
        3: 'Third Term'
      };
      const termNumber = classData.term_id.term_number;
      const yearLabel = classData.term_id.academic_year_id?.year_label || 'Unknown Year';
      termDisplayName = `${termNames[termNumber] || `Term ${termNumber}`} - ${yearLabel}`;
    }

    // Delete all related assignments
    await UserClassAssignment.deleteMany({ class_id: id });
    await TeacherSubjectAssignment.deleteMany({ class_id: id });

    // Delete the class
    await Class.findByIdAndDelete(id);

    // Create notification for class deletion
    await createClassCreationNotification(classData.class_name, classData.grade, classData.section, termDisplayName, adminName, 'deleted');

    res.json({
      message: "Class and all related assignments deleted successfully"
    });
  } catch (error) {
    console.error("Delete class error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Assign Class Teacher
export const assignClassTeacher = async (req, res) => {
  try {
    const { class_id, teacher_id } = req.body;
    
    if (!class_id || !teacher_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if class exists
    const classData = await Class.findById(class_id);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Check if teacher exists and has Teacher role
    const teacher = await User.findById(teacher_id);
    if (!teacher || teacher.role !== 'Teacher') {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Check if teacher is already a class teacher for another class
    const existingClassTeacherAssignment = await UserClassAssignment.findOne({
      user_id: teacher_id,
      is_class_teacher: true,
      class_id: { $ne: class_id }
    });

    if (existingClassTeacherAssignment) {
      return res.status(400).json({ message: "Teacher is already assigned as class teacher to another class. Please remove them from their current class first." });
    }

    // Remove existing class teacher for this class
    await UserClassAssignment.updateMany(
      { class_id, is_class_teacher: true },
      { is_class_teacher: false }
    );

    // Create or update assignment
    const assignment = await UserClassAssignment.findOneAndUpdate(
      { user_id: teacher_id, class_id },
      { is_class_teacher: true },
      { upsert: true, new: true }
    ).populate('user_id', 'name role');

    res.json({
      message: "Class teacher assigned successfully",
      assignment
    });
  } catch (error) {
    console.error("Assign class teacher error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Assign Teacher to Subject
export const assignTeacherToSubject = async (req, res) => {
  try {
    const { teacher_id, subject_id, class_id, course_limit } = req.body;
    
    if (!teacher_id || !subject_id || !class_id || !course_limit) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if teacher exists and has Teacher role
    const teacher = await User.findById(teacher_id);
    if (!teacher || teacher.role !== 'Teacher') {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Check if subject exists
    const subject = await Subject.findById(subject_id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Check if class exists
    const classData = await Class.findById(class_id);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Check if assignment already exists
    const existingAssignment = await TeacherSubjectAssignment.findOne({
      user_id: teacher_id,
      subject_id,
      class_id
    });

    if (existingAssignment) {
      return res.status(400).json({ message: "Teacher is already assigned to this subject for this class" });
    }

    // Get the class with term information
    const classWithTerm = await Class.findById(class_id).populate('term_id');
    const currentTerm = classWithTerm.term_id;

    // Check if this subject was assigned to this teacher in previous terms of the same academic year
    const previousAssignments = await TeacherSubjectAssignment.find({
      user_id: teacher_id,
      subject_id,
      'class_id': { $ne: class_id }
    }).populate({
      path: 'class_id',
      populate: {
        path: 'term_id',
        populate: {
          path: 'academic_year_id'
        }
      }
    });

    // Find assignments from previous terms in the same academic year
    const sameYearAssignments = previousAssignments.filter(assignment => 
      assignment.class_id.term_id.academic_year_id._id.toString() === 
      currentTerm.academic_year_id.toString()
    );

    let finalCourseLimit = parseInt(course_limit);

    if (sameYearAssignments.length > 0) {
      // Add remaining course limits from previous terms
      const totalPreviousLimit = sameYearAssignments.reduce((sum, assignment) => {
        return sum + (assignment.course_limit || 0);
      }, 0);
      
      finalCourseLimit = totalPreviousLimit + parseInt(course_limit);
    }

    const assignment = await TeacherSubjectAssignment.create({
      user_id: teacher_id,
      subject_id,
      class_id,
      course_limit: finalCourseLimit
    });

    const populatedAssignment = await TeacherSubjectAssignment.findById(assignment._id)
      .populate('user_id', 'name role')
      .populate('subject_id', 'subject_name')
      .populate('class_id', 'class_name grade section');

    res.status(201).json({
      message: "Teacher assigned to subject successfully",
      assignment: populatedAssignment
    });
  } catch (error) {
    console.error("Assign teacher to subject error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Teachers for Class
export const getClassTeachers = async (req, res) => {
  try {
    const { class_id } = req.params;
    
    const assignments = await TeacherSubjectAssignment.find({ class_id })
      .populate('user_id', 'name role')
      .populate('subject_id', 'subject_name')
      .populate('class_id', 'class_name grade section');

    res.json(assignments);
  } catch (error) {
    console.error("Get class teachers error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Course Limit
export const updateCourseLimit = async (req, res) => {
  try {
    const { id } = req.params;
    const { course_limit } = req.body;
    
    if (!course_limit || course_limit < 1) {
      return res.status(400).json({ message: "Course limit must be at least 1" });
    }

    const assignment = await TeacherSubjectAssignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    assignment.course_limit = course_limit;
    await assignment.save();

    const populatedAssignment = await TeacherSubjectAssignment.findById(id)
      .populate('user_id', 'name role')
      .populate('subject_id', 'subject_name')
      .populate('class_id', 'class_name grade section');

    res.json({
      message: "Course limit updated successfully",
      assignment: populatedAssignment
    });
  } catch (error) {
    console.error("Update course limit error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Teacher Assignment
export const updateTeacherAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher_id, course_limit } = req.body;
    
    if (!teacher_id || !course_limit || course_limit < 1) {
      return res.status(400).json({ message: "Teacher ID and course limit are required" });
    }

    const assignment = await TeacherSubjectAssignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Check if teacher exists
    const teacher = await User.findById(teacher_id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    assignment.user_id = teacher_id;
    assignment.course_limit = course_limit;
    await assignment.save();

    const populatedAssignment = await TeacherSubjectAssignment.findById(id)
      .populate('user_id', 'name role')
      .populate('subject_id', 'subject_name')
      .populate('class_id', 'class_name grade section');

    res.json({
      message: "Assignment updated successfully",
      assignment: populatedAssignment
    });
  } catch (error) {
    console.error("Update teacher assignment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Student Assignment Functions
export const assignStudentToClass = async (req, res) => {
  try {
    const { class_id, student_id } = req.body;
    
    if (!class_id || !student_id) {
      return res.status(400).json({ message: "Class ID and Student ID are required" });
    }

    // Check if student exists
    const student = await User.findById(student_id);
    if (!student || student.role !== 'Student') {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if class exists
    const classData = await Class.findById(class_id);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Check if student is already assigned to any class
    const existingAssignment = await UserClassAssignment.findOne({
      user_id: student_id,
      is_class_teacher: false
    });

    if (existingAssignment) {
      return res.status(400).json({ message: "Student is already assigned to a class. Please remove them from their current class first." });
    }

    const assignment = await UserClassAssignment.create({
      user_id: student_id,
      class_id: class_id,
      is_class_teacher: false
    });

    const populatedAssignment = await UserClassAssignment.findById(assignment._id)
      .populate('user_id', 'name role')
      .populate('class_id', 'class_name grade section');

    res.status(201).json({
      message: "Student assigned to class successfully",
      assignment: populatedAssignment
    });
  } catch (error) {
    console.error("Assign student to class error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const removeStudentFromClass = async (req, res) => {
  try {
    const { class_id, student_id } = req.body;
    
    if (!class_id || !student_id) {
      return res.status(400).json({ message: "Class ID and Student ID are required" });
    }

    const assignment = await UserClassAssignment.findOneAndDelete({
      user_id: student_id,
      class_id: class_id,
      is_class_teacher: false
    });

    if (!assignment) {
      return res.status(404).json({ message: "Student assignment not found" });
    }

    res.json({
      message: "Student removed from class successfully"
    });
  } catch (error) {
    console.error("Remove student from class error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const removeTeacherFromClass = async (req, res) => {
  try {
    const { class_id, teacher_id } = req.body;
    
    if (!class_id || !teacher_id) {
      return res.status(400).json({ message: "Class ID and Teacher ID are required" });
    }

    const assignment = await UserClassAssignment.findOneAndDelete({
      user_id: teacher_id,
      class_id: class_id,
      is_class_teacher: true
    });

    if (!assignment) {
      return res.status(404).json({ message: "Teacher assignment not found" });
    }

    res.json({
      message: "Teacher removed from class successfully"
    });
  } catch (error) {
    console.error("Remove teacher from class error:", error);
    res.status(500).json({ message: "Server error" });
  }
};