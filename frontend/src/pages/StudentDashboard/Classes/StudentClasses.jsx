import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './StudentClasses.css';

const StudentClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.class_id) {
        const response = await fetch(`http://localhost:5000/api/admin/classes/${user.class_id}`);
        const data = await response.json();
        if (data.success) {
          setClasses([data.class]);
        }
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigationSections = [
    {
      title: 'My Dashboard',
      items: [
        { label: 'Student Home', icon: '🏠', path: '/student/dashboard' },
        { label: 'My Timetable', icon: '📅', path: '/student/timetable' },
        { label: 'My Classes', icon: '📚', path: '/student/classes' },
        { label: 'Assignments', icon: '📝', path: '/student/assignments' }
      ]
    }
  ];

  if (loading) {
    return (
      <DashboardLayout
        pageTitle="My Classes"
        pageDescription="View your enrolled classes"
        userRole="Student"
        userName="Student User"
        navigationSections={navigationSections}
      >
        <div className="studentclasses-loading">Loading classes...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      pageTitle="My Classes"
      pageDescription="View your enrolled classes and subjects"
      userRole="Student"
      userName="Student User"
      navigationSections={navigationSections}
    >
      <div className="studentclasses-container">
        <div className="studentclasses-grid">
          {classes.map((classItem) => (
            <div key={classItem._id} className="studentclasses-card">
              <div className="studentclasses-card-header">
                <h3>{classItem.class_name}</h3>
                <span className="studentclasses-badge">Active</span>
              </div>
              <div className="studentclasses-card-body">
                <div className="studentclasses-info">
                  <span className="studentclasses-label">Grade:</span>
                  <span className="studentclasses-value">{classItem.grade || 'N/A'}</span>
                </div>
                <div className="studentclasses-info">
                  <span className="studentclasses-label">Section:</span>
                  <span className="studentclasses-value">{classItem.section || 'N/A'}</span>
                </div>
                <div className="studentclasses-info">
                  <span className="studentclasses-label">Class Teacher:</span>
                  <span className="studentclasses-value">{classItem.class_teacher?.name || 'TBA'}</span>
                </div>
              </div>
              <div className="studentclasses-card-footer">
                <button className="studentclasses-btn" onClick={() => navigate('/student/timetable')}>
                  View Timetable
                </button>
              </div>
            </div>
          ))}
          {classes.length === 0 && (
            <div className="studentclasses-empty">
              <p>No classes found. Please contact your administrator.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentClasses;

