import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './ParentAttendance.css';

const ParentAttendance = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const navigationSections = [
    {
      title: 'My Children',
      items: [
        { label: 'Parent Home', icon: '🏠', path: '/parent/dashboard' },
        { label: 'My Children', icon: '👨‍👩‍👧‍👦', path: '/parent/children' },
        { label: 'Attendance', icon: '✅', path: '/parent/attendance' }
      ]
    },
    {
      title: 'Profile',
      items: [
        { label: 'Update Profile', icon: '✏️', path: '/parent/profile' }
      ]
    }
  ];

  useEffect(() => {
    fetchChildren();
    fetchCurrentTerm();
  }, []);

  useEffect(() => {
    if (selectedChild && currentTerm) {
      fetchChildAttendance();
    }
  }, [selectedChild, currentTerm, dateRange]);

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

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      const token = localStorage.getItem('token') || '';

      if (!userId) {
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:5000/api/parent/children?parent_id=${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setChildren(data);
          setSelectedChild(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildAttendance = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      const token = localStorage.getItem('token') || '';

      if (!userId || !selectedChild?.student_id || !currentTerm?._id) {
        setLoading(false);
        return;
      }

      const url = new URL('http://localhost:5000/api/attendance/child');
      url.searchParams.append('parent_id', userId);
      url.searchParams.append('child_id', selectedChild.student_id);
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
      console.error('Error fetching child attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      pageTitle="Children Attendance"
      pageDescription="Track your children's attendance"
      userRole="Parent"
      userName={user?.name || "Parent User"}
      navigationSections={navigationSections}
    >
      <div className="parentattendance-container">
        {/* Child Selection */}
        {children.length > 1 && (
          <div className="parentattendance-child-selector">
            <label>Select Child:</label>
            <select
              value={selectedChild?.student_id || ''}
              onChange={(e) => {
                const child = children.find(c => c.student_id === e.target.value);
                setSelectedChild(child || null);
              }}
            >
              {children.map(child => (
                <option key={child.student_id} value={child.student_id}>
                  {child.student_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Stats Cards */}
        {selectedChild && (
          <>
            <div className="parentattendance-stats">
              <div className="parentattendance-stat-card parentattendance-stat-primary">
                <div className="parentattendance-stat-icon">📊</div>
                <div className="parentattendance-stat-content">
                  <h3>{stats.percentage}%</h3>
                  <p>Attendance Rate</p>
                </div>
              </div>
              <div className="parentattendance-stat-card parentattendance-stat-success">
                <div className="parentattendance-stat-icon">✅</div>
                <div className="parentattendance-stat-content">
                  <h3>{stats.present}</h3>
                  <p>Present</p>
                </div>
              </div>
              <div className="parentattendance-stat-card parentattendance-stat-warning">
                <div className="parentattendance-stat-icon">⏰</div>
                <div className="parentattendance-stat-content">
                  <h3>{stats.late}</h3>
                  <p>Late</p>
                </div>
              </div>
              <div className="parentattendance-stat-card parentattendance-stat-error">
                <div className="parentattendance-stat-icon">❌</div>
                <div className="parentattendance-stat-content">
                  <h3>{stats.absent}</h3>
                  <p>Absent</p>
                </div>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="parentattendance-filters">
              <div className="parentattendance-filter-group">
                <label>From Date:</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div className="parentattendance-filter-group">
                <label>To Date:</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>

            {/* Attendance Table */}
            <div className="parentattendance-table-container">
              <table className="parentattendance-table">
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
                      <td colSpan="4" className="parentattendance-loading">Loading attendance...</td>
                    </tr>
                  ) : attendance.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="parentattendance-empty">No attendance records found for the selected period.</td>
                    </tr>
                  ) : (
                    attendance.map((record, index) => (
                      <tr key={record._id || index}>
                        <td>{new Date(record.date).toLocaleDateString()}</td>
                        <td>{record.subject_id?.subject_name || 'N/A'}</td>
                        <td>Period {record.slot_id?.slot_number || 'N/A'}</td>
                        <td>
                          <span className={`parentattendance-status parentattendance-status-${record.status?.toLowerCase() || 'unknown'}`}>
                            {record.status || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!selectedChild && !loading && (
          <div className="parentattendance-no-child">
            <p>No children found. Please contact the administrator.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ParentAttendance;
