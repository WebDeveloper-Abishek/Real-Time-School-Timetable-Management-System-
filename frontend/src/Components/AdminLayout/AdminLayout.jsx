import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo_light from '../../assets/logo-white.png';
import ProfileUpdateModal from '../ProfileUpdateModal/ProfileUpdateModal';
import NotificationSystem from '../NotificationSystem/NotificationSystem';
import ChatCenter from '../ChatCenter/ChatCenter';
import './AdminLayout.css';

const AdminLayout = ({ children, pageTitle = "Admin Dashboard", pageDescription = "Welcome back! Here's what's happening today." }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notificationRefreshKey, setNotificationRefreshKey] = useState(0);

  const go = (path) => () => navigate(path);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleProfileUpdate = () => {
    setShowProfileModal(true);
  };

  const handleProfileUpdateSuccess = (updatedUser) => {
    // You can add logic here to update the user info in the header
    console.log('Profile updated:', updatedUser);
  };

  const handleNotificationRefresh = () => {
    setNotificationRefreshKey(prev => prev + 1);
  };

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Navigate to login page
    navigate('/login');
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          <div className="sidebar-header">
            <div className="sidebar-user-info">
              <div className="sidebar-avatar">👤</div>
              <div className="sidebar-user-details">
                <span className="sidebar-user-name">Admin User</span>
                <span className="sidebar-user-role">Administrator</span>
              </div>
            </div>
            <button className="sidebar-close" onClick={closeSidebar}>
              <span>×</span>
            </button>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section">
              <h3 className="nav-title">Dashboard</h3>
              <ul className="nav-list">
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/dashboard')}>
                    <span className="nav-icon">📊</span>
                    <span>Main Dashboard</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/overview')}>
                    <span className="nav-icon">👁️</span>
                    <span>System Overview</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/real-time')}>
                    <span className="nav-icon">⚡</span>
                    <span>Real-time Monitoring</span>
                  </button>
                </li>
              </ul>
            </div>

            <div className="nav-section">
              <h3 className="nav-title">Profile</h3>
              <ul className="nav-list">
                <li className="nav-item">
                  <button className="nav-link" onClick={handleProfileUpdate}>
                    <span className="nav-icon">✏️</span>
                    <span>Update Profile</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/settings')}>
                    <span className="nav-icon">⚙️</span>
                    <span>Settings</span>
                  </button>
                </li>
              </ul>
            </div>

            <div className="nav-section">
              <h3 className="nav-title">User Management</h3>
              <ul className="nav-list">
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/users')}>
                    <span className="nav-icon">👥</span>
                    <span>All Users</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/users/students')}>
                    <span className="nav-icon">🎓</span>
                    <span>Students</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/users/teachers')}>
                    <span className="nav-icon">👨‍🏫</span>
                    <span>Teachers</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/users/parents')}>
                    <span className="nav-icon">👨‍👩‍👧‍👦</span>
                    <span>Parents</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/users/counsellors')}>
                    <span className="nav-icon">👨‍⚕️</span>
                    <span>Counsellors</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/roles')}>
                    <span className="nav-icon">🔐</span>
                    <span>Roles & Permissions</span>
                  </button>
                </li>
              </ul>
            </div>

            <div className="nav-section">
              <h3 className="nav-title">Academic Management</h3>
              <ul className="nav-list">
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/academic-years')}>
                    <span className="nav-icon">📅</span>
                    <span>Academic Years</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/terms')}>
                    <span className="nav-icon">📖</span>
                    <span>Terms</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/subjects')}>
                    <span className="nav-icon">📚</span>
                    <span>Subjects</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/classes')}>
                    <span className="nav-icon">🏫</span>
                    <span>Classes & Sections</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/assignments')}>
                    <span className="nav-icon">👥</span>
                    <span>Teacher-Student Assignments</span>
                  </button>
                </li>
              </ul>
            </div>

            <div className="nav-section">
              <h3 className="nav-title">Timetable Management</h3>
              <ul className="nav-list">
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/timetable-generator')}>
                    <span className="nav-icon">⚡</span>
                    <span>Timetable Generator</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/timetable-view')}>
                    <span className="nav-icon">👀</span>
                    <span>View Timetables</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/schedule-conflicts')}>
                    <span className="nav-icon">⚠️</span>
                    <span>Resolve Conflicts</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/exam-schedule')}>
                    <span className="nav-icon">📝</span>
                    <span>Exam Scheduling</span>
                  </button>
                </li>
              </ul>
            </div>

            <div className="nav-section">
              <h3 className="nav-title">Leave Management</h3>
              <ul className="nav-list">
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/leave-requests')}>
                    <span className="nav-icon">🏖️</span>
                    <span>Leave Requests</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/replacement-management')}>
                    <span className="nav-icon">🔄</span>
                    <span>Replacement Management</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/force-assignments')}>
                    <span className="nav-icon">⚡</span>
                    <span>Force Assignments</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/leave-tracking')}>
                    <span className="nav-icon">📊</span>
                    <span>Leave Analytics</span>
                  </button>
                </li>
              </ul>
            </div>

            <div className="nav-section">
              <h3 className="nav-title">Attendance Management</h3>
              <ul className="nav-list">
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/attendance-tracking')}>
                    <span className="nav-icon">✅</span>
                    <span>Attendance Tracking</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/attendance-reports')}>
                    <span className="nav-icon">📈</span>
                    <span>Attendance Reports</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/teacher-attendance')}>
                    <span className="nav-icon">👨‍🏫</span>
                    <span>Teacher Attendance</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/student-attendance')}>
                    <span className="nav-icon">🎓</span>
                    <span>Student Attendance</span>
                  </button>
                </li>
              </ul>
            </div>

            <div className="nav-section">
              <h3 className="nav-title">Exam Management</h3>
              <ul className="nav-list">
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/exam-management')}>
                    <span className="nav-icon">✍️</span>
                    <span>Exam Management</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/marks-recording')}>
                    <span className="nav-icon">📊</span>
                    <span>Marks & Grades</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/exam-schedule')}>
                    <span className="nav-icon">📝</span>
                    <span>Exam Scheduling</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/exam-reports')}>
                    <span className="nav-icon">📈</span>
                    <span>Exam Reports</span>
                  </button>
                </li>
              </ul>
            </div>

            <div className="nav-section">
              <h3 className="nav-title">Mental Health Management</h3>
              <ul className="nav-list">
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/mental-health-issues')}>
                    <span className="nav-icon">🧠</span>
                    <span>Mental Health Issues</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/counsellor-management')}>
                    <span className="nav-icon">👨‍⚕️</span>
                    <span>Counsellor Management</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/appointment-scheduling')}>
                    <span className="nav-icon">📅</span>
                    <span>Appointment Scheduling</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/wellbeing-reports')}>
                    <span className="nav-icon">📊</span>
                    <span>Wellbeing Reports</span>
                  </button>
                </li>
              </ul>
            </div>

            <div className="nav-section">
              <h3 className="nav-title">Communication Management</h3>
              <ul className="nav-list">
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/meeting-management')}>
                    <span className="nav-icon">🤝</span>
                    <span>Meeting Management</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/chat-monitoring')}>
                    <span className="nav-icon">💬</span>
                    <span>Chat Monitoring</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/broadcast-messages')}>
                    <span className="nav-icon">📢</span>
                    <span>Broadcast Messages</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/notification-center')}>
                    <span className="nav-icon">🔔</span>
                    <span>Notification Center</span>
                  </button>
                </li>
              </ul>
            </div>

            <div className="nav-section">
              <h3 className="nav-title">Financial Management</h3>
              <ul className="nav-list">
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/fee-management')}>
                    <span className="nav-icon">💰</span>
                    <span>Fee Management</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/payment-tracking')}>
                    <span className="nav-icon">💳</span>
                    <span>Payment Tracking</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/financial-reports')}>
                    <span className="nav-icon">📊</span>
                    <span>Financial Reports</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/budget-management')}>
                    <span className="nav-icon">📈</span>
                    <span>Budget Management</span>
                  </button>
                </li>
              </ul>
            </div>

            <div className="nav-section">
              <h3 className="nav-title">Event Management</h3>
              <ul className="nav-list">
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/school-events')}>
                    <span className="nav-icon">🎉</span>
                    <span>School Events</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/calendar-management')}>
                    <span className="nav-icon">📅</span>
                    <span>Calendar Management</span>
                  </button>
                </li>
              </ul>
            </div>

            <div className="nav-section">
              <h3 className="nav-title">System Management</h3>
              <ul className="nav-list">
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/notifications')}>
                    <span className="nav-icon">🔔</span>
                    <span>Notification Center</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/system-reports')}>
                    <span className="nav-icon">📈</span>
                    <span>System Reports</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/backup-restore')}>
                    <span className="nav-icon">💾</span>
                    <span>Backup & Restore</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/system-settings')}>
                    <span className="nav-icon">⚙️</span>
                    <span>System Settings</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={go('/admin/maintenance')}>
                    <span className="nav-icon">🔧</span>
                    <span>System Maintenance</span>
                  </button>
                </li>
              </ul>
            </div>
          </nav>

          <div className="sidebar-footer">
            <button className="nav-link logout-btn" onClick={handleLogout}>
              <span className="nav-icon">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="dashboard-container">
        {/* Top Navigation Bar */}
        <header className="dashboard-header">
          <div className="header-left">
            <div className="header-logo" onClick={() => navigate('/')}>
              <img src={logo_light} alt="EduFord Logo" className="dashboard-logo" />
            </div>
            <div className="header-title">
              <h1>{pageTitle}</h1>
              <p>{pageDescription}</p>
            </div>
          </div>
          
          <div className="header-right">
            <div className="header-search">
              <input type="text" placeholder="Search..." />
              <span className="search-icon">🔍</span>
            </div>
            <div className="header-notifications">
              <NotificationSystem type="bell" />
              <ChatCenter userRole="Admin" userId={JSON.parse(localStorage.getItem('user') || '{}').id} />
            </div>
            <div className="header-profile" onClick={toggleSidebar}>
              <div className="profile-avatar">👤</div>
              <div className="profile-info">
                <span className="profile-name">Admin User</span>
                <span className="profile-role">Administrator</span>
              </div>
              <span className="dropdown-arrow">▼</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="dashboard-main">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

      {/* Profile Update Modal */}
      <ProfileUpdateModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onUpdate={handleProfileUpdateSuccess}
        onNotificationRefresh={handleNotificationRefresh}
      />
    </div>
  );
};

export default AdminLayout;
