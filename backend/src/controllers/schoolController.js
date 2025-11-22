import Subject from "../models/Subject.js";
import Class from "../models/Class.js";
import TeacherSubjectAssignment from "../models/TeacherSubjectAssignment.js";

export const createSubject = async (req, res) => {
  try {
    const { subject_name, code, description } = req.body;
    if (!subject_name) return res.status(400).json({ message: "subject_name required" });
    const doc = await Subject.create({ subject_name, code, description });
    return res.status(201).json(doc);
  } catch (e) { return res.status(500).json({ message: "Server error" }); }
};

export const listSubjects = async (_req, res) => {
  try {
    const list = await Subject.find({ is_active: true }).sort({ subject_name: 1 });
    return res.json(list);
  } catch (e) { return res.status(500).json({ message: "Server error" }); }
};

export const createClass = async (req, res) => {
  try {
    const { term_id, grade, section, class_name } = req.body;
    if (!term_id || !grade || !section || !class_name) return res.status(400).json({ message: "Missing fields" });
    const doc = await Class.create({ term_id, grade, section, class_name });
    return res.status(201).json(doc);
  } catch (e) { return res.status(500).json({ message: "Server error" }); }
};

export const listClasses = async (req, res) => {
  try {
    const { term_id } = req.query;
    const filter = {};
    if (term_id) filter.term_id = term_id;
    const list = await Class.find(filter).sort({ class_name: 1 });
    return res.json(list);
  } catch (e) { return res.status(500).json({ message: "Server error" }); }
};

export const assignTeacher = async (req, res) => {
  try {
    const { user_id, subject_id, class_id, course_limit } = req.body;
    if (!user_id || !subject_id || !class_id || course_limit == null) return res.status(400).json({ message: "Missing fields" });
    const doc = await TeacherSubjectAssignment.create({ user_id, subject_id, class_id, course_limit });
    return res.status(201).json(doc);
  } catch (e) { return res.status(500).json({ message: "Server error" }); }
};

export const listAssignments = async (req, res) => {
  try {
    const { class_id } = req.query;
    const filter = {};
    if (class_id) filter.class_id = class_id;
    const list = await TeacherSubjectAssignment.find(filter)
      .populate("user_id","name role")
      .populate("subject_id","subject_name")
      .populate("class_id","class_name")
      .sort({ createdAt: -1 });
    return res.json(list);
  } catch (e) { return res.status(500).json({ message: "Server error" }); }
};


