import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../Components/DashboardLayout/DashboardLayout';
import ProfileUpdateModal from '../../Components/ProfileUpdateModal/ProfileUpdateModal';
import './CounsellorDashboard.css';

const CounsellorDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalStudents: 0,
      todayAppointments: 0,
      activeCases: 0,
      completedSessions: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      
      if (!userId) {
        setLoading(false);
        return;
      }

      const stats = {
        totalStudents: 0,
        todayAppointments: 0,
        activeCases: 0,
        completedSessions: 0
      };

      try {
        const { mentalHealthAPI } = await import('../../services/api');
        const reportsResponse = await mentalHealthAPI.getMentalHealthReports({
          user_id: userId,
          role: 'Counsellor'
        });
        
        if (reportsResponse?.success) {
          const reports = reportsResponse.reports || [];
          stats.activeCases = reports.filter(r => r.status === 'Reported' || r.status === 'In Progress').length;
          const uniqueStudents = new Set(reports.map(r => r.student_id?._id || r.student_id));
          stats.totalStudents = uniqueStudents.size;
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
      }

      try {
        const { mentalHealthAPI } = await import('../../services/api');
        const today = new Date().toISOString().split('T')[0];
        const meetingsResponse = await mentalHealthAPI.getCounsellorMeetings({
          counsellor_id: userId,
          start_date: today,
          end_date: today
        });
        
        if (meetingsResponse?.success) {
          const meetings = meetingsResponse.meetings || [];
          stats.todayAppointments = meetings.filter(m => m.status === 'Scheduled' || m.status === 'Accepted').length;
          stats.completedSessions = meetings.filter(m => m.status === 'Completed').length;
        }
      } catch (error) {
        console.error('Error fetching meetings:', error);
      }

      setDashboardData({ stats });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = () => {
    setShowProfileModal(true);
  };

  const handleProfileClose = () => {
    setShowProfileModal(false);
  };

  const handleProfileUpdated = (updatedUser) => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUserData = { ...currentUser, ...updatedUser };
    localStorage.setItem('user', JSON.stringify(updatedUserData));
    setShowProfileModal(false);
  };

  const go = (path) => () => navigate(path);

  const navigationSections = [
    {
      title: 'My Dashboard',
      items: [
        { label: 'Counsellor Home', icon: '🏠', path: '/counsellor/dashboard' },
        { label: 'My Schedule', icon: '📅', path: '/counsellor/schedule' },
        { label: 'Student Cases', icon: '👥', path: '/counsellor/students' },
        { label: 'Appointments', icon: '📋', path: '/counsellor/appointments' }
      ]
    },
    {
      title: 'Profile',
      items: [
        { label: 'Update Profile', icon: '✏️', path: '/counsellor/profile', onClick: handleProfileUpdate }
      ]
    }
  ];

  if (loading) {
    return (
      <DashboardLayout
        pageTitle="Counsellor Dashboard"
        pageDescription="Loading dashboard data..."
        userRole="Counsellor"
        userName={user?.name || "Counsellor User"}
        navigationSections={navigationSections}
      >
        <div className="counsellordash-loading-container">
          <div className="counsellordash-loading">Loading Dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      pageTitle="Counsellor Dashboard"
      pageDescription="Welcome back! Supporting student wellbeing today."
      userRole="Counsellor"
      userName={user?.name || "Counsellor User"}
      navigationSections={navigationSections}
    >
      {/* Quick Stats Cards */}
      <section className="counsellordash-stats-section">
        <div className="counsellordash-stats-grid">
          <div className="counsellordash-stat-card counsellordash-primary">
            <div className="counsellordash-stat-icon counsellordash-students">🎓</div>
            <div className="counsellordash-stat-content">
              <h3 className="counsellordash-stat-value">{dashboardData.stats.totalStudents}</h3>
              <p className="counsellordash-stat-label">My Students</p>
              <span className="counsellordash-stat-change counsellordash-info">Assigned to me</span>
            </div>
          </div>
          
          <div className="counsellordash-stat-card counsellordash-success">
            <div className="counsellordash-stat-icon counsellordash-appointments">📅</div>
            <div className="counsellordash-stat-content">
              <h3 className="counsellordash-stat-value">{dashboardData.stats.todayAppointments}</h3>
              <p className="counsellordash-stat-label">Today's Sessions</p>
              <span className="counsellordash-stat-change counsellordash-positive">Scheduled today</span>
            </div>
          </div>
          
          <div className="counsellordash-stat-card counsellordash-warning">
            <div className="counsellordash-stat-icon counsellordash-cases">🧠</div>
            <div className="counsellordash-stat-content">
              <h3 className="counsellordash-stat-value">{dashboardData.stats.activeCases}</h3>
              <p className="counsellordash-stat-label">Active Cases</p>
              <span className="counsellordash-stat-change counsellordash-warning">Needs attention</span>
            </div>
          </div>
          
          <div className="counsellordash-stat-card counsellordash-info">
            <div className="counsellordash-stat-icon counsellordash-completed">✅</div>
            <div className="counsellordash-stat-content">
              <h3 className="counsellordash-stat-value">{dashboardData.stats.completedSessions}</h3>
              <p className="counsellordash-stat-label">Completed Sessions</p>
              <span className="counsellordash-stat-change counsellordash-info">This term</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="counsellordash-quick-actions-section">
        <h2 className="counsellordash-section-title">Quick Actions</h2>
        <div className="counsellordash-quick-actions-grid">
          <button className="counsellordash-quick-action-card" onClick={go('/counsellor/schedule')}>
            <div className="counsellordash-action-icon">📅</div>
            <h3>My Schedule</h3>
            <p>View appointment schedule</p>
          </button>
          
          <button className="counsellordash-quick-action-card" onClick={go('/counsellor/students')}>
            <div className="counsellordash-action-icon">🎓</div>
            <h3>My Students</h3>
            <p>Manage student profiles</p>
          </button>
          
          <button className="counsellordash-quick-action-card" onClick={go('/counsellor/requests')}>
            <div className="counsellordash-action-icon">⏰</div>
            <h3>Requests</h3>
            <p>Review appointment requests</p>
          </button>
          
          <button className="counsellordash-quick-action-card" onClick={go('/counsellor/case-management')}>
            <div className="counsellordash-action-icon">🧠</div>
            <h3>Case Management</h3>
            <p>Manage active cases</p>
          </button>
          
          <button className="counsellordash-quick-action-card" onClick={go('/counsellor/messages')}>
            <div className="counsellordash-action-icon">💬</div>
            <h3>Messages</h3>
            <p>Communicate with students</p>
          </button>
        </div>
      </section>

      {/* 12 Cards Grid Section */}
      <section className="counsellordash-cards-grid-section">
        <div className="counsellordash-cards-grid">
          <div className="counsellordash-card counsellordash-card-1">
            <h3>📅 My Schedule</h3>
            <button className="counsellordash-view-all-btn" onClick={go('/counsellor/schedule')}>View Calendar</button>
          </div>
          
          <div className="counsellordash-card counsellordash-card-2">
            <h3>🎓 My Students</h3>
            <button className="counsellordash-view-all-btn" onClick={go('/counsellor/students')}>View All</button>
          </div>
          
          <div className="counsellordash-card counsellordash-card-3">
            <h3>⏰ Requests</h3>
            <button className="counsellordash-view-all-btn" onClick={go('/counsellor/requests')}>Review</button>
          </div>
          
          <div className="counsellordash-card counsellordash-card-4">
            <h3>✅ Completed</h3>
            <button className="counsellordash-view-all-btn" onClick={go('/counsellor/completed')}>View Sessions</button>
          </div>
          
          <div className="counsellordash-card counsellordash-card-5">
            <h3>📝 Session Notes</h3>
            <button className="counsellordash-view-all-btn" onClick={go('/counsellor/notes')}>View Notes</button>
          </div>
          
          <div className="counsellordash-card counsellordash-card-6">
            <h3>🧠 Active Cases</h3>
            <button className="counsellordash-view-all-btn" onClick={go('/counsellor/active-cases')}>Manage</button>
          </div>
          
          <div className="counsellordash-card counsellordash-card-7">
            <h3>📋 Case Management</h3>
            <button className="counsellordash-view-all-btn" onClick={go('/counsellor/case-management')}>View All</button>
          </div>
          
          <div className="counsellordash-card counsellordash-card-8">
            <h3>📈 Progress Tracking</h3>
            <button className="counsellordash-view-all-btn" onClick={go('/counsellor/progress')}>Track Progress</button>
          </div>
          
          <div className="counsellordash-card counsellordash-card-9">
            <h3>🔔 Follow-ups</h3>
            <button className="counsellordash-view-all-btn" onClick={go('/counsellor/followups')}>View All</button>
          </div>
          
          <div className="counsellordash-card counsellordash-card-10">
            <h3>💬 Messages</h3>
            <button className="counsellordash-view-all-btn" onClick={go('/counsellor/messages')}>Open Chat</button>
          </div>
          
          <div className="counsellordash-card counsellordash-card-11">
            <h3>📚 Resources</h3>
            <button className="counsellordash-view-all-btn" onClick={go('/counsellor/resources')}>Browse</button>
          </div>
          
          <div className="counsellordash-card counsellordash-card-12">
            <h3>📊 Reports</h3>
            <button className="counsellordash-view-all-btn" onClick={go('/counsellor/analytics')}>View Analytics</button>
          </div>
        </div>
      </section>

      <ProfileUpdateModal
        isOpen={showProfileModal}
        onClose={handleProfileClose}
        onUpdate={handleProfileUpdated}
      />
    </DashboardLayout>
  );
};

export default CounsellorDashboard;
