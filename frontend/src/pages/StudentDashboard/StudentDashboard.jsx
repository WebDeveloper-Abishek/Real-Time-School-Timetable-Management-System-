import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../Components/DashboardLayout/DashboardLayout';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalSubjects: 8,
      todayAttendance: 100,
      upcomingExams: 3,
      pendingAssignments: 5
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
      title: 'My Dashboard',
      items: [
        { label: 'Student Home', icon: '🏠', path: '/student/dashboard' },
        { label: 'My Timetable', icon: '📅', path: '/student/timetable' },
        { label: 'My Classes', icon: '📚', path: '/student/classes' },
        { label: 'Assignments', icon: '📝', path: '/student/assignments' }
      ]
    },
    {
      title: 'Academic',
      items: [
        { label: 'Exams', icon: '✍️', path: '/student/exams' },
        { label: 'Grades', icon: '📊', path: '/student/grades' },
        { label: 'Attendance', icon: '✅', path: '/student/attendance' },
        { label: 'Progress', icon: '📈', path: '/student/progress' }
      ]
    },
    {
      title: 'Support',
      items: [
        { label: 'Counselling', icon: '🧠', path: '/student/counselling' },
        { label: 'Messages', icon: '💬', path: '/student/messages' },
        { label: 'Notifications', icon: '🔔', path: '/student/notifications' }
      ]
    },
    {
      title: 'Profile',
      items: [
        { label: 'Update Profile', icon: '✏️', path: '/student/profile', onClick: handleProfileUpdate },
        { label: 'Settings', icon: '⚙️', path: '/student/settings' }
      ]
    }
  ];

  if (loading) {
    return (
      <DashboardLayout
        pageTitle="Student Dashboard"
        pageDescription="Loading dashboard data..."
        userRole="Student"
        userName="Student User"
        navigationSections={navigationSections}
      >
        <div className="studentdash-loading-container">
          <div className="studentdash-loading">Loading Dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      pageTitle="Student Dashboard"
      pageDescription="Welcome back! Here's your learning journey today."
      userRole="Student"
      userName="Student User"
      navigationSections={navigationSections}
    >
      {/* Quick Stats Cards */}
      <section className="studentdash-stats-section">
        <div className="studentdash-stats-grid">
          <div className="studentdash-stat-card studentdash-primary">
            <div className="studentdash-stat-icon studentdash-subjects">📚</div>
            <div className="studentdash-stat-content">
              <h3 className="studentdash-stat-value">{dashboardData.stats.totalSubjects}</h3>
              <p className="studentdash-stat-label">My Subjects</p>
              <span className="studentdash-stat-change studentdash-info">Active this term</span>
            </div>
          </div>
          
          <div className="studentdash-stat-card studentdash-success">
            <div className="studentdash-stat-icon studentdash-attendance">✅</div>
            <div className="studentdash-stat-content">
              <h3 className="studentdash-stat-value">{dashboardData.stats.todayAttendance}%</h3>
              <p className="studentdash-stat-label">My Attendance</p>
              <span className="studentdash-stat-change studentdash-positive">Excellent record!</span>
            </div>
          </div>
          
          <div className="studentdash-stat-card studentdash-warning">
            <div className="studentdash-stat-icon studentdash-exams">📝</div>
            <div className="studentdash-stat-content">
              <h3 className="studentdash-stat-value">{dashboardData.stats.upcomingExams}</h3>
              <p className="studentdash-stat-label">Upcoming Exams</p>
              <span className="studentdash-stat-change studentdash-warning">Next week</span>
            </div>
          </div>

          <div className="studentdash-stat-card studentdash-info">
            <div className="studentdash-stat-icon studentdash-assignments">📋</div>
            <div className="studentdash-stat-content">
              <h3 className="studentdash-stat-value">{dashboardData.stats.pendingAssignments}</h3>
              <p className="studentdash-stat-label">Pending Tasks</p>
              <span className="studentdash-stat-change studentdash-info">Due this week</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="studentdash-quick-actions-section">
        <h2 className="studentdash-section-title">Quick Actions</h2>
        <div className="studentdash-quick-actions-grid">
          <button className="studentdash-quick-action-card" onClick={go('/student/timetable')}>
            <div className="studentdash-action-icon">📅</div>
            <h3>View Timetable</h3>
            <p>Check your daily schedule</p>
          </button>
          
          <button className="studentdash-quick-action-card" onClick={go('/student/attendance')}>
            <div className="studentdash-action-icon">✅</div>
            <h3>View Attendance</h3>
            <p>Track your attendance record</p>
          </button>
          
          <button className="studentdash-quick-action-card" onClick={go('/student/exams')}>
            <div className="studentdash-action-icon">📝</div>
            <h3>Exam Results</h3>
            <p>View your marks and grades</p>
          </button>
          
          <button className="studentdash-quick-action-card" onClick={go('/student/counselling')}>
            <div className="studentdash-action-icon">🧠</div>
            <h3>Counselling</h3>
            <p>Book counselling sessions</p>
          </button>
          
          <button className="studentdash-quick-action-card" onClick={go('/student/messages')}>
            <div className="studentdash-action-icon">💬</div>
            <h3>Messages</h3>
            <p>Chat with teachers and peers</p>
          </button>
        </div>
      </section>

      {/* 12 Cards Grid Section */}
      <section className="studentdash-cards-grid-section">
        <div className="studentdash-cards-grid">
          <div className="studentdash-card studentdash-card-1">
            <h3>📅 Today's Schedule</h3>
            <button className="studentdash-view-all-btn" onClick={go('/student/timetable')}>View Full Timetable</button>
          </div>
          
          <div className="studentdash-card studentdash-card-2">
            <h3>📚 My Subjects</h3>
            <button className="studentdash-view-all-btn" onClick={go('/student/subjects')}>View All Subjects</button>
          </div>
          
          <div className="studentdash-card studentdash-card-3">
            <h3>✅ Attendance Record</h3>
            <button className="studentdash-view-all-btn" onClick={go('/student/attendance')}>View Details</button>
          </div>
          
          <div className="studentdash-card studentdash-card-4">
            <h3>📝 Exam Schedule</h3>
            <button className="studentdash-view-all-btn" onClick={go('/student/exams')}>View Exams</button>
          </div>

          <div className="studentdash-card studentdash-card-5">
            <h3>📊 My Progress</h3>
            <button className="studentdash-view-all-btn" onClick={go('/student/progress')}>View Reports</button>
          </div>

          <div className="studentdash-card studentdash-card-6">
            <h3>📋 Assignments</h3>
            <button className="studentdash-view-all-btn" onClick={go('/student/assignments')}>View All</button>
          </div>
          
          <div className="studentdash-card studentdash-card-7">
            <h3>🧠 Counselling</h3>
            <button className="studentdash-view-all-btn" onClick={go('/student/counselling')}>Book Session</button>
          </div>
            
          <div className="studentdash-card studentdash-card-8">
            <h3>💬 Messages</h3>
            <button className="studentdash-view-all-btn" onClick={go('/student/messages')}>Open Chat</button>
          </div>
          
          <div className="studentdash-card studentdash-card-9">
            <h3>🔔 Notifications</h3>
            <button className="studentdash-view-all-btn" onClick={go('/student/notifications')}>View All</button>
          </div>
          
          <div className="studentdash-card studentdash-card-10">
            <h3>📖 Study Resources</h3>
            <button className="studentdash-view-all-btn" onClick={go('/student/resources')}>Browse</button>
          </div>
          
          <div className="studentdash-card studentdash-card-11">
            <h3>🎯 Goals & Tasks</h3>
            <button className="studentdash-view-all-btn" onClick={go('/student/goals')}>Manage Tasks</button>
          </div>
          
          <div className="studentdash-card studentdash-card-12">
            <h3>🏆 Achievements</h3>
            <button className="studentdash-view-all-btn" onClick={go('/student/achievements')}>View All</button>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
};

export default StudentDashboard;
