import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../Components/DashboardLayout/DashboardLayout';
import { teacherNavigationSections } from '../../config/teacherNavigation';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
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
        </div>
      </section>

      {/* Teacher Tools Section */}
      <section className="teacherdash-cards-grid-section">
        <div className="teacherdash-cards-grid">
          <div className="teacherdash-card">
            <div className="teacherdash-card-icon">🏫</div>
            <h3>My Classes</h3>
            <p>All grades and sections assigned to you.</p>
            <button className="teacherdash-view-all-btn" onClick={go('/teacher/classes')}>View Classes</button>
          </div>

          <div className="teacherdash-card">
            <div className="teacherdash-card-icon">🏖️</div>
            <h3>Leave Management</h3>
            <p>Request time off and track approvals.</p>
            <button className="teacherdash-view-all-btn" onClick={go('/teacher/request-leave')}>Manage Leave</button>
          </div>

          <div className="teacherdash-card">
            <div className="teacherdash-card-icon">✅</div>
            <h3>Attendance Records</h3>
            <p>Review daily and period-level attendance.</p>
            <button className="teacherdash-view-all-btn" onClick={go('/teacher/attendance-reports')}>View Reports</button>
          </div>

          <div className="teacherdash-card">
            <div className="teacherdash-card-icon">📝</div>
            <h3>Exam Schedule</h3>
            <p>Stay ahead of upcoming assessments.</p>
            <button className="teacherdash-view-all-btn" onClick={go('/teacher/exam-schedule')}>View Exams</button>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
