import mongoose from "mongoose";
import Subject from "../models/Subject.js";
import TeacherSubjectAssignment from "../models/TeacherSubjectAssignment.js";
import Class from "../models/Class.js";
import User from "../models/User.js";
import Term from "../models/Term.js";
import Notification from "../models/Notification.js";

// Helper function to create subject notification
const createSubjectNotification = async (subjectName, courseLimit, termName, adminName, action = 'created') => {
  try {
    // Get all active users
    const users = await User.find({ is_deleted: { $ne: true } }, '_id');
    
    if (users.length === 0) return;

    const notifications = users.map(user => ({
      user_id: user._id,
      title: `Subject ${action === 'created' ? 'Created' : action === 'updated' ? 'Updated' : 'Deleted'}`,
      body: `Subject "${subjectName}" (${courseLimit} periods)${termName ? ` for ${termName}` : ''} has been ${action} by ${adminName}.`,
      type: 'academic',
      priority: 'medium',
      category: 'academic',
      is_system: true,
      metadata: {
        action: `subject_${action}`,
        subject_name: subjectName,
        course_limit: courseLimit,
        term_name: termName,
        admin_name: adminName,
        system_wide: true,
        created_at: new Date()
      }
    }));

    await Notification.insertMany(notifications);
  } catch (error) {
    console.error(`Error creating subject ${action} notification:`, error);
  }
};

