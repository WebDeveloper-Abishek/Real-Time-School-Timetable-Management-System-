import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './StudentNotifications.css';

const StudentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const mockNotifications = [
        { id: 1, title: 'New Assignment', message: 'Mathematics homework assigned', time: '2 hours ago', read: false },
        { id: 2, title: 'Exam Schedule', message: 'Mid-term exams start next week', time: '1 day ago', read: false },
        { id: 3, title: 'Class Cancelled', message: 'Science class cancelled for today', time: '2 days ago', read: true },
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigationSections = [
    {
      title: 'Communication',
      items: [
        { label: 'Notifications', icon: '🔔', path: '/student/notifications' }
      ]
    }
  ];

  return (
    <DashboardLayout
      pageTitle="Notifications"
      pageDescription="View your notifications"
      userRole="Student"
      userName="Student User"
      navigationSections={navigationSections}
    >
      <div className="studentnotifications-container">
        <div className="studentnotifications-list">
          {loading ? (
            <div className="studentnotifications-loading">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="studentnotifications-empty">No notifications.</div>
          ) : (
            notifications.map((notif) => (
              <div key={notif.id} className={`studentnotifications-card ${notif.read ? 'studentnotifications-read' : ''}`}>
                <div className="studentnotifications-content">
                  <h3>{notif.title}</h3>
                  <p>{notif.message}</p>
                  <span className="studentnotifications-time">{notif.time}</span>
                </div>
                {!notif.read && <div className="studentnotifications-unread-dot"></div>}
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentNotifications;

