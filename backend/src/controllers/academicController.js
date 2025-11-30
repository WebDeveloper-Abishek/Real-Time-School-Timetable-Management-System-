import mongoose from "mongoose";
import AcademicYear from "../models/AcademicYear.js";
import Term from "../models/Term.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import TeacherSubjectAssignment from "../models/TeacherSubjectAssignment.js";
import Class from "../models/Class.js";

// Helper function to create academic year notification
const createAcademicYearNotification = async (yearLabel, adminName, action = 'created') => {
  try {
    // Get all active users
    const users = await User.find({ is_deleted: { $ne: true } }, '_id');
    
    if (users.length === 0) return;

    const notifications = users.map(user => ({
      user_id: user._id,
      title: `Academic Year ${action === 'created' ? 'Created' : action === 'updated' ? 'Updated' : 'Deleted'}`,
      body: `Academic year "${yearLabel}" has been ${action} by ${adminName}.`,
      type: 'academic',
      priority: 'high',
      category: 'academic',
      is_system: true,
      metadata: {
        action: `academic_year_${action}`,
        year_label: yearLabel,
        admin_name: adminName,
        system_wide: true,
        created_at: new Date()
      }
    }));

    await Notification.insertMany(notifications);
    console.log(`Academic year ${action} notification created for ${users.length} users`);
  } catch (error) {
    console.error(`Error creating academic year ${action} notification:`, error);
  }
};

// Helper function to carry forward course limits from previous term to new term
const carryForwardCourseLimits = async (newTermId, previousTermId) => {
  try {
    if (!previousTermId) {
      console.log('No previous term found, skipping course limit carry forward');
      return;
    }

    // Get all classes from previous term
    const previousClasses = await Class.find({ term_id: previousTermId });
    if (previousClasses.length === 0) {
      console.log('No classes found in previous term, skipping course limit carry forward');
      return;
    }

    // Get all classes from new term
    const newClasses = await Class.find({ term_id: newTermId });
    if (newClasses.length === 0) {
      console.log('No classes found in new term, skipping course limit carry forward');
      return;
    }

    // Create a map of class names to new class IDs for matching
    const newClassMap = new Map();
    newClasses.forEach(cls => {
      const key = `${cls.grade}-${cls.section}-${cls.class_name}`;
      newClassMap.set(key, cls._id);
    });

    // Get all assignments from previous term
    const previousAssignments = await TeacherSubjectAssignment.find()
      .populate({
        path: 'class_id',
        match: { term_id: previousTermId }
      })
      .populate('subject_id')
      .populate('user_id');

    // Filter out assignments where class_id is null (populate failed)
    const validAssignments = previousAssignments.filter(
      assignment => assignment.class_id && assignment.class_id.term_id?.toString() === previousTermId.toString()
    );

    let carriedForwardCount = 0;

    // Carry forward each assignment
    for (const prevAssignment of validAssignments) {
      const prevClass = prevAssignment.class_id;
      const key = `${prevClass.grade}-${prevClass.section}-${prevClass.class_name}`;
      const newClassId = newClassMap.get(key);

      if (newClassId && prevAssignment.subject_id && prevAssignment.user_id) {
        // Check if assignment already exists in new term
        const existingAssignment = await TeacherSubjectAssignment.findOne({
          user_id: prevAssignment.user_id._id,
          subject_id: prevAssignment.subject_id._id,
          class_id: newClassId
        });

        if (!existingAssignment) {
          // Create new assignment with same course limit
          await TeacherSubjectAssignment.create({
            user_id: prevAssignment.user_id._id,
            subject_id: prevAssignment.subject_id._id,
            class_id: newClassId,
            course_limit: prevAssignment.course_limit
          });
          carriedForwardCount++;
        }
      }
    }

    console.log(`Carried forward ${carriedForwardCount} course limits from previous term to new term`);
  } catch (error) {
    console.error('Error carrying forward course limits:', error);
    // Don't throw error, just log it - we don't want to fail term creation if this fails
  }
};

