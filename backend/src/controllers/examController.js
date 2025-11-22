import ExamMark from "../models/ExamMark.js";
import UserClassAssignment from "../models/UserClassAssignment.js";
import TeacherSubjectAssignment from "../models/TeacherSubjectAssignment.js";
import Notification from "../models/Notification.js";
import StudentParentLink from "../models/StudentParentLink.js";

// Add exam marks for students
export const addExamMarks = async (req, res) => {
  try {
    const { class_id, term_id, subject_id, exam_name, exam_date, marks_data } = req.body;
    const teacher_id = req.user.id; // From JWT token

    // Validate input
    if (!class_id || !term_id || !subject_id || !exam_name || !exam_date || !marks_data) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Verify teacher is assigned to this subject and class
    const teacherAssignment = await TeacherSubjectAssignment.findOne({
      user_id: teacher_id,
      subject_id,
      class_id
    });

    if (!teacherAssignment) {
      return res.status(403).json({ message: "You are not authorized to add marks for this subject/class" });
    }

    const results = [];
    const examDate = new Date(exam_date);

    // Add marks for each student
    for (const studentMark of marks_data) {
      const { student_id, marks_obtained, total_marks, remarks } = studentMark;

      // Calculate percentage and grade
      const percentage = total_marks > 0 ? ((marks_obtained / total_marks) * 100).toFixed(2) : 0;
      const grade = calculateGrade(percentage);

      // Check if marks already exist for this student and exam
      const existingMark = await ExamMark.findOne({
        student_id,
        term_id,
        subject_id,
        exam_name
      });

      if (existingMark) {
        // Update existing marks
        existingMark.marks_obtained = marks_obtained;
        existingMark.total_marks = total_marks;
        existingMark.percentage = percentage;
        existingMark.grade = grade;
        existingMark.remarks = remarks;
        existingMark.entered_by = teacher_id;
        await existingMark.save();
        results.push({ student_id, status: 'updated', exam_mark: existingMark });
      } else {
        // Create new exam mark
        const newExamMark = await ExamMark.create({
          student_id,
          class_id,
          term_id,
          subject_id,
          teacher_id,
          exam_name,
          exam_date: examDate,
          marks_obtained,
          total_marks,
          percentage,
          grade,
          remarks,
          entered_by: teacher_id
        });
        results.push({ student_id, status: 'created', exam_mark: newExamMark });
      }

      // Send notification to student and parents
      await sendExamMarkNotification(student_id, exam_name, percentage, grade);
    }

    res.json({ 
      success: true, 
      message: 'Exam marks added successfully',
      results 
    });

  } catch (error) {
    console.error('Error adding exam marks:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get exam marks for a student
export const getStudentExamMarks = async (req, res) => {
  try {
    const { student_id, term_id, subject_id, exam_name } = req.query;

    if (!student_id || !term_id) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    const query = {
      student_id,
      term_id
    };

    if (subject_id) query.subject_id = subject_id;
    if (exam_name) query.exam_name = exam_name;

    const examMarks = await ExamMark.find(query)
      .populate('subject_id', 'subject_name')
      .populate('teacher_id', 'name')
      .populate('entered_by', 'name')
      .sort({ exam_date: -1, 'subject_id.subject_name': 1 });

    // Calculate statistics
    const stats = calculateExamStats(examMarks);

    res.json({ 
      success: true, 
      exam_marks: examMarks,
      statistics: stats
    });

  } catch (error) {
    console.error('Error getting student exam marks:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get exam marks for a class
export const getClassExamMarks = async (req, res) => {
  try {
    const { class_id, term_id, subject_id, exam_name } = req.query;

    if (!class_id || !term_id) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    const query = {
      class_id,
      term_id
    };

    if (subject_id) query.subject_id = subject_id;
    if (exam_name) query.exam_name = exam_name;

    const examMarks = await ExamMark.find(query)
      .populate('student_id', 'name')
      .populate('subject_id', 'subject_name')
      .populate('teacher_id', 'name')
      .populate('entered_by', 'name')
      .sort({ 'student_id.name': 1, exam_date: -1 });

    // Group by exam and subject
    const groupedMarks = examMarks.reduce((acc, mark) => {
      const examKey = `${mark.exam_name}_${mark.subject_id.subject_name}`;
      if (!acc[examKey]) {
        acc[examKey] = {
          exam_name: mark.exam_name,
          subject_name: mark.subject_id.subject_name,
          exam_date: mark.exam_date,
          marks: []
        };
      }
      acc[examKey].marks.push(mark);
      return acc;
    }, {});

    // Calculate class statistics
    const classStats = calculateClassExamStats(examMarks);

    res.json({ 
      success: true, 
      exam_marks: Object.values(groupedMarks),
      class_statistics: classStats
    });

  } catch (error) {
    console.error('Error getting class exam marks:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get parent's child exam marks
export const getChildExamMarks = async (req, res) => {
  try {
    const { parent_id, child_id, term_id, subject_id } = req.query;

    if (!parent_id || !child_id || !term_id) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    // Verify parent-child relationship
    const parentLink = await StudentParentLink.findOne({
      parent_id,
      student_id: child_id
    });

    if (!parentLink) {
      return res.status(403).json({ message: "Access denied" });
    }

    const query = {
      student_id: child_id,
      term_id
    };

    if (subject_id) query.subject_id = subject_id;

    const examMarks = await ExamMark.find(query)
      .populate('subject_id', 'subject_name')
      .populate('teacher_id', 'name')
      .populate('class_id', 'class_name')
      .sort({ exam_date: -1, 'subject_id.subject_name': 1 });

    // Calculate statistics
    const stats = calculateExamStats(examMarks);

    res.json({ 
      success: true, 
      exam_marks: examMarks,
      statistics: stats
    });

  } catch (error) {
    console.error('Error getting child exam marks:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get teacher's exam marks summary
export const getTeacherExamSummary = async (req, res) => {
  try {
    const { teacher_id, term_id, class_id, subject_id } = req.query;
    const teacherId = teacher_id || req.user.id;

    const query = {
      teacher_id: teacherId,
      term_id
    };

    if (class_id) query.class_id = class_id;
    if (subject_id) query.subject_id = subject_id;

    const examMarks = await ExamMark.find(query)
      .populate('student_id', 'name')
      .populate('class_id', 'class_name')
      .populate('subject_id', 'subject_name')
      .sort({ exam_date: -1, 'student_id.name': 1 });

    // Group by exam and class
    const summary = examMarks.reduce((acc, mark) => {
      const examKey = `${mark.exam_name}_${mark.subject_id.subject_name}`;
      const classKey = mark.class_id.class_name;
      
      if (!acc[examKey]) acc[examKey] = {};
      if (!acc[examKey][classKey]) {
        acc[examKey][classKey] = {
          exam_name: mark.exam_name,
          subject_name: mark.subject_id.subject_name,
          exam_date: mark.exam_date,
          total_students: 0,
          average_percentage: 0,
          highest_percentage: 0,
          lowest_percentage: 100,
          grade_distribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
          marks: []
        };
      }

      const classData = acc[examKey][classKey];
      classData.total_students++;
      classData.average_percentage += parseFloat(mark.percentage);
      classData.highest_percentage = Math.max(classData.highest_percentage, parseFloat(mark.percentage));
      classData.lowest_percentage = Math.min(classData.lowest_percentage, parseFloat(mark.percentage));
      
      if (mark.grade) classData.grade_distribution[mark.grade]++;
      
      classData.marks.push(mark);
      return acc;
    }, {});

    // Calculate averages
    Object.values(summary).forEach(examData => {
      Object.values(examData).forEach(classData => {
        if (classData.total_students > 0) {
          classData.average_percentage = (classData.average_percentage / classData.total_students).toFixed(2);
        }
      });
    });

    res.json({ success: true, summary });

  } catch (error) {
    console.error('Error getting teacher exam summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get exam analytics for admin
export const getExamAnalytics = async (req, res) => {
  try {
    const { term_id, class_id, subject_id, exam_name } = req.query;

    const query = { term_id };
    if (class_id) query.class_id = class_id;
    if (subject_id) query.subject_id = subject_id;
    if (exam_name) query.exam_name = exam_name;

    const examMarks = await ExamMark.find(query)
      .populate('student_id', 'name')
      .populate('class_id', 'class_name')
      .populate('subject_id', 'subject_name')
      .populate('teacher_id', 'name');

    // Calculate analytics
    const analytics = {
      totalRecords: examMarks.length,
      byClass: {},
      bySubject: {},
      byExam: {},
      byGrade: { A: 0, B: 0, C: 0, D: 0, F: 0 },
      overallStats: {
        average_percentage: 0,
        highest_percentage: 0,
        lowest_percentage: 100,
        total_students: examMarks.length
      }
    };

    let totalPercentage = 0;

    examMarks.forEach(mark => {
      const percentage = parseFloat(mark.percentage);
      totalPercentage += percentage;

      // Update overall stats
      analytics.overallStats.highest_percentage = Math.max(analytics.overallStats.highest_percentage, percentage);
      analytics.overallStats.lowest_percentage = Math.min(analytics.overallStats.lowest_percentage, percentage);

      // By grade
      if (mark.grade) analytics.byGrade[mark.grade]++;

      // By class
      const className = mark.class_id ? mark.class_id.class_name : 'Unknown';
      if (!analytics.byClass[className]) {
        analytics.byClass[className] = {
          total: 0,
          average_percentage: 0,
          total_percentage: 0,
          grade_distribution: { A: 0, B: 0, C: 0, D: 0, F: 0 }
        };
      }
      analytics.byClass[className].total++;
      analytics.byClass[className].total_percentage += percentage;
      if (mark.grade) analytics.byClass[className].grade_distribution[mark.grade]++;

      // By subject
      const subjectName = mark.subject_id ? mark.subject_id.subject_name : 'Unknown';
      if (!analytics.bySubject[subjectName]) {
        analytics.bySubject[subjectName] = {
          total: 0,
          average_percentage: 0,
          total_percentage: 0,
          grade_distribution: { A: 0, B: 0, C: 0, D: 0, F: 0 }
        };
      }
      analytics.bySubject[subjectName].total++;
      analytics.bySubject[subjectName].total_percentage += percentage;
      if (mark.grade) analytics.bySubject[subjectName].grade_distribution[mark.grade]++;

      // By exam
      const examKey = mark.exam_name;
      if (!analytics.byExam[examKey]) {
        analytics.byExam[examKey] = {
          total: 0,
          average_percentage: 0,
          total_percentage: 0,
          grade_distribution: { A: 0, B: 0, C: 0, D: 0, F: 0 }
        };
      }
      analytics.byExam[examKey].total++;
      analytics.byExam[examKey].total_percentage += percentage;
      if (mark.grade) analytics.byExam[examKey].grade_distribution[mark.grade]++;
    });

    // Calculate averages
    if (analytics.overallStats.total_students > 0) {
      analytics.overallStats.average_percentage = (totalPercentage / analytics.overallStats.total_students).toFixed(2);
    }

    Object.values(analytics.byClass).forEach(classData => {
      if (classData.total > 0) {
        classData.average_percentage = (classData.total_percentage / classData.total).toFixed(2);
      }
    });

    Object.values(analytics.bySubject).forEach(subjectData => {
      if (subjectData.total > 0) {
        subjectData.average_percentage = (subjectData.total_percentage / subjectData.total).toFixed(2);
      }
    });

    Object.values(analytics.byExam).forEach(examData => {
      if (examData.total > 0) {
        examData.average_percentage = (examData.total_percentage / examData.total).toFixed(2);
      }
    });

    res.json({ success: true, analytics });

  } catch (error) {
    console.error('Error getting exam analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper functions
const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

const calculateExamStats = (examMarks) => {
  if (examMarks.length === 0) {
    return {
      total_exams: 0,
      average_percentage: 0,
      highest_percentage: 0,
      lowest_percentage: 0,
      grade_distribution: { A: 0, B: 0, C: 0, D: 0, F: 0 }
    };
  }

  const totalPercentage = examMarks.reduce((sum, mark) => sum + parseFloat(mark.percentage), 0);
  const percentages = examMarks.map(mark => parseFloat(mark.percentage));
  const gradeDistribution = examMarks.reduce((acc, mark) => {
    if (mark.grade) acc[mark.grade]++;
    return acc;
  }, { A: 0, B: 0, C: 0, D: 0, F: 0 });

  return {
    total_exams: examMarks.length,
    average_percentage: (totalPercentage / examMarks.length).toFixed(2),
    highest_percentage: Math.max(...percentages),
    lowest_percentage: Math.min(...percentages),
    grade_distribution: gradeDistribution
  };
};

const calculateClassExamStats = (examMarks) => {
  if (examMarks.length === 0) {
    return {
      total_students: 0,
      average_percentage: 0,
      highest_percentage: 0,
      lowest_percentage: 0,
      grade_distribution: { A: 0, B: 0, C: 0, D: 0, F: 0 }
    };
  }

  const totalPercentage = examMarks.reduce((sum, mark) => sum + parseFloat(mark.percentage), 0);
  const percentages = examMarks.map(mark => parseFloat(mark.percentage));
  const gradeDistribution = examMarks.reduce((acc, mark) => {
    if (mark.grade) acc[mark.grade]++;
    return acc;
  }, { A: 0, B: 0, C: 0, D: 0, F: 0 });

  return {
    total_students: examMarks.length,
    average_percentage: (totalPercentage / examMarks.length).toFixed(2),
    highest_percentage: Math.max(...percentages),
    lowest_percentage: Math.min(...percentages),
    grade_distribution: gradeDistribution
  };
};

// Send exam mark notification to student and parents
const sendExamMarkNotification = async (student_id, exam_name, percentage, grade) => {
  try {
    // Send notification to student
    await Notification.create({
      user_id: student_id,
      title: 'Exam Results Available',
      body: `Your ${exam_name} results are now available. You scored ${percentage}% (Grade: ${grade}).`,
      type: 'EXAM',
      is_read: false
    });

    // Send notification to parents
    const parentLinks = await StudentParentLink.find({ student_id })
      .populate('student_id', 'name');

    for (const link of parentLinks) {
      await Notification.create({
        user_id: link.parent_id,
        title: 'Child Exam Results',
        body: `${link.student_id.name}'s ${exam_name} results are available. Score: ${percentage}% (Grade: ${grade}).`,
        type: 'EXAM',
        is_read: false
      });
    }
  } catch (error) {
    console.error('Error sending exam mark notification:', error);
  }
};
