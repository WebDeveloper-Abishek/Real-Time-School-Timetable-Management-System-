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
    console.log(`Subject ${action} notification created for ${users.length} users`);
  } catch (error) {
    console.error(`Error creating subject ${action} notification:`, error);
  }
};

// Create Subject
export const createSubject = async (req, res) => {
  try {
    const { subject_name, course_limit, term_id } = req.body;
    
    // Validation
    if (!subject_name || !subject_name.trim()) {
      return res.status(400).json({ message: "Subject name is required" });
    }

    if (!course_limit || course_limit < 1) {
      return res.status(400).json({ message: "Course limit must be at least 1" });
    }

    // Validate term_id if provided
    if (term_id && term_id !== '' && term_id !== null && term_id !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(term_id)) {
        return res.status(400).json({ message: "Invalid term ID" });
      }
      
      const term = await Term.findById(term_id);
      if (!term) {
        return res.status(400).json({ message: "Term not found" });
      }
    }

    // Check for duplicate subject name (case-insensitive)
    const existingSubject = await Subject.findOne({ 
      subject_name: { $regex: new RegExp(`^${subject_name.trim()}$`, 'i') }
    });
    
    if (existingSubject) {
      return res.status(400).json({ message: "Subject with this name already exists" });
    }

    // Create subject with optional term_id
    const subjectData = {
      subject_name: subject_name.trim(),
      course_limit: parseInt(course_limit),
      term_id: term_id ? new mongoose.Types.ObjectId(term_id) : null,
      is_active: true
    };
    
    const subject = await Subject.create(subjectData);
    
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
    let termDisplayName = null;
    if (populatedSubject.term_id) {
      const termNames = {
        1: 'First Term',
        2: 'Second Term', 
        3: 'Third Term'
      };
      const termNumber = populatedSubject.term_id.term_number;
      const yearLabel = populatedSubject.term_id.academic_year_id?.year_label || 'Unknown Year';
      termDisplayName = `${termNames[termNumber] || `Term ${termNumber}`} - ${yearLabel}`;
    }

    // Create notification for subject creation
    await createSubjectNotification(subject_name.trim(), parseInt(course_limit), termDisplayName, adminName, 'created');
    
    res.status(201).json({
      message: "Subject created successfully",
      subject: populatedSubject
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
    
    // Get subjects with population
    // OPTIMIZED QUERY: Nested population to avoid N+1 queries
    const subjects = await Subject.find(query)
      .populate({
        path: 'term_id',
        select: 'academic_year_id term_number start_date end_date',
        populate: {
          path: 'academic_year_id',
          select: 'year_label'
        }
      })
      .sort({ subject_name: 1 });

    // Get assignments for all subjects
    const subjectIds = subjects.map(s => s._id);
    const assignments = await TeacherSubjectAssignment.find({ 
      subject_id: { $in: subjectIds } 
    })
      .populate('user_id', 'name role')
      .populate('class_id', 'class_name grade section term_id')
      .populate('subject_id', 'subject_name');

    // Group assignments by subject
    const assignmentMap = {};
    assignments.forEach(assignment => {
      const subjectId = assignment.subject_id._id.toString();
      if (!assignmentMap[subjectId]) {
        assignmentMap[subjectId] = [];
      }
      assignmentMap[subjectId].push(assignment);
    });

    // Add assignments to subjects
    const subjectsWithAssignments = subjects.map(subject => ({
      ...subject.toObject(),
      assignments: assignmentMap[subject._id.toString()] || []
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
    if (course_limit !== undefined) subject.course_limit = parseInt(course_limit);
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