// Helper function to create term notification
const createTermNotification = async (termNumber, yearLabel, adminName, action = 'created') => {
  try {
    // Get all active users
    const users = await User.find({ is_deleted: { $ne: true } }, '_id');
    
    if (users.length === 0) return;

    const termNames = {
      1: 'First Term',
      2: 'Second Term', 
      3: 'Third Term'
    };
    const termName = termNames[termNumber] || `Term ${termNumber}`;

    const notifications = users.map(user => ({
      user_id: user._id,
      title: `Term ${action === 'created' ? 'Created' : action === 'updated' ? 'Updated' : 'Deleted'}`,
      body: `${termName} for ${yearLabel} has been ${action} by ${adminName}.`,
      type: 'academic',
      priority: 'high',
      category: 'academic',
      is_system: true,
      metadata: {
        action: `term_${action}`,
        term_number: termNumber,
        term_name: termName,
        year_label: yearLabel,
        admin_name: adminName,
        system_wide: true,
        created_at: new Date()
      }
    }));

    await Notification.insertMany(notifications);
    console.log(`Term ${action} notification created for ${users.length} users`);
  } catch (error) {
    console.error(`Error creating term ${action} notification:`, error);
  }
};

// Academic Year CRUD Operations
export const createAcademicYear = async (req, res) => {
  try {
    const { year_label, start_date, end_date } = req.body;
    if (!year_label || !start_date || !end_date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if academic year already exists
    const existingYear = await AcademicYear.findOne({ year_label });
    if (existingYear) {
      return res.status(400).json({ message: "Academic year already exists" });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (startDate >= endDate) {
      return res.status(400).json({ message: "End date must be after start date" });
    }
    
    // Validate that start date is on or after January 1st
    const startYear = startDate.getFullYear();
    const janFirst = new Date(startYear, 0, 1); // January 1st
    if (startDate < janFirst) {
      return res.status(400).json({ 
        message: "Start date must be on or after January 1st" 
      });
    }
    
    // Validate that end date is on or before December 31st
    const endYear = endDate.getFullYear();
    const decThirtyFirst = new Date(endYear, 11, 31); // December 31st
    if (endDate > decThirtyFirst) {
      return res.status(400).json({ 
        message: "End date must be on or before December 31st" 
      });
    }
    
    // Validate that start and end dates are in the same year
    if (startYear !== endYear) {
      return res.status(400).json({ 
        message: "Start date and end date must be in the same year" 
      });
    }
    
    // Validate that the year is reasonable (not before 2020)
    if (startYear < 2020) {
      return res.status(400).json({ 
        message: "Academic year cannot be before 2020" 
      });
    }

    const academicYear = await AcademicYear.create({ year_label, start_date, end_date });

    // Get admin name from request
    const adminName = req.user?.name || 'System Administrator';

    // Create notification for academic year creation
    await createAcademicYearNotification(year_label, adminName, 'created');

    res.status(201).json({
      message: "Academic year created successfully",
      academicYear
    });
  } catch (error) {
    console.error("Create academic year error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAcademicYears = async (req, res) => {
  try {
    const academicYears = await AcademicYear.find()
      .sort({ start_date: -1 });
    
    // Get terms for each academic year
    const academicYearsWithTerms = await Promise.all(
      academicYears.map(async (year) => {
        const terms = await Term.find({ academic_year_id: year._id })
          .sort({ term_number: 1 });
        return {
          ...year.toObject(),
          terms
        };
      })
    );
    
    res.json(academicYearsWithTerms);
  } catch (error) {
    console.error("Get academic years error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;
    const academicYear = await AcademicYear.findById(id);
    
    if (!academicYear) {
      return res.status(404).json({ message: "Academic year not found" });
    }
    
    res.json(academicYear);
  } catch (error) {
    console.error("Get academic year error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;
    const { year_label, start_date, end_date } = req.body;

    const academicYear = await AcademicYear.findById(id);
    if (!academicYear) {
      return res.status(404).json({ message: "Academic year not found" });
    }

    // Store original year label for notification
    const originalYearLabel = academicYear.year_label;

    // Check for duplicate year label if changing
    if (year_label && year_label !== academicYear.year_label) {
      const existingYear = await AcademicYear.findOne({ 
        year_label, 
        _id: { $ne: id } 
      });
      if (existingYear) {
        return res.status(400).json({ message: "Academic year already exists" });
      }
    }

    // Validate dates if provided
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      if (startDate >= endDate) {
        return res.status(400).json({ message: "End date must be after start date" });
      }
    }

    // Update fields
    if (year_label) academicYear.year_label = year_label;
    if (start_date) academicYear.start_date = start_date;
    if (end_date) academicYear.end_date = end_date;

    await academicYear.save();

    // Get admin name from request
    const adminName = req.user?.name || 'System Administrator';

    // Create notification for academic year update
    await createAcademicYearNotification(year_label || originalYearLabel, adminName, 'updated');

    res.json({
      message: "Academic year updated successfully",
      academicYear
    });
  } catch (error) {
    console.error("Update academic year error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;

    const academicYear = await AcademicYear.findById(id);
    if (!academicYear) {
      return res.status(404).json({ message: "Academic year not found" });
    }

    // Get admin name from request
    const adminName = req.user?.name || 'System Administrator';

    // First, delete all terms associated with this academic year
    const deletedTerms = await Term.deleteMany({ academic_year_id: id });
    console.log(`Deleted ${deletedTerms.deletedCount} terms for academic year ${id}`);

    // Then delete the academic year
    await AcademicYear.findByIdAndDelete(id);

    // Create notification for academic year deletion
    await createAcademicYearNotification(academicYear.year_label, adminName, 'deleted');

    res.json({
      message: "Academic year and all associated terms deleted successfully",
      deletedTermsCount: deletedTerms.deletedCount
    });
  } catch (error) {
    console.error("Delete academic year error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Term CRUD Operations
export const createTerm = async (req, res) => {
  try {
    const { academic_year_id, term_number, start_date, end_date } = req.body;
    console.log('Creating term with data:', { academic_year_id, term_number, start_date, end_date });
    
    if (!academic_year_id || !term_number || !start_date || !end_date) {
      console.log('Missing required fields');
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate term number (1, 2, or 3)
    if (![1, 2, 3].includes(parseInt(term_number))) {
      return res.status(400).json({ message: "Term number must be 1, 2, or 3" });
    }

    // Check if academic year exists
    const academicYear = await AcademicYear.findById(academic_year_id);
    console.log('Found academic year:', academicYear);
    if (!academicYear) {
      return res.status(404).json({ message: "Academic year not found" });
    }

    // Check if term already exists for this academic year
    const existingTerm = await Term.findOne({ 
      academic_year_id, 
      term_number: parseInt(term_number) 
    });
    if (existingTerm) {
      return res.status(400).json({ message: "Term already exists for this academic year" });
    }

    // Check if academic year already has 3 terms
    const termCount = await Term.countDocuments({ academic_year_id });
    if (termCount >= 3) {
      return res.status(400).json({ message: "Academic year can only have 3 terms" });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (startDate >= endDate) {
      return res.status(400).json({ message: "End date must be after start date" });
    }

    // Validate dates are within academic year range (only if academic year has dates)
    if (academicYear.start_date && academicYear.end_date) {
      const yearStart = new Date(academicYear.start_date);
      const yearEnd = new Date(academicYear.end_date);
      if (startDate < yearStart || endDate > yearEnd) {
        return res.status(400).json({ 
          message: "Term dates must be within the academic year range" 
        });
      }
    } else {
      console.log('Academic year does not have start_date and end_date, skipping date range validation');
    }

    const term = await Term.create({ 
      academic_year_id, 
      term_number: parseInt(term_number), 
      start_date, 
      end_date 
    });

    // Get admin name from request
    const adminName = req.user?.name || 'System Administrator';

    // If this is not the first term, carry forward course limits from previous term
    if (parseInt(term_number) > 1) {
      // Find previous term in the same academic year
      const previousTerm = await Term.findOne({
        academic_year_id,
        term_number: parseInt(term_number) - 1
      });
      
      if (previousTerm) {
        await carryForwardCourseLimits(term._id, previousTerm._id);
      }
    }

    // Create notification for term creation
    await createTermNotification(parseInt(term_number), academicYear.year_label, adminName, 'created');

    res.status(201).json({
      message: "Term created successfully",
      term
    });
  } catch (error) {
    console.error("Create term error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTerms = async (req, res) => {
  try {
    const { academic_year_id } = req.query;
    const filter = {};
    
    // Validate ObjectId if provided
    if (academic_year_id) {
      if (!mongoose.Types.ObjectId.isValid(academic_year_id)) {
        return res.status(400).json({ message: "Invalid academic year ID" });
      }
      filter.academic_year_id = academic_year_id;
    }
    
    const terms = await Term.find(filter)
      .populate('academic_year_id', 'year_label')
      .sort({ term_number: 1 });
    
    // Sort terms by academic year and term number
    const sortedTerms = terms.sort((a, b) => {
      // First sort by academic year
      const yearA = a.academic_year_id?.year_label || '';
      const yearB = b.academic_year_id?.year_label || '';
      if (yearA !== yearB) {
        return yearA.localeCompare(yearB);
      }
      // Then sort by term number
      return a.term_number - b.term_number;
    });
    
    // Get classes for each term
    const Class = (await import('../models/Class.js')).default;
    const termsWithClasses = await Promise.all(
      sortedTerms.map(async (term) => {
        const classes = await Class.find({ term_id: term._id })
          .sort({ grade: 1, section: 1 });
        return {
          ...term.toObject(),
          classes
        };
      })
    );
    
    res.json(termsWithClasses);
  } catch (error) {
    console.error("Get terms error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTerm = async (req, res) => {
  try {
    const { id } = req.params;
    const term = await Term.findById(id).populate('academic_year_id', 'year_label');
    
    if (!term) {
      return res.status(404).json({ message: "Term not found" });
    }

    res.json(term);
  } catch (error) {
    console.error("Get term error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateTerm = async (req, res) => {
  try {
    const { id } = req.params;
    const { term_number, start_date, end_date, is_active } = req.body;

    const term = await Term.findById(id).populate('academic_year_id');
    if (!term) {
      return res.status(404).json({ message: "Term not found" });
    }

    // Validate term number if changing
    if (term_number && ![1, 2, 3].includes(parseInt(term_number))) {
      return res.status(400).json({ message: "Term number must be 1, 2, or 3" });
    }

    // Check for duplicate term number if changing
    if (term_number && parseInt(term_number) !== term.term_number) {
      const existingTerm = await Term.findOne({
        academic_year_id: term.academic_year_id._id,
        term_number: parseInt(term_number),
        _id: { $ne: id }
      });
      if (existingTerm) {
        return res.status(400).json({ message: "Term number already exists for this academic year" });
      }
    }

    // Validate dates if provided
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      if (startDate >= endDate) {
        return res.status(400).json({ message: "End date must be after start date" });
      }

      // Validate dates are within academic year range
      const yearStart = new Date(term.academic_year_id.start_date);
      const yearEnd = new Date(term.academic_year_id.end_date);
      if (startDate < yearStart || endDate > yearEnd) {
        return res.status(400).json({ 
          message: "Term dates must be within the academic year range" 
        });
      }
    }

    // Store original values
    const originalIsActive = term.is_active;
    const originalTermNumber = term.term_number;
    
    // Update fields
    if (term_number) term.term_number = parseInt(term_number);
    if (start_date) term.start_date = start_date;
    if (end_date) term.end_date = end_date;
    if (is_active !== undefined) term.is_active = is_active;
    
    // Check if is_active is being set to true (term is being activated)
    const isBeingActivated = is_active === true && !originalIsActive;

    await term.save();

    // If term is being activated and it's not the first term, carry forward course limits
    if (isBeingActivated && term.term_number > 1) {
      const previousTerm = await Term.findOne({
        academic_year_id: term.academic_year_id._id,
        term_number: term.term_number - 1
      });
      
      if (previousTerm) {
        await carryForwardCourseLimits(term._id, previousTerm._id);
      }
    }

    // Get admin name from request
    const adminName = req.user?.name || 'System Administrator';

    // Create notification for term update
    await createTermNotification(term.term_number, term.academic_year_id.year_label, adminName, 'updated');

    res.json({
      message: "Term updated successfully",
      term
    });
  } catch (error) {
    console.error("Update term error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteTerm = async (req, res) => {
  try {
    const { id } = req.params;

    const term = await Term.findById(id).populate('academic_year_id', 'year_label');
    if (!term) {
      return res.status(404).json({ message: "Term not found" });
    }

    // Get admin name from request
    const adminName = req.user?.name || 'System Administrator';

    await Term.findByIdAndDelete(id);

    // Create notification for term deletion
    await createTermNotification(term.term_number, term.academic_year_id.year_label, adminName, 'deleted');

    res.json({
      message: "Term deleted successfully"
    });
  } catch (error) {
    console.error("Delete term error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Legacy function names for backward compatibility
export const listAcademicYears = getAcademicYears;
export const listTerms = getTerms;


