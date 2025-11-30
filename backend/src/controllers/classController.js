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
      .lean()
      .sort({ grade: 1, section: 1 });
    
    // Batch fetch all related data at once
    const classIds = classes.map(c => c._id);
    
    const [allTeacherAssignments, allUserAssignments] = await Promise.all([
      TeacherSubjectAssignment.find({ class_id: { $in: classIds } })
        .populate('user_id', 'name')
        .populate('subject_id', 'subject_name')
        .lean(),
      UserClassAssignment.find({ class_id: { $in: classIds } })
        .populate('user_id', 'name role')
        .lean()
    ]);

    // Create lookup maps
    const teacherAssignmentsMap = new Map();
    const studentsMap = new Map();
    const teachersMap = new Map();
    const classTeacherMap = new Map();

    allTeacherAssignments.forEach(ta => {
      const cid = ta.class_id.toString();
      if (!teacherAssignmentsMap.has(cid)) teacherAssignmentsMap.set(cid, []);
      teacherAssignmentsMap.get(cid).push(ta);
    });

    allUserAssignments.forEach(ua => {
      const cid = ua.class_id.toString();
      if (ua.is_class_teacher) {
        if (!teachersMap.has(cid)) teachersMap.set(cid, []);
        teachersMap.get(cid).push(ua.user_id);
        // Store first class teacher found
        if (!classTeacherMap.has(cid)) {
          classTeacherMap.set(cid, ua);
        }
      } else {
        if (!studentsMap.has(cid)) studentsMap.set(cid, []);
        studentsMap.get(cid).push(ua.user_id);
      }
    });
    
    // Build response efficiently
    const classesWithAssignments = classes.map(classData => {
      const classId = classData._id.toString();
      return {
        ...classData,
        students: (studentsMap.get(classId) || []).filter(s => s !== null && s !== undefined),
        teachers: (teachersMap.get(classId) || []).filter(t => t !== null && t !== undefined),
        class_teacher: classTeacherMap.get(classId) || null,
        teacher_assignments: teacherAssignmentsMap.get(classId) || []
      };
    });
    
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
    const studentAssignments = await UserClassAssignment.find({ 
      class_id: id, 
      is_class_teacher: false 
    }).populate({
      path: 'user_id',
      select: 'name role email'
    });
    
    // Filter out assignments where user_id is null (populate failed or user deleted) 
    // and ensure we only include actual students
    const students = studentAssignments
      .filter(s => s.user_id !== null && s.user_id !== undefined)
      .map(s => s.user_id)
      .filter(user => user.role === 'Student'); // Double-check role is Student

    // Get all teachers assigned to this class
    const teacherAssignmentsForClass = await UserClassAssignment.find({ 
      class_id: id, 
      is_class_teacher: true 
    }).populate({
      path: 'user_id',
      select: 'name role email'
    });

    // Filter out assignments where user_id is null and ensure role is Teacher
    const teachers = teacherAssignmentsForClass
      .filter(t => t.user_id !== null && t.user_id !== undefined)
      .map(t => t.user_id)
      .filter(user => user.role === 'Teacher'); // Double-check role is Teacher

    // Get all subject teacher assignments for this class
    const teacherAssignments = await TeacherSubjectAssignment.find({ class_id: id })
      .populate('user_id', 'name role')
      .populate('subject_id', 'subject_name');

    res.json({
      ...classData.toObject(),
      class_teacher: classTeacher,
      students: students,
      teachers: teachers,
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

    // Check if this class already has a class teacher assigned
    const existingClassTeacherForThisClass = await UserClassAssignment.findOne({
      class_id,
      is_class_teacher: true
    });

    if (existingClassTeacherForThisClass) {
      const existingTeacher = await User.findById(existingClassTeacherForThisClass.user_id);
      const teacherName = existingTeacher?.name || 'Unknown Teacher';
      return res.status(400).json({ 
        message: `This class already has a class teacher assigned (${teacherName}). Please remove the current class teacher before assigning a new one.` 
      });
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

// Helper function to calculate maximum course limit per subject for a class
// Calculate max course limit based on current active term's current month weekdays (Monday-Friday) * 8 periods
const calculateMaxCourseLimitForClass = async (class_id) => {
  try {
    // Get the current active term from the database
    const currentTerm = await Term.findOne({ is_active: true }).sort({ createdAt: -1 });
    
    if (!currentTerm) {
      // Default to 176 if no active term found (22 days * 8 = 176)
      return 176;
    }

    // Step 2: Get the current month (today's month)
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Step 3: Count weekdays (Monday-Friday) in the current month
    let weekdayCount = 0;
    const currentDate = new Date(currentMonth);
    
    while (currentDate <= lastDayOfMonth) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      // Count Monday (1) through Friday (5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        weekdayCount++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Step 4: Multiply by 8 periods per day
    const maxCourseLimit = weekdayCount * 8;
    
    return maxCourseLimit;
  } catch (error) {
    console.error('Error calculating max course limit:', error);
    // Default to 160 periods if calculation fails (20 days * 8 = 160)
    return 160;
  }
};

const calculateMaxCourseLimitPerSubject = async (class_id) => {
  const subjectCount = await TeacherSubjectAssignment.distinct('subject_id', { class_id });
  const numberOfSubjects = subjectCount.length;
  
  if (numberOfSubjects === 0) {
    const maxLimit = await calculateMaxCourseLimitForClass(class_id);
    return maxLimit;
  }
  
  const maxLimit = await calculateMaxCourseLimitForClass(class_id);
  return Math.floor(maxLimit / numberOfSubjects);
};

// Assign Teacher to Subject
// Get all teacher assignments for validation
export const getAllTeacherAssignments = async (req, res) => {
  try {
    const assignments = await TeacherSubjectAssignment.find()
      .populate('user_id', 'name role')
      .populate('subject_id', 'subject_name')
      .populate('class_id', 'class_name grade section');
    
    res.json(assignments);
  } catch (error) {
    console.error("Get all teacher assignments error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const assignTeacherToSubject = async (req, res) => {
  try {
    const { teacher_id, subject_id, class_id, course_limit, religion_type } = req.body;
    
    if (!teacher_id || !subject_id || !class_id) {
      return res.status(400).json({ message: "Teacher ID, Subject ID, and Class ID are required" });
    }

    // Check if teacher exists and has Teacher role
    const teacher = await User.findById(teacher_id);
    if (!teacher || teacher.role !== 'Teacher') {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Check if subject exists
    const subjectData = await Subject.findById(subject_id);
    if (!subjectData) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Check if class exists
    const classData = await Class.findById(class_id);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Validation 1: Check if subject is already assigned to this class (prevent duplicate subject-class)
    // EXCEPTION: Allow multiple teachers for "Religion", "Tamil", and "Sinhala" subjects (for different types)
    const subjectNameLower = subjectData?.subject_name?.toLowerCase().trim() || '';
    const isReligionSubjectCheck = subjectNameLower === 'religion' || subjectNameLower.includes('religion');
    const isTamilSubjectCheck = subjectNameLower === 'tamil' || subjectNameLower.includes('tamil');
    const isSinhalaSubjectCheck = subjectNameLower === 'sinhala' || subjectNameLower.includes('sinhala');
    const isSpecialSubject = isReligionSubjectCheck || isTamilSubjectCheck || isSinhalaSubjectCheck;
    
    if (!isSpecialSubject) {
      // For non-special subjects, check if subject is already assigned to this class
      const existingSubjectAssignment = await TeacherSubjectAssignment.findOne({
        subject_id,
        class_id,
        user_id: { $exists: true, $ne: null } // Only check if teacher is assigned
      });

      if (existingSubjectAssignment) {
        return res.status(400).json({ 
          message: "This subject is already assigned to this class. Please select a different subject." 
        });
      }
    }
    // For Religion, Tamil, and Sinhala subjects, allow multiple teachers (one for each type)

    // Validation 2: Check if teacher is already assigned to this subject-class combination
    const existingAssignmentWithTeacher = await TeacherSubjectAssignment.findOne({
      user_id: teacher_id,
      subject_id,
      class_id
    });

    if (existingAssignmentWithTeacher) {
      return res.status(400).json({ 
        message: "This teacher is already assigned to this subject for this class." 
      });
    }

    // Validation 3: Check if teacher already has 2 different subjects assigned
    const teacherAssignments = await TeacherSubjectAssignment.find({
      user_id: teacher_id
    }).populate('subject_id', '_id subject_name');

    // Get unique subject IDs
    const uniqueSubjectIds = new Set();
    teacherAssignments.forEach(assignment => {
      if (assignment.subject_id && assignment.subject_id._id) {
        uniqueSubjectIds.add(assignment.subject_id._id.toString());
      }
    });

    // Check if the new subject is already in the teacher's assignments
    const isNewSubject = !uniqueSubjectIds.has(subject_id.toString());

    // If it's a new subject and teacher already has 2 subjects, reject
    if (isNewSubject && uniqueSubjectIds.size >= 2) {
      const subjectNames = Array.from(uniqueSubjectIds).map(id => {
        const assignment = teacherAssignments.find(a => 
          a.subject_id && a.subject_id._id.toString() === id
        );
        return assignment?.subject_id?.subject_name || 'Unknown';
      }).join(', ');
      
      return res.status(400).json({ 
        message: `Teacher can only be assigned to maximum 2 different subjects. This teacher is already assigned to: ${subjectNames}. You can assign this teacher to the same subject in a different class, but not to a third different subject.` 
      });
    }

    // All validations passed - validate course limit
    // Course limit is required
    if (course_limit === undefined || course_limit === null) {
      return res.status(400).json({ message: "Course limit is required" });
    }

    const requestedLimit = parseInt(course_limit);
    if (isNaN(requestedLimit) || requestedLimit < 1) {
      return res.status(400).json({ message: "Invalid course limit. Must be a positive number." });
    }

    // Get max course limit for this class based on current month
    const maxCourseLimit = await calculateMaxCourseLimitForClass(class_id);
    
    // Validate: individual subject course limit cannot exceed max
    if (requestedLimit > maxCourseLimit) {
      return res.status(400).json({ 
        message: `Course limit (${requestedLimit}) cannot exceed the maximum allowed (${maxCourseLimit} periods) for this class.` 
      });
    }

    // Get current assignments to calculate total
    const existingAssignments = await TeacherSubjectAssignment.find({ class_id }).populate('subject_id', 'subject_name');
    
    // Helper functions to check if a subject is a special subject (by name)
    const isReligionSubjectByName = (subjectName) => {
      if (!subjectName) return false;
      const name = subjectName.toLowerCase().trim();
      return name === 'religion' || name.includes('religion');
    };
    
    const isTamilSubjectByName = (subjectName) => {
      if (!subjectName) return false;
      const name = subjectName.toLowerCase().trim();
      return name === 'tamil' || name.includes('tamil');
    };
    
    const isSinhalaSubjectByName = (subjectName) => {
      if (!subjectName) return false;
      const name = subjectName.toLowerCase().trim();
      return name === 'sinhala' || name.includes('sinhala');
    };
    
    // Get the subject being assigned
    const assignedSubject = await Subject.findById(subject_id);
    const isNewAssignmentReligion = assignedSubject && isReligionSubjectByName(assignedSubject.subject_name);
    const isNewAssignmentTamil = assignedSubject && isTamilSubjectByName(assignedSubject.subject_name);
    const isNewAssignmentSinhala = assignedSubject && isSinhalaSubjectByName(assignedSubject.subject_name);
    
    // Calculate current total, treating all religion subjects as ONE, and Tamil+Sinhala together as ONE
    // Group special subjects together and count them as one each
    const religionSubjects = new Set();
    const languageSubjects = new Set(); // Tamil and Sinhala together
    let currentTotal = 0;
    let religionTotal = 0;
    let languageTotal = 0; // Shared total for Tamil and Sinhala
    
    for (const assignment of existingAssignments) {
      const subjName = assignment.subject_id?.subject_name;
      if (isReligionSubjectByName(subjName)) {
        // Track religion subjects but only count the maximum course limit once
        religionSubjects.add(subjName);
        religionTotal = Math.max(religionTotal, assignment.course_limit || 0);
      } else if (isTamilSubjectByName(subjName) || isSinhalaSubjectByName(subjName)) {
        // Track Tamil and Sinhala together - only count the maximum course limit once
        languageSubjects.add(subjName);
        languageTotal = Math.max(languageTotal, assignment.course_limit || 0);
      } else {
        // Regular subjects count normally
        currentTotal += (assignment.course_limit || 0);
      }
    }
    
    // Add special subject totals as ONE subject each (only if there are subjects of that type)
    if (religionSubjects.size > 0) {
      currentTotal += religionTotal; // Count all religion subjects as ONE
    }
    if (languageSubjects.size > 0) {
      currentTotal += languageTotal; // Count Tamil and Sinhala together as ONE
    }
    
    // Calculate new total
    let newTotal;
    if (isNewAssignmentReligion) {
      // If assigning a religion subject, check if other religion subjects exist
      if (religionSubjects.size > 0) {
        // Religion subjects already exist - only update if new limit is higher
        const maxReligionLimit = Math.max(religionTotal, requestedLimit);
        newTotal = currentTotal - religionTotal + maxReligionLimit;
      } else {
        // First religion subject, add it as one subject
        newTotal = currentTotal + requestedLimit;
      }
    } else if (isNewAssignmentTamil || isNewAssignmentSinhala) {
      // If assigning Tamil or Sinhala, check if language subjects (Tamil or Sinhala) exist
      if (languageSubjects.size > 0) {
        // Language subjects already exist - only update if new limit is higher
        const maxLanguageLimit = Math.max(languageTotal, requestedLimit);
        newTotal = currentTotal - languageTotal + maxLanguageLimit;
      } else {
        // First language subject (Tamil or Sinhala), add it as one subject
        newTotal = currentTotal + requestedLimit;
      }
    } else {
      // Regular subject, add normally
      newTotal = currentTotal + requestedLimit;
    }
    
    // Validate: total course limits cannot exceed max
    if (newTotal > maxCourseLimit) {
      const remaining = maxCourseLimit - currentTotal;
      let specialNote = '';
      if (isNewAssignmentReligion && religionSubjects.size > 0) {
        specialNote = ' Note: All religion assignments count as 1 subject and share the same course limit.';
      } else if ((isNewAssignmentTamil || isNewAssignmentSinhala) && languageSubjects.size > 0) {
        specialNote = ' Note: Tamil and Sinhala assignments count as 1 subject together and share the same course limit.';
      }
      return res.status(400).json({ 
        message: `Total course limits would exceed ${maxCourseLimit} periods. Current total: ${currentTotal}, Remaining available: ${remaining} periods. Please reduce the course limit.${specialNote}` 
      });
    }

    // Create new assignment with the exact course limit set by admin (no auto-calculation)
    const assignment = await TeacherSubjectAssignment.create({
      user_id: teacher_id,
      subject_id,
      class_id,
      course_limit: requestedLimit
    });

    // Get all assignments to calculate total
    const allAssignments = await TeacherSubjectAssignment.find({ class_id });
    const totalCourseLimits = allAssignments.reduce((sum, a) => sum + (a.course_limit || 0), 0);
    
    // Get max course limit for response
    const maxCourseLimitForResponse = await calculateMaxCourseLimitForClass(class_id);

    const populatedAssignment = await TeacherSubjectAssignment.findById(assignment._id)
      .populate('user_id', 'name role')
      .populate('subject_id', 'subject_name')
      .populate('class_id', 'class_name grade section');

    // Calculate display total (treating religion subjects as one, and Tamil+Sinhala together as one)
    const displayAssignments = await TeacherSubjectAssignment.find({ class_id }).populate('subject_id', 'subject_name');
    const isReligionSubjectForDisplay = (subjectName) => {
      if (!subjectName) return false;
      const name = subjectName.toLowerCase().trim();
      return name === 'hinduism' || name === 'christianity' || name === 'muslim' || name === 'islam' || name === 'buddhism';
    };
    
    const isLanguageSubjectForDisplay = (subjectName) => {
      if (!subjectName) return false;
      const name = subjectName.toLowerCase().trim();
      return name === 'tamil' || name.includes('tamil') || name === 'sinhala' || name.includes('sinhala');
    };
    
    const displayReligionSubjects = new Set();
    const displayLanguageSubjects = new Set();
    let displayTotal = 0;
    let displayReligionTotal = 0;
    let displayLanguageTotal = 0;
    
    for (const a of displayAssignments) {
      const subjName = a.subject_id?.subject_name;
      if (isReligionSubjectForDisplay(subjName)) {
        displayReligionSubjects.add(subjName);
        displayReligionTotal = Math.max(displayReligionTotal, a.course_limit || 0);
      } else if (isLanguageSubjectForDisplay(subjName)) {
        displayLanguageSubjects.add(subjName);
        displayLanguageTotal = Math.max(displayLanguageTotal, a.course_limit || 0);
      } else {
        displayTotal += (a.course_limit || 0);
      }
    }
    
    if (displayReligionSubjects.size > 0) {
      displayTotal += displayReligionTotal;
    }
    if (displayLanguageSubjects.size > 0) {
      displayTotal += displayLanguageTotal;
    }
    
    let specialNote = '';
    if (isNewAssignmentReligion && displayReligionSubjects.size > 0) {
      specialNote = ' (Religion subjects counted as 1 subject)';
    } else if ((isNewAssignmentTamil || isNewAssignmentSinhala) && displayLanguageSubjects.size > 0) {
      specialNote = ' (Tamil and Sinhala counted as 1 subject together)';
    }
    
    res.status(201).json({
      message: `Teacher assigned to subject successfully. Course limit set to ${requestedLimit} periods. Total course limits: ${displayTotal}/${maxCourseLimitForResponse} periods${specialNote}.`,
      assignment: populatedAssignment,
      total_course_limits: displayTotal,
      max_total_allowed: maxCourseLimitForResponse
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
    
    const courseLimitValue = parseInt(course_limit);
    
    // Validate course limit is a positive number
    if (isNaN(courseLimitValue) || courseLimitValue < 1) {
      return res.status(400).json({ message: "Course limit must be a positive number" });
    }

    const assignment = await TeacherSubjectAssignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Get all assignments for this class to calculate total
    const allAssignments = await TeacherSubjectAssignment.find({ 
      class_id: assignment.class_id 
    }).populate('subject_id', 'subject_name');
    
    // Helper functions to check if a subject is a special subject (by name)
    const isReligionSubjectByNameUpdate = (subjectName) => {
      if (!subjectName) return false;
      const name = subjectName.toLowerCase().trim();
      return name === 'religion' || name.includes('religion');
    };
    
    const isTamilSubjectByNameUpdate = (subjectName) => {
      if (!subjectName) return false;
      const name = subjectName.toLowerCase().trim();
      return name === 'tamil' || name.includes('tamil');
    };
    
    const isSinhalaSubjectByNameUpdate = (subjectName) => {
      if (!subjectName) return false;
      const name = subjectName.toLowerCase().trim();
      return name === 'sinhala' || name.includes('sinhala');
    };
    
    // Get the subject being updated
    const updatedSubject = await Subject.findById(assignment.subject_id);
    const isUpdatedSubjectReligion = updatedSubject && isReligionSubjectByNameUpdate(updatedSubject.subject_name);
    const isUpdatedSubjectTamil = updatedSubject && isTamilSubjectByNameUpdate(updatedSubject.subject_name);
    const isUpdatedSubjectSinhala = updatedSubject && isSinhalaSubjectByNameUpdate(updatedSubject.subject_name);
    
    // Calculate current total, treating all religion subjects as ONE, and Tamil+Sinhala together as ONE
    const religionSubjects = new Set();
    const languageSubjects = new Set(); // Tamil and Sinhala together
    let currentTotal = 0;
    let religionTotal = 0;
    let languageTotal = 0;
    
    for (const a of allAssignments) {
      if (a._id.toString() === id.toString()) {
        continue; // Skip the assignment being updated
      }
      
      const subjName = a.subject_id?.subject_name;
      if (isReligionSubjectByNameUpdate(subjName)) {
        religionSubjects.add(subjName);
        religionTotal = Math.max(religionTotal, a.course_limit || 0);
      } else if (isTamilSubjectByNameUpdate(subjName) || isSinhalaSubjectByNameUpdate(subjName)) {
        languageSubjects.add(subjName);
        languageTotal = Math.max(languageTotal, a.course_limit || 0);
      } else {
        currentTotal += (a.course_limit || 0);
      }
    }
    
    // Add special subject totals as ONE subject each
    if (religionSubjects.size > 0) {
      currentTotal += religionTotal;
    }
    if (languageSubjects.size > 0) {
      currentTotal += languageTotal;
    }
    
    // Get max course limit for this class
    const maxCourseLimit = await calculateMaxCourseLimitForClass(assignment.class_id);
    
    // Calculate new total
    let newTotal;
    if (isUpdatedSubjectReligion) {
      // If updating a religion subject, check if other religion subjects exist
      if (religionSubjects.size > 0) {
        newTotal = currentTotal - religionTotal + Math.max(religionTotal, courseLimitValue);
      } else {
        newTotal = currentTotal + courseLimitValue;
      }
    } else if (isUpdatedSubjectTamil || isUpdatedSubjectSinhala) {
      // If updating Tamil or Sinhala, check if language subjects exist
      if (languageSubjects.size > 0) {
        newTotal = currentTotal - languageTotal + Math.max(languageTotal, courseLimitValue);
      } else {
        newTotal = currentTotal + courseLimitValue;
      }
    } else {
      newTotal = currentTotal + courseLimitValue;
    }
    
    // Validate: total course limits cannot exceed max
    if (newTotal > maxCourseLimit) {
      const remaining = maxCourseLimit - currentTotal;
      return res.status(400).json({ 
        message: `Total course limits would exceed ${maxCourseLimit} periods. Current total (excluding this subject): ${currentTotal}, Remaining available: ${remaining} periods. Please reduce the course limit.` 
      });
    }

    assignment.course_limit = courseLimitValue;
    await assignment.save();

    const populatedAssignment = await TeacherSubjectAssignment.findById(id)
      .populate('user_id', 'name role')
      .populate('subject_id', 'subject_name')
      .populate('class_id', 'class_name grade section');

    res.json({
      message: `Course limit updated successfully. Course limit set to ${courseLimitValue} periods. Total course limits: ${newTotal}/${maxCourseLimit} periods.`,
      assignment: populatedAssignment,
      total_course_limits: newTotal,
      max_total_allowed: maxCourseLimit
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