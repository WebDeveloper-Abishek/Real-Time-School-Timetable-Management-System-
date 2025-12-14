import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './CounsellorAppointments.css';

const CounsellorAppointments = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    start_time: '',
    end_time: '',
    max_duration: 45,
    notes: ''
  });

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
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      
      if (!userId) {
        setLoading(false);
        return;
      }

      const { mentalHealthAPI } = await import('../../../services/api');
      const response = await mentalHealthAPI.getCounsellorMeetings({
        counsellor_id: userId
      });

      if (response?.success) {
        setAppointments(response.meetings || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSlot = async (e) => {
    e.preventDefault();
    
    try {
      const userId = user?.id || user?._id;
      
      if (!userId) {
        alert('User not found');
        return;
      }

      const { mentalHealthAPI } = await import('../../../services/api');
      const response = await mentalHealthAPI.scheduleCounsellorSlot({
        counsellor_id: userId,
        date: scheduleForm.date,
        start_time: scheduleForm.start_time,
        end_time: scheduleForm.end_time,
        max_duration: scheduleForm.max_duration,
        notes: scheduleForm.notes
      });

      if (response?.success) {
        alert('Available slot created successfully!');
        setShowScheduleModal(false);
        setScheduleForm({
          date: '',
          start_time: '',
          end_time: '',
          max_duration: 45,
          notes: ''
        });
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error scheduling slot:', error);
      alert('Failed to create slot');
    }
  };

  const filteredAppointments = filter === 'all'
    ? appointments
    : appointments.filter(apt => apt.status?.toLowerCase() === filter);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return 'counsellorappointments-status-scheduled';
      case 'accepted': return 'counsellorappointments-status-accepted';
      case 'completed': return 'counsellorappointments-status-completed';
      case 'cancelled': return 'counsellorappointments-status-cancelled';
      default: return 'counsellorappointments-status-scheduled';
    }
  };

  return (
    <DashboardLayout
      pageTitle="My Appointments"
      pageDescription="Manage counselling sessions and availability"
      userRole="Counsellor"
      userName={user?.name || "Counsellor User"}
      navigationSections={navigationSections}
    >
      <div className="counsellorappointments-container">
        <div className="counsellorappointments-header">
          <div className="counsellorappointments-filters">
            <button 
              className={filter === 'all' ? 'counsellorappointments-filter-active' : 'counsellorappointments-filter'}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={filter === 'scheduled' ? 'counsellorappointments-filter-active' : 'counsellorappointments-filter'}
              onClick={() => setFilter('scheduled')}
            >
              Scheduled
            </button>
            <button 
              className={filter === 'completed' ? 'counsellorappointments-filter-active' : 'counsellorappointments-filter'}
              onClick={() => setFilter('completed')}
            >
              Completed
            </button>
          </div>
          <button 
            className="counsellorappointments-btn-schedule"
            onClick={() => setShowScheduleModal(true)}
          >
            + Add Available Slot
          </button>
        </div>

        <div className="counsellorappointments-list">
          {loading ? (
            <div className="counsellorappointments-loading">Loading appointments...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="counsellorappointments-empty">No appointments found.</div>
          ) : (
            filteredAppointments.map((apt) => {
              const student = apt.initiator_id || apt.participant_ids?.find(p => p.role === 'Student');
              
              return (
                <div key={apt._id} className="counsellorappointments-card">
                  <div className="counsellorappointments-card-header">
                    <div>
                      <h3>{student?.name || 'Student'}</h3>
                      <p className="counsellorappointments-subject">{apt.subject}</p>
                    </div>
                    <span className={`counsellorappointments-status ${getStatusColor(apt.status)}`}>
                      {apt.status}
                    </span>
                  </div>
                  <div className="counsellorappointments-card-body">
                    <div className="counsellorappointments-info">
                      <span>📅 Date: {new Date(apt.date).toLocaleDateString()}</span>
                      <span>⏰ Time: {apt.start_time} - {apt.end_time}</span>
                      <span>⏱️ Duration: {apt.duration} min</span>
                    </div>
                    {apt.description && (
                      <p className="counsellorappointments-description">{apt.description}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {showScheduleModal && (
          <div className="counsellorappointments-modal-overlay" onClick={() => setShowScheduleModal(false)}>
            <div className="counsellorappointments-modal" onClick={(e) => e.stopPropagation()}>
              <div className="counsellorappointments-modal-header">
                <h2>Create Available Slot</h2>
                <button className="counsellorappointments-close-btn" onClick={() => setShowScheduleModal(false)}>×</button>
              </div>
              <form onSubmit={handleScheduleSlot}>
                <div className="counsellorappointments-form-group">
                  <label>Date:</label>
                  <input
                    type="date"
                    value={scheduleForm.date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="counsellorappointments-form-row">
                  <div className="counsellorappointments-form-group">
                    <label>Start Time:</label>
                    <input
                      type="time"
                      value={scheduleForm.start_time}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="counsellorappointments-form-group">
                    <label>End Time:</label>
                    <input
                      type="time"
                      value={scheduleForm.end_time}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="counsellorappointments-form-group">
                  <label>Session Duration (minutes):</label>
                  <input
                    type="number"
                    value={scheduleForm.max_duration}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, max_duration: parseInt(e.target.value) })}
                    min="15"
                    max="120"
                  />
                </div>
                <div className="counsellorappointments-form-group">
                  <label>Notes (Optional):</label>
                  <textarea
                    value={scheduleForm.notes}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                    rows="3"
                    placeholder="Any special notes for this slot..."
                  />
                </div>
                <div className="counsellorappointments-modal-actions">
                  <button 
                    type="button"
                    className="counsellorappointments-btn-cancel"
                    onClick={() => setShowScheduleModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="counsellorappointments-btn-submit"
                  >
                    Create Slot
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

export default CounsellorAppointments;
