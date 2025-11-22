import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo_light from '../../assets/logo-white.png';
import ProfileUpdateModal from '../ProfileUpdateModal/ProfileUpdateModal';
import NotificationSystem from '../NotificationSystem/NotificationSystem';
import ChatCenter from '../ChatCenter/ChatCenter';
import './DashboardLayout.css';

const DashboardLayout = ({ 
  children, 
  pageTitle = "Dashboard", 
  pageDescription = "Welcome back!", 
  userRole = "User",
  userName = "User",
  navigationSections = []
}) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notificationRefreshKey, setNotificationRefreshKey] = useState(0);
  
  // Get user info for components
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id;

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
    console.log('Profile updated:', updatedUser);
  };

  const handleNotificationRefresh = () => {
    setNotificationRefreshKey(prev => prev + 1);
  };

  return (
    <div className="dashlayout-wrapper">
      {/* Sidebar */}
      <aside className={`dashlayout-sidebar ${sidebarOpen ? 'dashlayout-sidebar-open' : ''}`}>
        <div className="dashlayout-sidebar-content">
          <div className="dashlayout-sidebar-header">
            <div className="dashlayout-sidebar-user-info">
              <div className="dashlayout-sidebar-avatar">👤</div>
              <div className="dashlayout-sidebar-user-details">
                <span className="dashlayout-sidebar-user-name">{userName}</span>
                <span className="dashlayout-sidebar-user-role">{userRole}</span>
              </div>
            </div>
            <button className="dashlayout-sidebar-close" onClick={closeSidebar}>
              <span>×</span>
            </button>
          </div>

          <nav className="dashlayout-sidebar-nav">
            {navigationSections.map((section, idx) => (
              <div key={idx} className="dashlayout-nav-section">
                <h3 className="dashlayout-nav-title">{section.title}</h3>
                <ul className="dashlayout-nav-list">
                  {section.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="dashlayout-nav-item">
                      <button className="dashlayout-nav-link" onClick={item.action || go(item.path)}>
                        <span className="dashlayout-nav-icon">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="dashlayout-sidebar-footer">
            <button className="dashlayout-nav-link dashlayout-logout-btn" onClick={() => { localStorage.clear(); navigate('/login'); }}>
              <span className="dashlayout-nav-icon">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="dashlayout-container">
        {/* Top Navigation Bar */}
        <header className="dashlayout-header">
          <div className="dashlayout-header-left">
            <div className="dashlayout-header-logo" onClick={() => navigate('/')}>
              <img src={logo_light} alt="EduFord Logo" className="dashlayout-logo" />
            </div>
            <div className="dashlayout-header-title">
              <h1>{pageTitle}</h1>
              <p>{pageDescription}</p>
            </div>
          </div>
          
          <div className="dashlayout-header-right">
            <div className="dashlayout-header-search">
              <input type="text" placeholder="Search..." />
              <span className="dashlayout-search-icon">🔍</span>
            </div>
            <div className="dashlayout-header-notifications">
              <NotificationSystem type="bell" />
              <ChatCenter userRole={userRole} userId={userId} />
            </div>
            <div className="dashlayout-header-profile" onClick={toggleSidebar}>
              <div className="dashlayout-profile-avatar">👤</div>
              <div className="dashlayout-profile-info">
                <span className="dashlayout-profile-name">{userName}</span>
                <span className="dashlayout-profile-role">{userRole}</span>
              </div>
              <span className="dashlayout-dropdown-arrow">▼</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="dashlayout-main">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="dashlayout-sidebar-overlay" onClick={closeSidebar}></div>}

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

export default DashboardLayout;

