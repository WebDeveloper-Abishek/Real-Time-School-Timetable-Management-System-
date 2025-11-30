import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './StudentProgress.css';

const StudentProgress = () => {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const mockProgress = [
        { subject: 'Mathematics', progress: 75, completed: 18, total: 24 },
        { subject: 'English', progress: 80, completed: 16, total: 20 },
        { subject: 'Science', progress: 65, completed: 13, total: 20 },
      ];
      setProgress(mockProgress);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigationSections = [
    {
      title: 'My Dashboard',
      items: [
        { label: 'Student Home', icon: '🏠', path: '/student/dashboard' },
        { label: 'Progress', icon: '📈', path: '/student/progress' }
      ]
    }
  ];

  return (
    <DashboardLayout
      pageTitle="My Progress"
      pageDescription="Track your academic progress"
      userRole="Student"
      userName="Student User"
      navigationSections={navigationSections}
    >
      <div className="studentprogress-container">
        <div className="studentprogress-list">
          {loading ? (
            <div className="studentprogress-loading">Loading progress...</div>
          ) : progress.length === 0 ? (
            <div className="studentprogress-empty">No progress data available.</div>
          ) : (
            progress.map((item, index) => (
              <div key={index} className="studentprogress-card">
                <div className="studentprogress-header">
                  <h3>{item.subject}</h3>
                  <span className="studentprogress-percentage">{item.progress}%</span>
                </div>
                <div className="studentprogress-bar-container">
                  <div className="studentprogress-bar" style={{ width: `${item.progress}%` }}></div>
                </div>
                <div className="studentprogress-details">
                  <span>Completed: {item.completed} / {item.total} lessons</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentProgress;

