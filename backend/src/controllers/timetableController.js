import TimetableSlot from "../models/TimetableSlot.js";
import ClassTimetable from "../models/ClassTimetable.js";
import TeacherTimetable from "../models/TeacherTimetable.js";
import ReplacementAssignment from "../models/ReplacementAssignment.js";
import TeacherSubjectAssignment from "../models/TeacherSubjectAssignment.js";
import {
  generateAITimetable,
  generateTimetablesForAllClasses,
  checkTimetableConflicts,
  validateTimetableRequirements,
  getClassTimetable
} from "../services/timetableGenerationService.js";

export const createSlot = async (req, res) => {
  try {
    const { class_id, subject_id, teacher_id, term_id, day_of_week, period_index, start_time, end_time, slot_type, is_double_period } = req.body;
    if (!class_id || !term_id || !day_of_week || !period_index || !start_time || !end_time) return res.status(400).json({ message: "Missing fields" });
    const doc = await TimetableSlot.create({ class_id, subject_id, teacher_id, term_id, day_of_week, period_index, start_time, end_time, slot_type, is_double_period });
    return res.status(201).json(doc);
  } catch (e) { return res.status(500).json({ message: "Server error" }); }
};

export const listClassDay = async (req, res) => {
  try {
    const { class_id, day_of_week } = req.query;
    if (!class_id) {
      return res.status(400).json({ message: "class_id is required" });
    }
    
    const filter = { class_id };
    if (day_of_week) filter.day_of_week = day_of_week;
    
    // Get ClassTimetable entries with slot details
    const list = await ClassTimetable.find(filter)
      .populate('slot_id') // Get slot details (time, slot_number, etc.)
      .populate('subject_id', 'subject_name')
      .populate('teacher_id', 'name')
      .populate('class_id', 'class_name grade section')
      .sort({ day_of_week: 1 });
    
    // Transform to include slot details in response
    const transformedList = list.map(ct => ({
      ...ct.toObject(),
      period_index: ct.slot_id?.slot_number,
      start_time: ct.slot_id?.start_time,
      end_time: ct.slot_id?.end_time,
      slot_type: ct.slot_id?.slot_type
    }));
    
    return res.json(transformedList);
  } catch (e) {
    console.error('Error in listClassDay:', e);
    return res.status(500).json({ message: "Server error" });
  }
};

// AI Timetable Generation
export const generateTimetable = async (req, res) => {
  try {
    const { term_id, class_id } = req.body;
    
    if (!term_id || !class_id) {
      return res.status(400).json({ message: "Term ID and Class ID are required" });
    }

    // Validate requirements first
    const validation = await validateTimetableRequirements(term_id, class_id);
    if (!validation.valid) {
      return res.status(400).json({
        message: "Timetable requirements not met",
        errors: validation.errors,
        stats: validation.stats
      });
    }

    // Generate timetable using AI algorithm
    const result = await generateAITimetable(term_id, class_id);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Generate timetable error:', error);
    return res.status(500).json({
      message: "Error generating timetable",
      error: error.message
    });
  }
};