// Create Subject
export const createSubject = async (req, res) => {
  try {
    const { subject_name, course_limit, class_assignments } = req.body;
    
    // Validation
    if (!subject_name || !subject_name.trim()) {
      return res.status(400).json({ message: "Subject name is required" });
    }

    // Check for duplicate subject name (case-insensitive)
    const existingSubject = await Subject.findOne({ 
      subject_name: { $regex: new RegExp(`^${subject_name.trim()}$`, 'i') }
    });
    
    if (existingSubject) {
      return res.status(400).json({ message: "Subject with this name already exists" });
    }

    // Auto-assign to current active term
    const currentTerm = await Term.findOne({ is_active: true })
      .sort({ 'academic_year_id': -1, term_number: -1 })
      .populate('academic_year_id', 'year_label');
    
    if (!currentTerm) {
      return res.status(400).json({ 
        message: "No active term found. Please create an active term first." 
      });
    }

    // Set default course_limit if not provided (will be overridden by class assignments)
    const defaultCourseLimit = course_limit ? parseInt(course_limit) : 1;
    
    // Validate course limit is between 0 and 50
    if (isNaN(defaultCourseLimit) || defaultCourseLimit < 0 || defaultCourseLimit > 50) {
      return res.status(400).json({ message: "Course limit must be between 0 and 50" });
    }

    // Create subject assigned to current term
    const subjectData = {
      subject_name: subject_name.trim(),
      course_limit: defaultCourseLimit, // Default/fallback limit
      term_id: currentTerm._id,
      is_active: true
    };
    
    const subject = await Subject.create(subjectData);
    
    // Process class assignments if provided (store for later teacher assignment)
    const classAssignmentResults = [];
    if (class_assignments && Array.isArray(class_assignments) && class_assignments.length > 0) {
      // Store class-course_limit mappings (will be used when teachers are assigned)
      // For now, we'll store them in a temporary structure or prepare them
      for (const assignment of class_assignments) {
        const { class_id, course_limit: classCourseLimit } = assignment;
        
        // Validate class_id
        if (!class_id || !mongoose.Types.ObjectId.isValid(class_id)) {
          continue;
        }
        
        // Validate class exists
        const classExists = await Class.findById(class_id);
        if (!classExists) {
          continue;
        }
        
        // Validate course_limit
        const limit = classCourseLimit ? parseInt(classCourseLimit) : defaultCourseLimit;
        if (isNaN(limit) || limit < 0 || limit > 50) {
          continue;
        }
        
        classAssignmentResults.push({
          class_id: class_id,
          course_limit: limit,
          class_name: classExists.class_name
        });
      }
    }
    
    // Populate the subject with term data for response
    const populatedSubject = await Subject.findById(subject._id)
      .populate({
        path: 'term_id',
        select: 'academic_year_id term_number start_date end_date',
        populate: {
          path: 'academic_year_id',
          select: 'year_label'
        }
      });
    
    // Get admin name from request
    const adminName = req.user?.name || 'System Administrator';
    
    // Get term display name for notification
    const termNames = {
      1: 'First Term',
      2: 'Second Term', 
      3: 'Third Term'
    };
    const termNumber = currentTerm.term_number;
    const yearLabel = currentTerm.academic_year_id?.year_label || 'Unknown Year';
    const termDisplayName = `${termNames[termNumber] || `Term ${termNumber}`} - ${yearLabel}`;

    // Create notification for subject creation
    await createSubjectNotification(subject_name.trim(), defaultCourseLimit, termDisplayName, adminName, 'created');
    
    res.status(201).json({
      message: "Subject created successfully",
      subject: populatedSubject,
      class_assignments_prepared: classAssignmentResults // Class-course_limit mappings for teacher assignment
    });
  } catch (error) {
    console.error("Create subject error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

// Get Subjects with filtering
export const getSubjects = async (req, res) => {
  try {
    const { term_id, academic_year_id } = req.query;
    
    // Build query
    let query = {};
    
    // Handle term and academic year filtering
    if (term_id && academic_year_id) {
      // Both filters: subjects assigned to specific term in specific academic year
      if (!mongoose.Types.ObjectId.isValid(term_id) || !mongoose.Types.ObjectId.isValid(academic_year_id)) {
        return res.status(400).json({ message: "Invalid term or academic year ID" });
      }
      
      // Verify term belongs to academic year
      const term = await Term.findOne({ 
        _id: term_id, 
        academic_year_id: academic_year_id 
      });
      
      if (!term) {
        return res.status(404).json({ message: "Term not found in specified academic year" });
      }
      
      query.term_id = term_id;
    } else if (academic_year_id) {
      // Only academic year filter: subjects assigned to terms in this academic year OR unassigned
      if (!mongoose.Types.ObjectId.isValid(academic_year_id)) {
        return res.status(400).json({ message: "Invalid academic year ID" });
      }
      
      const terms = await Term.find({ academic_year_id });
      const termIds = terms.map(t => t._id);
      
      query.$or = [
        { term_id: { $in: termIds } },
        { term_id: null }
      ];
    } else if (term_id) {
      // Only term filter: subjects assigned to this term
      if (!mongoose.Types.ObjectId.isValid(term_id)) {
        return res.status(400).json({ message: "Invalid term ID" });
      }
      
      query.term_id = term_id;
    }
    // If no filters, show all subjects (assigned and unassigned)
    
    // Get subjects with population - use lean() for faster queries
    const subjects = await Subject.find(query)
      .populate({
        path: 'term_id',
        select: 'academic_year_id term_number start_date end_date',
        populate: {
          path: 'academic_year_id',
          select: 'year_label'
        }
      })
      .lean()
      .sort({ subject_name: 1 });

    // Batch fetch all assignments at once
    const subjectIds = subjects.map(s => s._id);
    const assignments = await TeacherSubjectAssignment.find({ 
      subject_id: { $in: subjectIds } 
    })
      .populate('user_id', 'name role')
      .populate('class_id', 'class_name grade section term_id')
      .populate('subject_id', 'subject_name')
      .lean();

    // Group assignments by subject using Map for better performance
    const assignmentMap = new Map();
    assignments.forEach(assignment => {
      const subjectId = assignment.subject_id?._id?.toString();
      if (subjectId) {
        if (!assignmentMap.has(subjectId)) {
          assignmentMap.set(subjectId, []);
        }
        assignmentMap.get(subjectId).push(assignment);
      }
    });

    // Add assignments to subjects
    const subjectsWithAssignments = subjects.map(subject => ({
      ...subject,
      assignments: assignmentMap.get(subject._id.toString()) || []
    }));

    res.json(subjectsWithAssignments);
  } catch (error) {
    console.error("Get subjects error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

// Get Single Subject
export const getSubject = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid subject ID" });
    }
    
    const subject = await Subject.findById(id)
      .populate('term_id', 'academic_year_id term_number start_date end_date')
      .populate('term_id.academic_year_id', 'year_label');
    
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Get assignments for this subject
    const assignments = await TeacherSubjectAssignment.find({ subject_id: id })
      .populate('user_id', 'name role')
      .populate('class_id', 'class_name grade section term_id')
      .populate('subject_id', 'subject_name');

    res.json({
      ...subject.toObject(),
      assignments
    });
  } catch (error) {
    console.error("Get subject error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

// Update Subject
export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_name, course_limit, term_id, is_active } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid subject ID" });
    }

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Check for duplicate name if changing
    if (subject_name && subject_name.trim() !== subject.subject_name) {
      const existingSubject = await Subject.findOne({ 
        subject_name: { $regex: new RegExp(`^${subject_name.trim()}$`, 'i') },
        _id: { $ne: id }
      });
      
      if (existingSubject) {
        return res.status(400).json({ message: "Subject with this name already exists" });
      }
    }
    
    // Validate term if changing
    if (term_id !== undefined && term_id !== subject.term_id) {
      if (term_id && !mongoose.Types.ObjectId.isValid(term_id)) {
        return res.status(400).json({ message: "Invalid term ID" });
      }
      
      if (term_id) {
        const newTerm = await Term.findById(term_id);
        if (!newTerm) {
          return res.status(400).json({ message: "Term not found" });
        }
      }
    }
    
    // Update fields
    if (subject_name !== undefined) subject.subject_name = subject_name.trim();
    if (course_limit !== undefined) {
      const courseLimitValue = parseInt(course_limit);
      if (isNaN(courseLimitValue) || courseLimitValue < 0 || courseLimitValue > 50) {
        return res.status(400).json({ message: "Course limit must be between 0 and 50" });
      }
      subject.course_limit = courseLimitValue;
    }
    if (term_id !== undefined) {
      subject.term_id = term_id ? new mongoose.Types.ObjectId(term_id) : null;
    }
    if (is_active !== undefined) subject.is_active = is_active;
    
    await subject.save();
    
    // Populate and return updated subject
    const updatedSubject = await Subject.findById(subject._id)
      .populate({
        path: 'term_id',
        select: 'academic_year_id term_number start_date end_date',
        populate: {
          path: 'academic_year_id',
          select: 'year_label'
        }
      });

    // Get admin name from request
    const adminName = req.user?.name || 'System Administrator';
    
    // Get term display name for notification
    let termDisplayName = null;
    if (updatedSubject.term_id) {
      const termNames = {
        1: 'First Term',
        2: 'Second Term', 
        3: 'Third Term'
      };
      const termNumber = updatedSubject.term_id.term_number;
      const yearLabel = updatedSubject.term_id.academic_year_id?.year_label || 'Unknown Year';
      termDisplayName = `${termNames[termNumber] || `Term ${termNumber}`} - ${yearLabel}`;
    }

    // Create notification for subject update
    await createSubjectNotification(subject.subject_name, subject.course_limit, termDisplayName, adminName, 'updated');

    res.json({
      message: "Subject updated successfully",
      subject: updatedSubject
    });
  } catch (error) {
    console.error("Update subject error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

// Delete Subject (hard delete)
export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid subject ID" });
    }

    const subject = await Subject.findById(id).populate({
      path: 'term_id',
      select: 'academic_year_id term_number',
      populate: {
        path: 'academic_year_id',
        select: 'year_label'
      }
    });
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Check if subject has assignments
    const assignments = await TeacherSubjectAssignment.find({ subject_id: id });
    if (assignments.length > 0) {
      return res.status(400).json({ 
        message: "Cannot delete subject. It has teacher assignments. Please remove all assignments first." 
      });
    }

    // Get admin name from request
    const adminName = req.user?.name || 'System Administrator';
    
    // Get term display name for notification
    let termDisplayName = null;
    if (subject.term_id) {
      const termNames = {
        1: 'First Term',
        2: 'Second Term', 
        3: 'Third Term'
      };
      const termNumber = subject.term_id.term_number;
      const yearLabel = subject.term_id.academic_year_id?.year_label || 'Unknown Year';
      termDisplayName = `${termNames[termNumber] || `Term ${termNumber}`} - ${yearLabel}`;
    }

    // Hard delete - remove from database
    await Subject.findByIdAndDelete(id);

    // Create notification for subject deletion
    await createSubjectNotification(subject.subject_name, subject.course_limit, termDisplayName, adminName, 'deleted');

    res.json({
      message: "Subject deleted successfully"
    });
  } catch (error) {
    console.error("Delete subject error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

// Restore Subject
export const restoreSubject = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid subject ID" });
    }

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    subject.is_active = true;
    await subject.save();
    
    res.json({
      message: "Subject restored successfully",
      subject
    });
  } catch (error) {
    console.error("Restore subject error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

// Assign Subject to Term
export const assignSubjectToTerm = async (req, res) => {
  try {
    const { subject_id, term_id } = req.body;
    
    if (!subject_id || !term_id) {
      return res.status(400).json({ message: "Subject ID and Term ID are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(subject_id) || !mongoose.Types.ObjectId.isValid(term_id)) {
      return res.status(400).json({ message: "Invalid subject or term ID" });
    }
    
    const subject = await Subject.findById(subject_id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const term = await Term.findById(term_id);
    if (!term) {
      return res.status(404).json({ message: "Term not found" });
    }

    subject.term_id = term_id;
    await subject.save();

    const updatedSubject = await Subject.findById(subject._id)
      .populate('term_id', 'academic_year_id term_number start_date end_date')
      .populate('term_id.academic_year_id', 'year_label');

    res.json({
      message: "Subject assigned to term successfully",
      subject: updatedSubject
    });
  } catch (error) {
    console.error("Assign subject to term error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

// Remove Subject from Term
export const removeSubjectFromTerm = async (req, res) => {
  try {
    const { subject_id } = req.body;
    
    if (!subject_id) {
      return res.status(400).json({ message: "Subject ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(subject_id)) {
      return res.status(400).json({ message: "Invalid subject ID" });
    }
    
    const subject = await Subject.findById(subject_id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    subject.term_id = null;
    await subject.save();

    res.json({
      message: "Subject removed from term successfully",
      subject
    });
  } catch (error) {
    console.error("Remove subject from term error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

// Get Available Terms for Subject Progression
export const getAvailableTerms = async (req, res) => {
  try {
    const { subject_id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(subject_id)) {
      return res.status(400).json({ message: "Invalid subject ID" });
    }
    
    const subject = await Subject.findById(subject_id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    
    let availableTerms = [];
    
    if (subject.term_id) {
      // Subject is assigned to a term, get the next logical term
      const currentTerm = await Term.findById(subject.term_id).populate('academic_year_id', 'year_label');
      if (currentTerm) {
        const nextTermNumber = currentTerm.term_number + 1;
        
        // First try to find next term in same academic year
        let nextTerms = await Term.find({
          academic_year_id: currentTerm.academic_year_id._id,
          term_number: nextTermNumber
        }).populate('academic_year_id', 'year_label');
        
        // If no next term in same year (e.g., was in 3rd term), find first term of next academic year
        if (nextTerms.length === 0) {
          // Get all academic years and find the next one
          const AcademicYear = (await import('../models/AcademicYear.js')).default;
          const allAcademicYears = await AcademicYear.find().sort({ year_label: 1 });
          const currentYearIndex = allAcademicYears.findIndex(year => 
            year._id.toString() === currentTerm.academic_year_id._id.toString()
          );
          
          if (currentYearIndex >= 0 && currentYearIndex < allAcademicYears.length - 1) {
            const nextAcademicYear = allAcademicYears[currentYearIndex + 1];
            nextTerms = await Term.find({
              academic_year_id: nextAcademicYear._id,
              term_number: 1 // First term of next year
            }).populate('academic_year_id', 'year_label');
          }
        }
        
        availableTerms = nextTerms;
      }
    } else {
      // Subject is not assigned to any term, get all available terms
      const allTerms = await Term.find()
        .populate('academic_year_id', 'year_label')
        .sort({ 'academic_year_id.year_label': 1, term_number: 1 });
      
      availableTerms = allTerms;
    }
    
    res.json(availableTerms);
  } catch (error) {
    console.error("Get available terms error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

// Get Available Teachers for Subject Assignment
export const getAvailableTeachers = async (req, res) => {
  try {
    const { subject_id, class_id } = req.query;
    
    if (!subject_id || !class_id) {
      return res.status(400).json({ message: "Subject ID and Class ID are required" });
    }
    
    // Get all active teachers
    const teachers = await User.find({ 
      role: 'Teacher', 
      is_active: true 
    }).select('name role');
    
    // Get teachers already assigned to this subject-class combination
    const assignedTeachers = await TeacherSubjectAssignment.find({
      subject_id,
      class_id
    }).select('user_id');
    
    const assignedTeacherIds = assignedTeachers.map(a => a.user_id.toString());
    
    // Filter out already assigned teachers
    const availableTeachers = teachers.filter(teacher => 
      !assignedTeacherIds.includes(teacher._id.toString())
    );
    
    res.json(availableTeachers);
  } catch (error) {
    console.error("Get available teachers error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

// Assign Subject to Multiple Classes with Different Course Limits
export const assignSubjectToClasses = async (req, res) => {
  try {
    const { subject_id, class_assignments } = req.body;
    
    if (!subject_id) {
      return res.status(400).json({ message: "Subject ID is required" });
    }
    
    if (!mongoose.Types.ObjectId.isValid(subject_id)) {
      return res.status(400).json({ message: "Invalid subject ID" });
    }
    
    const subject = await Subject.findById(subject_id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    
    if (!class_assignments || !Array.isArray(class_assignments) || class_assignments.length === 0) {
      return res.status(400).json({ message: "At least one class assignment is required" });
    }
    
    const results = {
      successful: [],
      failed: [],
      skipped: []
    };
    
    // Process each class assignment
    // Get existing assignments for this subject to check which classes already have teachers
    const existingAssignments = await TeacherSubjectAssignment.find({ subject_id: subject._id });
    const existingClassIds = existingAssignments.map(a => a.class_id.toString());
    
    for (const assignment of class_assignments) {
      const { class_id, course_limit } = assignment;
      
      // Validate class_id
      if (!class_id || !mongoose.Types.ObjectId.isValid(class_id)) {
        results.failed.push({
          class_id,
          error: "Invalid class ID"
        });
        continue;
      }
      
      // Validate class exists
      const classExists = await Class.findById(class_id);
      if (!classExists) {
        results.failed.push({
          class_id,
          error: "Class not found"
        });
        continue;
      }
      
      // Validate course_limit
      const limit = course_limit ? parseInt(course_limit) : subject.course_limit;
      if (isNaN(limit) || limit < 1) {
        results.failed.push({
          class_id,
          error: "Invalid course limit (must be at least 1)"
        });
        continue;
      }
      
      // Check if assignment exists
      const existingAssignment = existingAssignments.find(a => 
        a.class_id.toString() === class_id.toString()
      );
      
      if (existingAssignment) {
        // Update existing assignment course_limit
        existingAssignment.course_limit = limit;
        await existingAssignment.save();
        results.successful.push({
          class_id,
          course_limit: limit,
          action: "updated"
        });
      } else {
        // Note: We can't create TeacherSubjectAssignment without a teacher (user_id is required)
        // So we'll just prepare this for later teacher assignment
        results.skipped.push({
          class_id,
          course_limit: limit,
          reason: "Teacher assignment required. Use teacher assignment endpoint with this course_limit."
        });
      }
    }
    
    // Get updated subject with assignments
    const updatedSubject = await Subject.findById(subject._id)
      .populate({
        path: 'term_id',
        select: 'academic_year_id term_number start_date end_date',
        populate: {
          path: 'academic_year_id',
          select: 'year_label'
        }
      });
    
    res.json({
      message: `Processed ${class_assignments.length} class assignments`,
      subject: updatedSubject,
      results
    });
  } catch (error) {
    console.error("Assign subject to classes error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

// Helper function to get or create system "Unassigned" teacher
const getOrCreateUnassignedTeacher = async () => {
  // Look for existing "Unassigned" teacher
  let unassignedTeacher = await User.findOne({ 
    name: "Unassigned", 
    role: "Teacher",
    nic_number: "UNASSIGNED_SYSTEM"
  });
  
  if (!unassignedTeacher) {
    // Create system "Unassigned" teacher
    unassignedTeacher = await User.create({
      name: "Unassigned",
      role: "Teacher",
      nic_number: "UNASSIGNED_SYSTEM",
      is_deleted: false
    });
  }
  
  return unassignedTeacher;
};

// Helper function to calculate maximum course limit per subject for a class
// Formula: Total periods per month (160) / number of subjects in class
// 160 = 40 periods/week × 4 weeks
const calculateMaxCourseLimitPerSubject = async (class_id) => {
  // Count unique subjects assigned to this class
  const subjectCount = await TeacherSubjectAssignment.distinct('subject_id', { class_id });
  const numberOfSubjects = subjectCount.length;
  
  if (numberOfSubjects === 0) {
    return 160; // If no subjects, max is 160 (will be divided when subjects are added)
  }
  
  // Calculate max course limit per subject
  const maxLimit = Math.floor(160 / numberOfSubjects);
  return maxLimit;
};

// Helper function to recalculate and update course limits for all subjects in a class
const recalculateCourseLimitsForClass = async (class_id) => {
  // Get all subject assignments for this class
  const assignments = await TeacherSubjectAssignment.find({ class_id });
  
  if (assignments.length === 0) {
    return; // No assignments to update
  }
  
  // Calculate new max limit per subject
  const maxLimit = Math.floor(160 / assignments.length);
  
  // Update all assignments with the new max limit
  await TeacherSubjectAssignment.updateMany(
    { class_id },
    { course_limit: maxLimit }
  );
  
  return maxLimit;
};

// Assign Subjects to Class with Course Limits
// Creates TeacherSubjectAssignment entries with a system "Unassigned" teacher
// Teachers can be assigned later by updating the assignment
export const assignSubjectsToClass = async (req, res) => {
  try {
    const { class_id, subject_assignments } = req.body;
    
    if (!class_id) {
      return res.status(400).json({ message: "Class ID is required" });
    }
    
    if (!mongoose.Types.ObjectId.isValid(class_id)) {
      return res.status(400).json({ message: "Invalid class ID" });
    }
    
    // Validate class exists
    const classData = await Class.findById(class_id);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }
    
    if (!subject_assignments || !Array.isArray(subject_assignments) || subject_assignments.length === 0) {
      return res.status(400).json({ message: "At least one subject assignment is required" });
    }
    
    // Get or create system "Unassigned" teacher
    const unassignedTeacher = await getOrCreateUnassignedTeacher();
    
    const results = {
      successful: [],
      failed: [],
      skipped: []
    };
    
    // Get existing subject assignments for this class to count current subjects
    const existingAssignments = await TeacherSubjectAssignment.find({ class_id });
    const existingSubjectIds = existingAssignments.map(a => a.subject_id.toString());
    
    // Process each subject assignment
    for (const assignment of subject_assignments) {
      const { subject_id } = assignment;
      
      // Validate subject_id
      if (!subject_id || !mongoose.Types.ObjectId.isValid(subject_id)) {
        results.failed.push({
          subject_id,
          error: "Invalid subject ID"
        });
        continue;
      }
      
      // Validate subject exists
      const subject = await Subject.findById(subject_id);
      if (!subject) {
        results.failed.push({
          subject_id,
          error: "Subject not found"
        });
        continue;
      }
      
      // Check if assignment already exists for this subject-class combination
      const existingAssignment = existingAssignments.find(a => 
        a.subject_id.toString() === subject_id.toString()
      );
      
      if (existingAssignment) {
        // Skip if already exists (will be recalculated at the end)
        results.skipped.push({
          subject_id,
          subject_name: subject.subject_name,
          reason: "Subject already assigned to this class"
        });
        continue;
      }
      
      // Add to existing list for calculation (temporarily)
      existingSubjectIds.push(subject_id.toString());
    }
    
    // Calculate course limit: 160 / total number of subjects (existing + new)
    const totalSubjects = existingSubjectIds.length;
    const calculatedCourseLimit = totalSubjects > 0 ? Math.floor(160 / totalSubjects) : 160;
    
    // Now create/update assignments with calculated course limit
    for (const assignment of subject_assignments) {
      const { subject_id } = assignment;
      
      if (!subject_id || !mongoose.Types.ObjectId.isValid(subject_id)) {
        continue; // Already handled in validation above
      }
      
      const subject = await Subject.findById(subject_id);
      if (!subject) {
        continue; // Already handled in validation above
      }
      
      const existingAssignment = await TeacherSubjectAssignment.findOne({
        subject_id,
        class_id
      });
      
      if (!existingAssignment) {
        // Create new assignment with "Unassigned" teacher and calculated course limit
        const newAssignment = await TeacherSubjectAssignment.create({
          user_id: unassignedTeacher._id,
          subject_id,
          class_id,
          course_limit: calculatedCourseLimit
        });
        
        results.successful.push({
          subject_id,
          subject_name: subject.subject_name,
          course_limit: calculatedCourseLimit,
          assignment_id: newAssignment._id,
          action: "created"
        });
      }
    }
    
    // Recalculate course limits for all subjects in the class (including existing ones)
    await recalculateCourseLimitsForClass(class_id);
    
    // Get updated class subjects
    const updatedSubjects = await TeacherSubjectAssignment.find({ class_id })
      .populate('subject_id', 'subject_name')
      .populate('user_id', 'name role')
      .populate('class_id', 'class_name');
    
    res.json({
      message: `Processed ${subject_assignments.length} subject assignments. Course limits recalculated based on total subjects (160 periods / ${updatedSubjects.length} subjects = ${Math.floor(160 / updatedSubjects.length)} per subject)`,
      class: classData,
      results,
      assignments: updatedSubjects,
      max_course_limit_per_subject: updatedSubjects.length > 0 ? Math.floor(160 / updatedSubjects.length) : 160
    });
  } catch (error) {
    console.error("Assign subjects to class error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

// Update Course Limit - Updates existing TeacherSubjectAssignment
export const updateClassSubjectCourseLimit = async (req, res) => {
  try {
    const { assignment_id, course_limit } = req.body;
    
    if (!assignment_id || !mongoose.Types.ObjectId.isValid(assignment_id)) {
      return res.status(400).json({ message: "Invalid assignment ID" });
    }
    
    const courseLimitValue = parseInt(course_limit);
    
    // Validate course limit is a positive number
    if (isNaN(courseLimitValue) || courseLimitValue < 1) {
      return res.status(400).json({ message: "Course limit must be a positive number" });
    }
    
    // Get the assignment first to check class_id
    const assignment = await TeacherSubjectAssignment.findById(assignment_id)
      .populate('subject_id', 'subject_name')
      .populate('class_id', 'class_name')
      .populate('user_id', 'name');
    
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    
    // Get all assignments for this class to calculate total
    const allAssignments = await TeacherSubjectAssignment.find({ 
      class_id: assignment.class_id 
    }).populate('subject_id', 'subject_name');
    
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
    
    // Calculate current total excluding the assignment being updated
    // Treat Religion subjects as ONE and Tamil/Sinhala together as ONE
    const religionSubjects = new Set();
    const languageSubjects = new Set();
    let currentTotal = 0;
    let religionTotal = 0;
    let languageTotal = 0;
    
    for (const a of allAssignments) {
      if (a._id.toString() === assignment_id.toString()) {
        continue; // Skip the assignment being updated
      }
      
      const subjName = a.subject_id?.subject_name;
      if (isReligionSubjectByName(subjName)) {
        // Track religion subjects but only count the maximum course limit once
        religionSubjects.add(subjName);
        religionTotal = Math.max(religionTotal, a.course_limit || 0);
      } else if (isTamilSubjectByName(subjName) || isSinhalaSubjectByName(subjName)) {
        // Track Tamil and Sinhala together - only count the maximum course limit once
        languageSubjects.add(subjName);
        languageTotal = Math.max(languageTotal, a.course_limit || 0);
      } else {
        // Regular subjects count normally
        currentTotal += (a.course_limit || 0);
      }
    }
    
    // Add special subject totals as ONE subject each (only if there are subjects of that type)
    if (religionSubjects.size > 0) {
      currentTotal += religionTotal; // Count all religion subjects as ONE
    }
    if (languageSubjects.size > 0) {
      currentTotal += languageTotal; // Count Tamil and Sinhala together as ONE
    }
    
    // Get the subject being updated
    const updatedSubjectName = assignment.subject_id?.subject_name;
    const isUpdatedSubjectReligion = isReligionSubjectByName(updatedSubjectName);
    const isUpdatedSubjectTamil = isTamilSubjectByName(updatedSubjectName);
    const isUpdatedSubjectSinhala = isSinhalaSubjectByName(updatedSubjectName);
    const currentAssignmentLimit = assignment.course_limit || 0;

    // Calculate max course limit based on current active term's current month weekdays (Monday-Friday) * 8 periods
    const calculateMaxCourseLimitForClass = async (class_id) => {
      try {
        // Step 1: Get the current active term from the database
        const currentTerm = await Term.findOne({ is_active: true }).sort({ createdAt: -1 });
        if (!currentTerm) {
          return 176; // Default: 22 days * 8 = 176
        }

        // Step 2: Get the current month (today's month)
        const today = new Date();
        const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        // Step 3: Count weekdays (Monday-Friday) in the current month
        let weekdayCount = 0;
        const currentDate = new Date(currentMonth);
        
        while (currentDate <= lastDayOfMonth) {
          const dayOfWeek = currentDate.getDay();
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            weekdayCount++;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Step 4: Multiply by 8 periods per day
        return weekdayCount * 8;
      } catch (error) {
        console.error('Error calculating max course limit:', error);
        return 176; // Default: 22 days * 8 = 176
      }
    };

    // Get max course limit for this class based on term's first month
    const maxCourseLimit = await calculateMaxCourseLimitForClass(assignment.class_id);

    // Calculate new total based on the type of subject being updated
    let newTotal;
    if (isUpdatedSubjectReligion) {
      // If updating a religion subject, check if other religion subjects exist
      if (religionSubjects.size > 0) {
        // Other religion subjects exist - use the maximum of existing and new limit
        const maxReligionLimit = Math.max(religionTotal, courseLimitValue);
        newTotal = currentTotal - religionTotal + maxReligionLimit;
      } else {
        // This is the only religion subject - just replace its limit
        newTotal = currentTotal + courseLimitValue;
      }
    } else if (isUpdatedSubjectTamil || isUpdatedSubjectSinhala) {
      // If updating Tamil or Sinhala, check if other language subjects exist
      if (languageSubjects.size > 0) {
        // Other language subjects exist - use the maximum of existing and new limit
        const maxLanguageLimit = Math.max(languageTotal, courseLimitValue);
        newTotal = currentTotal - languageTotal + maxLanguageLimit;
      } else {
        // This is the only language subject - just replace its limit
        newTotal = currentTotal + courseLimitValue;
      }
    } else {
      // Regular subject - subtract current limit and add new limit
      newTotal = currentTotal - currentAssignmentLimit + courseLimitValue;
    }

    // Validate: total course limits cannot exceed max
    if (newTotal > maxCourseLimit) {
      const remaining = maxCourseLimit - currentTotal;
      let specialNote = '';
      if (isUpdatedSubjectReligion && religionSubjects.size > 0) {
        specialNote = ' Note: All religion assignments count as 1 subject and share the same course limit.';
      } else if ((isUpdatedSubjectTamil || isUpdatedSubjectSinhala) && languageSubjects.size > 0) {
        specialNote = ' Note: Tamil and Sinhala assignments count as 1 subject together and share the same course limit.';
      }
      return res.status(400).json({ 
        message: `Total course limits would exceed ${maxCourseLimit} periods. Current total (excluding this subject): ${currentTotal}, Remaining available: ${remaining} periods. Please reduce the course limit.${specialNote}` 
      });
    }
    
    assignment.course_limit = courseLimitValue;
    await assignment.save();
    
    const updatedAssignment = await TeacherSubjectAssignment.findById(assignment_id)
      .populate('subject_id', 'subject_name')
      .populate('class_id', 'class_name')
      .populate('user_id', 'name');
    
    res.json({
      message: `Course limit updated successfully. Course limit set to ${courseLimitValue} periods. Total course limits: ${newTotal}/${maxCourseLimit} periods.`,
      assignment: updatedAssignment,
      total_course_limits: newTotal,
      max_total_allowed: maxCourseLimit
    });
  } catch (error) {
    console.error("Update class subject course limit error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

// Remove Subject from Class
export const removeSubjectFromClass = async (req, res) => {
  try {
    const { assignment_id } = req.body;
    
    if (!assignment_id || !mongoose.Types.ObjectId.isValid(assignment_id)) {
      return res.status(400).json({ message: "Invalid assignment ID" });
    }
    
    // Find the assignment
    const assignment = await TeacherSubjectAssignment.findById(assignment_id)
      .populate('subject_id', 'subject_name')
      .populate('class_id', 'class_name');
    
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    
    const class_id = assignment.class_id._id;
    const subject_name = assignment.subject_id.subject_name;
    const removedCourseLimit = assignment.course_limit || 0;
    
    // Get current total course limits for the class (before removal)
    // Need to populate subject_id to check subject names
    const allAssignments = await TeacherSubjectAssignment.find({ class_id })
      .populate('subject_id', 'subject_name');
    
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
    
    // Calculate current total treating Religion as ONE and Tamil/Sinhala together as ONE
    const religionSubjects = new Set();
    const languageSubjects = new Set();
    let currentTotal = 0;
    let religionTotal = 0;
    let languageTotal = 0;
    
    for (const a of allAssignments) {
      const subjName = a.subject_id?.subject_name;
      if (isReligionSubjectByName(subjName)) {
        // Track religion subjects but only count the maximum course limit once
        religionSubjects.add(subjName);
        religionTotal = Math.max(religionTotal, a.course_limit || 0);
      } else if (isTamilSubjectByName(subjName) || isSinhalaSubjectByName(subjName)) {
        // Track Tamil and Sinhala together - only count the maximum course limit once
        languageSubjects.add(subjName);
        languageTotal = Math.max(languageTotal, a.course_limit || 0);
      } else {
        // Regular subjects count normally
        currentTotal += (a.course_limit || 0);
      }
    }
    
    // Add special subject totals as ONE subject each (only if there are subjects of that type)
    if (religionSubjects.size > 0) {
      currentTotal += religionTotal; // Count all religion subjects as ONE
    }
    if (languageSubjects.size > 0) {
      currentTotal += languageTotal; // Count Tamil and Sinhala together as ONE
    }
    
    // Calculate max course limit for this class
    const calculateMaxCourseLimitForClass = async (class_id) => {
      try {
        const currentTerm = await Term.findOne({ is_active: true }).sort({ createdAt: -1 });
        if (!currentTerm) {
          return 176; // Default: 22 days * 8 = 176
        }
        const today = new Date();
        const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        let weekdayCount = 0;
        const currentDate = new Date(currentMonth);
        while (currentDate <= lastDayOfMonth) {
          const dayOfWeek = currentDate.getDay();
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            weekdayCount++;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
        return weekdayCount * 8;
      } catch (error) {
        return 176;
      }
    };
    
    const maxCourseLimit = await calculateMaxCourseLimitForClass(class_id);
    
    // Check if the removed subject is Religion or Language
    const isRemovedSubjectReligion = isReligionSubjectByName(subject_name);
    const isRemovedSubjectTamil = isTamilSubjectByName(subject_name);
    const isRemovedSubjectSinhala = isSinhalaSubjectByName(subject_name);
    
    // Delete the assignment (this frees up the course limit)
    await TeacherSubjectAssignment.findByIdAndDelete(assignment_id);
    
    // Calculate remaining assignments and their total (using same logic as above)
    const remainingAssignments = await TeacherSubjectAssignment.find({ class_id })
      .populate('subject_id', 'subject_name');
    
    const remainingReligionSubjects = new Set();
    const remainingLanguageSubjects = new Set();
    let remainingTotal = 0;
    let remainingReligionTotal = 0;
    let remainingLanguageTotal = 0;
    
    for (const a of remainingAssignments) {
      const subjName = a.subject_id?.subject_name;
      if (isReligionSubjectByName(subjName)) {
        remainingReligionSubjects.add(subjName);
        remainingReligionTotal = Math.max(remainingReligionTotal, a.course_limit || 0);
      } else if (isTamilSubjectByName(subjName) || isSinhalaSubjectByName(subjName)) {
        remainingLanguageSubjects.add(subjName);
        remainingLanguageTotal = Math.max(remainingLanguageTotal, a.course_limit || 0);
      } else {
        remainingTotal += (a.course_limit || 0);
      }
    }
    
    // Add special subject totals as ONE subject each
    if (remainingReligionSubjects.size > 0) {
      remainingTotal += remainingReligionTotal;
    }
    if (remainingLanguageSubjects.size > 0) {
      remainingTotal += remainingLanguageTotal;
    }
    
    // Calculate freed up limit
    // For Religion/Language, only count the limit if it was the last one of that type
    let freedUpLimit = 0;
    if (isRemovedSubjectReligion) {
      // If there are still other religion subjects, no limit is freed (they share the same limit)
      // Only free up if this was the last religion subject
      if (remainingReligionSubjects.size === 0) {
        freedUpLimit = removedCourseLimit;
      } else {
        // Check if the removed limit was the maximum - if so, the new max might be lower
        if (removedCourseLimit >= remainingReligionTotal) {
          freedUpLimit = removedCourseLimit - remainingReligionTotal;
        }
      }
    } else if (isRemovedSubjectTamil || isRemovedSubjectSinhala) {
      // If there are still other language subjects, no limit is freed (they share the same limit)
      // Only free up if this was the last language subject
      if (remainingLanguageSubjects.size === 0) {
        freedUpLimit = removedCourseLimit;
      } else {
        // Check if the removed limit was the maximum - if so, the new max might be lower
        if (removedCourseLimit >= remainingLanguageTotal) {
          freedUpLimit = removedCourseLimit - remainingLanguageTotal;
        }
      }
    } else {
      // Regular subject - always free up its limit
      freedUpLimit = removedCourseLimit;
    }
    
    const availableLimit = maxCourseLimit - remainingTotal;
    
    res.json({
      message: `Subject "${subject_name}" removed from class. Course limit of ${freedUpLimit} periods has been freed up and is now available for other subjects.`,
      removed_course_limit: freedUpLimit,
      remaining_subjects: remainingAssignments.length,
      current_total_used: remainingTotal,
      max_course_limit: maxCourseLimit,
      available_course_limit: availableLimit
    });
  } catch (error) {
    console.error("Remove subject from class error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

// Get Subjects for a Specific Class
export const getSubjectsForClass = async (req, res) => {
  try {
    const { class_id } = req.params;
    
    if (!class_id || !mongoose.Types.ObjectId.isValid(class_id)) {
      return res.status(400).json({ message: "Invalid class ID" });
    }
    
    // Check if class exists - use lean() for faster query
    const classData = await Class.findById(class_id)
      .populate('term_id', 'term_number academic_year_id')
      .populate({
        path: 'term_id',
        populate: {
          path: 'academic_year_id',
          select: 'year_label'
        }
      })
      .lean();
    
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Get all subject assignments for this class - use lean() for faster query
    // Only get assignments where both subject and user (teacher) exist
    const assignments = await TeacherSubjectAssignment.find({ 
      class_id,
      subject_id: { $exists: true, $ne: null },
      user_id: { $exists: true, $ne: null }
    })
      .populate('subject_id', 'subject_name term_id is_active')
      .populate('user_id', 'name role')
      .populate({
        path: 'subject_id',
        populate: {
          path: 'term_id',
          select: 'term_number academic_year_id'
        }
      })
      .lean();

    // Group by subject and include course limits
    // Only include subjects that have valid assignments with teachers
    const subjectsMap = new Map();
    
    assignments.forEach(assignment => {
      // Only process assignments with valid subject and teacher
      // Double check that user_id exists and has a name (is a valid teacher)
      if (assignment.subject_id && assignment.user_id && assignment.user_id._id) {
        const subjectId = assignment.subject_id._id.toString();
        
        if (!subjectsMap.has(subjectId)) {
          subjectsMap.set(subjectId, {
            _id: assignment.subject_id._id,
            subject_name: assignment.subject_id.subject_name,
            term_id: assignment.subject_id.term_id,
            is_active: assignment.subject_id.is_active !== false, // Default to true if not set
            course_limit: assignment.course_limit || 0,
            assignments: []
          });
        }
        
        const subjectData = subjectsMap.get(subjectId);
        // Use the maximum course limit if multiple teachers have different limits
        if (assignment.course_limit && assignment.course_limit > subjectData.course_limit) {
          subjectData.course_limit = assignment.course_limit;
        }
        
        subjectData.assignments.push({
          _id: assignment._id,
          teacher_id: assignment.user_id,
          course_limit: assignment.course_limit || 0
        });
      }
    });

    // Convert map to array and filter out any subjects without assignments
    const subjects = Array.from(subjectsMap.values()).filter(subject => 
      subject.assignments && subject.assignments.length > 0
    );

    res.json({
      class: classData,
      subjects: subjects,
      total_subjects: subjects.length,
      assigned_count: subjects.length
    });
  } catch (error) {
    console.error("Get subjects for class error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};