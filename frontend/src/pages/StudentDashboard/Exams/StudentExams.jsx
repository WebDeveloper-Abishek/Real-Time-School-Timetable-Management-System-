import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './StudentExams.css';

const StudentExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('upcoming');

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      // Mock data
      const mockExams = [
        { id: 1, name: 'Mid-Term Exam', subject: 'Mathematics', date: '2025-01-15', time: '09:00 AM', marks: null, status: 'upcoming' },
        { id: 2, name: 'Mid-Term Exam', subject: 'English', date: '2025-01-16', time: '09:00 AM', marks: null, status: 'upcoming' },
        { id: 3, name: 'Quiz Test', subject: 'Science', date: '2024-12-10', time: '10:00 AM', marks: 85, status: 'completed' },
      ];
      setExams(mockExams);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = view === 'all' 
    ? exams 
    : exams.filter(e => e.status === view);

  const navigationSections = [
    {
      title: 'My Dashboard',
      items: [
        { label: 'Student Home', icon: '🏠', path: '/student/dashboard' },
        { label: 'Exams', icon: '✍️', path: '/student/exams' },
        { label: 'Grades', icon: '📊', path: '/student/grades' }
      ]
    }
  ];

  return (
    <DashboardLayout
      pageTitle="Exams"
      pageDescription="View your exam schedule and results"
      userRole="Student"
      userName="Student User"
      navigationSections={navigationSections}
    >
      <div className="studentexams-container">
        <div className="studentexams-header">
          <div className="studentexams-tabs">
            <button className={view === 'upcoming' ? 'studentexams-tab-active' : 'studentexams-tab'} onClick={() => setView('upcoming')}>
              Upcoming
            </button>
            <button className={view === 'completed' ? 'studentexams-tab-active' : 'studentexams-tab'} onClick={() => setView('completed')}>
              Completed
            </button>
            <button className={view === 'all' ? 'studentexams-tab-active' : 'studentexams-tab'} onClick={() => setView('all')}>
              All
            </button>
          </div>
        </div>

        <div className="studentexams-grid">
          {loading ? (
            <div className="studentexams-loading">Loading exams...</div>
          ) : filteredExams.length === 0 ? (
            <div className="studentexams-empty">No exams found.</div>
          ) : (
            filteredExams.map((exam) => (
              <div key={exam.id} className="studentexams-card">
                <div className="studentexams-card-header">
                  <h3>{exam.name}</h3>
                  <span className={`studentexams-badge studentexams-badge-${exam.status}`}>
                    {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                  </span>
                </div>
                <div className="studentexams-card-body">
                  <div className="studentexams-info">
                    <span className="studentexams-label">Subject:</span>
                    <span className="studentexams-value">{exam.subject}</span>
                  </div>
                  <div className="studentexams-info">
                    <span className="studentexams-label">Date:</span>
                    <span className="studentexams-value">{new Date(exam.date).toLocaleDateString()}</span>
                  </div>
                  <div className="studentexams-info">
                    <span className="studentexams-label">Time:</span>
                    <span className="studentexams-value">{exam.time}</span>
                  </div>
                  {exam.marks !== null && (
                    <div className="studentexams-marks">
                      <span className="studentexams-marks-label">Marks:</span>
                      <span className="studentexams-marks-value">{exam.marks}/100</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentExams;

