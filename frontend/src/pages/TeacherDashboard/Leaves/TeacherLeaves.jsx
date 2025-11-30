import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './TeacherLeaves.css';

const TeacherLeaves = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [teacherleavesTerms, setTeacherleavesTerms] = useState([]);
  const [teacherleavesList, setTeacherleavesList] = useState([]);
  const [teacherleavesLoading, setTeacherleavesLoading] = useState(false);
  const [teacherleavesShowModal, setTeacherleavesShowModal] = useState(false);
  const [teacherleavesAlerts, setTeacherleavesAlerts] = useState([]);
  const [teacherleavesFilterStatus, setTeacherleavesFilterStatus] = useState('ALL');
  
  const [teacherleavesForm, setTeacherleavesForm] = useState({
    start_date: '',
    end_date: '',
    type: 'FULL_DAY',
    reason: '',
    term_id: ''
  });

  const teacherleavesAddAlert = (message, type = 'success') => {
    const id = Date.now();
    setTeacherleavesAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setTeacherleavesAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  };

  const teacherleavesFetchTerms = async () => {
    try {
      const r = await fetch('http://localhost:5000/api/admin/terms');
      if (!r.ok) throw new Error('Failed to fetch terms');
      const data = await r.json();
      const terms = Array.isArray(data) ? data : [];
      setTeacherleavesTerms(terms);
      
      // Automatically set the current active term
      const currentTerm = terms.find(term => term.is_active === true);
      if (currentTerm) {
        setTeacherleavesForm(prev => ({
          ...prev,
          term_id: currentTerm._id
        }));
      } else if (terms.length > 0) {
        // If no active term, use the most recent one
        const sortedTerms = [...terms].sort((a, b) => {
          const dateA = new Date(a.start_date || a.createdAt || 0);
          const dateB = new Date(b.start_date || b.createdAt || 0);
          return dateB - dateA;
        });
        setTeacherleavesForm(prev => ({
          ...prev,
          term_id: sortedTerms[0]._id
        }));
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
      teacherleavesAddAlert('Error fetching terms', 'error');
    }
  };

  const teacherleavesFetchLeaves = async () => {
    try {
      setTeacherleavesLoading(true);
      const userId = user.id || user._id;
      const r = await fetch(`http://localhost:5000/api/teacher/leaves?user_id=${userId}`);
      if (!r.ok) throw new Error('Failed to fetch leaves');
      const data = await r.json();
      const leaves = Array.isArray(data) ? data : [];
      // Sort by creation date (newest first)
      leaves.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || 0);
        const dateB = new Date(b.createdAt || b.created_at || 0);
        return dateB - dateA;
      });
      setTeacherleavesList(leaves);
    } catch (error) {
      console.error('Error fetching leaves:', error);
      teacherleavesAddAlert('Error fetching leaves: ' + (error.message || 'Unknown error'), 'error');
      setTeacherleavesList([]);
    } finally {
      setTeacherleavesLoading(false);
    }
  };

  useEffect(() => {
    teacherleavesFetchTerms();
    teacherleavesFetchLeaves();
  }, []);

  const teacherleavesRequestLeave = async (e) => {
    e.preventDefault();
    
    if (!teacherleavesForm.start_date || !teacherleavesForm.end_date) {
      teacherleavesAddAlert('Please fill all required fields', 'error');
      return;
    }

    // Ensure term_id is set (should already be set automatically, but double-check)
    if (!teacherleavesForm.term_id) {
      const currentTerm = adminleavesTerms.find(term => term.is_active === true);
      if (currentTerm) {
        setTeacherleavesForm(prev => ({ ...prev, term_id: currentTerm._id }));
      } else {
        teacherleavesAddAlert('No active term found. Please contact administrator.', 'error');
        return;
      }
    }

    try {
      setTeacherleavesLoading(true);
      const userId = user.id || user._id;
      const response = await fetch('http://localhost:5000/api/teacher/leaves', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          user_id: userId,
          term_id: teacherleavesForm.term_id, // Always include term_id
          ...teacherleavesForm
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit leave request');
      }
      
      teacherleavesAddAlert('Leave request submitted successfully', 'success');
      setTeacherleavesShowModal(false);
      setTeacherleavesForm({
        start_date: '',
        end_date: '',
        type: 'FULL_DAY',
        reason: '',
        term_id: ''
      });
      await teacherleavesFetchLeaves();
    } catch (error) {
      teacherleavesAddAlert(error.message || 'Error submitting leave request', 'error');
    } finally {
      setTeacherleavesLoading(false);
    }
  };

  const teacherleavesGetFilteredLeaves = () => {
    let filtered = teacherleavesList;
    
    if (teacherleavesFilterStatus !== 'ALL') {
      filtered = filtered.filter(leave => {
        const status = leave.approved === true ? 'APPROVED' : (leave.approved === false && leave.createdAt ? 'PENDING' : 'PENDING');
        return status === teacherleavesFilterStatus;
      });
    }
    
    return filtered;
  };

  const teacherleavesGetStatusColor = (approved) => {
    if (approved === true) return 'teacherleaves-status-approved';
    return 'teacherleaves-status-pending';
  };

  const teacherleavesGetStatusIcon = (approved) => {
    if (approved === true) return '✅';
    return '⏳';
  };

  const teacherleavesGetStatusLabel = (approved) => {
    if (approved === true) return 'APPROVED';
    return 'PENDING';
  };

  const teacherleavesGetLeaveTypeLabel = (leave) => {
    // Handle new format
    if (leave.type) {
      const labels = {
        'FULL_DAY': 'Full Day',
        'FIRST_HALF': 'First Half',
        'SECOND_HALF': 'Second Half'
      };
      return labels[leave.type] || leave.type;
    }
    // Handle old format
    if (leave.leave_type === 'Full') return 'Full Day';
    if (leave.leave_type === 'Half') {
      return leave.half_day_type === 'First' ? 'First Half' : 'Second Half';
    }
    return 'Full Day';
  };

  const teacherleavesGetLeaveTypeBadge = (leave) => {
    // Handle new format
    if (leave.type) {
      if (leave.type === 'FULL_DAY') return 'teacherleaves-type-full';
      return 'teacherleaves-type-half';
    }
    // Handle old format
    if (leave.leave_type === 'Full') return 'teacherleaves-type-full';
    return 'teacherleaves-type-half';
  };

  const teacherleavesCalculateLeaveDays = (startDate, endDate, leave) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const isFullDay = leave.type === 'FULL_DAY' || (leave.leave_type === 'Full');
    if (isFullDay) {
      return diffDays;
    } else {
      return diffDays * 0.5;
    }
  };

  const filteredLeaves = teacherleavesGetFilteredLeaves();

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
      title: 'Leave & Duties',
      items: [
        { label: 'Leave Requests', icon: '🏖️', path: '/teacher/leaves' },
        { label: 'Replacements', icon: '🔄', path: '/teacher/replacements' },
        { label: 'Duties', icon: '⚡', path: '/teacher/duties' }
      ]
    }
  ];

  return (
    <DashboardLayout
      pageTitle="Leave Management"
      pageDescription="Request and manage your leave applications"
      userRole="Teacher"
      userName={user.name || "Teacher User"}
      navigationSections={navigationSections}
    >
      {/* Alerts */}
      <div className="teacherleaves-alerts-container">
        {teacherleavesAlerts.map(alert => (
          <div key={alert.id} className={`teacherleaves-alert teacherleaves-alert-${alert.type}`}>
            {alert.message}
          </div>
        ))}
      </div>

      <div className="teacherleaves-container">
        {/* Header */}
        <div className="teacherleaves-header">
          <div className="teacherleaves-header-left">
            <h1 className="teacherleaves-page-title">Leave Management</h1>
            <p className="teacherleaves-page-subtitle">Apply for leave and view your leave request history</p>
          </div>
          <div className="teacherleaves-header-right">
            <button
              className="teacherleaves-btn teacherleaves-btn-primary"
              onClick={() => setTeacherleavesShowModal(true)}
            >
              ➕ Apply New Request
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="teacherleaves-stats-section">
          <div className="teacherleaves-stats-grid">
            <div className="teacherleaves-stat-card teacherleaves-stat-pending">
              <div className="teacherleaves-stat-icon">⏳</div>
              <div className="teacherleaves-stat-content">
                <h3 className="teacherleaves-stat-value">
                  {teacherleavesList.filter(l => !l.approved).length}
                </h3>
                <p className="teacherleaves-stat-label">Pending Requests</p>
              </div>
            </div>
            
            <div className="teacherleaves-stat-card teacherleaves-stat-approved">
              <div className="teacherleaves-stat-icon">✅</div>
              <div className="teacherleaves-stat-content">
                <h3 className="teacherleaves-stat-value">
                  {teacherleavesList.filter(l => l.approved === true).length}
                </h3>
                <p className="teacherleaves-stat-label">Approved</p>
              </div>
            </div>
            
            <div className="teacherleaves-stat-card teacherleaves-stat-total">
              <div className="teacherleaves-stat-icon">📋</div>
              <div className="teacherleaves-stat-content">
                <h3 className="teacherleaves-stat-value">
                  {teacherleavesList.length}
                </h3>
                <p className="teacherleaves-stat-label">Total Requests</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="teacherleaves-filters">
          <div className="teacherleaves-filter-group">
            <label htmlFor="teacherleaves-status-filter">Filter by Status:</label>
            <select
              id="teacherleaves-status-filter"
              value={teacherleavesFilterStatus}
              onChange={(e) => setTeacherleavesFilterStatus(e.target.value)}
              className="teacherleaves-filter-select"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
            </select>
          </div>
          
          <div className="teacherleaves-filter-stats">
            <span className="teacherleaves-stats-text">
              Showing {filteredLeaves.length} of {teacherleavesList.length} requests
            </span>
          </div>
        </div>

        {/* Leave Requests List */}
        <div className="teacherleaves-list-section">
          <div className="teacherleaves-list-header">
            <h2 className="teacherleaves-list-title">My Requests</h2>
            <p className="teacherleaves-list-subtitle">All your leave requests are listed below</p>
          </div>
          
          {teacherleavesLoading ? (
            <div className="teacherleaves-loading-container">
              <div className="teacherleaves-loading">Loading leave requests...</div>
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="teacherleaves-no-data">
              <div className="teacherleaves-no-data-icon">📋</div>
              <h3>No Leave Requests Found</h3>
              <p>No leave requests match the current filters</p>
            </div>
          ) : (
            <div className="teacherleaves-cards-grid">
              {filteredLeaves.map(leave => (
                <div key={leave._id} className="teacherleaves-card">
                  {/* Card Header */}
                  <div className="teacherleaves-card-header">
                    <div className="teacherleaves-leave-info">
                      <div className="teacherleaves-leave-avatar">
                        🏖️
                      </div>
                      <div className="teacherleaves-leave-details">
                        <h3 className="teacherleaves-leave-title">Leave Request</h3>
                        <span className="teacherleaves-leave-date">
                          {new Date(leave.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className={`teacherleaves-status-badge ${teacherleavesGetStatusColor(leave.approved)}`}>
                      {teacherleavesGetStatusIcon(leave.approved)} {teacherleavesGetStatusLabel(leave.approved)}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="teacherleaves-card-body">
                    <div className="teacherleaves-info-grid">
                      <div className="teacherleaves-info-item">
                        <span className="teacherleaves-info-icon">📅</span>
                        <div className="teacherleaves-info-content">
                          <span className="teacherleaves-info-label">Leave Type</span>
                          <span className={`teacherleaves-type-badge ${teacherleavesGetLeaveTypeBadge(leave)}`}>
                            {teacherleavesGetLeaveTypeLabel(leave)}
                          </span>
                        </div>
                      </div>
                      
                      {leave.term_id && (
                        <div className="teacherleaves-info-item">
                          <span className="teacherleaves-info-icon">📖</span>
                          <div className="teacherleaves-info-content">
                            <span className="teacherleaves-info-label">Term</span>
                            <span className="teacherleaves-info-value">
                              Term {leave.term_id?.term_number || 'N/A'}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="teacherleaves-info-item">
                        <span className="teacherleaves-info-icon">📆</span>
                        <div className="teacherleaves-info-content">
                          <span className="teacherleaves-info-label">Start Date</span>
                          <span className="teacherleaves-info-value">
                            {new Date(leave.start_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="teacherleaves-info-item">
                        <span className="teacherleaves-info-icon">📆</span>
                        <div className="teacherleaves-info-content">
                          <span className="teacherleaves-info-label">End Date</span>
                          <span className="teacherleaves-info-value">
                            {new Date(leave.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="teacherleaves-info-item">
                        <span className="teacherleaves-info-icon">⏱️</span>
                        <div className="teacherleaves-info-content">
                          <span className="teacherleaves-info-label">Duration</span>
                          <span className="teacherleaves-info-value">
                            {teacherleavesCalculateLeaveDays(leave.start_date, leave.end_date, leave)} days
                          </span>
                        </div>
                      </div>
                      
                      {leave.reason && (
                        <div className="teacherleaves-info-item teacherleaves-info-full">
                          <span className="teacherleaves-info-icon">💬</span>
                          <div className="teacherleaves-info-content">
                            <span className="teacherleaves-info-label">Reason</span>
                            <span className="teacherleaves-info-value">{leave.reason}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leave Request Modal */}
        {teacherleavesShowModal && (
          <div className="teacherleaves-modal-overlay">
            <div className="teacherleaves-modal">
              <div className="teacherleaves-modal-header">
                <h2>Request Leave</h2>
                <button
                  className="teacherleaves-close-btn"
                  onClick={() => setTeacherleavesShowModal(false)}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={teacherleavesRequestLeave} className="teacherleaves-modal-form">
                <div className="teacherleaves-form-group">
                  <label htmlFor="teacherleaves-term-select">Term (Optional)</label>
                  <select
                    id="teacherleaves-term-select"
                    value={teacherleavesForm.term_id}
                    onChange={(e) => setTeacherleavesForm({...teacherleavesForm, term_id: e.target.value})}
                    className="teacherleaves-form-select"
                  >
                    <option value="">Select Term (Optional)</option>
                    {teacherleavesTerms.map(term => (
                      <option key={term._id} value={term._id}>
                        Term {term.term_number} - {term.academic_year_id?.year_label || ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="teacherleaves-form-row">
                  <div className="teacherleaves-form-group">
                    <label htmlFor="teacherleaves-start-date">Start Date *</label>
                    <input
                      type="date"
                      id="teacherleaves-start-date"
                      value={teacherleavesForm.start_date}
                      onChange={(e) => setTeacherleavesForm({...teacherleavesForm, start_date: e.target.value})}
                      required
                      className="teacherleaves-form-input"
                    />
                  </div>
                  
                  <div className="teacherleaves-form-group">
                    <label htmlFor="teacherleaves-end-date">End Date *</label>
                    <input
                      type="date"
                      id="teacherleaves-end-date"
                      value={teacherleavesForm.end_date}
                      onChange={(e) => setTeacherleavesForm({...teacherleavesForm, end_date: e.target.value})}
                      required
                      className="teacherleaves-form-input"
                    />
                  </div>
                </div>
                
                <div className="teacherleaves-form-group">
                  <label htmlFor="teacherleaves-type-select">Leave Type *</label>
                  <select
                    id="teacherleaves-type-select"
                    value={teacherleavesForm.type}
                    onChange={(e) => setTeacherleavesForm({...teacherleavesForm, type: e.target.value})}
                    required
                    className="teacherleaves-form-select"
                  >
                    <option value="FULL_DAY">Full Day</option>
                    <option value="FIRST_HALF">First Half</option>
                    <option value="SECOND_HALF">Second Half</option>
                  </select>
                </div>
                
                <div className="teacherleaves-form-group">
                  <label htmlFor="teacherleaves-reason">Reason</label>
                  <textarea
                    id="teacherleaves-reason"
                    value={teacherleavesForm.reason}
                    onChange={(e) => setTeacherleavesForm({...teacherleavesForm, reason: e.target.value})}
                    rows="3"
                    placeholder="Enter reason for leave..."
                    className="teacherleaves-form-textarea"
                  />
                </div>
                
                <div className="teacherleaves-modal-actions">
                  <button
                    type="button"
                    className="teacherleaves-btn teacherleaves-btn-outline"
                    onClick={() => setTeacherleavesShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="teacherleaves-btn teacherleaves-btn-primary"
                    disabled={teacherleavesLoading}
                  >
                    {teacherleavesLoading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherLeaves;

