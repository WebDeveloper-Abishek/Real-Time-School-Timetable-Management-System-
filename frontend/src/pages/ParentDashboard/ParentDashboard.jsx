import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../Components/DashboardLayout/DashboardLayout';
import ProfileUpdateModal from '../../Components/ProfileUpdateModal/ProfileUpdateModal';
import './ParentDashboard.css';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalChildren: 0,
      averageAttendance: 0,
      upcomingMeetings: 0,
      unreadMessages: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      
      if (!userId) {
        setLoading(false);
        return;
      }

      const stats = {
        totalChildren: 0,
        averageAttendance: 0,
        upcomingMeetings: 0,
        unreadMessages: 0
      };

      try {
        const { parentAPI } = await import('../../services/api');
        const childrenResponse = await parentAPI.getParentChildren();
        
        if (childrenResponse?.success) {
          const children = childrenResponse.children || [];
          stats.totalChildren = children.length;
          
          if (children.length > 0) {
            let totalAttendance = 0;
            let count = 0;
            
            for (const child of children) {
              try {
                const attendanceResponse = await fetch(`http://localhost:5000/api/attendance/student?student_id=${child._id || child.id}`, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                  }
                });
                
                if (attendanceResponse.ok) {
                  const attendanceData = await attendanceResponse.json();
                  if (attendanceData?.statistics?.presentPercentage) {
                    totalAttendance += parseFloat(attendanceData.statistics.presentPercentage);
                    count++;
                  }
                }
              } catch (error) {
                console.error('Error fetching child attendance:', error);
              }
            }
            
            stats.averageAttendance = count > 0 ? Math.round(totalAttendance / count) : 0;
          }
        }
      } catch (error) {
        console.error('Error fetching children:', error);
      }

      setDashboardData({ stats });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = () => {
    setShowProfileModal(true);
  };

  const handleProfileClose = () => {
    setShowProfileModal(false);
  };

  const handleProfileUpdated = (updatedUser) => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUserData = { ...currentUser, ...updatedUser };
    localStorage.setItem('user', JSON.stringify(updatedUserData));
    setShowProfileModal(false);
  };

  const go = (path) => () => navigate(path);

  const navigationSections = [
    {
      title: 'My Children',
      items: [
        { label: 'Parent Home', icon: '🏠', path: '/parent/dashboard' },
        { label: 'My Children', icon: '👨‍👩‍👧‍👦', path: '/parent/children' },
        { label: 'Attendance', icon: '✅', path: '/parent/attendance' },
        { label: 'Academic Progress', icon: '📊', path: '/parent/progress' }
      ]
    },
    {
      title: 'Profile',
      items: [
        { label: 'Update Profile', icon: '✏️', path: '/parent/profile', onClick: handleProfileUpdate },
      ]
    }
  ];

  if (loading) {
    return (
      <DashboardLayout
        pageTitle="Parent Dashboard"
        pageDescription="Loading dashboard data..."
        userRole="Parent"
        userName={user?.name || "Parent User"}
        navigationSections={navigationSections}
      >
        <div className="parentdash-loading-container">
          <div className="parentdash-loading">Loading Dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      pageTitle="Parent Dashboard"
      pageDescription="Welcome back! Here's your family's educational journey."
      userRole="Parent"
      userName={user?.name || "Parent User"}
      navigationSections={navigationSections}
    >
      {/* Quick Stats Cards */}
      <section className="parentdash-stats-section">
        <div className="parentdash-stats-grid">
          <div className="parentdash-stat-card parentdash-primary">
            <div className="parentdash-stat-icon parentdash-children">👶</div>
            <div className="parentdash-stat-content">
              <h3 className="parentdash-stat-value">{dashboardData.stats.totalChildren}</h3>
              <p className="parentdash-stat-label">My Children</p>
              <span className="parentdash-stat-change parentdash-info">Linked accounts</span>
            </div>
          </div>

          <div className="parentdash-stat-card parentdash-success">
            <div className="parentdash-stat-icon parentdash-attendance">✅</div>
            <div className="parentdash-stat-content">
              <h3 className="parentdash-stat-value">{dashboardData.stats.averageAttendance}%</h3>
              <p className="parentdash-stat-label">Avg Attendance</p>
              <span className="parentdash-stat-change parentdash-positive">Excellent!</span>
            </div>
          </div>
              
          <div className="parentdash-stat-card parentdash-warning">
            <div className="parentdash-stat-icon parentdash-meetings">🤝</div>
            <div className="parentdash-stat-content">
              <h3 className="parentdash-stat-value">{dashboardData.stats.upcomingMeetings}</h3>
              <p className="parentdash-stat-label">Upcoming Meetings</p>
              <span className="parentdash-stat-change parentdash-warning">This week</span>
            </div>
          </div>
          
          <div className="parentdash-stat-card parentdash-info">
            <div className="parentdash-stat-icon parentdash-messages">💬</div>
            <div className="parentdash-stat-content">
              <h3 className="parentdash-stat-value">{dashboardData.stats.unreadMessages}</h3>
              <p className="parentdash-stat-label">Unread Messages</p>
              <span className="parentdash-stat-change parentdash-info">From teachers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="parentdash-quick-actions-section">
        <h2 className="parentdash-section-title">Quick Actions</h2>
        <div className="parentdash-quick-actions-grid">
          <button className="parentdash-quick-action-card" onClick={go('/parent/children')}>
            <div className="parentdash-action-icon">👶</div>
            <h3>View Children</h3>
            <p>Access children profiles</p>
          </button>
          
          <button className="parentdash-quick-action-card" onClick={go('/parent/attendance')}>
            <div className="parentdash-action-icon">✅</div>
            <h3>Attendance</h3>
            <p>Track attendance records</p>
          </button>
          
          <button className="parentdash-quick-action-card" onClick={go('/parent/exam-results')}>
            <div className="parentdash-action-icon">📝</div>
            <h3>Exam Results</h3>
            <p>View marks and grades</p>
          </button>
          
          <button className="parentdash-quick-action-card" onClick={go('/parent/meetings')}>
            <div className="parentdash-action-icon">🤝</div>
            <h3>Meetings</h3>
            <p>Schedule teacher meetings</p>
          </button>
          
          <button className="parentdash-quick-action-card" onClick={go('/parent/messages')}>
            <div className="parentdash-action-icon">💬</div>
            <h3>Messages</h3>
            <p>Chat with teachers</p>
          </button>
        </div>
      </section>

      {/* 12 Cards Grid Section */}
      <section className="parentdash-cards-grid-section">
        <div className="parentdash-cards-grid">
          <div className="parentdash-card parentdash-card-1">
            <h3>👶 My Children</h3>
            <button className="parentdash-view-all-btn" onClick={go('/parent/children')}>View Profiles</button>
          </div>
          
          <div className="parentdash-card parentdash-card-2">
            <h3>📅 Timetables</h3>
            <button className="parentdash-view-all-btn" onClick={go('/parent/timetables')}>View Schedules</button>
          </div>
          
          <div className="parentdash-card parentdash-card-3">
            <h3>✅ Attendance</h3>
            <button className="parentdash-view-all-btn" onClick={go('/parent/attendance')}>View Records</button>
          </div>
          
          <div className="parentdash-card parentdash-card-4">
            <h3>📝 Exam Results</h3>
            <button className="parentdash-view-all-btn" onClick={go('/parent/exam-results')}>View Marks</button>
          </div>
          
          <div className="parentdash-card parentdash-card-5">
            <h3>📈 Progress Reports</h3>
            <button className="parentdash-view-all-btn" onClick={go('/parent/progress')}>View Progress</button>
          </div>

          <div className="parentdash-card parentdash-card-6">
            <h3>🧠 Counselling</h3>
            <button className="parentdash-view-all-btn" onClick={go('/parent/counselling')}>View Updates</button>
          </div>
          
          <div className="parentdash-card parentdash-card-7">
            <h3>💬 Messages</h3>
            <button className="parentdash-view-all-btn" onClick={go('/parent/messages')}>Open Chat</button>
          </div>
            
          <div className="parentdash-card parentdash-card-8">
            <h3>🔔 Notifications</h3>
            <button className="parentdash-view-all-btn" onClick={go('/parent/notifications')}>View All</button>
          </div>
          
          <div className="parentdash-card parentdash-card-9">
            <h3>🤝 Meetings</h3>
            <button className="parentdash-view-all-btn" onClick={go('/parent/meetings')}>Schedule</button>
          </div>
          
          <div className="parentdash-card parentdash-card-10">
            <h3>📢 Announcements</h3>
            <button className="parentdash-view-all-btn" onClick={go('/parent/announcements')}>View All</button>
          </div>
          
          <div className="parentdash-card parentdash-card-11">
            <h3>💰 Fee Payments</h3>
            <button className="parentdash-view-all-btn" onClick={go('/parent/fee-payments')}>Make Payment</button>
          </div>
          
          <div className="parentdash-card parentdash-card-12">
            <h3>💳 Payment History</h3>
            <button className="parentdash-view-all-btn" onClick={go('/parent/payment-history')}>View History</button>
          </div>
        </div>
      </section>

      <ProfileUpdateModal
        isOpen={showProfileModal}
        onClose={handleProfileClose}
        onUpdate={handleProfileUpdated}
      />
    </DashboardLayout>
  );
};

export default ParentDashboard;
