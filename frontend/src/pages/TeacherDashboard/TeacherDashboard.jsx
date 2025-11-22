import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../Components/DashboardLayout/DashboardLayout';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalClasses: 5,
      todayPeriods: 6,
      pendingReplacements: 2,
      leaveBalance: 12
    }
  });
  const [loading, setLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    // Fetch dashboard data
    setLoading(false);
  }, []);

  const handleProfileUpdate = () => {
    setShowProfileModal(true);
  };

  const go = (path) => () => navigate(path);

  const navigationSections = [
    {
      title: 'My Teaching',
      items: [
        { label: 'Teacher Home', icon: '🏠', path: '/teacher/dashboard' },
        { label: 'My Classes', icon: '📚', path: '/teacher/classes' },
        { label: 'Timetable', icon: '📅', path: '/teacher/timetable' },
        { label: 'Students', icon: '🎓', path: '/teacher/students' }
      ]
    },
    {
      title: 'Academic',
      items: [
        { label: 'Assignments', icon: '📝', path: '/teacher/assignments' },
        { label: 'Exams', icon: '✍️', path: '/teacher/exams' },
        { label: 'Grades', icon: '📊', path: '/teacher/grades' },
        { label: 'Attendance', icon: '✅', path: '/teacher/attendance' }
      ]
    },
    {
      title: 'Leave & Duties',
      items: [
        { label: 'Leave Requests', icon: '🏖️', path: '/teacher/leaves' },
        { label: 'Replacements', icon: '🔄', path: '/teacher/replacements' },
        { label: 'Duties', icon: '⚡', path: '/teacher/duties' }
      ]
    },
    {
      title: 'Profile',
      items: [
        { label: 'Update Profile', icon: '✏️', path: '/teacher/profile', onClick: handleProfileUpdate },
        { label: 'Settings', icon: '⚙️', path: '/teacher/settings' }
      ]
    }
  ];

  if (loading) {
    return (
      <DashboardLayout
        pageTitle="Teacher Dashboard"
        pageDescription="Loading dashboard data..."
        userRole="Teacher"
        userName="Teacher User"
        navigationSections={navigationSections}
      >
        <div className="teacherdash-loading-container">
          <div className="teacherdash-loading">Loading Dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      pageTitle="Teacher Dashboard"
      pageDescription="Welcome back! Here's your teaching schedule today."
      userRole="Teacher"
      userName="Teacher User"
      navigationSections={navigationSections}
    >
      {/* Quick Stats Cards */}
      <section className="teacherdash-stats-section">
        <div className="teacherdash-stats-grid">
          <div className="teacherdash-stat-card teacherdash-primary">
            <div className="teacherdash-stat-icon teacherdash-classes">🏫</div>
            <div className="teacherdash-stat-content">
              <h3 className="teacherdash-stat-value">{dashboardData.stats.totalClasses}</h3>
              <p className="teacherdash-stat-label">My Classes</p>
              <span className="teacherdash-stat-change teacherdash-info">Active this term</span>
            </div>
          </div>
          
          <div className="teacherdash-stat-card teacherdash-success">
            <div className="teacherdash-stat-icon teacherdash-periods">📅</div>
            <div className="teacherdash-stat-content">
              <h3 className="teacherdash-stat-value">{dashboardData.stats.todayPeriods}</h3>
              <p className="teacherdash-stat-label">Today's Periods</p>
              <span className="teacherdash-stat-change teacherdash-positive">Full schedule</span>
            </div>
          </div>
          
          <div className="teacherdash-stat-card teacherdash-warning">
            <div className="teacherdash-stat-icon teacherdash-replacements">🔄</div>
            <div className="teacherdash-stat-content">
              <h3 className="teacherdash-stat-value">{dashboardData.stats.pendingReplacements}</h3>
              <p className="teacherdash-stat-label">Replacement Duties</p>
              <span className="teacherdash-stat-change teacherdash-warning">Action needed</span>
            </div>
          </div>

          <div className="teacherdash-stat-card teacherdash-info">
            <div className="teacherdash-stat-icon teacherdash-leave">🏖️</div>
            <div className="teacherdash-stat-content">
              <h3 className="teacherdash-stat-value">{dashboardData.stats.leaveBalance}</h3>
              <p className="teacherdash-stat-label">Leave Balance</p>
              <span className="teacherdash-stat-change teacherdash-info">Days available</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="teacherdash-quick-actions-section">
        <h2 className="teacherdash-section-title">Quick Actions</h2>
        <div className="teacherdash-quick-actions-grid">
          <button className="teacherdash-quick-action-card" onClick={go('/teacher/timetable')}>
            <div className="teacherdash-action-icon">📅</div>
            <h3>View Timetable</h3>
            <p>Check your teaching schedule</p>
          </button>
          
          <button className="teacherdash-quick-action-card" onClick={go('/teacher/mark-attendance')}>
            <div className="teacherdash-action-icon">✅</div>
            <h3>Mark Attendance</h3>
            <p>Record student attendance</p>
          </button>
          
          <button className="teacherdash-quick-action-card" onClick={go('/teacher/enter-marks')}>
            <div className="teacherdash-action-icon">📊</div>
            <h3>Enter Marks</h3>
            <p>Record exam marks and grades</p>
          </button>
          
          <button className="teacherdash-quick-action-card" onClick={go('/teacher/request-leave')}>
            <div className="teacherdash-action-icon">🏖️</div>
            <h3>Request Leave</h3>
            <p>Submit leave application</p>
          </button>
          
          <button className="teacherdash-quick-action-card" onClick={go('/teacher/messages')}>
            <div className="teacherdash-action-icon">💬</div>
            <h3>Messages</h3>
            <p>Chat with students and parents</p>
          </button>
        </div>
      </section>

      {/* 12 Cards Grid Section */}
      <section className="teacherdash-cards-grid-section">
        <div className="teacherdash-cards-grid">
          <div className="teacherdash-card teacherdash-card-1">
            <h3>📅 Today's Schedule</h3>
            <button className="teacherdash-view-all-btn" onClick={go('/teacher/timetable')}>View Full Timetable</button>
          </div>
          
          <div className="teacherdash-card teacherdash-card-2">
            <h3>🏫 My Classes</h3>
            <button className="teacherdash-view-all-btn" onClick={go('/teacher/classes')}>View All Classes</button>
          </div>
          
          <div className="teacherdash-card teacherdash-card-3">
            <h3>📚 My Subjects</h3>
            <button className="teacherdash-view-all-btn" onClick={go('/teacher/subjects')}>View Subjects</button>
          </div>
          
          <div className="teacherdash-card teacherdash-card-4">
            <h3>📊 Course Progress</h3>
            <button className="teacherdash-view-all-btn" onClick={go('/teacher/course-progress')}>View Progress</button>
          </div>
          
          <div className="teacherdash-card teacherdash-card-5">
            <h3>✅ Attendance Records</h3>
            <button className="teacherdash-view-all-btn" onClick={go('/teacher/attendance-reports')}>View Reports</button>
          </div>
          
          <div className="teacherdash-card teacherdash-card-6">
            <h3>📝 Exam Schedule</h3>
            <button className="teacherdash-view-all-btn" onClick={go('/teacher/exam-schedule')}>View Exams</button>
          </div>
          
          <div className="teacherdash-card teacherdash-card-7">
            <h3>📊 Enter Marks</h3>
            <button className="teacherdash-view-all-btn" onClick={go('/teacher/enter-marks')}>Record Marks</button>
          </div>
          
          <div className="teacherdash-card teacherdash-card-8">
            <h3>🏖️ Leave Management</h3>
            <button className="teacherdash-view-all-btn" onClick={go('/teacher/request-leave')}>Manage Leaves</button>
          </div>
          
          <div className="teacherdash-card teacherdash-card-9">
            <h3>🔄 Replacements</h3>
            <button className="teacherdash-view-all-btn" onClick={go('/teacher/replacements')}>View Duties</button>
          </div>
          
          <div className="teacherdash-card teacherdash-card-10">
            <h3>💬 Messages</h3>
            <button className="teacherdash-view-all-btn" onClick={go('/teacher/messages')}>Open Chat</button>
          </div>
          
          <div className="teacherdash-card teacherdash-card-11">
            <h3>🔔 Notifications</h3>
            <button className="teacherdash-view-all-btn" onClick={go('/teacher/notifications')}>View All</button>
          </div>
          
          <div className="teacherdash-card teacherdash-card-12">
            <h3>🤝 Parent Meetings</h3>
            <button className="teacherdash-view-all-btn" onClick={go('/teacher/meetings')}>Schedule Meeting</button>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
