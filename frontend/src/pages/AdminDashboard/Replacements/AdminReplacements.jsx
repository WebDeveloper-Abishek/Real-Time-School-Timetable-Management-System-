import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../Components/AdminLayout/AdminLayout';
import './AdminReplacements.css';

const AdminReplacements = () => {
  const navigate = useNavigate();
  const [replacements, setReplacements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, pending, accepted, declined

  const addAlert = (message, type = 'success') => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  };

  const fetchReplacements = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/replacements');
      const data = await response.json();
      setReplacements(data.replacements || []);
    } catch (error) {
      console.error('Error fetching replacements:', error);
      addAlert('Error fetching replacements', 'error');
      setReplacements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplacements();
    
    // Poll for updates every 5 seconds for real-time collaboration
    const interval = setInterval(() => {
      fetchReplacements();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const getFilteredReplacements = () => {
    if (filterStatus === 'ALL') return replacements;
    
    return replacements.filter(replacement => {
      if (filterStatus === 'accepted') {
        return replacement.accepted === true;
      } else if (filterStatus === 'pending') {
        return replacement.accepted !== true && !replacement.reason_declined;
      } else if (filterStatus === 'declined') {
        return replacement.accepted === false && replacement.reason_declined;
      }
      return true;
    });
  };

  const getStatusBadge = (replacement) => {
    if (replacement.accepted === true) {
      return <span className="adminreplacements-status-badge adminreplacements-status-accepted">✅ Accepted</span>;
    } else if (replacement.reason_declined) {
      return <span className="adminreplacements-status-badge adminreplacements-status-declined">❌ Declined</span>;
    } else {
      return <span className="adminreplacements-status-badge adminreplacements-status-pending">⏳ Pending</span>;
    }
  };

  const filteredReplacements = getFilteredReplacements();

  return (
    <AdminLayout
      pageTitle="Replacements Management"
      pageDescription="View and manage all teacher replacement assignments"
    >
      <div className="adminreplacements-container">
        {/* Alerts */}
        <div className="adminreplacements-alerts-container">
          {alerts.map(alert => (
            <div key={alert.id} className={`adminreplacements-alert adminreplacements-alert-${alert.type}`}>
              {alert.message}
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="adminreplacements-header">
          <div>
            <h1 className="adminreplacements-page-title">Replacements Management</h1>
            <p className="adminreplacements-page-subtitle">View and manage all teacher replacement assignments</p>
          </div>
        </div>

        {/* Stats */}
        <div className="adminreplacements-stats">
          <div className="adminreplacements-stat-card">
            <h3>{replacements.filter(r => r.accepted !== true && !r.reason_declined).length}</h3>
            <p>Pending</p>
          </div>
          <div className="adminreplacements-stat-card adminreplacements-stat-accepted">
            <h3>{replacements.filter(r => r.accepted === true).length}</h3>
            <p>Accepted</p>
          </div>
          <div className="adminreplacements-stat-card adminreplacements-stat-declined">
            <h3>{replacements.filter(r => r.reason_declined).length}</h3>
            <p>Declined</p>
          </div>
          <div className="adminreplacements-stat-card adminreplacements-stat-total">
            <h3>{replacements.length}</h3>
            <p>Total</p>
          </div>
        </div>

        {/* Filters */}
        <div className="adminreplacements-filters">
          <div className="adminreplacements-filter-group">
            <label htmlFor="status-filter">Filter by Status:</label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="adminreplacements-filter-select"
            >
              <option value="ALL">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
            </select>
          </div>
          <div className="adminreplacements-filter-stats">
            <span>Showing {filteredReplacements.length} of {replacements.length} replacements</span>
          </div>
        </div>

        {/* Replacements List */}
        {loading ? (
          <div className="adminreplacements-loading">
            <div className="adminreplacements-loading-spinner"></div>
            <p>Loading replacements...</p>
          </div>
        ) : filteredReplacements.length === 0 ? (
          <div className="adminreplacements-empty">
            <div className="adminreplacements-empty-icon">🔄</div>
            <h3>No Replacements Found</h3>
            <p>No replacement assignments match the current filters</p>
          </div>
        ) : (
          <div className="adminreplacements-list">
            {filteredReplacements.map((replacement) => (
              <div key={replacement._id} className="adminreplacements-card">
                <div className="adminreplacements-card-header">
                  <div className="adminreplacements-card-title">
                    <h3>
                      {replacement.subject_id?.subject_name || 'Unknown Subject'} - {replacement.class_id?.class_name || 'Unknown Class'}
                    </h3>
                    {getStatusBadge(replacement)}
                  </div>
                  <div className="adminreplacements-card-date">
                    {new Date(replacement.date).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="adminreplacements-card-body">
                  <div className="adminreplacements-info-grid">
                    <div className="adminreplacements-info-item">
                      <span className="adminreplacements-info-label">Original Teacher:</span>
                      <span className="adminreplacements-info-value">
                        {replacement.original_teacher_id?.name || 'Unknown'}
                      </span>
                    </div>
                    
                    <div className="adminreplacements-info-item">
                      <span className="adminreplacements-info-label">Replacement Teacher:</span>
                      <span className="adminreplacements-info-value">
                        {replacement.replacement_teacher_id?.name || 'Not Assigned'}
                      </span>
                    </div>
                    
                    <div className="adminreplacements-info-item">
                      <span className="adminreplacements-info-label">Date:</span>
                      <span className="adminreplacements-info-value">
                        {new Date(replacement.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    {replacement.slot_id && (
                      <div className="adminreplacements-info-item">
                        <span className="adminreplacements-info-label">Time:</span>
                        <span className="adminreplacements-info-value">
                          {replacement.slot_id.start_time} - {replacement.slot_id.end_time}
                          {replacement.slot_id.slot_number && ` (Period ${replacement.slot_id.slot_number})`}
                        </span>
                      </div>
                    )}
                    
                    {replacement.leave && (
                      <div className="adminreplacements-info-item adminreplacements-info-full">
                        <span className="adminreplacements-info-label">Leave Reason:</span>
                        <span className="adminreplacements-info-value">{replacement.leave.reason || 'N/A'}</span>
                      </div>
                    )}
                    
                    {replacement.reason_declined && (
                      <div className="adminreplacements-info-item adminreplacements-info-full">
                        <span className="adminreplacements-info-label">Decline Reason:</span>
                        <span className="adminreplacements-info-value adminreplacements-declined-reason">
                          {replacement.reason_declined}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReplacements;

