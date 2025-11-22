import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../Components/AdminLayout/AdminLayout';
import './AdminNotifications.css';

const AdminNotifications = () => {
  const navigate = useNavigate();
  
  // State with unique prefixes
  const [adminnotifNotifications, setAdminnotifNotifications] = useState([]);
  const [adminnotifUsers, setAdminnotifUsers] = useState([]);
  const [adminnotifLoading, setAdminnotifLoading] = useState(false);
  const [adminnotifShowModal, setAdminnotifShowModal] = useState(false);
  const [adminnotifAlerts, setAdminnotifAlerts] = useState([]);
  const [adminnotifFilterType, setAdminnotifFilterType] = useState('ALL');
  const [adminnotifFilterRole, setAdminnotifFilterRole] = useState('ALL');
  
  const [adminnotifForm, setAdminnotifForm] = useState({
    title: '',
    body: '',
    type: 'INFO',
    recipient_type: 'ALL_USERS',
    recipient_ids: [],
    priority: 'MEDIUM'
  });

  const adminnotifAddAlert = (message, type = 'success') => {
    const id = Date.now();
    setAdminnotifAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setAdminnotifAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  };

  const adminnotifFetchNotifications = async () => {
    try {
      setAdminnotifLoading(true);
      const r = await fetch('/api/notifications/admin/all');
      const data = await r.json();
      setAdminnotifNotifications(data || []);
    } catch (error) {
      adminnotifAddAlert('Error fetching notifications', 'error');
    } finally {
      setAdminnotifLoading(false);
    }
  };

  const adminnotifFetchUsers = async () => {
    try {
      const r = await fetch('/api/admin/users');
      const data = await r.json();
      const users = data.users || data || [];
      setAdminnotifUsers(users);
    } catch (error) {
      adminnotifAddAlert('Error fetching users', 'error');
    }
  };

  useEffect(() => {
    adminnotifFetchNotifications();
    adminnotifFetchUsers();
  }, []);

  const adminnotifSendNotification = async (e) => {
    e.preventDefault();
    
    if (!adminnotifForm.title || !adminnotifForm.body) {
      adminnotifAddAlert('Title and message are required', 'error');
      return;
    }

    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminnotifForm)
      });

      if (response.ok) {
        adminnotifAddAlert('Notification sent successfully! 📢', 'success');
        setAdminnotifShowModal(false);
        setAdminnotifForm({
          title: '',
          body: '',
          type: 'INFO',
          recipient_type: 'ALL_USERS',
          recipient_ids: [],
          priority: 'MEDIUM'
        });
        await adminnotifFetchNotifications();
      } else {
        adminnotifAddAlert('Error sending notification', 'error');
      }
    } catch (error) {
      adminnotifAddAlert('Error sending notification', 'error');
    }
  };

  const adminnotifGetFilteredNotifications = () => {
    let filtered = adminnotifNotifications;
    
    if (adminnotifFilterType !== 'ALL') {
      filtered = filtered.filter(notif => notif.type === adminnotifFilterType);
    }
    
    return filtered;
  };

  const adminnotifGetTypeIcon = (type) => {
    const icons = {
      'INFO': 'ℹ️',
      'WARNING': '⚠️',
      'SUCCESS': '✅',
      'ERROR': '❌',
      'ANNOUNCEMENT': '📢'
    };
    return icons[type] || 'ℹ️';
  };

  const adminnotifGetTypeClass = (type) => {
    const classes = {
      'INFO': 'adminnotif-type-info',
      'WARNING': 'adminnotif-type-warning',
      'SUCCESS': 'adminnotif-type-success',
      'ERROR': 'adminnotif-type-error',
      'ANNOUNCEMENT': 'adminnotif-type-announcement'
    };
    return classes[type] || 'adminnotif-type-info';
  };

  const adminnotifGetPriorityClass = (priority) => {
    const classes = {
      'LOW': 'adminnotif-priority-low',
      'MEDIUM': 'adminnotif-priority-medium',
      'HIGH': 'adminnotif-priority-high',
      'URGENT': 'adminnotif-priority-urgent'
    };
    return classes[priority] || 'adminnotif-priority-medium';
  };

  const filteredNotifications = adminnotifGetFilteredNotifications();

  return (
    <AdminLayout
      pageTitle="Notification Center"
      pageDescription="Manage and send system notifications to users"
    >
      {/* Alerts */}
      <div className="adminnotif-alerts-container">
        {adminnotifAlerts.map(alert => (
          <div key={alert.id} className={`adminnotif-alert adminnotif-alert-${alert.type}`}>
            {alert.message}
          </div>
        ))}
      </div>

      <div className="adminnotif-container">
        {/* Header */}
        <div className="adminnotif-header">
          <div className="adminnotif-header-left">
            <h1 className="adminnotif-page-title">Notification Center</h1>
            <p className="adminnotif-page-subtitle">Send system alerts and announcements to users</p>
          </div>
          <div className="adminnotif-header-right">
            <button
              className="adminnotif-btn adminnotif-btn-primary"
              onClick={() => setAdminnotifShowModal(true)}
            >
              📢 Send Notification
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="adminnotif-stats-section">
          <div className="adminnotif-stats-grid">
            <div className="adminnotif-stat-card adminnotif-stat-total">
              <div className="adminnotif-stat-icon">📊</div>
              <div className="adminnotif-stat-content">
                <h3 className="adminnotif-stat-value">{adminnotifNotifications.length}</h3>
                <p className="adminnotif-stat-label">Total Notifications</p>
              </div>
            </div>
            
            <div className="adminnotif-stat-card adminnotif-stat-info">
              <div className="adminnotif-stat-icon">ℹ️</div>
              <div className="adminnotif-stat-content">
                <h3 className="adminnotif-stat-value">
                  {adminnotifNotifications.filter(n => n.type === 'INFO').length}
                </h3>
                <p className="adminnotif-stat-label">Info</p>
              </div>
            </div>
            
            <div className="adminnotif-stat-card adminnotif-stat-warning">
              <div className="adminnotif-stat-icon">⚠️</div>
              <div className="adminnotif-stat-content">
                <h3 className="adminnotif-stat-value">
                  {adminnotifNotifications.filter(n => n.type === 'WARNING').length}
                </h3>
                <p className="adminnotif-stat-label">Warnings</p>
              </div>
            </div>
            
            <div className="adminnotif-stat-card adminnotif-stat-announcement">
              <div className="adminnotif-stat-icon">📢</div>
              <div className="adminnotif-stat-content">
                <h3 className="adminnotif-stat-value">
                  {adminnotifNotifications.filter(n => n.type === 'ANNOUNCEMENT').length}
                </h3>
                <p className="adminnotif-stat-label">Announcements</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="adminnotif-filters">
          <div className="adminnotif-filter-group">
            <label htmlFor="adminnotif-type-filter">Filter by Type:</label>
            <select
              id="adminnotif-type-filter"
              value={adminnotifFilterType}
              onChange={(e) => setAdminnotifFilterType(e.target.value)}
              className="adminnotif-filter-select"
            >
              <option value="ALL">All Types</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="SUCCESS">Success</option>
              <option value="ERROR">Error</option>
              <option value="ANNOUNCEMENT">Announcement</option>
            </select>
          </div>
          
          <div className="adminnotif-filter-stats">
            <span className="adminnotif-stats-text">
              Showing {filteredNotifications.length} of {adminnotifNotifications.length} notifications
            </span>
          </div>
        </div>

        {/* Notifications List */}
        <div className="adminnotif-list-section">
          {adminnotifLoading ? (
            <div className="adminnotif-loading-container">
              <div className="adminnotif-loading">Loading notifications...</div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="adminnotif-no-data">
              <div className="adminnotif-no-data-icon">🔔</div>
              <h3>No Notifications Found</h3>
              <p>No notifications match the current filters</p>
            </div>
          ) : (
            <div className="adminnotif-cards-grid">
              {filteredNotifications.map(notification => (
                <div key={notification._id} className="adminnotif-card">
                  <div className="adminnotif-card-header">
                    <div className={`adminnotif-type-badge ${adminnotifGetTypeClass(notification.type)}`}>
                      {adminnotifGetTypeIcon(notification.type)} {notification.type}
                    </div>
                    <div className={`adminnotif-priority-badge ${adminnotifGetPriorityClass(notification.priority)}`}>
                      {notification.priority}
                    </div>
                  </div>
                  
                  <div className="adminnotif-card-body">
                    <h3 className="adminnotif-title">{notification.title}</h3>
                    <p className="adminnotif-body">{notification.body}</p>
                    
                    <div className="adminnotif-meta">
                      <span className="adminnotif-date">
                        📅 {new Date(notification.createdAt).toLocaleString()}
                      </span>
                      {notification.recipient_type && (
                        <span className="adminnotif-recipient">
                          👥 {notification.recipient_type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Send Notification Modal */}
        {adminnotifShowModal && (
          <div className="adminnotif-modal-overlay">
            <div className="adminnotif-modal">
              <div className="adminnotif-modal-header">
                <h2>Send Notification</h2>
                <button
                  className="adminnotif-close-btn"
                  onClick={() => setAdminnotifShowModal(false)}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={adminnotifSendNotification} className="adminnotif-modal-form">
                <div className="adminnotif-form-group">
                  <label htmlFor="adminnotif-title">Title *</label>
                  <input
                    type="text"
                    id="adminnotif-title"
                    value={adminnotifForm.title}
                    onChange={(e) => setAdminnotifForm({...adminnotifForm, title: e.target.value})}
                    required
                    placeholder="Enter notification title"
                    className="adminnotif-form-input"
                  />
                </div>
                
                <div className="adminnotif-form-group">
                  <label htmlFor="adminnotif-body">Message *</label>
                  <textarea
                    id="adminnotif-body"
                    value={adminnotifForm.body}
                    onChange={(e) => setAdminnotifForm({...adminnotifForm, body: e.target.value})}
                    required
                    placeholder="Enter notification message"
                    rows="4"
                    className="adminnotif-form-textarea"
                  />
                </div>
                
                <div className="adminnotif-form-row">
                  <div className="adminnotif-form-group">
                    <label htmlFor="adminnotif-type">Type *</label>
                    <select
                      id="adminnotif-type"
                      value={adminnotifForm.type}
                      onChange={(e) => setAdminnotifForm({...adminnotifForm, type: e.target.value})}
                      className="adminnotif-form-select"
                    >
                      <option value="INFO">Info</option>
                      <option value="WARNING">Warning</option>
                      <option value="SUCCESS">Success</option>
                      <option value="ERROR">Error</option>
                      <option value="ANNOUNCEMENT">Announcement</option>
                    </select>
                  </div>
                  
                  <div className="adminnotif-form-group">
                    <label htmlFor="adminnotif-priority">Priority *</label>
                    <select
                      id="adminnotif-priority"
                      value={adminnotifForm.priority}
                      onChange={(e) => setAdminnotifForm({...adminnotifForm, priority: e.target.value})}
                      className="adminnotif-form-select"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>
                
                <div className="adminnotif-form-group">
                  <label htmlFor="adminnotif-recipient">Send To *</label>
                  <select
                    id="adminnotif-recipient"
                    value={adminnotifForm.recipient_type}
                    onChange={(e) => setAdminnotifForm({...adminnotifForm, recipient_type: e.target.value})}
                    className="adminnotif-form-select"
                  >
                    <option value="ALL_USERS">All Users</option>
                    <option value="ALL_STUDENTS">All Students</option>
                    <option value="ALL_TEACHERS">All Teachers</option>
                    <option value="ALL_PARENTS">All Parents</option>
                    <option value="ALL_COUNSELLORS">All Counsellors</option>
                    <option value="SPECIFIC_USERS">Specific Users</option>
                  </select>
                </div>
                
                {adminnotifForm.recipient_type === 'SPECIFIC_USERS' && (
                  <div className="adminnotif-form-group">
                    <label>Select Recipients:</label>
                    <div className="adminnotif-users-select">
                      {adminnotifUsers.map(user => (
                        <label key={user._id} className="adminnotif-user-checkbox">
                          <input
                            type="checkbox"
                            checked={adminnotifForm.recipient_ids.includes(user._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAdminnotifForm({
                                  ...adminnotifForm,
                                  recipient_ids: [...adminnotifForm.recipient_ids, user._id]
                                });
                              } else {
                                setAdminnotifForm({
                                  ...adminnotifForm,
                                  recipient_ids: adminnotifForm.recipient_ids.filter(id => id !== user._id)
                                });
                              }
                            }}
                          />
                          <span>{user.name} ({user.role})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="adminnotif-modal-actions">
                  <button
                    type="button"
                    className="adminnotif-btn adminnotif-btn-outline"
                    onClick={() => setAdminnotifShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="adminnotif-btn adminnotif-btn-primary"
                  >
                    Send Notification
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminNotifications;

