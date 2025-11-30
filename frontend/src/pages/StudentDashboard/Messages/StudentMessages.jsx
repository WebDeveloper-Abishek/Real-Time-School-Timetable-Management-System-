import React from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import StudentChat from '../Chat/StudentChat';
import './StudentMessages.css';

const StudentMessages = () => {
  const navigationSections = [
    {
      title: 'Communication',
      items: [
        { label: 'Messages', icon: '💬', path: '/student/messages' },
        { label: 'Chat Center', icon: '💬', path: '/student/chat' }
      ]
    }
  ];

  return (
    <DashboardLayout
      pageTitle="Messages"
      pageDescription="View your messages"
      userRole="Student"
      userName="Student User"
      navigationSections={navigationSections}
    >
      <div className="studentmessages-container">
        <StudentChat />
      </div>
    </DashboardLayout>
  );
};

export default StudentMessages;

