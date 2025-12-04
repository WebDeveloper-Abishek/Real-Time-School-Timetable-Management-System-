import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './StudentAttendance.css';

const StudentAttendance = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
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
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchCurrentTerm();
  }, []);

  useEffect(() => {
    if (currentTerm) {
      fetchAttendance();
    }
  }, [currentTerm, dateRange]);

  const fetchCurrentTerm = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch('http://localhost:5000/api/academic/terms/current', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentTerm(data);
      }
    } catch (error) {
      console.error('Error fetching current term:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      const token = localStorage.getItem('token') || '';

      if (!userId || !currentTerm?._id) {
        setLoading(false);
        return;
      }

      const url = new URL('http://localhost:5000/api/attendance/student');
      url.searchParams.append('student_id', userId);
      url.searchParams.append('term_id', currentTerm._id);
      url.searchParams.append('start_date', dateRange.start);
      url.searchParams.append('end_date', dateRange.end);

      const response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch attendance');
      }

      const data = await response.json();
      
      if (data.success) {
        // Flatten attendance array if it's grouped
        const attendanceList = Array.isArray(data.attendance) 
          ? data.attendance 
          : Object.values(data.attendance).flat();
        
        setAttendance(attendanceList);
        
        if (data.statistics) {
          setStats({
            total: data.statistics.total || 0,
            present: data.statistics.present || 0,
            absent: data.statistics.absent || 0,
            late: data.statistics.late || 0,
            percentage: parseFloat(data.statistics.presentPercentage || 0)
          });
        } else {
          // Calculate stats manually
          const total = attendanceList.length;
          const present = attendanceList.filter(a => a.status === 'Present').length;
          const absent = attendanceList.filter(a => a.status === 'Absent').length;
          const late = attendanceList.filter(a => a.status === 'Late').length;
          setStats({
            total,
            present,
            absent,
            late,
            percentage: total > 0 ? ((present / total) * 100).toFixed(1) : 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      pageTitle="My Attendance"
      pageDescription="Track your attendance record"
      userRole="Student"
      userName={user?.name || "Student User"}
      navigationSections={navigationSections}
    >
      <div className="studentattendance-container">
        {/* Stats Cards */}
        <div className="studentattendance-stats">
          <div className="studentattendance-stat-card studentattendance-stat-primary">
            <div className="studentattendance-stat-icon">📊</div>
            <div className="studentattendance-stat-content">
              <h3>{stats.percentage}%</h3>
              <p>Attendance Rate</p>
            </div>
          </div>
          <div className="studentattendance-stat-card studentattendance-stat-success">
            <div className="studentattendance-stat-icon">✅</div>
            <div className="studentattendance-stat-content">
              <h3>{stats.present}</h3>
              <p>Present</p>
            </div>
          </div>
          <div className="studentattendance-stat-card studentattendance-stat-warning">
            <div className="studentattendance-stat-icon">⏰</div>
            <div className="studentattendance-stat-content">
              <h3>{stats.late}</h3>
              <p>Late</p>
            </div>
          </div>
          <div className="studentattendance-stat-card studentattendance-stat-error">
            <div className="studentattendance-stat-icon">❌</div>
            <div className="studentattendance-stat-content">
              <h3>{stats.absent}</h3>
              <p>Absent</p>
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="studentattendance-filters">
          <div className="studentattendance-filter-group">
            <label>From Date:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div className="studentattendance-filter-group">
            <label>To Date:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
        </div>

        {/* Attendance Table */}
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
                  <td colSpan="4" className="studentattendance-empty">No attendance records found for the selected period.</td>
                </tr>
              ) : (
                attendance.map((record, index) => (
                  <tr key={record._id || index}>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>{record.subject_id?.subject_name || 'N/A'}</td>
                    <td>Period {record.slot_id?.slot_number || 'N/A'}</td>
                    <td>
                      <span className={`studentattendance-status studentattendance-status-${record.status?.toLowerCase() || 'unknown'}`}>
                        {record.status || 'N/A'}
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
