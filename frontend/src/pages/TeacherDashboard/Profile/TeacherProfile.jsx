import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './TeacherProfile.css';

const TeacherProfile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  const navigationSections = [
    {
      title: 'Profile',
      items: [
        { label: 'Update Profile', icon: '✏️', path: '/teacher/profile' },
        { label: 'Settings', icon: '⚙️', path: '/teacher/settings' }
      ]
    }
  ];

  return (
    <DashboardLayout
      pageTitle="My Profile"
      pageDescription="View and manage your profile"
      userRole="Teacher"
      userName={user?.name || 'Teacher User'}
      navigationSections={navigationSections}
    >
      <div className="teacherprofile-container">
        <div className="teacherprofile-card">
          <div className="teacherprofile-header">
            <div className="teacherprofile-avatar">👤</div>
            <h2>{user?.name || 'Teacher Name'}</h2>
            <p className="teacherprofile-role">Teacher</p>
          </div>
          <div className="teacherprofile-body">
            <div className="teacherprofile-info">
              <span className="teacherprofile-label">Email:</span>
              <span className="teacherprofile-value">{user?.email || 'N/A'}</span>
            </div>
            <div className="teacherprofile-info">
              <span className="teacherprofile-label">Phone:</span>
              <span className="teacherprofile-value">{user?.phone || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherProfile;

