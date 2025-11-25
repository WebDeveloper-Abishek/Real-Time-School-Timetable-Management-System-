import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../Components/AdminLayout/AdminLayout';
import './AdminLeaves.css';

const AdminLeaves = () => {
  const navigate = useNavigate();
  const [adminleavesTerms, setAdminleavesTerms] = useState([]);
  const [adminleavesTeachers, setAdminleavesTeachers] = useState([]);
  const [adminleavesList, setAdminleavesList] = useState([]);
  const [adminleavesLoading, setAdminleavesLoading] = useState(false);
  const [adminleavesShowModal, setAdminleavesShowModal] = useState(false);
  const [adminleavesAlerts, setAdminleavesAlerts] = useState([]);
  const [adminleavesFilterStatus, setAdminleavesFilterStatus] = useState('ALL');
  const [adminleavesFilterTerm, setAdminleavesFilterTerm] = useState('');
  
  const [adminleavesForm, setAdminleavesForm] = useState({
    user_id: '',
    term_id: '',
    start_date: '',
    end_date: '',
    type: 'FULL_DAY',
    reason: ''
  });

  const adminleavesAddAlert = (message, type = 'success') => {
    const id = Date.now();
    setAdminleavesAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setAdminleavesAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  };

  const adminleavesFetchTerms = async () => {
    try {
      const r = await fetch('/api/admin/terms');
      const data = await r.json();
      setAdminleavesTerms(data || []);
    } catch (error) {
      adminleavesAddAlert('Error fetching terms', 'error');
    }
  };

  const adminleavesFetchTeachers = async () => {
    try {
      const r = await fetch('/api/admin/users?role=Teacher');
      const data = await r.json();
      const teachers = data.users || data || [];
      setAdminleavesTeachers(teachers.filter(t => t.role === 'Teacher'));
    } catch (error) {
      adminleavesAddAlert('Error fetching teachers', 'error');
    }
  };

  const adminleavesFetchLeaves = async () => {
    try {
      setAdminleavesLoading(true);
      const r = await fetch('/api/admin/leaves');
      if (!r.ok) {
        throw new Error('Failed to fetch leaves');
      }
      const data = await r.json();
      // Ensure we have an array and filter out any invalid entries
      const validLeaves = Array.isArray(data) ? data.filter(leave => leave && leave._id) : [];
      setAdminleavesList(validLeaves);
    } catch (error) {
      console.error('Error fetching leaves:', error);
      adminleavesAddAlert('Error fetching leaves: ' + (error.message || 'Unknown error'), 'error');
      setAdminleavesList([]);
    } finally {
      setAdminleavesLoading(false);
    }
  };

  useEffect(() => {
    adminleavesFetchTerms();
    adminleavesFetchTeachers();
    adminleavesFetchLeaves();
    
    // Refresh leaves every 30 seconds to catch new teacher submissions
    const refreshInterval = setInterval(() => {
      adminleavesFetchLeaves();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  const adminleavesRequestLeave = async (e) => {
    e.preventDefault();
    
    if (!adminleavesForm.user_id || !adminleavesForm.term_id || !adminleavesForm.start_date || !adminleavesForm.end_date) {
      adminleavesAddAlert('Please fill all required fields', 'error');
      return;
    }

    try {
      setAdminleavesLoading(true);
      await fetch('/api/admin/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminleavesForm)
      });
      
      adminleavesAddAlert('Leave request submitted successfully', 'success');
      setAdminleavesShowModal(false);
      setAdminleavesForm({
        user_id: '',
        term_id: '',
        start_date: '',
        end_date: '',
        type: 'FULL_DAY',
        reason: ''
      });
      await adminleavesFetchLeaves();
    } catch (error) {
      adminleavesAddAlert('Error submitting leave request', 'error');
    } finally {
      setAdminleavesLoading(false);
    }
  };

  const adminleavesApprove = async (id) => {
    if (!window.confirm('Approve this leave request? System will automatically find replacement teachers.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/leaves/${id}/approve`, { method: 'PUT' });
      if (response.ok) {
        adminleavesAddAlert('Leave approved successfully! Replacement teachers will be notified.', 'success');
        // Refresh the list to show updated status
        await adminleavesFetchLeaves();
      } else {
        const errorData = await response.json().catch(() => ({}));
        adminleavesAddAlert('Error approving leave: ' + (errorData.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error approving leave:', error);
      adminleavesAddAlert('Error approving leave: ' + (error.message || 'Unknown error'), 'error');
    }
  };

  const adminleavesReject = async (id) => {
    const reason = prompt('Enter reason for rejection (optional):');
    
    try {
      const response = await fetch(`/api/admin/leaves/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || '' })
      });
      
      if (response.ok) {
        adminleavesAddAlert('Leave request rejected', 'success');
        // Refresh the list to show updated status
        await adminleavesFetchLeaves();
      } else {
        const errorData = await response.json().catch(() => ({}));
        adminleavesAddAlert('Error rejecting leave: ' + (errorData.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error rejecting leave:', error);
      adminleavesAddAlert('Error rejecting leave: ' + (error.message || 'Unknown error'), 'error');
    }
  };

  const adminleavesGetFilteredLeaves = () => {
    let filtered = adminleavesList;
    
    if (adminleavesFilterStatus !== 'ALL') {
      filtered = filtered.filter(leave => {
        // Handle both new format (status) and old format (approved)
        const status = leave.status || (leave.approved === true ? 'APPROVED' : (leave.approved === false ? 'PENDING' : 'PENDING'));
        return status === adminleavesFilterStatus;
      });
    }
    
    if (adminleavesFilterTerm) {
      filtered = filtered.filter(leave => {
        const leaveTermId = typeof leave.term_id === 'object' ? leave.term_id._id : leave.term_id;
        return leaveTermId === adminleavesFilterTerm;
      });
    }
    
    return filtered;
  };

  const adminleavesGetStatusColor = (leave) => {
    // Handle both new format (status) and old format (approved)
    const status = leave.status || (leave.approved === true ? 'APPROVED' : (leave.approved === false ? 'PENDING' : 'PENDING'));
    const colors = {
      'PENDING': 'adminleaves-status-pending',
      'APPROVED': 'adminleaves-status-approved',
      'REJECTED': 'adminleaves-status-rejected'
    };
    return colors[status] || 'adminleaves-status-pending';
  };

  const adminleavesGetStatusIcon = (leave) => {
    // Handle both new format (status) and old format (approved)
    const status = leave.status || (leave.approved === true ? 'APPROVED' : (leave.approved === false ? 'PENDING' : 'PENDING'));
    const icons = {
      'PENDING': '⏳',
      'APPROVED': '✅',
      'REJECTED': '❌'
    };
    return icons[status] || '⏳';
  };

  const adminleavesGetStatusLabel = (leave) => {
    // Handle both new format (status) and old format (approved)
    return leave.status || (leave.approved === true ? 'APPROVED' : (leave.approved === false ? 'PENDING' : 'PENDING'));
  };

  const adminleavesGetLeaveTypeLabel = (leave) => {
    // Handle new format (type: FULL_DAY, FIRST_HALF, SECOND_HALF)
    if (leave.type) {
      const labels = {
        'FULL_DAY': 'Full Day',
        'FIRST_HALF': 'First Half',
        'SECOND_HALF': 'Second Half'
      };
      return labels[leave.type] || leave.type;
    }
    // Handle old format (leave_type: Full/Half, half_day_type: First/Second)
    if (leave.leave_type === 'Full') return 'Full Day';
    if (leave.leave_type === 'Half') {
      return leave.half_day_type === 'First' ? 'First Half' : 'Second Half';
    }
    return 'Full Day';
  };

  const adminleavesGetLeaveTypeBadge = (leave) => {
    // Handle new format
    if (leave.type) {
      if (leave.type === 'FULL_DAY') return 'adminleaves-type-full';
      return 'adminleaves-type-half';
    }
    // Handle old format
    if (leave.leave_type === 'Full') return 'adminleaves-type-full';
    return 'adminleaves-type-half';
  };

  const adminleavesCalculateLeaveDays = (startDate, endDate, leave) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // Handle new format
    const isFullDay = leave.type === 'FULL_DAY' || (leave.leave_type === 'Full');
    if (isFullDay) {
      return diffDays;
    } else {
      return diffDays * 0.5;
    }
  };

  const filteredLeaves = adminleavesGetFilteredLeaves();

  return (
    <AdminLayout
      pageTitle="Leave Management"
      pageDescription="Manage teacher leave requests and automated replacements"
    >
      {/* Alerts */}
      <div className="adminleaves-alerts-container">
        {adminleavesAlerts.map(alert => (
          <div key={alert.id} className={`adminleaves-alert adminleaves-alert-${alert.type}`}>
            {alert.message}
          </div>
        ))}
      </div>

      <div className="adminleaves-container">
        {/* Header */}
        <div className="adminleaves-header">
          <div className="adminleaves-header-left">
            <h1 className="adminleaves-page-title">Leave Management</h1>
            <p className="adminleaves-page-subtitle">Manage teacher leave requests and automated replacements</p>
          </div>
          <div className="adminleaves-header-right">
            <button
              className="adminleaves-btn adminleaves-btn-primary"
              onClick={() => setAdminleavesShowModal(true)}
            >
              ➕ Request Leave
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="adminleaves-stats-section">
          <div className="adminleaves-stats-grid">
            <div className="adminleaves-stat-card adminleaves-stat-pending">
              <div className="adminleaves-stat-icon">⏳</div>
              <div className="adminleaves-stat-content">
                <h3 className="adminleaves-stat-value">
                  {adminleavesList.filter(l => {
                    const status = l.status || (l.approved === true ? 'APPROVED' : (l.approved === false ? 'PENDING' : 'PENDING'));
                    return status === 'PENDING';
                  }).length}
                </h3>
                <p className="adminleaves-stat-label">Pending Requests</p>
              </div>
            </div>
            
            <div className="adminleaves-stat-card adminleaves-stat-approved">
              <div className="adminleaves-stat-icon">✅</div>
              <div className="adminleaves-stat-content">
                <h3 className="adminleaves-stat-value">
                  {adminleavesList.filter(l => {
                    const status = l.status || (l.approved === true ? 'APPROVED' : (l.approved === false ? 'PENDING' : 'PENDING'));
                    return status === 'APPROVED';
                  }).length}
                </h3>
                <p className="adminleaves-stat-label">Approved</p>
              </div>
            </div>
            
            <div className="adminleaves-stat-card adminleaves-stat-rejected">
              <div className="adminleaves-stat-icon">❌</div>
              <div className="adminleaves-stat-content">
                <h3 className="adminleaves-stat-value">
                  {adminleavesList.filter(l => {
                    const status = l.status || (l.approved === true ? 'APPROVED' : (l.approved === false ? 'PENDING' : 'PENDING'));
                    return status === 'REJECTED';
                  }).length}
                </h3>
                <p className="adminleaves-stat-label">Rejected</p>
              </div>
            </div>
            
            <div className="adminleaves-stat-card adminleaves-stat-total">
              <div className="adminleaves-stat-icon">📋</div>
              <div className="adminleaves-stat-content">
                <h3 className="adminleaves-stat-value">
                  {adminleavesList.length}
                </h3>
                <p className="adminleaves-stat-label">Total Requests</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="adminleaves-filters">
          <div className="adminleaves-filter-group">
            <label htmlFor="adminleaves-status-filter">Filter by Status:</label>
            <select
              id="adminleaves-status-filter"
              value={adminleavesFilterStatus}
              onChange={(e) => setAdminleavesFilterStatus(e.target.value)}
              className="adminleaves-filter-select"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          
          <div className="adminleaves-filter-group">
            <label htmlFor="adminleaves-term-filter">Filter by Term:</label>
            <select
              id="adminleaves-term-filter"
              value={adminleavesFilterTerm}
              onChange={(e) => setAdminleavesFilterTerm(e.target.value)}
              className="adminleaves-filter-select"
            >
              <option value="">All Terms</option>
              {adminleavesTerms.map(term => (
                <option key={term._id} value={term._id}>
                  Term {term.term_number} - {term.academic_year_id?.year_label || ''}
                </option>
              ))}
            </select>
          </div>
          
          <div className="adminleaves-filter-stats">
            <span className="adminleaves-stats-text">
              Showing {filteredLeaves.length} of {adminleavesList.length} requests
            </span>
          </div>
        </div>

        {/* Leave Requests List */}
        <div className="adminleaves-list-section">
          <div className="adminleaves-list-header">
            <h2 className="adminleaves-list-title">Leave Requests</h2>
          </div>
          
          {adminleavesLoading ? (
            <div className="adminleaves-loading-container">
              <div className="adminleaves-loading">Loading leave requests...</div>
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="adminleaves-no-data">
              <div className="adminleaves-no-data-icon">📋</div>
              <h3>No Leave Requests Found</h3>
              <p>
                {adminleavesList.length === 0 
                  ? 'No leave requests have been submitted yet. Teachers can submit leave requests from their dashboard.'
                  : 'No leave requests match the current filters. Try adjusting your filter criteria.'}
              </p>
            </div>
          ) : (
            <div className="adminleaves-cards-grid">
              {filteredLeaves.map(leave => (
                <div key={leave._id} className="adminleaves-card">
                  {/* Card Header */}
                  <div className="adminleaves-card-header">
                    <div className="adminleaves-teacher-info">
                      <div className="adminleaves-teacher-avatar">
                        {leave.user_id?.name?.charAt(0) || 'T'}
                      </div>
                      <div className="adminleaves-teacher-details">
                        <h3 className="adminleaves-teacher-name">
                          {leave.user_id?.name || leave.user_id || 'Unknown Teacher'}
                        </h3>
                        <span className="adminleaves-teacher-role">
                          {leave.user_id?.role || 'Teacher'}
                        </span>
                      </div>
                    </div>
                    <div className={`adminleaves-status-badge ${adminleavesGetStatusColor(leave)}`}>
                      {adminleavesGetStatusIcon(leave)} {adminleavesGetStatusLabel(leave)}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="adminleaves-card-body">
                    <div className="adminleaves-info-grid">
                      <div className="adminleaves-info-item">
                        <span className="adminleaves-info-icon">📅</span>
                        <div className="adminleaves-info-content">
                          <span className="adminleaves-info-label">Leave Type</span>
                          <span className={`adminleaves-type-badge ${adminleavesGetLeaveTypeBadge(leave)}`}>
                            {adminleavesGetLeaveTypeLabel(leave)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="adminleaves-info-item">
                        <span className="adminleaves-info-icon">📖</span>
                        <div className="adminleaves-info-content">
                          <span className="adminleaves-info-label">Term</span>
                          <span className="adminleaves-info-value">
                            Term {leave.term_id?.term_number || 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="adminleaves-info-item">
                        <span className="adminleaves-info-icon">📆</span>
                        <div className="adminleaves-info-content">
                          <span className="adminleaves-info-label">Start Date</span>
                          <span className="adminleaves-info-value">
                            {new Date(leave.start_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="adminleaves-info-item">
                        <span className="adminleaves-info-icon">📆</span>
                        <div className="adminleaves-info-content">
                          <span className="adminleaves-info-label">End Date</span>
                          <span className="adminleaves-info-value">
                            {new Date(leave.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="adminleaves-info-item">
                        <span className="adminleaves-info-icon">⏱️</span>
                        <div className="adminleaves-info-content">
                          <span className="adminleaves-info-label">Duration</span>
                          <span className="adminleaves-info-value">
                            {adminleavesCalculateLeaveDays(leave.start_date, leave.end_date, leave)} days
                          </span>
                        </div>
                      </div>
                      
                      {leave.reason && (
                        <div className="adminleaves-info-item adminleaves-info-full">
                          <span className="adminleaves-info-icon">💬</span>
                          <div className="adminleaves-info-content">
                            <span className="adminleaves-info-label">Reason</span>
                            <span className="adminleaves-info-value">{leave.reason}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  {(!leave.status || leave.status === 'PENDING') && leave.approved !== true && (
                    <div className="adminleaves-card-actions">
                      <button
                        className="adminleaves-btn adminleaves-btn-approve"
                        onClick={() => adminleavesApprove(leave._id)}
                      >
                        ✅ Approve
                      </button>
                      <button
                        className="adminleaves-btn adminleaves-btn-reject"
                        onClick={() => adminleavesReject(leave._id)}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}
                  
                  {(leave.status === 'APPROVED' || leave.approved === true) && (
                    <div className="adminleaves-replacement-info">
                      <div className="adminleaves-replacement-header">
                        <span className="adminleaves-replacement-icon">🔄</span>
                        <span className="adminleaves-replacement-label">Replacement Status</span>
                      </div>
                      <div className="adminleaves-replacement-status">
                        <span className="adminleaves-replacement-badge adminleaves-replacement-active">
                          Automatic replacement in progress
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leave Request Modal */}
        {adminleavesShowModal && (
          <div className="adminleaves-modal-overlay">
            <div className="adminleaves-modal">
              <div className="adminleaves-modal-header">
                <h2>Request Teacher Leave</h2>
                <button
                  className="adminleaves-close-btn"
                  onClick={() => setAdminleavesShowModal(false)}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={adminleavesRequestLeave} className="adminleaves-modal-form">
                <div className="adminleaves-form-row">
                  <div className="adminleaves-form-group">
                    <label htmlFor="adminleaves-teacher-select">Teacher *</label>
                    <select
                      id="adminleaves-teacher-select"
                      value={adminleavesForm.user_id}
                      onChange={(e) => setAdminleavesForm({...adminleavesForm, user_id: e.target.value})}
                      required
                      className="adminleaves-form-select"
                    >
          <option value="">Select Teacher</option>
                      {adminleavesTeachers.map(teacher => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.name}
                        </option>
                      ))}
        </select>
                  </div>
                  
                  <div className="adminleaves-form-group">
                    <label htmlFor="adminleaves-term-select">Term *</label>
                    <select
                      id="adminleaves-term-select"
                      value={adminleavesForm.term_id}
                      onChange={(e) => setAdminleavesForm({...adminleavesForm, term_id: e.target.value})}
                      required
                      className="adminleaves-form-select"
                    >
          <option value="">Select Term</option>
                      {adminleavesTerms.map(term => (
                        <option key={term._id} value={term._id}>
                          Term {term.term_number} - {term.academic_year_id?.year_label || ''}
                        </option>
                      ))}
        </select>
                  </div>
                </div>
                
                <div className="adminleaves-form-row">
                  <div className="adminleaves-form-group">
                    <label htmlFor="adminleaves-start-date">Start Date *</label>
                    <input
                      type="date"
                      id="adminleaves-start-date"
                      value={adminleavesForm.start_date}
                      onChange={(e) => setAdminleavesForm({...adminleavesForm, start_date: e.target.value})}
                      required
                      className="adminleaves-form-input"
                    />
                  </div>
                  
                  <div className="adminleaves-form-group">
                    <label htmlFor="adminleaves-end-date">End Date *</label>
                    <input
                      type="date"
                      id="adminleaves-end-date"
                      value={adminleavesForm.end_date}
                      onChange={(e) => setAdminleavesForm({...adminleavesForm, end_date: e.target.value})}
                      required
                      className="adminleaves-form-input"
                    />
                  </div>
                </div>
                
                <div className="adminleaves-form-group">
                  <label htmlFor="adminleaves-type-select">Leave Type *</label>
                  <select
                    id="adminleaves-type-select"
                    value={adminleavesForm.type}
                    onChange={(e) => setAdminleavesForm({...adminleavesForm, type: e.target.value})}
                    required
                    className="adminleaves-form-select"
                  >
                    <option value="FULL_DAY">Full Day</option>
                    <option value="FIRST_HALF">First Half</option>
                    <option value="SECOND_HALF">Second Half</option>
        </select>
                </div>
                
                <div className="adminleaves-form-group">
                  <label htmlFor="adminleaves-reason">Reason</label>
                  <textarea
                    id="adminleaves-reason"
                    value={adminleavesForm.reason}
                    onChange={(e) => setAdminleavesForm({...adminleavesForm, reason: e.target.value})}
                    rows="3"
                    placeholder="Enter reason for leave..."
                    className="adminleaves-form-textarea"
                  />
                </div>
                
                <div className="adminleaves-modal-actions">
                  <button
                    type="button"
                    className="adminleaves-btn adminleaves-btn-outline"
                    onClick={() => setAdminleavesShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="adminleaves-btn adminleaves-btn-primary"
                    disabled={adminleavesLoading}
                  >
                    {adminleavesLoading ? 'Submitting...' : 'Submit Request'}
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

export default AdminLeaves;
