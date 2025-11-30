import React from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './StudentSettings.css';

const StudentSettings = () => {
  const navigationSections = [
    {
      title: 'Profile',
      items: [
        { label: 'Profile', icon: '👤', path: '/student/profile' },
        { label: 'Settings', icon: '⚙️', path: '/student/settings' }
      ]
    }
  ];

  return (
    <DashboardLayout
      pageTitle="Settings"
      pageDescription="Manage your account settings"
      userRole="Student"
      userName="Student User"
      navigationSections={navigationSections}
    >
      <div className="studentsettings-container">
        <div className="studentsettings-card">
          <h3>Account Settings</h3>
          <div className="studentsettings-section">
            <label>Notification Preferences</label>
            <div className="studentsettings-option">
              <input type="checkbox" defaultChecked />
              <span>Email notifications</span>
            </div>
            <div className="studentsettings-option">
              <input type="checkbox" defaultChecked />
              <span>Push notifications</span>
            </div>
          </div>
          <div className="studentsettings-section">
            <button className="studentsettings-btn">Save Changes</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentSettings;

