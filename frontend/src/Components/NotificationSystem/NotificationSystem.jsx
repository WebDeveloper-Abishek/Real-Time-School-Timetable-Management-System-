import React, { useState, useEffect } from 'react';
import './NotificationSystem.css';

const NotificationSystem = ({ type = 'bell' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id;

  useEffect(() => {
    if (userId) {
      fetchNotifications(true); // Show loading on initial load
      fetchUnreadCount();
      
      // Poll for new notifications every 3 seconds
      const interval = setInterval(() => {
        fetchNotifications(false); // Don't show loading on polling
        fetchUnreadCount();
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [userId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const notificationContainer = document.querySelector('.notification-system-container');
      if (notificationContainer && !notificationContainer.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchNotifications = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/notifications/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };


  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/notifications/${userId}/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, read_status: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const toggleDropdown = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    if (newIsOpen) {
      // Close any open chat dropdowns
      const chatDropdowns = document.querySelectorAll('.chat-dropdown');
      chatDropdowns.forEach(dropdown => {
        dropdown.style.display = 'none';
      });
      
      fetchNotifications(true); // Show loading when opening dropdown
      fetchUnreadCount();
    }
  };

  const refreshNotifications = () => {
    fetchNotifications(true); // Show loading when manually refreshing
    fetchUnreadCount();
  };

  const showNotificationDetails = (notification) => {
    setSelectedNotification(notification);
    setShowDetails(true);
    markAsRead(notification._id);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedNotification(null);
  };

  const deleteNotification = async (notificationId) => {
    try {
      // Add deletion animation
      const cardElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
      if (cardElement) {
        cardElement.style.animation = 'slideOutToRight 0.3s ease-in forwards';
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        if (selectedNotification && selectedNotification._id === notificationId) {
          closeDetails();
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getIcon = () => {
    return type === 'bell' ? '🔔' : '✉️';
  };

  const getTitle = () => {
    return type === 'bell' ? 'System Alerts' : 'Messages';
  };

  return (
    <div className="notification-system-container">
      <button 
        className="notification-btn" 
        onClick={toggleDropdown}
        title={getTitle()}
      >
        <span className="notification-icon">{getIcon()}</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3 className="notification-dropdown-title">{getTitle()}</h3>
            <div className="notification-header-actions">
              <button 
                className="notification-action-btn"
                onClick={refreshNotifications}
                title="Refresh notifications"
              >
                ↻
              </button>
              <button 
                className="notification-close-btn"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>
          </div>

          <div className="notification-dropdown-content">
            {loading ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="system-alert-empty">
                <div className="system-alert-empty-icon">🔔</div>
                <div>No {type === 'bell' ? 'alerts' : 'messages'} yet</div>
              </div>
            ) : (
              <div className="system-alert-list">
                {notifications.map((notification) => (
                  <div 
                    key={notification._id} 
                    data-notification-id={notification._id}
                    className={`system-alert-card system-alert-${notification.type || 'info'}`}
                  >
                    <div
                      className="system-alert-content"
                      onClick={() => showNotificationDetails(notification)}
                    >
                      <div className={`system-alert-icon system-alert-icon-${notification.type || 'info'}`}>
                        {notification.type === 'info' && <span>i</span>}
                        {notification.type === 'warning' && <span>!</span>}
                        {notification.type === 'error' && <span>✕</span>}
                        {notification.type === 'success' && <span>✓</span>}
                        {!notification.type && <span>i</span>}
                      </div>
                      <div className="system-alert-message">
                        <div className="system-alert-text">
                          <span className="system-alert-type">{notification.type || 'Info'}:</span> {notification.title}
                        </div>
                      </div>
                      <div className="system-alert-timestamp">
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <button 
                      className="system-alert-dismiss"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification._id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification Details Modal */}
      {showDetails && selectedNotification && (
        <div className="notification-details-overlay">
          <div className="notification-details-modal">
            <div className="notification-details-header">
              <div className="notification-details-title">
                <div className={`system-alert-icon system-alert-icon-${selectedNotification.type || 'info'}`}>
                  {selectedNotification.type === 'info' && <span>i</span>}
                  {selectedNotification.type === 'warning' && <span>!</span>}
                  {selectedNotification.type === 'error' && <span>✕</span>}
                  {selectedNotification.type === 'success' && <span>✓</span>}
                  {!selectedNotification.type && <span>i</span>}
                </div>
                <div>
                  <div className="notification-details-type">{selectedNotification.type || 'Info'}:</div>
                  <div className="notification-details-subtitle">{selectedNotification.title}</div>
                </div>
              </div>
              <button 
                className="notification-details-close"
                onClick={closeDetails}
              >
                ×
              </button>
            </div>
            <div className="notification-details-content">
              <div className="notification-details-body">
                {selectedNotification.body}
              </div>
              {selectedNotification.category && (
                <div className="notification-details-meta">
                  <span className="notification-details-label">Category:</span>
                  <span className="notification-details-value">{selectedNotification.category}</span>
                </div>
              )}
              {selectedNotification.priority && (
                <div className="notification-details-meta">
                  <span className="notification-details-label">Priority:</span>
                  <span className="notification-details-value">{selectedNotification.priority}</span>
                </div>
              )}
              <div className="notification-details-meta">
                <span className="notification-details-label">Time:</span>
                <span className="notification-details-value">
                  {new Date(selectedNotification.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="notification-details-footer">
              <button 
                className="notification-details-delete"
                onClick={() => deleteNotification(selectedNotification._id)}
              >
                Delete Notification
              </button>
              <button 
                className="notification-details-close-btn"
                onClick={closeDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;
