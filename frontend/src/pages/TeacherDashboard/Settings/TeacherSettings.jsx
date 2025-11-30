import React from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './TeacherSettings.css';

const TeacherSettings = () => {
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
      pageTitle="Settings"
      pageDescription="Manage your account settings"
      userRole="Teacher"
      userName="Teacher User"
      navigationSections={navigationSections}
    >
      <div className="teachersettings-container">
        <div className="teachersettings-card">
          <h3>Account Settings</h3>
          <div className="teachersettings-section">
            <label>Notification Preferences</label>
            <div className="teachersettings-option">
              <input type="checkbox" defaultChecked />
              <span>Email notifications</span>
            </div>
          </div>
          <div className="teachersettings-section">
            <button className="teachersettings-btn">Save Changes</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherSettings;

