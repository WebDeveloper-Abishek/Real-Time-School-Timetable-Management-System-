import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './StudentGrades.css';

const StudentGrades = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      // Mock data
      const mockGrades = [
        { subject: 'Mathematics', grade: 'A', marks: 92, percentage: 92 },
        { subject: 'English', grade: 'B+', marks: 87, percentage: 87 },
        { subject: 'Science', grade: 'A-', marks: 89, percentage: 89 },
        { subject: 'History', grade: 'B', marks: 83, percentage: 83 },
      ];
      setGrades(mockGrades);
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'studentgrades-grade-excellent';
    if (grade.startsWith('B')) return 'studentgrades-grade-good';
    if (grade.startsWith('C')) return 'studentgrades-grade-average';
    return 'studentgrades-grade-poor';
  };

  const navigationSections = [
    {
      title: 'My Dashboard',
      items: [
        { label: 'Student Home', icon: '🏠', path: '/student/dashboard' },
        { label: 'Grades', icon: '📊', path: '/student/grades' },
        { label: 'Exams', icon: '✍️', path: '/student/exams' }
      ]
    }
  ];

  return (
    <DashboardLayout
      pageTitle="My Grades"
      pageDescription="View your academic performance"
      userRole="Student"
      userName="Student User"
      navigationSections={navigationSections}
    >
      <div className="studentgrades-container">
        <div className="studentgrades-grid">
          {loading ? (
            <div className="studentgrades-loading">Loading grades...</div>
          ) : grades.length === 0 ? (
            <div className="studentgrades-empty">No grades available.</div>
          ) : (
            grades.map((item, index) => (
              <div key={index} className="studentgrades-card">
                <div className="studentgrades-card-header">
                  <h3>{item.subject}</h3>
                </div>
                <div className="studentgrades-card-body">
                  <div className="studentgrades-grade-display">
                    <span className={`studentgrades-grade ${getGradeColor(item.grade)}`}>
                      {item.grade}
                    </span>
                  </div>
                  <div className="studentgrades-marks">
                    <div className="studentgrades-marks-item">
                      <span className="studentgrades-label">Marks:</span>
                      <span className="studentgrades-value">{item.marks}/100</span>
                    </div>
                    <div className="studentgrades-marks-item">
                      <span className="studentgrades-label">Percentage:</span>
                      <span className="studentgrades-value">{item.percentage}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentGrades;

