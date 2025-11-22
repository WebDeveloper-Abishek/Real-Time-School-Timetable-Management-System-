import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../Components/AdminLayout/AdminLayout';
import { academicYearAPI, termsAPI, classAPI, userAPI, subjectAPI } from '../../../services/api';
import './AdminAssignments.css';

const AdminAssignments = () => {
  const navigate = useNavigate();
  
  // State management with unique names
  const [assignmentAcademicYears, setAssignmentAcademicYears] = useState([]);
  const [assignmentTerms, setAssignmentTerms] = useState([]);
  const [assignmentClasses, setAssignmentClasses] = useState([]);
  const [assignmentSubjects, setAssignmentSubjects] = useState([]);
  const [assignmentTeachers, setAssignmentTeachers] = useState([]);
  const [assignmentStudents, setAssignmentStudents] = useState([]);
  const [assignmentAlerts, setAssignmentAlerts] = useState([]);
  
  // Selection states with unique names
  const [assignmentSelectedAcademicYear, setAssignmentSelectedAcademicYear] = useState('');
  const [assignmentSelectedTerm, setAssignmentSelectedTerm] = useState('');
  const [assignmentSelectedClass, setAssignmentSelectedClass] = useState('');
  
  // Assignment states with unique names
  const [assignmentTeacherAssignments, setAssignmentTeacherAssignments] = useState([]);
  const [assignmentStudentAssignments, setAssignmentStudentAssignments] = useState([]);
  
  // Form display control
  const [assignmentActiveForm, setAssignmentActiveForm] = useState('teacher'); // 'teacher' or 'student'
  
  // Form states with unique names
  const [assignmentTeacherForm, setAssignmentTeacherForm] = useState({
    teacher_id: '',
    subject_id: '',
    course_limit: 1,
    is_primary: false
  });
  const [assignmentStudentForm, setAssignmentStudentForm] = useState({
    student_id: ''
  });

  // Loading states
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  // Alert system with unique names
  const assignmentAddAlert = (message, type = 'success') => {
    const id = Date.now();
    setAssignmentAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setAssignmentAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  };

  // Fetch functions with unique names
  const assignmentFetchAcademicYears = async () => {
    try {
      const data = await academicYearAPI.getAcademicYears();
      setAssignmentAcademicYears(data || []);
    } catch (error) {
      console.error('Error fetching academic years:', error);
      assignmentAddAlert('Error fetching academic years', 'error');
    }
  };

  const assignmentFetchTerms = async (academicYearId) => {
    try {
      const data = await termsAPI.getTerms({ academic_year_id: academicYearId });
      setAssignmentTerms(data || []);
    } catch (error) {
      console.error('Error fetching terms:', error);
      assignmentAddAlert('Error fetching terms', 'error');
    }
  };

  const assignmentFetchClasses = async (termId) => {
    try {
      const data = await classAPI.getClasses({ term_id: termId });
      setAssignmentClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      assignmentAddAlert('Error fetching classes', 'error');
    }
  };

  const assignmentFetchSubjects = async () => {
    try {
      const data = await subjectAPI.getSubjects();
      setAssignmentSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      assignmentAddAlert('Error fetching subjects', 'error');
    }
  };

  const assignmentFetchTeachers = async () => {
    try {
      const data = await userAPI.getUsers({ role: 'Teacher' });
      const teachers = data.users || data || [];
      // Additional filtering to ensure only teachers are shown
      const filteredTeachers = teachers.filter(user => user.role === 'Teacher');
      setAssignmentTeachers(filteredTeachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      assignmentAddAlert('Error fetching teachers', 'error');
    }
  };

  const assignmentFetchStudents = async () => {
    try {
      const data = await userAPI.getUsers({ role: 'Student' });
      const students = data.users || data || [];
      // Additional filtering to ensure only students are shown
      const filteredStudents = students.filter(user => user.role === 'Student');
      setAssignmentStudents(filteredStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      assignmentAddAlert('Error fetching students', 'error');
    }
  };

  const assignmentFetchTeacherAssignments = async (classId) => {
    try {
      const data = await classAPI.getClass(classId);
      setAssignmentTeacherAssignments(data.teacher_assignments || []);
    } catch (error) {
      console.error('Error fetching teacher assignments:', error);
    }
  };

  const assignmentFetchStudentAssignments = async (classId) => {
    try {
      const data = await classAPI.getClass(classId);
      setAssignmentStudentAssignments(data.students || []);
    } catch (error) {
      console.error('Error fetching student assignments:', error);
    }
  };

  // Initialize data
  useEffect(() => {
    assignmentFetchAcademicYears();
    assignmentFetchSubjects();
    assignmentFetchTeachers();
    assignmentFetchStudents();
  }, []);

  // Handle academic year change
  useEffect(() => {
    if (assignmentSelectedAcademicYear) {
      assignmentFetchTerms(assignmentSelectedAcademicYear);
      setAssignmentSelectedTerm('');
      setAssignmentSelectedClass('');
      setAssignmentClasses([]);
    } else {
      setAssignmentTerms([]);
      setAssignmentSelectedTerm('');
      setAssignmentSelectedClass('');
      setAssignmentClasses([]);
    }
  }, [assignmentSelectedAcademicYear]);

  // Handle term change
  useEffect(() => {
    if (assignmentSelectedTerm) {
      assignmentFetchClasses(assignmentSelectedTerm);
      setAssignmentSelectedClass('');
    } else {
      setAssignmentClasses([]);
      setAssignmentSelectedClass('');
    }
  }, [assignmentSelectedTerm]);

  // Handle class change
  useEffect(() => {
    if (assignmentSelectedClass) {
      assignmentFetchTeacherAssignments(assignmentSelectedClass);
      assignmentFetchStudentAssignments(assignmentSelectedClass);
    } else {
      setAssignmentTeacherAssignments([]);
      setAssignmentStudentAssignments([]);
    }
  }, [assignmentSelectedClass]);

  // Form handlers with unique names
  const assignmentHandleTeacherFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setAssignmentTeacherForm(prev => {
      const newForm = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      
      // Reset subject when teacher changes
      if (name === 'teacher_id') {
        newForm.subject_id = '';
      }
      // Reset teacher when subject changes
      if (name === 'subject_id') {
        newForm.teacher_id = '';
      }
      
      return newForm;
    });
  };

  const assignmentHandleStudentFormChange = (e) => {
    const { name, value } = e.target;
    setAssignmentStudentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Assignment handlers with unique names
  const assignmentHandleTeacherAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentSelectedClass || !assignmentTeacherForm.teacher_id || !assignmentTeacherForm.subject_id) {
      assignmentAddAlert('Please select a class, teacher, and subject', 'error');
      return;
    }

    setAssignmentLoading(true);
    try {
      await classAPI.assignTeacherToSubject(
        assignmentTeacherForm.teacher_id,
        assignmentTeacherForm.subject_id,
        assignmentSelectedClass,
        assignmentTeacherForm.course_limit
      );
      assignmentAddAlert('Teacher assigned successfully!', 'success');
      setAssignmentTeacherForm({
        teacher_id: '',
        subject_id: '',
        course_limit: 1,
        is_primary: false
      });
      assignmentFetchTeacherAssignments(assignmentSelectedClass);
    } catch (error) {
      console.error('Error assigning teacher:', error);
      assignmentAddAlert('Error assigning teacher: ' + error.message, 'error');
    } finally {
      setAssignmentLoading(false);
    }
  };

  const assignmentHandleStudentAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentSelectedClass || !assignmentStudentForm.student_id) {
      assignmentAddAlert('Please select a class and student', 'error');
      return;
    }

    setAssignmentLoading(true);
    try {
      await classAPI.assignStudentToClass(assignmentSelectedClass, assignmentStudentForm.student_id);
      assignmentAddAlert('Student assigned successfully!', 'success');
      setAssignmentStudentForm({ student_id: '' });
      assignmentFetchStudentAssignments(assignmentSelectedClass);
    } catch (error) {
      console.error('Error assigning student:', error);
      assignmentAddAlert('Error assigning student: ' + error.message, 'error');
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Remove assignment handlers with unique names
  const assignmentHandleRemoveTeacherAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to remove this teacher assignment?')) {
      return;
    }

    try {
      await classAPI.updateTeacherAssignment(assignmentId, { course_limit: 0 });
      assignmentAddAlert('Teacher assignment removed successfully!', 'success');
      assignmentFetchTeacherAssignments(assignmentSelectedClass);
    } catch (error) {
      console.error('Error removing teacher assignment:', error);
      assignmentAddAlert('Error removing teacher assignment: ' + error.message, 'error');
    }
  };

  const assignmentHandleRemoveStudentAssignment = async (studentId) => {
    if (!window.confirm('Are you sure you want to remove this student from the class?')) {
      return;
    }

    try {
      await classAPI.removeStudentFromClass(assignmentSelectedClass, studentId);
      assignmentAddAlert('Student removed from class successfully!', 'success');
      assignmentFetchStudentAssignments(assignmentSelectedClass);
    } catch (error) {
      console.error('Error removing student assignment:', error);
      assignmentAddAlert('Error removing student assignment: ' + error.message, 'error');
    }
  };

  // Get selected class info
  const assignmentGetSelectedClassInfo = () => {
    return assignmentClasses.find(cls => cls._id === assignmentSelectedClass);
  };

  // Get term name
  const assignmentGetTermName = (term) => {
    if (!term) return 'Unknown Term';
    const termNames = {
      1: 'First Term',
      2: 'Second Term',
      3: 'Third Term'
    };
    const termNumber = term.term_number;
    const yearLabel = term.academic_year_id?.year_label || 'Unknown Year';
    return `${termNames[termNumber] || `Term ${termNumber}`} - ${yearLabel}`;
  };

  return (
    <AdminLayout 
      pageTitle="Assignment Management" 
      pageDescription="Manage teacher and student assignments to classes"
    >
      {/* Alerts */}
      <div className="assignment-alerts-container">
        {assignmentAlerts.map(alert => (
          <div key={alert.id} className={`assignment-alert assignment-alert-${alert.type}`}>
            {alert.message}
          </div>
        ))}
      </div>

      <div className="assignment-management-container">
      {/* Header */}
        <div className="assignment-management-header">
          <div className="assignment-header-left">
            <h1 className="assignment-page-main-title">Assignment Management</h1>
            <p>Manage teacher and student assignments to classes</p>
        </div>
          <div className="assignment-header-right">
          <button 
              className="assignment-btn assignment-btn-primary"
              onClick={() => navigate('/admin/classes')}
          >
              Manage Classes
          </button>
        </div>
      </div>

        {/* Selection Filters */}
        <div className="assignment-selection-filters">
          <div className="assignment-filter-group">
            <label htmlFor="assignment-academic-year-filter">Academic Year:</label>
            <select 
              id="assignment-academic-year-filter"
              value={assignmentSelectedAcademicYear}
              onChange={(e) => setAssignmentSelectedAcademicYear(e.target.value)}
              className="assignment-filter-select"
            >
              <option value="">Select Academic Year</option>
              {assignmentAcademicYears.map(year => (
                <option key={year._id} value={year._id}>
                  {year.year_label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="assignment-filter-group">
            <label htmlFor="assignment-term-filter">Term:</label>
            <select 
              id="assignment-term-filter"
              value={assignmentSelectedTerm}
              onChange={(e) => setAssignmentSelectedTerm(e.target.value)}
              className="assignment-filter-select"
              disabled={!assignmentSelectedAcademicYear}
            >
          <option value="">Select Term</option>
              {assignmentTerms.map(term => (
                <option key={term._id} value={term._id}>
                  {assignmentGetTermName(term)}
                </option>
              ))}
        </select>
      </div>

          <div className="assignment-filter-group">
            <label htmlFor="assignment-class-filter">Class:</label>
            <select 
              id="assignment-class-filter"
              value={assignmentSelectedClass}
              onChange={(e) => setAssignmentSelectedClass(e.target.value)}
              className="assignment-filter-select"
              disabled={!assignmentSelectedTerm}
            >
              <option value="">Select Class</option>
              {assignmentClasses.map(cls => (
                <option key={cls._id} value={cls._id}>
                  {cls.class_name} (Grade {cls.grade})
                </option>
              ))}
            </select>
        </div>
      </div>

        {/* Class Information */}
        {assignmentSelectedClass && (
          <div className="assignment-class-info">
            <h3>Class Information</h3>
            <div className="assignment-class-details">
              <div className="assignment-class-detail-item">
                <span className="assignment-class-detail-label">Class:</span>
                <span className="assignment-class-detail-value">{assignmentGetSelectedClassInfo()?.class_name}</span>
              </div>
              <div className="assignment-class-detail-item">
                <span className="assignment-class-detail-label">Grade:</span>
                <span className="assignment-class-detail-value">{assignmentGetSelectedClassInfo()?.grade}</span>
              </div>
              <div className="assignment-class-detail-item">
                <span className="assignment-class-detail-label">Section:</span>
                <span className="assignment-class-detail-value">{assignmentGetSelectedClassInfo()?.section}</span>
              </div>
              <div className="assignment-class-detail-item">
                <span className="assignment-class-detail-label">Term:</span>
                <span className="assignment-class-detail-value">{assignmentGetTermName(assignmentTerms.find(t => t._id === assignmentSelectedTerm))}</span>
            </div>
          </div>
        </div>
      )}

        {/* Assignment Actions */}
        {assignmentSelectedClass && (
          <div className="assignment-actions-section">
            {/* Form Toggle Buttons */}
            <div className="assignment-form-toggle">
              <button 
                type="button"
                className={`assignment-toggle-btn ${assignmentActiveForm === 'teacher' ? 'active' : ''}`}
                onClick={() => setAssignmentActiveForm('teacher')}
              >
                Assign Teacher
              </button>
              <button 
                type="button"
                className={`assignment-toggle-btn ${assignmentActiveForm === 'student' ? 'active' : ''}`}
                onClick={() => setAssignmentActiveForm('student')}
              >
                Assign Student
              </button>
            </div>
            
            <div className="assignment-actions-grid">
              {/* Teacher Assignment Form */}
              {assignmentActiveForm === 'teacher' && (
              <div className="assignment-form-card">
                <div className="assignment-form-header">
              <h3>Assign Teacher to Subject</h3>
            </div>
                <form onSubmit={assignmentHandleTeacherAssignment} className="assignment-form">
                  <div className="assignment-form-group">
                    <label htmlFor="assignment-teacher-select">Teacher:</label>
                <select 
                      id="assignment-teacher-select"
                      name="teacher_id"
                      value={assignmentTeacherForm.teacher_id}
                      onChange={assignmentHandleTeacherFormChange}
                  required
                      className="assignment-form-select"
                >
          <option value="">Select Teacher</option>
                      {assignmentTeachers
                        .filter(teacher => 
                          teacher.role === 'Teacher' &&
                          !assignmentTeacherAssignments.some(ta => 
                            ta.user_id._id === teacher._id && 
                            ta.subject_id._id === assignmentTeacherForm.subject_id
                          )
                        )
                        .map(teacher => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name}
                    </option>
                  ))}
        </select>
              </div>
              
                  <div className="assignment-form-group">
                    <label htmlFor="assignment-subject-select">Subject:</label>
                <select 
                      id="assignment-subject-select"
                      name="subject_id"
                      value={assignmentTeacherForm.subject_id}
                      onChange={assignmentHandleTeacherFormChange}
                  required
                      className="assignment-form-select"
                >
          <option value="">Select Subject</option>
                      {assignmentSubjects
                        .filter(subject => 
                          !assignmentTeacherAssignments.some(ta => 
                            ta.user_id._id === assignmentTeacherForm.teacher_id && 
                            ta.subject_id._id === subject._id
                          )
                        )
                        .map(subject => (
                    <option key={subject._id} value={subject._id}>
                      {subject.subject_name}
                    </option>
                  ))}
        </select>
              </div>
              
                  <div className="assignment-form-group">
                    <label htmlFor="assignment-course-limit">Course Limit (Periods):</label>
                <input 
                  type="number" 
                      id="assignment-course-limit"
                      name="course_limit"
                      value={assignmentTeacherForm.course_limit}
                      onChange={assignmentHandleTeacherFormChange}
                      min="1"
                      max="20"
                  required
                      className="assignment-form-input"
                />
              </div>
              
                  <button 
                    type="submit" 
                    className="assignment-btn assignment-btn-assign"
                    disabled={assignmentLoading}
                  >
                    {assignmentLoading ? 'Assigning...' : 'Assign Teacher'}
                  </button>
                </form>
              </div>
              )}
              
              {/* Student Assignment Form */}
              {assignmentActiveForm === 'student' && (
              <div className="assignment-form-card">
                <div className="assignment-form-header">
              <h3>Assign Student to Class</h3>
            </div>
                <form onSubmit={assignmentHandleStudentAssignment} className="assignment-form">
                  <div className="assignment-form-group">
                    <label htmlFor="assignment-student-select">Student:</label>
                <select 
                      id="assignment-student-select"
                      name="student_id"
                      value={assignmentStudentForm.student_id}
                      onChange={assignmentHandleStudentFormChange}
                  required
                      className="assignment-form-select"
                >
                  <option value="">Select Student</option>
                      {assignmentStudents
                        .filter(student => 
                          student.role === 'Student' &&
                          !assignmentStudentAssignments.some(sa => sa._id === student._id) &&
                          !student.class_assignments?.some(ca => ca.class_id)
                        )
                        .map(student => (
                    <option key={student._id} value={student._id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </div>
              
                  <button 
                    type="submit" 
                    className="assignment-btn assignment-btn-assign"
                    disabled={assignmentLoading}
                  >
                    {assignmentLoading ? 'Assigning...' : 'Assign Student'}
                  </button>
                </form>
              </div>
              )}
            </div>
          </div>
        )}

        {/* Current Assignments */}
        {assignmentSelectedClass && (
          <div className="assignment-current-assignments">
            <div className="assignment-assignments-grid">
              {/* Teacher Assignments */}
              <div className="assignment-assignments-card">
                <div className="assignment-assignments-header">
                  <h3>Current Teacher Assignments</h3>
                  <span className="assignment-count-badge">
                    {assignmentTeacherAssignments.length} assigned
                  </span>
                </div>
                <div className="assignment-assignments-list">
                  {assignmentTeacherAssignments.length > 0 ? (
                    assignmentTeacherAssignments.map(assignment => (
                      <div key={assignment._id} className="assignment-assignment-item">
                        <div className="assignment-assignment-info">
                          <span className="assignment-assignment-teacher">{assignment.user_id?.name}</span>
                          <span className="assignment-assignment-subject">{assignment.subject_id?.subject_name}</span>
                          <span className="assignment-assignment-limit">({assignment.course_limit} periods)</span>
                        </div>
                        <button 
                          className="assignment-btn assignment-btn-danger assignment-btn-sm"
                          onClick={() => assignmentHandleRemoveTeacherAssignment(assignment._id)}
                        >
                          Remove
                </button>
                      </div>
                    ))
                  ) : (
                    <div className="assignment-no-assignments">
                      <span>No teachers assigned to this class</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Student Assignments */}
              <div className="assignment-assignments-card">
                <div className="assignment-assignments-header">
                  <h3>Current Student Assignments</h3>
                  <span className="assignment-count-badge">
                    {assignmentStudentAssignments.length} assigned
                  </span>
                </div>
                <div className="assignment-assignments-list">
                  {assignmentStudentAssignments.length > 0 ? (
                    assignmentStudentAssignments.map(student => (
                      <div key={student._id} className="assignment-assignment-item">
                        <div className="assignment-assignment-info">
                          <span className="assignment-assignment-student">{student.name}</span>
                          <span className="assignment-assignment-role">{student.role}</span>
                        </div>
                        <button 
                          className="assignment-btn assignment-btn-danger assignment-btn-sm"
                          onClick={() => assignmentHandleRemoveStudentAssignment(student._id)}
                        >
                          Remove
                </button>
                      </div>
                    ))
                  ) : (
                    <div className="assignment-no-assignments">
                      <span>No students assigned to this class</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Selection Message */}
        {!assignmentSelectedClass && (
          <div className="assignment-no-selection">
            <div className="assignment-no-selection-icon">📚</div>
            <h3>Select a Class to Manage Assignments</h3>
            <p>Choose an academic year, term, and class to start managing teacher and student assignments</p>
        </div>
      )}
    </div>
    </AdminLayout>
  );
};

export default AdminAssignments;