import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './StudentExamsGrades.css';

const StudentExamsGrades = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [activeTab, setActiveTab] = useState('exams');
  const [currentTerm, setCurrentTerm] = useState(null);
  const [exams, setExams] = useState([]);
  const [grades, setGrades] = useState([]);
  const [examsLoading, setExamsLoading] = useState(true);
  const [gradesLoading, setGradesLoading] = useState(true);
  const [examsView, setExamsView] = useState('upcoming');
  
  const navigationSections = [
    {
      title: 'My Dashboard',
      items: [
        { label: 'Student Home', icon: '🏠', path: '/student/dashboard' },
        { label: 'My Timetable', icon: '📅', path: '/student/timetable' },
        { label: 'Assignments', icon: '📝', path: '/student/assignments' }
      ]
    },
    {
      title: 'Academic',
      items: [
        { label: 'Exams & Grades', icon: '📊', path: '/student/exams' },
        { label: 'Attendance', icon: '✅', path: '/student/attendance' }
      ]
    },
    {
      title: 'Support',
      items: [
        { label: 'Counselling', icon: '🧠', path: '/student/counselling' }
      ]
    },
    {
      title: 'Profile',
      items: [
        { label: 'Update Profile', icon: '✏️', path: '/student/profile' }
      ]
    }
  ];

  useEffect(() => {
    fetchCurrentTerm();
  }, []);

  useEffect(() => {
    if (currentTerm) {
    fetchExams();
    fetchGrades();
    }
  }, [currentTerm]);

  const fetchCurrentTerm = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch('http://localhost:5000/api/teacher/terms/current', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentTerm(data);
      }
    } catch (error) {
      console.error('Error fetching current term:', error);
    }
  };

  const fetchExams = async () => {
    try {
      setExamsLoading(true);
      const userId = user?.id || user?._id;
      
      if (!userId || !currentTerm?._id) {
        setExamsLoading(false);
        return;
      }

      const { examAPI } = await import('../../../services/api');
      const response = await examAPI.getStudentExamMarks({
        student_id: userId,
        term_id: currentTerm._id
      });

      if (response.success) {
        const examMarks = response.exam_marks || [];
        const now = new Date();
        
        const formattedExams = examMarks.map((mark, index) => {
          const examDate = new Date(mark.exam_date);
          const isUpcoming = examDate > now;
          
          return {
            id: mark._id || index,
            name: mark.exam_name || 'Exam',
            subject: mark.subject_id?.subject_name || 'Unknown',
            date: mark.exam_date,
            time: '09:00 AM',
            marks: mark.marks_obtained || null,
            status: isUpcoming ? 'upcoming' : 'completed',
            total_marks: mark.total_marks,
            percentage: mark.percentage
          };
        });
        
        setExams(formattedExams);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setExamsLoading(false);
    }
  };

  const fetchGrades = async () => {
    try {
      setGradesLoading(true);
      const userId = user?.id || user?._id;
      
      if (!userId || !currentTerm?._id) {
        setGradesLoading(false);
        return;
      }

      const { examAPI } = await import('../../../services/api');
      const response = await examAPI.getStudentExamMarks({
        student_id: userId,
        term_id: currentTerm._id
      });

      if (response.success) {
        const examMarks = response.exam_marks || [];
        
        // Calculate average grades per subject
        const subjectGrades = {};
        
        examMarks.forEach(mark => {
          const subjectName = mark.subject_id?.subject_name || 'Unknown';
          if (!subjectGrades[subjectName]) {
            subjectGrades[subjectName] = {
              subject: subjectName,
              total: 0,
              count: 0,
              marks: []
            };
          }
          subjectGrades[subjectName].total += parseFloat(mark.percentage || 0);
          subjectGrades[subjectName].count += 1;
          subjectGrades[subjectName].marks.push(parseFloat(mark.percentage || 0));
        });

        const formattedGrades = Object.values(subjectGrades).map(subj => {
          const average = subj.count > 0 ? (subj.total / subj.count) : 0;
          const grade = average >= 90 ? 'A' : average >= 80 ? 'B' : average >= 70 ? 'C' : average >= 60 ? 'D' : 'F';
          
          return {
            subject: subj.subject,
            grade: grade,
            marks: Math.round(average),
            percentage: average.toFixed(1)
          };
        });
        
        setGrades(formattedGrades);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setGradesLoading(false);
    }
  };

  const filteredExams = examsView === 'all' 
    ? exams 
    : exams.filter(e => e.status === examsView);

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'studentexamsgrades-grade-excellent';
    if (grade.startsWith('B')) return 'studentexamsgrades-grade-good';
    if (grade.startsWith('C')) return 'studentexamsgrades-grade-average';
    return 'studentexamsgrades-grade-poor';
  };

  return (
    <DashboardLayout
      pageTitle="Exams & Grades"
      pageDescription="View your exam schedule, results, and academic performance"
      userRole="Student"
      userName={user?.name || "Student User"}
      navigationSections={navigationSections}
    >
      <div className="studentexamsgrades-container">
        <div className="studentexamsgrades-header">
          <div className="studentexamsgrades-tabs">
            <button 
              className={activeTab === 'exams' ? 'studentexamsgrades-tab-active' : 'studentexamsgrades-tab'} 
              onClick={() => setActiveTab('exams')}
            >
              Exams
            </button>
            <button 
              className={activeTab === 'grades' ? 'studentexamsgrades-tab-active' : 'studentexamsgrades-tab'} 
              onClick={() => setActiveTab('grades')}
            >
              Grades
            </button>
          </div>
        </div>

        {activeTab === 'exams' && (
          <div className="studentexamsgrades-content">
            <div className="studentexamsgrades-subtabs">
              <button 
                className={examsView === 'upcoming' ? 'studentexamsgrades-subtab-active' : 'studentexamsgrades-subtab'} 
                onClick={() => setExamsView('upcoming')}
              >
                Upcoming
              </button>
              <button 
                className={examsView === 'completed' ? 'studentexamsgrades-subtab-active' : 'studentexamsgrades-subtab'} 
                onClick={() => setExamsView('completed')}
              >
                Completed
              </button>
              <button 
                className={examsView === 'all' ? 'studentexamsgrades-subtab-active' : 'studentexamsgrades-subtab'} 
                onClick={() => setExamsView('all')}
              >
                All
              </button>
            </div>

            <div className="studentexamsgrades-grid">
              {examsLoading ? (
                <div className="studentexamsgrades-loading">Loading exams...</div>
              ) : filteredExams.length === 0 ? (
                <div className="studentexamsgrades-empty">No exams found.</div>
              ) : (
                filteredExams.map((exam) => (
                  <div key={exam.id} className="studentexamsgrades-exam-card">
                    <div className="studentexamsgrades-card-header">
                      <h3>{exam.name}</h3>
                      <span className={`studentexamsgrades-badge studentexamsgrades-badge-${exam.status}`}>
                        {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                      </span>
                    </div>
                    <div className="studentexamsgrades-card-body">
                      <div className="studentexamsgrades-info">
                        <span className="studentexamsgrades-label">Subject:</span>
                        <span className="studentexamsgrades-value">{exam.subject}</span>
                      </div>
                      <div className="studentexamsgrades-info">
                        <span className="studentexamsgrades-label">Date:</span>
                        <span className="studentexamsgrades-value">{new Date(exam.date).toLocaleDateString()}</span>
                      </div>
                      <div className="studentexamsgrades-info">
                        <span className="studentexamsgrades-label">Time:</span>
                        <span className="studentexamsgrades-value">{exam.time}</span>
                      </div>
                      {exam.marks !== null && (
                        <div className="studentexamsgrades-marks">
                          <span className="studentexamsgrades-marks-label">Marks:</span>
                          <span className="studentexamsgrades-marks-value">{exam.marks}/100</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'grades' && (
          <div className="studentexamsgrades-content">
            <div className="studentexamsgrades-grid">
              {gradesLoading ? (
                <div className="studentexamsgrades-loading">Loading grades...</div>
              ) : grades.length === 0 ? (
                <div className="studentexamsgrades-empty">No grades available.</div>
              ) : (
                grades.map((item, index) => (
                  <div key={index} className="studentexamsgrades-grade-card">
                    <div className="studentexamsgrades-card-header">
                      <h3>{item.subject}</h3>
                    </div>
                    <div className="studentexamsgrades-card-body">
                      <div className="studentexamsgrades-grade-display">
                        <span className={`studentexamsgrades-grade ${getGradeColor(item.grade)}`}>
                          {item.grade}
                        </span>
                      </div>
                      <div className="studentexamsgrades-marks">
                        <div className="studentexamsgrades-marks-item">
                          <span className="studentexamsgrades-label">Marks:</span>
                          <span className="studentexamsgrades-value">{item.marks}/100</span>
                        </div>
                        <div className="studentexamsgrades-marks-item">
                          <span className="studentexamsgrades-label">Percentage:</span>
                          <span className="studentexamsgrades-value">{item.percentage}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentExamsGrades;

