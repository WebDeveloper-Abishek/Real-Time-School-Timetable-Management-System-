import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../Components/AdminLayout/AdminLayout';
import './AdminAttendance.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const AdminAttendance = () => {
  const navigate = useNavigate();
  
  // State with unique prefixes
  const [adminattendTerms, setAdminattendTerms] = useState([]);
  const [adminattendClasses, setAdminattendClasses] = useState([]);
  const [adminattendStudents, setAdminattendStudents] = useState([]);
  const [adminattendAttendanceRecords, setAdminattendAttendanceRecords] = useState([]);
  const [adminattendStats, setAdminattendStats] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    totalLate: 0,
    attendanceRate: 0
  });
  const [adminattendLoading, setAdminattendLoading] = useState(false);
  const [adminattendAlerts, setAdminattendAlerts] = useState([]);
  
  // Filters
  const [adminattendSelectedTerm, setAdminattendSelectedTerm] = useState('');
  const [adminattendSelectedClass, setAdminattendSelectedClass] = useState('');
  const [adminattendSelectedDate, setAdminattendSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [adminattendViewMode, setAdminattendViewMode] = useState('daily'); // 'daily', 'weekly', 'monthly'

  const adminattendAddAlert = (message, type = 'success') => {
    const id = Date.now();
    setAdminattendAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setAdminattendAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  };

  const adminattendFetchTerms = async () => {
    try {
      const r = await fetch('/api/admin/terms');
      const data = await r.json();
      setAdminattendTerms(data || []);
    } catch (error) {
      adminattendAddAlert('Error fetching terms', 'error');
    }
  };

  const adminattendFetchClasses = async (termId) => {
    try {
      const r = await fetch(`/api/admin/classes?term_id=${termId}`);
      const data = await r.json();
      if (Array.isArray(data)) {
        // Sort classes by grade (ascending) then by section (ascending)
        const sortedClasses = [...data].sort((a, b) => {
          const gradeA = parseInt(a.grade) || 0;
          const gradeB = parseInt(b.grade) || 0;
          if (gradeA !== gradeB) {
            return gradeA - gradeB;
          }
          return (a.section || '').localeCompare(b.section || '');
        });
        setAdminattendClasses(sortedClasses);
      } else {
        setAdminattendClasses([]);
      }
    } catch (error) {
      adminattendAddAlert('Error fetching classes', 'error');
    }
  };

  const adminattendFetchStudents = async (classId) => {
    try {
      const r = await fetch(`/api/admin/class/${classId}/students`);
      const data = await r.json();
      setAdminattendStudents(data.students || []);
    } catch (error) {
      adminattendAddAlert('Error fetching students', 'error');
    }
  };

  const adminattendFetchAttendance = async () => {
    if (!adminattendSelectedClass || !adminattendSelectedDate) return;
    
    try {
      setAdminattendLoading(true);
      const r = await fetch(
        `/api/admin/attendance?class_id=${adminattendSelectedClass}&date=${adminattendSelectedDate}`
      );
      const data = await r.json();
      setAdminattendAttendanceRecords(data.attendance || []);
      
      // Calculate stats
      const present = data.attendance?.filter(a => a.status === 'Present').length || 0;
      const absent = data.attendance?.filter(a => a.status === 'Absent').length || 0;
      const late = data.attendance?.filter(a => a.status === 'Late').length || 0;
      const total = present + absent + late;
      
      setAdminattendStats({
        totalPresent: present,
        totalAbsent: absent,
        totalLate: late,
        attendanceRate: total > 0 ? ((present + late) / total * 100).toFixed(1) : 0
      });
    } catch (error) {
      adminattendAddAlert('Error fetching attendance', 'error');
    } finally {
      setAdminattendLoading(false);
    }
  };

  useEffect(() => {
    adminattendFetchTerms();
  }, []);

  useEffect(() => {
    if (adminattendSelectedTerm) {
      adminattendFetchClasses(adminattendSelectedTerm);
      setAdminattendSelectedClass('');
    }
  }, [adminattendSelectedTerm]);

  useEffect(() => {
    if (adminattendSelectedClass) {
      adminattendFetchStudents(adminattendSelectedClass);
      adminattendFetchAttendance();
    }
  }, [adminattendSelectedClass, adminattendSelectedDate]);

  const adminattendGetStatusColor = (status) => {
    const colors = {
      'Present': 'adminattend-status-present',
      'Absent': 'adminattend-status-absent',
      'Late': 'adminattend-status-late'
    };
    return colors[status] || 'adminattend-status-present';
  };

  const adminattendGetStatusIcon = (status) => {
    const icons = {
      'Present': '✅',
      'Absent': '❌',
      'Late': '⏰'
    };
    return icons[status] || '✅';
  };

  return (
    <AdminLayout
      pageTitle="Attendance Management"
      pageDescription="Track and monitor student attendance across all classes"
    >
      {/* Alerts */}
      <div className="adminattend-alerts-container">
        {adminattendAlerts.map(alert => (
          <div key={alert.id} className={`adminattend-alert adminattend-alert-${alert.type}`}>
            {alert.message}
          </div>
        ))}
      </div>

      <div className="adminattend-container">
        {/* Header */}
        <div className="adminattend-header">
          <div className="adminattend-header-left">
            <h1 className="adminattend-page-title">Attendance Management</h1>
            <p className="adminattend-page-subtitle">Track and monitor student attendance</p>
          </div>
          <div className="adminattend-header-right">
            <button
              className="adminattend-btn adminattend-btn-export"
              onClick={() => adminattendAddAlert('Export feature coming soon', 'info')}
            >
              📊 Export Report
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="adminattend-stats-section">
          <div className="adminattend-stats-grid">
            <div className="adminattend-stat-card adminattend-stat-present">
              <div className="adminattend-stat-icon">✅</div>
              <div className="adminattend-stat-content">
                <h3 className="adminattend-stat-value">{adminattendStats.totalPresent}</h3>
                <p className="adminattend-stat-label">Present</p>
              </div>
            </div>
            
            <div className="adminattend-stat-card adminattend-stat-absent">
              <div className="adminattend-stat-icon">❌</div>
              <div className="adminattend-stat-content">
                <h3 className="adminattend-stat-value">{adminattendStats.totalAbsent}</h3>
                <p className="adminattend-stat-label">Absent</p>
              </div>
            </div>
            
            <div className="adminattend-stat-card adminattend-stat-late">
              <div className="adminattend-stat-icon">⏰</div>
              <div className="adminattend-stat-content">
                <h3 className="adminattend-stat-value">{adminattendStats.totalLate}</h3>
                <p className="adminattend-stat-label">Late</p>
              </div>
            </div>
            
            <div className="adminattend-stat-card adminattend-stat-rate">
              <div className="adminattend-stat-icon">📊</div>
              <div className="adminattend-stat-content">
                <h3 className="adminattend-stat-value">{adminattendStats.attendanceRate}%</h3>
                <p className="adminattend-stat-label">Attendance Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="adminattend-filters">
          <div className="adminattend-filter-group">
            <label htmlFor="adminattend-term-filter">Term:</label>
            <select
              id="adminattend-term-filter"
              value={adminattendSelectedTerm}
              onChange={(e) => setAdminattendSelectedTerm(e.target.value)}
              className="adminattend-filter-select"
            >
              <option value="">Select Term</option>
              {adminattendTerms.map(term => (
                <option key={term._id} value={term._id}>
                  Term {term.term_number} - {term.academic_year_id?.year_label || ''}
                </option>
              ))}
            </select>
          </div>
          
          <div className="adminattend-filter-group">
            <label htmlFor="adminattend-class-filter">Class:</label>
            <select
              id="adminattend-class-filter"
              value={adminattendSelectedClass}
              onChange={(e) => setAdminattendSelectedClass(e.target.value)}
              className="adminattend-filter-select"
              disabled={!adminattendSelectedTerm}
            >
              <option value="">Select Class</option>
              {adminattendClasses.map(cls => (
                <option key={cls._id} value={cls._id}>
                  {cls.class_name} (Grade {cls.grade})
                </option>
              ))}
            </select>
          </div>
          
          <div className="adminattend-filter-group">
            <label htmlFor="adminattend-date-filter">Date:</label>
            <input
              type="date"
              id="adminattend-date-filter"
              value={adminattendSelectedDate}
              onChange={(e) => setAdminattendSelectedDate(e.target.value)}
              className="adminattend-filter-input"
              disabled={!adminattendSelectedClass}
            />
          </div>
        </div>

        {/* Attendance Display */}
        {adminattendSelectedClass ? (
          <div className="adminattend-view-section">
            <div className="adminattend-view-header">
              <h2 className="adminattend-view-title">
                Attendance - {adminattendClasses.find(c => c._id === adminattendSelectedClass)?.class_name}
              </h2>
              <span className="adminattend-date-display">
                📅 {new Date(adminattendSelectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            
            {adminattendLoading ? (
              <div className="adminattend-loading-container">
                <div className="adminattend-loading">Loading attendance data...</div>
              </div>
            ) : adminattendAttendanceRecords.length === 0 ? (
              <div className="adminattend-no-data">
                <div className="adminattend-no-data-icon">📝</div>
                <h3>No Attendance Records</h3>
                <p>No attendance has been marked for this class on the selected date</p>
              </div>
            ) : (
              <div className="adminattend-records-grid">
                {adminattendAttendanceRecords.map(record => (
                  <div key={record._id} className="adminattend-record-card">
                    <div className="adminattend-student-info">
                      <div className="adminattend-student-avatar">
                        {record.student_id?.name?.charAt(0) || 'S'}
                      </div>
                      <div className="adminattend-student-details">
                        <h4 className="adminattend-student-name">{record.student_id?.name || 'Unknown'}</h4>
                        <span className="adminattend-period-info">Period {record.period_index}</span>
                      </div>
                    </div>
                    
                    <div className={`adminattend-status-badge ${adminattendGetStatusColor(record.status)}`}>
                      {adminattendGetStatusIcon(record.status)} {record.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="adminattend-no-selection">
            <div className="adminattend-no-selection-icon">📊</div>
            <h3>Select Class to View Attendance</h3>
            <p>Choose a term and class to view attendance records</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAttendance;

