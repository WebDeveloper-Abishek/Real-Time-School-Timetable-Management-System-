import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './StudentAttendance.css';

const StudentAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('daily');

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      // Mock data - replace with actual API call
      const mockAttendance = [
        { id: 1, date: '2024-12-19', subject: 'Mathematics', status: 'Present', period: 2 },
        { id: 2, date: '2024-12-18', subject: 'English', status: 'Present', period: 3 },
        { id: 3, date: '2024-12-17', subject: 'Science', status: 'Absent', period: 4 },
      ];
      setAttendance(mockAttendance);
      setStats({ total: 30, present: 28, absent: 2, percentage: 93.3 });
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigationSections = [
    {
      title: 'My Dashboard',
      items: [
        { label: 'Student Home', icon: '🏠', path: '/student/dashboard' },
        { label: 'Attendance', icon: '✅', path: '/student/attendance' }
      ]
    }
  ];

  return (
    <DashboardLayout
      pageTitle="My Attendance"
      pageDescription="Track your attendance record"
      userRole="Student"
      userName="Student User"
      navigationSections={navigationSections}
    >
      <div className="studentattendance-container">
        <div className="studentattendance-stats">
          <div className="studentattendance-stat-card">
            <h3>{stats.percentage.toFixed(1)}%</h3>
            <p>Attendance Rate</p>
          </div>
          <div className="studentattendance-stat-card">
            <h3>{stats.present}</h3>
            <p>Days Present</p>
          </div>
          <div className="studentattendance-stat-card">
            <h3>{stats.absent}</h3>
            <p>Days Absent</p>
          </div>
          <div className="studentattendance-stat-card">
            <h3>{stats.total}</h3>
            <p>Total Days</p>
          </div>
        </div>

        <div className="studentattendance-table-container">
          <table className="studentattendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject</th>
                <th>Period</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="studentattendance-loading">Loading attendance...</td>
                </tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td colSpan="4" className="studentattendance-empty">No attendance records found.</td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record.id}>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>{record.subject}</td>
                    <td>Period {record.period}</td>
                    <td>
                      <span className={`studentattendance-status studentattendance-status-${record.status.toLowerCase()}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentAttendance;