// Check for conflicts
export const checkConflicts = async (req, res) => {
  try {
    const { term_id, class_id } = req.query;
    
    if (!term_id || !class_id) {
      return res.status(400).json({ message: "Term ID and Class ID are required" });
    }

    const conflicts = await checkTimetableConflicts(term_id, class_id);
    
    return res.json({
      hasConflicts: conflicts.length > 0,
      conflicts
    });
  } catch (error) {
    console.error('Check conflicts error:', error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const requestReplacement = async (req, res) => {
  try {
    const { original_teacher_id, replacement_teacher_id, class_id, subject_id, slot_id, date, reason_declined } = req.body;
    if (!original_teacher_id || !class_id || !subject_id || !slot_id || !date) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    const doc = await ReplacementAssignment.create({ 
      original_teacher_id, 
      replacement_teacher_id, 
      class_id, 
      subject_id, 
      slot_id, 
      date, 
      accepted: false,
      reason_declined: reason_declined || null
    });
    return res.status(201).json(doc);
  } catch (e) { return res.status(500).json({ message: "Server error" }); }
};

// Placeholder: choose replacement teacher by free slot + highest remaining course_limit
export const suggestReplacement = async (req, res) => {
  try {
    const { timetable_slot_id, date } = req.query;
    if (!timetable_slot_id || !date) return res.status(400).json({ message: "Missing params" });

    const slot = await TimetableSlot.findById(timetable_slot_id);
    if (!slot) return res.status(404).json({ message: "Slot not found" });

    // Find teacher assignments for the class/term day that match any subject present in that class's day timetable
    const sameClassDay = await TimetableSlot.find({ class_id: slot.class_id, term_id: slot.term_id, day_of_week: slot.day_of_week });
    const subjectsOnDay = [...new Set(sameClassDay.map(s => String(s.subject_id)))];

    const candidates = await TeacherSubjectAssignment.find({ class_id: slot.class_id, subject_id: { $in: subjectsOnDay } })
      .populate("user_id","name")
      .populate("subject_id","subject_name");

    // Exclude teachers already teaching at that period in another class
    const busy = await TimetableSlot.find({ term_id: slot.term_id, day_of_week: slot.day_of_week, period_index: slot.period_index, teacher_id: { $ne: null } }).distinct("teacher_id");
    const freeCandidates = candidates.filter(c => !busy.find(b => String(b) === String(c.user_id._id)));

    // Sort by highest remaining course limit (placeholder: use course_limit desc)
    freeCandidates.sort((a,b) => (b.course_limit||0) - (a.course_limit||0));

    return res.json(freeCandidates.map(c => ({ teacher_id: c.user_id._id, teacher_name: c.user_id.name, subject_id: c.subject_id._id, subject_name: c.subject_id.subject_name, course_limit: c.course_limit })));
  } catch (e) { return res.status(500).json({ message: "Server error" }); }
};

export const listTeacherDay = async (req, res) => {
  try {
    const { teacher_id, term_id, day_of_week } = req.query;
    if (!teacher_id || !term_id || !day_of_week) return res.status(400).json({ message: "Missing params" });
    const list = await TimetableSlot.find({ teacher_id, term_id, day_of_week }).sort({ period_index: 1 })
      .populate("subject_id","subject_name")
      .populate("class_id","class_name");
    return res.json(list);
  } catch (e) { return res.status(500).json({ message: "Server error" }); }
};

export const decideReplacement = async (req, res) => {
  try {
    const { id } = req.params;
    const { accepted, reason_declined } = req.body;
    if (typeof accepted !== 'boolean') return res.status(400).json({ message: "accepted must be boolean" });
    
    const doc = await ReplacementAssignment.findById(id);
    if (!doc) return res.status(404).json({ message: "Replacement assignment not found" });
    
    doc.accepted = accepted;
    if (!accepted && reason_declined) {
      doc.reason_declined = reason_declined;
    }
    await doc.save();
    return res.json(doc);
  } catch (e) { return res.status(500).json({ message: "Server error" }); }
};

// Get Teacher Timetable - Based on ClassTimetable (shows which classes teacher should go to)
export const getTeacherTimetable = async (req, res) => {
  try {
    const { teacher_id, term_id } = req.query;
    if (!teacher_id) {
      return res.status(400).json({ message: "teacher_id is required" });
    }
    
    // Build query
    const query = { teacher_id };
    if (term_id) {
      query.term_id = term_id;
    }
    
    // Get timetable from ClassTimetable (where teacher is assigned)
    const timetable = await ClassTimetable.find(query)
      .populate('class_id', 'class_name grade section')
      .populate('subject_id', 'subject_name')
      .populate('slot_id', 'start_time end_time slot_number slot_type')
      .populate('term_id', 'term_number academic_year_id')
      .sort({ day_of_week: 1, 'slot_id.slot_number': 1 });
    
    // Transform to include all necessary information
    const transformedTimetable = timetable.map(entry => ({
      _id: entry._id,
      day_of_week: entry.day_of_week,
      class_id: entry.class_id,
      subject_id: entry.subject_id,
      teacher_id: entry.teacher_id,
      slot_id: entry.slot_id,
      term_id: entry.term_id,
      is_double_period: entry.is_double_period || false,
      // Include time info directly
      period_index: entry.slot_id?.slot_number,
      start_time: entry.slot_id?.start_time,
      end_time: entry.slot_id?.end_time,
      slot_type: entry.slot_id?.slot_type
    }));
    
    return res.json({ timetable: transformedTimetable });
  } catch (e) {
    console.error('Error in getTeacherTimetable:', e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get Student Timetable
export const getStudentTimetable = async (req, res) => {
  try {
    const { class_id } = req.query;
    if (!class_id) {
      return res.status(400).json({ message: "class_id is required" });
    }
    
    const timetable = await ClassTimetable.find({ class_id })
      .populate('subject_id', 'subject_name')
      .populate('teacher_id', 'name')
      .populate('slot_id', 'start_time end_time slot_number')
      .sort({ day_of_week: 1, 'slot_id.slot_number': 1 });
    
    return res.json({ timetable });
  } catch (e) {
    console.error('Error in getStudentTimetable:', e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Generate timetables for all classes in a term
export const generateAllClassTimetables = async (req, res) => {
  try {
    const { term_id } = req.body;
    
    if (!term_id) {
      return res.status(400).json({ message: "Term ID is required" });
    }

    const result = await generateTimetablesForAllClasses(term_id);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Generate all timetables error:', error);
    return res.status(500).json({
      message: "Error generating timetables",
      error: error.message
    });
  }
};


