import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './StudentCounselling.css';

const StudentCounselling = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const mockSessions = [
        { id: 1, counsellor: 'Dr. Lisa Anderson', date: '2024-12-25', time: '10:00 AM', status: 'scheduled' },
        { id: 2, counsellor: 'Dr. Lisa Anderson', date: '2024-12-15', time: '11:00 AM', status: 'completed' },
      ];
      setSessions(mockSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigationSections = [
    {
      title: 'Support',
      items: [
        { label: 'Counselling', icon: '🧠', path: '/student/counselling' }
      ]
    }
  ];

  return (
    <DashboardLayout
      pageTitle="Counselling"
      pageDescription="Book and manage counselling sessions"
      userRole="Student"
      userName="Student User"
      navigationSections={navigationSections}
    >
      <div className="studentcounselling-container">
        <div className="studentcounselling-header">
          <button className="studentcounselling-btn-primary">Book New Session</button>
        </div>
        <div className="studentcounselling-list">
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
                    <span>Date: {new Date(session.date).toLocaleDateString()}</span>
                    <span>Time: {session.time}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentCounselling;

