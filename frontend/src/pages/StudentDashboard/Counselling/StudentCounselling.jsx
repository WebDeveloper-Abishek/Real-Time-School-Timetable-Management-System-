import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './StudentCounselling.css';

const StudentCounselling = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [reportForm, setReportForm] = useState({
    reported_to: '',
    issue_type: '',
    description: '',
    severity: 'Medium',
    is_confidential: true
  });
  
  const navigationSections = [
    {
      title: 'My Dashboard',
      items: [
        { label: 'Student Home', icon: '🏠', path: '/student/dashboard' },
        { label: 'My Timetable', icon: '📅', path: '/student/timetable' },
        { label: 'Assignments', icon: '📝', path: '/student/assignments' }
      ]
    },
    {
      title: 'Academic',
      items: [
        { label: 'Exams & Grades', icon: '📊', path: '/student/exams' },
        { label: 'Attendance', icon: '✅', path: '/student/attendance' }
      ]
    },
    {
      title: 'Support',
      items: [
        { label: 'Counselling', icon: '🧠', path: '/student/counselling' }
      ]
    },
    {
      title: 'Profile',
      items: [
        { label: 'Update Profile', icon: '✏️', path: '/student/profile' }
      ]
    }
  ];

  useEffect(() => {
    fetchSessions();
    fetchAvailableSlots();
    fetchCounsellors();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      
      if (!userId) {
        setLoading(false);
        return;
      }

      const { mentalHealthAPI } = await import('../../../services/api');
      const response = await mentalHealthAPI.getCounsellorMeetings({
        student_id: userId
      });

      if (response?.success) {
        const meetings = response.meetings || [];
        const formattedSessions = meetings.map((meeting) => {
          const counsellor = meeting.participant_ids?.find(p => p.role === 'Counsellor');
          
          return {
            id: meeting._id,
            counsellor: counsellor?.name || 'Counsellor',
            date: meeting.date,
            time: meeting.start_time || '10:00 AM',
            status: meeting.status?.toLowerCase() || 'scheduled',
            subject: meeting.subject,
            description: meeting.description
          };
        });
        
        setSessions(formattedSessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const { mentalHealthAPI } = await import('../../../services/api');
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await mentalHealthAPI.getAvailableCounsellorSlots({
        start_date: startDate,
        end_date: endDate
      });

      if (response?.success) {
        setAvailableSlots(response.slots || []);
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
    }
  };

  const fetchCounsellors = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch('http://localhost:5000/api/admin/users?role=Counsellor', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.ok) {
        const data = await response.json();
        const counsellorsList = data.users || data || [];
        setCounsellors(counsellorsList.filter(u => u.role === 'Counsellor'));
      }
    } catch (error) {
      console.error('Error fetching counsellors:', error);
    }
  };

  const handleBookSession = async (slotId) => {
    try {
      const userId = user?.id || user?._id;
      const slot = availableSlots.find(s => s._id === slotId);
      
      if (!slot || !userId) return;

      const { mentalHealthAPI } = await import('../../../services/api');
      const response = await mentalHealthAPI.scheduleCounsellorMeeting({
        slot_id: slotId,
        initiator_id: userId,
        participant_ids: [slot.counsellor_id?._id || slot.counsellor_id],
        subject: 'Counselling Session',
        description: 'Student requested counselling session',
        duration: slot.max_duration || 45
      });

      if (response?.success) {
        alert('Session booked successfully!');
        setShowBookingModal(false);
        fetchSessions();
        fetchAvailableSlots();
      }
    } catch (error) {
      console.error('Error booking session:', error);
      alert('Failed to book session. Please try again.');
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    
    try {
      const userId = user?.id || user?._id;
      
      if (!userId || !reportForm.reported_to || !reportForm.issue_type || !reportForm.description) {
        alert('Please fill in all required fields');
        return;
      }

      const { mentalHealthAPI } = await import('../../../services/api');
      const response = await mentalHealthAPI.submitMentalHealthReport({
        student_id: userId,
        reported_to: reportForm.reported_to,
        issue_type: reportForm.issue_type,
        description: reportForm.description,
        severity: reportForm.severity,
        is_confidential: reportForm.is_confidential
      });

      if (response?.success) {
        alert('Mental health report submitted successfully! A counsellor will contact you soon.');
        setShowReportModal(false);
        setReportForm({
          reported_to: '',
          issue_type: '',
          description: '',
          severity: 'Medium',
          is_confidential: true
        });
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report');
    }
  };

  return (
    <DashboardLayout
      pageTitle="Counselling"
      pageDescription="Book sessions and report mental health concerns"
      userRole="Student"
      userName={user?.name || "Student User"}
      navigationSections={navigationSections}
    >
      <div className="studentcounselling-container">
        <div className="studentcounselling-header">
          <button 
            className="studentcounselling-btn-primary"
            onClick={() => setShowReportModal(true)}
          >
            Report Mental Health Issue
          </button>
          <button 
            className="studentcounselling-btn-secondary"
            onClick={() => setShowBookingModal(true)}
          >
            Book Counselling Session
          </button>
        </div>
        
        <div className="studentcounselling-list">
          <h3>My Counselling Sessions</h3>
          {loading ? (
            <div className="studentcounselling-loading">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="studentcounselling-empty">No counselling sessions scheduled.</div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="studentcounselling-card">
                <div className="studentcounselling-card-header">
                  <h3>Session with {session.counsellor}</h3>
                  <span className={`studentcounselling-status studentcounselling-status-${session.status}`}>
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </span>
                </div>
                <div className="studentcounselling-card-body">
                  <div className="studentcounselling-info">
                    <span>📅 Date: {new Date(session.date).toLocaleDateString()}</span>
                    <span>⏰ Time: {session.time}</span>
                  </div>
                  {session.subject && <p className="studentcounselling-subject">{session.subject}</p>}
                </div>
              </div>
            ))
          )}
        </div>

        {showReportModal && (
          <div className="studentcounselling-modal-overlay" onClick={() => setShowReportModal(false)}>
            <div className="studentcounselling-modal" onClick={(e) => e.stopPropagation()}>
              <div className="studentcounselling-modal-header">
                <h2>Report Mental Health Issue</h2>
                <button className="studentcounselling-close-btn" onClick={() => setShowReportModal(false)}>×</button>
              </div>
              <form onSubmit={handleSubmitReport}>
                <div className="studentcounselling-form-group">
                  <label>Report To (Counsellor): *</label>
                  <select
                    value={reportForm.reported_to}
                    onChange={(e) => setReportForm({ ...reportForm, reported_to: e.target.value })}
                    required
                  >
                    <option value="">Select Counsellor</option>
                    {counsellors.map((counsellor) => (
                      <option key={counsellor._id || counsellor.id} value={counsellor._id || counsellor.id}>
                        {counsellor.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="studentcounselling-form-group">
                  <label>Issue Type: *</label>
                  <select
                    value={reportForm.issue_type}
                    onChange={(e) => setReportForm({ ...reportForm, issue_type: e.target.value })}
                    required
                  >
                    <option value="">Select Issue Type</option>
                    <option value="Stress & Anxiety">Stress & Anxiety</option>
                    <option value="Depression">Depression</option>
                    <option value="Bullying">Bullying</option>
                    <option value="Family Issues">Family Issues</option>
                    <option value="Academic Pressure">Academic Pressure</option>
                    <option value="Social Issues">Social Issues</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="studentcounselling-form-group">
                  <label>Severity: *</label>
                  <select
                    value={reportForm.severity}
                    onChange={(e) => setReportForm({ ...reportForm, severity: e.target.value })}
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="studentcounselling-form-group">
                  <label>Description: *</label>
                  <textarea
                    value={reportForm.description}
                    onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                    placeholder="Please describe your concern in detail..."
                    rows="5"
                    required
                  />
                </div>
                <div className="studentcounselling-form-group">
                  <label className="studentcounselling-checkbox">
                    <input
                      type="checkbox"
                      checked={reportForm.is_confidential}
                      onChange={(e) => setReportForm({ ...reportForm, is_confidential: e.target.checked })}
                    />
                    <span>Keep this report confidential</span>
                  </label>
                </div>
                <div className="studentcounselling-modal-actions">
                  <button 
                    type="button"
                    className="studentcounselling-btn-cancel"
                    onClick={() => setShowReportModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="studentcounselling-btn-submit"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {showBookingModal && (
          <div className="studentcounselling-modal-overlay" onClick={() => setShowBookingModal(false)}>
            <div className="studentcounselling-modal" onClick={(e) => e.stopPropagation()}>
              <div className="studentcounselling-modal-header">
                <h2>Available Sessions</h2>
                <button className="studentcounselling-close-btn" onClick={() => setShowBookingModal(false)}>×</button>
              </div>
              <div className="studentcounselling-slots-list">
                {availableSlots.length === 0 ? (
                  <p className="studentcounselling-empty">No available slots at the moment.</p>
                ) : (
                  availableSlots.map((slot) => (
                    <div key={slot._id} className="studentcounselling-slot-card">
                      <div className="studentcounselling-slot-info">
                        <strong>{slot.counsellor_id?.name || 'Counsellor'}</strong>
                        <p>📅 {new Date(slot.date).toLocaleDateString()}</p>
                        <p>⏰ {slot.start_time} - {slot.end_time}</p>
                        <p>⏱️ Duration: {slot.max_duration} min</p>
                      </div>
                      <button 
                        onClick={() => handleBookSession(slot._id)}
                        className="studentcounselling-btn-book"
                      >
                        Book
                      </button>
                    </div>
                  ))
                )}
              </div>
              <button 
                className="studentcounselling-btn-cancel"
                onClick={() => setShowBookingModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentCounselling;
