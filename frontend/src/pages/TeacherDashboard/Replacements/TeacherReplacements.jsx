import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './TeacherReplacements.css';

const TeacherReplacements = () => {
  const [teacherreplacementsRequests, setTeacherreplacementsRequests] = useState([]);
  const [teacherreplacementsAlerts, setTeacherreplacementsAlerts] = useState([]);
  const [teacherreplacementsLoading, setTeacherreplacementsLoading] = useState(false);

  const teacherreplacementsAddAlert = (message, type = 'success') => {
    const id = Date.now();
    setTeacherreplacementsAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setTeacherreplacementsAlerts(prev => prev.filter(alert => alert.id !== id)), 5000);
  };

  const teacherreplacementsFetchRequests = async () => {
    try {
      setTeacherreplacementsLoading(true);
      const response = await fetch('/api/teacher/replacement-requests');
      const data = await response.json();
      setTeacherreplacementsRequests(data.requests || []);
    } catch (error) {
      teacherreplacementsAddAlert('Error fetching replacement requests', 'error');
    } finally {
      setTeacherreplacementsLoading(false);
    }
  };

  const teacherreplacementsAcceptRequest = async (requestId) => {
    try {
      await fetch(`/api/replacement/accept/${requestId}`, { method: 'POST' });
      teacherreplacementsAddAlert('Replacement request accepted', 'success');
      teacherreplacementsFetchRequests();
    } catch (error) {
      teacherreplacementsAddAlert('Error accepting request', 'error');
    }
  };

  const teacherreplacementsDeclineRequest = async (requestId) => {
    try {
      await fetch(`/api/replacement/decline/${requestId}`, { method: 'POST' });
      teacherreplacementsAddAlert('Replacement request declined', 'info');
      teacherreplacementsFetchRequests();
    } catch (error) {
      teacherreplacementsAddAlert('Error declining request', 'error');
    }
  };

  useEffect(() => {
    teacherreplacementsFetchRequests();
  }, []);

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
      title: 'Replacements',
      items: [
        { label: 'Replacement Requests', icon: '👨‍🏫', path: '/teacher/replacements' },
        { label: 'My Replacements', icon: '📋', path: '/teacher/my-replacements' }
      ]
    }
  ];

  return (
    <DashboardLayout
      pageTitle="Replacement Requests"
      pageDescription="Manage your replacement teaching requests"
      userRole="Teacher"
      userName="Teacher User"
      navigationSections={navigationSections}
    >
      <div className="teacherreplacements-alerts-container">
        {teacherreplacementsAlerts.map(alert => (
          <div key={alert.id} className={`teacherreplacements-alert teacherreplacements-alert-${alert.type}`}>
            {alert.message}
          </div>
        ))}
      </div>

      <div className="teacherreplacements-container">
        <div className="teacherreplacements-header">
          <h1 className="teacherreplacements-page-title">Replacement Requests</h1>
          <p className="teacherreplacements-page-subtitle">Manage your replacement teaching requests</p>
        </div>

        {teacherreplacementsLoading ? (
          <div className="teacherreplacements-loading">
            <div className="teacherreplacements-loading-spinner"></div>
            <p>Loading replacement requests...</p>
          </div>
        ) : teacherreplacementsRequests.length === 0 ? (
          <div className="teacherreplacements-no-requests">
            <div className="teacherreplacements-no-requests-icon">👨‍🏫</div>
            <h3>No Replacement Requests</h3>
            <p>You don't have any pending replacement requests at the moment</p>
          </div>
        ) : (
          <div className="teacherreplacements-requests-grid">
            {teacherreplacementsRequests.map(request => (
              <div key={request._id} className="teacherreplacements-request-card">
                <div className="teacherreplacements-request-header">
                  <div className="teacherreplacements-request-icon">
                    {request.type === 'replacement_request' ? '👨‍🏫' : '📅'}
                  </div>
                  <div className="teacherreplacements-request-info">
                    <h3 className="teacherreplacements-request-title">{request.title}</h3>
                    <p className="teacherreplacements-request-message">{request.message}</p>
                  </div>
                </div>
                
                <div className="teacherreplacements-request-details">
                  <div className="teacherreplacements-detail-item">
                    <span className="teacherreplacements-detail-label">Class:</span>
                    <span className="teacherreplacements-detail-value">{request.data?.class_name || 'Unknown'}</span>
                  </div>
                  <div className="teacherreplacements-detail-item">
                    <span className="teacherreplacements-detail-label">Subject:</span>
                    <span className="teacherreplacements-detail-value">{request.data?.subject_name || 'Unknown'}</span>
                  </div>
                  <div className="teacherreplacements-detail-item">
                    <span className="teacherreplacements-detail-label">Date:</span>
                    <span className="teacherreplacements-detail-value">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="teacherreplacements-request-actions">
                  <button 
                    className="teacherreplacements-btn teacherreplacements-btn-accept"
                    onClick={() => teacherreplacementsAcceptRequest(request._id)}
                  >
                    ✅ Accept
                  </button>
                  <button 
                    className="teacherreplacements-btn teacherreplacements-btn-decline"
                    onClick={() => teacherreplacementsDeclineRequest(request._id)}
                  >
                    ❌ Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherReplacements;
