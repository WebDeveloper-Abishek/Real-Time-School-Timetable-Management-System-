import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './TeacherAttendance.css';

const TeacherAttendance = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const navigationSections = [
    {
      title: 'MY TEACHING',
      items: [
        { label: 'Teacher Home', icon: '🏠', path: '/teacher/dashboard' },
        { label: 'My Classes', icon: '📚', path: '/teacher/classes' },
        { label: 'Timetable', icon: '📅', path: '/teacher/timetable' },
        { label: 'Students', icon: '🎓', path: '/teacher/students' }
      ]
    },
    {
      title: 'ACADEMIC',
      items: [
        { label: 'Exams', icon: '✍️', path: '/teacher/exams' },
        { label: 'Attendance', icon: '✅', path: '/teacher/attendance' }
      ]
    },
    {
      title: 'LEAVE & DUTIES',
      items: [
        { label: 'Leave Requests', icon: '🏖️', path: '/teacher/leaves' },
        { label: 'Replacements', icon: '🔄', path: '/teacher/replacements' }
      ]
    },
    {
      title: 'PROFILE',
      items: [
        { label: 'Update Profile', icon: '✏️', path: '/teacher/profile' }
      ]
    }
  ];
  const [attendanceMode, setAttendanceMode] = useState('class'); // 'class' or 'subject'
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [isSubjectTeacher, setIsSubjectTeacher] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Class teacher state
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  
  // Subject teacher state
  const [subjectAssignments, setSubjectAssignments] = useState([]);
  const [selectedSubjectAssignment, setSelectedSubjectAssignment] = useState(null);
  
  // Common state
  const [students, setStudents] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState('1');
  const [saving, setSaving] = useState(false);
  const [alerts, setAlerts] = useState([]);


  const addAlert = (message, type = 'success') => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setAlerts(prev => prev.filter(alert => alert.id !== id)), 5000);
  };

  // Check teacher roles and fetch data
  useEffect(() => {
    checkTeacherRoles();
  }, []);

  // Fetch students when class/subject is selected
  useEffect(() => {
    if (attendanceMode === 'class' && selectedClass) {
      fetchClassStudents();
    } else if (attendanceMode === 'subject' && selectedSubjectAssignment) {
      fetchSubjectClassStudents();
    }
  }, [selectedClass, selectedSubjectAssignment, attendanceMode]);

  const checkTeacherRoles = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      const token = localStorage.getItem('token') || '';

      if (!userId) {
        setLoading(false);
        return;
      }

      // Check if class teacher
      const classTeacherResponse = await fetch(`http://localhost:5000/api/teacher/class-teacher-classes?teacher_id=${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      let classData = [];
      let subjectData = [];

      // Check if class teacher
      if (classTeacherResponse.ok) {
        classData = await classTeacherResponse.json();
        if (Array.isArray(classData) && classData.length > 0) {
          setIsClassTeacher(true);
          setClasses(classData);
          if (classData.length === 1) {
            setSelectedClass(classData[0]);
          }
        }
      }

      // Check if subject teacher
      const subjectResponse = await fetch(`http://localhost:5000/api/teacher/subject-assignments`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (subjectResponse.ok) {
        subjectData = await subjectResponse.json();
        if (Array.isArray(subjectData) && subjectData.length > 0) {
          setIsSubjectTeacher(true);
          setSubjectAssignments(subjectData);
          if (subjectData.length === 1) {
            setSelectedSubjectAssignment(subjectData[0]);
          }
        }
      }

      // Set default mode based on what's available
      if (Array.isArray(classData) && classData.length > 0) {
        setAttendanceMode('class');
      } else if (Array.isArray(subjectData) && subjectData.length > 0) {
        setAttendanceMode('subject');
      }

    } catch (error) {
      console.error('Error checking teacher roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStudents = async () => {
    if (!selectedClass) return;

    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      const token = localStorage.getItem('token') || '';

      const response = await fetch(`http://localhost:5000/api/teacher/class-students?class_id=${selectedClass.id}&teacher_id=${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch students');
      }

      const data = await response.json();
      const studentsWithStatus = Array.isArray(data) ? data.map(student => ({
        ...student,
        status: 'Present'
      })) : [];

      setStudents(studentsWithStatus);
    } catch (error) {
      console.error('Error fetching students:', error);
      addAlert(error.message || 'Failed to load students', 'error');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectClassStudents = async () => {
    if (!selectedSubjectAssignment) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token') || '';

      const response = await fetch(`http://localhost:5000/api/teacher/subject-class-students?class_id=${selectedSubjectAssignment.class_id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch students');
      }

      const data = await response.json();
      const studentsWithStatus = Array.isArray(data) ? data.map(student => ({
        ...student,
        status: 'Present'
      })) : [];

      setStudents(studentsWithStatus);
    } catch (error) {
      console.error('Error fetching students:', error);
      addAlert(error.message || 'Failed to load students', 'error');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = (id) => {
    setStudents(students.map(s => 
      s.id === id ? { 
        ...s, 
        status: s.status === 'Present' ? 'Absent' : (s.status === 'Absent' ? 'Late' : 'Present')
      } : s
    ));
  };

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token') || '';

      const attendanceData = students.map(student => ({
        student_id: student.id,
        status: student.status
      }));

      let response;
      let termId;

      if (attendanceMode === 'class') {
        if (!selectedClass || students.length === 0) {
          addAlert('Please select a class with students', 'error');
          return;
        }
        termId = selectedClass.term?._id || selectedClass.term_id;
        
        response = await fetch('http://localhost:5000/api/attendance/mark', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            class_id: selectedClass.id,
            term_id: termId,
            date: attendanceDate,
            period_index: parseInt(period),
            attendance_data: attendanceData
          })
        });
      } else {
        // Subject teacher mode
        if (!selectedSubjectAssignment || students.length === 0) {
          addAlert('Please select a subject and class with students', 'error');
          return;
        }
        termId = selectedSubjectAssignment.term?._id || selectedSubjectAssignment.term_id;
        
        response = await fetch('http://localhost:5000/api/attendance/mark-subject', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            class_id: selectedSubjectAssignment.class_id,
            subject_id: selectedSubjectAssignment.subject_id,
            term_id: termId,
            date: attendanceDate,
            period_index: parseInt(period),
            attendance_data: attendanceData
          })
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save attendance');
      }

      addAlert('Attendance marked successfully!', 'success');
    } catch (error) {
      console.error('Error saving attendance:', error);
      addAlert(error.message || 'Failed to save attendance', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !isClassTeacher && !isSubjectTeacher) {
    return (
      <DashboardLayout
        pageTitle="Mark Attendance"
        pageDescription="Mark student attendance"
        userRole="Teacher"
        userName={user?.name || "Teacher User"}
      >
        <div className="teacherattendance-loading">Checking permissions...</div>
      </DashboardLayout>
    );
  }

  if (!isClassTeacher && !isSubjectTeacher) {
    return (
      <DashboardLayout
        pageTitle="Mark Attendance"
        pageDescription="Mark student attendance"
        userRole="Teacher"
        userName={user?.name || "Teacher User"}
      >
        <div className="teacherattendance-not-authorized">
          <div className="teacherattendance-not-authorized-icon">⚠️</div>
          <h3>Access Restricted</h3>
          <p>You are not assigned as a class teacher or subject teacher.</p>
          <p>If you believe this is an error, please contact your administrator.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      pageTitle="Mark Attendance"
      pageDescription="Mark student attendance for your classes or subjects"
      userRole="Teacher"
      userName={user?.name || "Teacher User"}
      navigationSections={navigationSections}
    >
      {/* Alerts */}
      <div className="teacherattendance-alerts-container">
        {alerts.map(alert => (
          <div key={alert.id} className={`teacherattendance-alert teacherattendance-alert-${alert.type}`}>
            {alert.message}
          </div>
        ))}
      </div>

      <div className="teacheraccontainer">
        {/* Mode Selection */}
        {(isClassTeacher && isSubjectTeacher) && (
          <div className="teacherattendance-mode-selector">
            <button
              className={`teacherattendance-mode-btn ${attendanceMode === 'class' ? 'active' : ''}`}
              onClick={() => {
                setAttendanceMode('class');
                setSelectedSubjectAssignment(null);
                setStudents([]);
              }}
            >
              📚 Class Teacher
            </button>
            <button
              className={`teacherattendance-mode-btn ${attendanceMode === 'subject' ? 'active' : ''}`}
              onClick={() => {
                setAttendanceMode('subject');
                setSelectedClass(null);
                setStudents([]);
              }}
            >
              📖 Subject Teacher
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="teacherattendance-controls">
          {attendanceMode === 'class' ? (
            <div className="teacherattendance-control-group">
              <label htmlFor="class-select">Select Class:</label>
              <select 
                id="class-select"
                value={selectedClass?.id || ''} 
                onChange={(e) => {
                  const classObj = classes.find(c => c.id === e.target.value);
                  setSelectedClass(classObj || null);
                  setStudents([]);
                }}
                className="teacherattendance-select"
              >
                <option value="">-- Select Class --</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_name} (Grade {cls.grade} - Section {cls.section})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="teacherattendance-control-group">
              <label htmlFor="subject-select">Select Subject & Class:</label>
              <select 
                id="subject-select"
                value={selectedSubjectAssignment?.id || ''} 
                onChange={(e) => {
                  const assignment = subjectAssignments.find(a => a.id === e.target.value);
                  setSelectedSubjectAssignment(assignment || null);
                  setStudents([]);
                }}
                className="teacherattendance-select"
              >
                <option value="">-- Select Subject & Class --</option>
                {subjectAssignments.map(assignment => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.subject_name} - {assignment.class_name} (Grade {assignment.grade} - Section {assignment.section})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="teacherattendance-control-group">
            <label htmlFor="date-select">Date:</label>
            <input
              id="date-select"
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="teacherattendance-input"
            />
          </div>

          <div className="teacherattendance-control-group">
            <label htmlFor="period-select">Period:</label>
            <select 
              id="period-select"
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              className="teacherattendance-select"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => (
                <option key={p} value={p}>Period {p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Attendance Card */}
        {((attendanceMode === 'class' && selectedClass) || (attendanceMode === 'subject' && selectedSubjectAssignment)) && (
          <div className="teacherattendance-card">
            <div className="teacherattendance-header">
              <h3>
                {attendanceMode === 'class' 
                  ? selectedClass.class_name 
                  : `${selectedSubjectAssignment.subject_name} - ${selectedSubjectAssignment.class_name}`}
              </h3>
              <span>Period {period} - {new Date(attendanceDate).toLocaleDateString()}</span>
            </div>
            {loading ? (
              <div className="teacherattendance-loading">Loading students...</div>
            ) : students.length === 0 ? (
              <div className="teacherattendance-empty">No students found.</div>
            ) : (
              <>
                <div className="teacherattendance-list">
                  {students.map((student) => (
                    <div key={student.id} className="teacherattendance-item">
                      <span className="teacherattendance-roll">{student.rollNumber}</span>
                      <span className="teacherattendance-name">{student.name}</span>
                      <button 
                        className={`teacherattendance-toggle ${student.status.toLowerCase()}`}
                        onClick={() => toggleStatus(student.id)}
                      >
                        {student.status}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="teacherattendance-footer">
                  <button 
                    className="teacherattendance-save"
                    onClick={handleSaveAttendance}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Attendance'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {((attendanceMode === 'class' && !selectedClass) || (attendanceMode === 'subject' && !selectedSubjectAssignment)) && (
          <div className="teacherattendance-no-class">
            <p>Please select a {attendanceMode === 'class' ? 'class' : 'subject and class'} to mark attendance.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherAttendance;
