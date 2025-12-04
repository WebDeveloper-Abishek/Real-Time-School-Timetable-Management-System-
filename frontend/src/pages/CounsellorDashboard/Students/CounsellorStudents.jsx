import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './CounsellorStudents.css';

const CounsellorStudents = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState('');

  const navigationSections = [
    {
      title: 'My Dashboard',
      items: [
        { label: 'Counsellor Home', icon: '🏠', path: '/counsellor/dashboard' },
        { label: 'Mental Health Reports', icon: '📊', path: '/counsellor/students' },
        { label: 'Appointments', icon: '📋', path: '/counsellor/appointments' }
      ]
    },
    {
      title: 'Profile',
      items: [
        { label: 'Update Profile', icon: '✏️', path: '/counsellor/profile' }
      ]
    }
  ];

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      
      if (!userId) {
        setLoading(false);
        return;
      }

      const { mentalHealthAPI } = await import('../../../services/api');
      const response = await mentalHealthAPI.getMentalHealthReports({
        user_id: userId,
        role: 'Counsellor'
      });

      if (response?.success) {
        setReports(response.reports || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(r => r.status?.toLowerCase() === filter);

  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const handleProvideFeedback = (report) => {
    setSelectedReport(report);
    setFeedback('');
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async () => {
    try {
      if (!feedback.trim()) {
        alert('Please provide feedback');
        return;
      }

      const { mentalHealthAPI } = await import('../../../services/api');
      const response = await mentalHealthAPI.provideMentalHealthFeedback(
        selectedReport._id,
        {
          feedback: feedback,
          status: 'Resolved',
          parent_notified: false,
          admin_notified: false
        }
      );

      if (response?.success) {
        alert('Feedback submitted successfully!');
        setShowFeedbackModal(false);
        fetchReports();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'counsellorstudents-severity-critical';
      case 'high': return 'counsellorstudents-severity-high';
      case 'medium': return 'counsellorstudents-severity-medium';
      case 'low': return 'counsellorstudents-severity-low';
      default: return 'counsellorstudents-severity-medium';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'reported': return 'counsellorstudents-status-reported';
      case 'in progress': return 'counsellorstudents-status-progress';
      case 'resolved': return 'counsellorstudents-status-resolved';
      default: return 'counsellorstudents-status-reported';
    }
  };

  return (
    <DashboardLayout
      pageTitle="Mental Health Reports"
      pageDescription="View and manage student mental health cases"
      userRole="Counsellor"
      userName={user?.name || "Counsellor User"}
      navigationSections={navigationSections}
    >
      <div className="counsellorstudents-container">
        <div className="counsellorstudents-header">
          <div className="counsellorstudents-filters">
            <button 
              className={filter === 'all' ? 'counsellorstudents-filter-active' : 'counsellorstudents-filter'}
              onClick={() => setFilter('all')}
            >
              All Reports
            </button>
            <button 
              className={filter === 'reported' ? 'counsellorstudents-filter-active' : 'counsellorstudents-filter'}
              onClick={() => setFilter('reported')}
            >
              New
            </button>
            <button 
              className={filter === 'in progress' ? 'counsellorstudents-filter-active' : 'counsellorstudents-filter'}
              onClick={() => setFilter('in progress')}
            >
              In Progress
            </button>
            <button 
              className={filter === 'resolved' ? 'counsellorstudents-filter-active' : 'counsellorstudents-filter'}
              onClick={() => setFilter('resolved')}
            >
              Resolved
            </button>
          </div>
        </div>

        <div className="counsellorstudents-grid">
          {loading ? (
            <div className="counsellorstudents-loading">Loading reports...</div>
          ) : filteredReports.length === 0 ? (
            <div className="counsellorstudents-empty">No mental health reports found.</div>
          ) : (
            filteredReports.map((report) => (
              <div key={report._id} className="counsellorstudents-card">
                <div className="counsellorstudents-card-header">
                  <div>
                    <h3>{report.student_id?.name || 'Student'}</h3>
                    <p className="counsellorstudents-issue-type">{report.issue_type}</p>
                  </div>
                  <div className="counsellorstudents-badges">
                    <span className={`counsellorstudents-severity ${getSeverityColor(report.severity)}`}>
                      {report.severity}
                    </span>
                    <span className={`counsellorstudents-status ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
                </div>
                <div className="counsellorstudents-card-body">
                  <p className="counsellorstudents-description">
                    {report.description?.substring(0, 100)}
                    {report.description?.length > 100 ? '...' : ''}
                  </p>
                  <div className="counsellorstudents-meta">
                    <span>📅 {new Date(report.createdAt).toLocaleDateString()}</span>
                    {report.is_confidential && <span className="counsellorstudents-confidential">🔒 Confidential</span>}
                  </div>
                </div>
                <div className="counsellorstudents-card-footer">
                  <button 
                    className="counsellorstudents-btn-view"
                    onClick={() => handleViewDetails(report)}
                  >
                    View Details
                  </button>
                  {report.status !== 'Resolved' && (
                    <button 
                      className="counsellorstudents-btn-feedback"
                      onClick={() => handleProvideFeedback(report)}
                    >
                      Provide Feedback
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {showDetailModal && selectedReport && (
          <div className="counsellorstudents-modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="counsellorstudents-modal" onClick={(e) => e.stopPropagation()}>
              <div className="counsellorstudents-modal-header">
                <h2>Report Details</h2>
                <button className="counsellorstudents-close-btn" onClick={() => setShowDetailModal(false)}>×</button>
              </div>
              <div className="counsellorstudents-modal-body">
                <div className="counsellorstudents-detail-group">
                  <label>Student:</label>
                  <p>{selectedReport.student_id?.name}</p>
                </div>
                <div className="counsellorstudents-detail-group">
                  <label>Issue Type:</label>
                  <p>{selectedReport.issue_type}</p>
                </div>
                <div className="counsellorstudents-detail-group">
                  <label>Severity:</label>
                  <span className={getSeverityColor(selectedReport.severity)}>{selectedReport.severity}</span>
                </div>
                <div className="counsellorstudents-detail-group">
                  <label>Status:</label>
                  <span className={getStatusColor(selectedReport.status)}>{selectedReport.status}</span>
                </div>
                <div className="counsellorstudents-detail-group">
                  <label>Description:</label>
                  <p>{selectedReport.description}</p>
                </div>
                <div className="counsellorstudents-detail-group">
                  <label>Reported On:</label>
                  <p>{new Date(selectedReport.createdAt).toLocaleString()}</p>
                </div>
                {selectedReport.is_confidential && (
                  <div className="counsellorstudents-confidential-notice">
                    🔒 This report is confidential
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showFeedbackModal && selectedReport && (
          <div className="counsellorstudents-modal-overlay" onClick={() => setShowFeedbackModal(false)}>
            <div className="counsellorstudents-modal" onClick={(e) => e.stopPropagation()}>
              <div className="counsellorstudents-modal-header">
                <h2>Provide Feedback</h2>
                <button className="counsellorstudents-close-btn" onClick={() => setShowFeedbackModal(false)}>×</button>
              </div>
              <div className="counsellorstudents-modal-body">
                <div className="counsellorstudents-detail-group">
                  <label>Student:</label>
                  <p>{selectedReport.student_id?.name}</p>
                </div>
                <div className="counsellorstudents-detail-group">
                  <label>Issue:</label>
                  <p>{selectedReport.issue_type}</p>
                </div>
                <div className="counsellorstudents-form-group">
                  <label>Feedback/Action Taken:</label>
                  <textarea
                    className="counsellorstudents-textarea"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Describe the counselling session, actions taken, and recommendations..."
                    rows="6"
                  />
                </div>
                <div className="counsellorstudents-modal-actions">
                  <button 
                    className="counsellorstudents-btn-cancel"
                    onClick={() => setShowFeedbackModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="counsellorstudents-btn-submit"
                    onClick={handleSubmitFeedback}
                  >
                    Submit Feedback
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CounsellorStudents;
