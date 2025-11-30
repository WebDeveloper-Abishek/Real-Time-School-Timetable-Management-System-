import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './StudentProfile.css';

const StudentProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    setLoading(false);
  }, []);

  const navigationSections = [
    {
      title: 'Profile',
      items: [
        { label: 'Profile', icon: '👤', path: '/student/profile' },
        { label: 'Settings', icon: '⚙️', path: '/student/settings' }
      ]
    }
  ];

  if (loading || !user) {
    return (
      <DashboardLayout
        pageTitle="Profile"
        pageDescription="View your profile"
        userRole="Student"
        userName="Student User"
        navigationSections={navigationSections}
      >
        <div className="studentprofile-loading">Loading profile...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      pageTitle="My Profile"
      pageDescription="View and manage your profile"
      userRole="Student"
      userName={user.name || 'Student User'}
      navigationSections={navigationSections}
    >
      <div className="studentprofile-container">
        <div className="studentprofile-card">
          <div className="studentprofile-header">
            <div className="studentprofile-avatar">👤</div>
            <h2>{user.name || 'Student Name'}</h2>
            <p className="studentprofile-role">Student</p>
          </div>
          <div className="studentprofile-body">
            <div className="studentprofile-info">
              <span className="studentprofile-label">Email:</span>
              <span className="studentprofile-value">{user.email || 'N/A'}</span>
            </div>
            <div className="studentprofile-info">
              <span className="studentprofile-label">Phone:</span>
              <span className="studentprofile-value">{user.phone || 'N/A'}</span>
            </div>
            <div className="studentprofile-info">
              <span className="studentprofile-label">Class:</span>
              <span className="studentprofile-value">{user.class_name || 'N/A'}</span>
            </div>
          </div>
          <div className="studentprofile-footer">
            <button className="studentprofile-btn">Edit Profile</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentProfile;

