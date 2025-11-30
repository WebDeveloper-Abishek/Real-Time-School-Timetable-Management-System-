import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../Components/AdminLayout/AdminLayout';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalStudents: 0,
      todayAttendance: 0,
      pendingLeaves: 0,
      activeReplacements: 0
    },
    courseProgress: [],
    attendanceTrends: [],
    replacementStats: [],
    counsellingStats: [],
    recentActivity: [],
    upcomingEvents: [],
    pendingLeaves: [],
    systemAlerts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [usersRes, leavesRes, replacementsRes] = await Promise.all([
        fetch('/api/admin/users').catch(() => ({ ok: false })),
        fetch('/api/admin/leaves').catch(() => ({ ok: false })),
        fetch('/api/admin/replacements').catch(() => ({ ok: false }))
      ]);

      // Process users to get total students
      let totalStudents = 0;
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData && usersData.users && Array.isArray(usersData.users)) {
          totalStudents = usersData.users.filter(u => u.role === 'Student').length;
        } else if (Array.isArray(usersData)) {
          totalStudents = usersData.filter(u => u.role === 'Student').length;
        }
      }

      // Process leaves to get pending leaves
      let pendingLeaves = 0;
      if (leavesRes.ok) {
        const leavesData = await leavesRes.json();
        if (leavesData && Array.isArray(leavesData)) {
          pendingLeaves = leavesData.filter(leave => {
            const status = leave.status || (leave.approved === true ? 'APPROVED' : (leave.approved === false ? 'PENDING' : 'PENDING'));
            return status === 'PENDING';
          }).length;
        }
      }

      // Process replacements to get active replacements
      let activeReplacements = 0;
      if (replacementsRes.ok) {
        const replacementsData = await replacementsRes.json();
        if (replacementsData && Array.isArray(replacementsData)) {
          activeReplacements = replacementsData.filter(req => 
            req.status === 'ACCEPTED' || req.status === 'accepted' || req.status === 'PENDING' || req.status === 'pending'
          ).length;
        }
      }

      // Calculate today's attendance (simplified - you may want to fetch actual attendance data)
      const todayAttendance = 94.2; // This would need actual attendance API call

      setDashboardData({
        stats: {
          totalStudents,
          todayAttendance,
          pendingLeaves,
          activeReplacements
        },
        courseProgress: [
          { subject: 'Mathematics', grade: '8A', completed: 15, total: 23, percentage: 65, teacher: 'Ms. Sarah Johnson' },
          { subject: 'Mathematics', grade: '8B', completed: 18, total: 23, percentage: 78, teacher: 'Mr. David Chen' },
          { subject: 'English', grade: '8A', completed: 12, total: 20, percentage: 60, teacher: 'Ms. Amanda Lee' },
          { subject: 'Science', grade: '8A', completed: 10, total: 18, percentage: 56, teacher: 'Dr. Emily Wilson' }
        ],
        attendanceTrends: [
          { date: '2024-12-15', students: 95.2, teachers: 98.1 },
          { date: '2024-12-16', students: 94.8, teachers: 97.5 },
          { date: '2024-12-17', students: 96.1, teachers: 98.9 },
          { date: '2024-12-18', students: 95.5, teachers: 98.3 },
          { date: '2024-12-19', students: 94.2, teachers: 97.8 }
        ],
        replacementStats: [
          { subject: 'Mathematics', totalReplacements: 12, successful: 10, pending: 2 },
          { subject: 'English', totalReplacements: 8, successful: 7, pending: 1 },
          { subject: 'Science', totalReplacements: 15, successful: 13, pending: 2 },
          { subject: 'History', totalReplacements: 5, successful: 4, pending: 1 }
        ],
        counsellingStats: [
          { counsellor: 'Dr. Lisa Anderson', totalSessions: 45, completed: 38, pending: 7 },
          { counsellor: 'Dr. Michael Brown', totalSessions: 32, completed: 28, pending: 4 },
          { counsellor: 'Dr. Sarah Wilson', totalSessions: 28, completed: 25, pending: 3 }
        ],
        recentActivity: [
          { id: 1, type: 'attendance', message: 'Student John Smith marked absent', time: '2 hours ago', priority: 'medium' },
          { id: 2, type: 'leave', message: 'Teacher Sarah Johnson requested leave', time: '3 hours ago', priority: 'high' },
          { id: 3, type: 'replacement', message: 'Replacement assigned for Mathematics class', time: '4 hours ago', priority: 'low' },
          { id: 4, type: 'counselling', message: 'New counselling session scheduled', time: '5 hours ago', priority: 'medium' }
        ],
        timetableStatus: {
          generated: true,
          lastGenerated: '2024-12-15',
          conflicts: 2,
          periodsPerDay: 8,
          periodDuration: 45,
          totalPeriods: 40
        },
        leaveRequests: [
          { id: 1, teacher: 'Ms. Sarah Johnson', subject: 'Mathematics', date: '2024-12-20', type: 'Full Day', reason: 'Medical appointment', status: 'pending' },
          { id: 2, teacher: 'Mr. David Chen', subject: 'Science', date: '2024-12-21', type: 'First Half', reason: 'Family emergency', status: 'pending' },
          { id: 3, teacher: 'Ms. Amanda Lee', subject: 'English', date: '2024-12-22', type: 'Full Day', reason: 'Personal leave', status: 'pending' },
          { id: 4, teacher: 'Dr. Emily Wilson', subject: 'Science', date: '2024-12-23', type: 'Second Half', reason: 'Conference attendance', status: 'pending' }
        ],
        replacementRequests: [
          { id: 1, absentTeacher: 'Ms. Sarah Johnson', subject: 'Mathematics', grade: '8A', date: '2024-12-20', periods: '1-4', replacementTeacher: 'Mr. David Chen', status: 'accepted' },
          { id: 2, absentTeacher: 'Mr. David Chen', subject: 'Science', grade: '8B', date: '2024-12-21', periods: '1-2', replacementTeacher: 'Dr. Emily Wilson', status: 'pending' },
          { id: 3, absentTeacher: 'Ms. Amanda Lee', subject: 'English', grade: '9A', date: '2024-12-22', periods: '3-6', replacementTeacher: 'Mr. Michael Brown', status: 'declined' }
        ],
        counsellingAppointments: [
          { id: 1, student: 'John Smith', grade: '8A', counsellor: 'Dr. Lisa Anderson', date: '2024-12-20', time: '3:00 PM', status: 'scheduled', priority: 'medium' },
          { id: 2, student: 'Sarah Johnson', grade: '9B', counsellor: 'Dr. Lisa Anderson', date: '2024-12-21', time: '2:30 PM', status: 'completed', priority: 'high' },
          { id: 3, student: 'Mike Davis', grade: '8B', counsellor: 'Dr. Lisa Anderson', date: '2024-12-22', time: '4:00 PM', status: 'pending', priority: 'low' }
        ],
        examSchedule: [
          { name: 'Mid-Term Exams', startDate: '2025-02-15', endDate: '2025-02-22', status: 'upcoming', subjects: ['Mathematics', 'English', 'Science', 'History'] },
          { name: 'Final Exams', startDate: '2025-06-10', endDate: '2025-06-17', status: 'upcoming', subjects: ['Mathematics', 'English', 'Science', 'History'] }
        ],
        upcomingEvents: [
          { id: 1, title: 'Annual Sports Day', date: '2024-02-15', type: 'Sports' },
          { id: 2, title: 'Parent-Teacher Meeting', date: '2024-02-20', type: 'Academic' },
          { id: 3, title: 'Science Fair', date: '2024-02-25', type: 'Academic' },
          { id: 4, title: 'Staff Training Workshop', date: '2024-03-01', type: 'Professional Development' }
        ],
        pendingLeaves: (() => {
          if (leavesRes.ok && leavesData && Array.isArray(leavesData)) {
            return leavesData
              .filter(leave => {
                const status = leave.status || (leave.approved === true ? 'APPROVED' : (leave.approved === false ? 'PENDING' : 'PENDING'));
                return status === 'PENDING';
              })
              .slice(0, 4) // Limit to 4 most recent
              .map(leave => ({
                id: leave._id,
                teacher: leave.user_id?.name || 'Unknown Teacher',
                subject: 'N/A', // You may want to fetch subject from timetable
                date: new Date(leave.start_date).toISOString().split('T')[0],
                reason: leave.reason || 'Not specified'
              }));
          }
          return [];
        })()
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const go = (path) => () => navigate(path);

  if (loading) {
    return (
      <AdminLayout pageTitle="Admin Dashboard" pageDescription="Loading dashboard data...">
        <div className="admindashboard-loading-container">
          <div className="admindashboard-loading">Loading Dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Admin Dashboard" pageDescription="Welcome back! Here's what's happening today.">
      {/* Quick Stats Cards */}
      <section className="admindashboard-stats-section">
        <div className="admindashboard-stats-grid">
          <div className="admindashboard-stat-card admindashboard-primary">
            <div className="admindashboard-stat-icon admindashboard-students">🎓</div>
            <div className="admindashboard-stat-content">
              <h3 className="admindashboard-stat-value">{dashboardData.stats.totalStudents.toLocaleString()}</h3>
              <p className="admindashboard-stat-label">Total Students</p>
              <span className="admindashboard-stat-change admindashboard-info">+23 this month</span>
            </div>
          </div>
          
          <div className="admindashboard-stat-card admindashboard-success">
            <div className="admindashboard-stat-icon admindashboard-attendance">✅</div>
            <div className="admindashboard-stat-content">
              <h3 className="admindashboard-stat-value">{dashboardData.stats.todayAttendance}%</h3>
              <p className="admindashboard-stat-label">Today's Attendance</p>
              <span className="admindashboard-stat-change admindashboard-positive">+1.8% vs yesterday</span>
            </div>
          </div>
          
          <div className="admindashboard-stat-card admindashboard-warning">
            <div className="admindashboard-stat-icon admindashboard-leaves">📋</div>
            <div className="admindashboard-stat-content">
              <h3 className="admindashboard-stat-value">{dashboardData.stats.pendingLeaves}</h3>
              <p className="admindashboard-stat-label">Pending Leaves</p>
              <span className="admindashboard-stat-change admindashboard-warning">Needs approval</span>
            </div>
          </div>
          
          <div className="admindashboard-stat-card admindashboard-info">
            <div className="admindashboard-stat-icon admindashboard-replacements">🔄</div>
            <div className="admindashboard-stat-content">
              <h3 className="admindashboard-stat-value">{dashboardData.stats.activeReplacements}</h3>
              <p className="admindashboard-stat-label">Active Replacements</p>
              <span className="admindashboard-stat-change admindashboard-info">Auto-managed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="admindashboard-quick-actions-section">
        <h2 className="admindashboard-section-title">Quick Actions</h2>
        <div className="admindashboard-quick-actions-grid">
          <button className="admindashboard-quick-action-card" onClick={go('/admin/classes')}>
            <div className="admindashboard-action-icon">🏫</div>
            <h3>Class Management</h3>
            <p>Create and manage classes</p>
          </button>
          
          <button className="admindashboard-quick-action-card" onClick={go('/admin/users')}>
            <div className="admindashboard-action-icon">👥</div>
            <h3>User Management</h3>
            <p>Manage all stakeholders and system access</p>
          </button>
          
          <button className="admindashboard-quick-action-card" onClick={go('/admin/timetable')}>
            <div className="admindashboard-action-icon">📅</div>
            <h3>Timetable Management</h3>
            <p>Generate and manage timetables</p>
          </button>
          
          <button className="admindashboard-quick-action-card" onClick={go('/admin/attendance')}>
            <div className="admindashboard-action-icon">📊</div>
            <h3>Attendance Tracking</h3>
            <p>Monitor student and teacher attendance</p>
          </button>
          
          <button className="admindashboard-quick-action-card" onClick={go('/admin/leaves')}>
            <div className="admindashboard-action-icon">📋</div>
            <h3>Leave Management</h3>
            <p>Handle leave requests and approvals</p>
          </button>
        </div>
      </section>

      {/* 12 Cards Grid Section */}
      <section className="admindashboard-cards-grid-section">
        <div className="admindashboard-cards-grid">
          <div className="admindashboard-card admindashboard-card-1">
            <h3>📅 Timetable Analytics</h3>
            <button className="admindashboard-view-all-btn" onClick={go('/admin/timetable')}>View Timetable</button>
          </div>
          
          <div className="admindashboard-card admindashboard-card-2">
            <h3>👨‍🏫 Teacher Analytics</h3>
            <button className="admindashboard-view-all-btn" onClick={go('/admin/users/teachers')}>Manage Teachers</button>
          </div>
          
          <div className="admindashboard-card admindashboard-card-3">
            <h3>📊 Attendance Analytics</h3>
            <button className="admindashboard-view-all-btn" onClick={go('/admin/attendance')}>View Reports</button>
          </div>
          
          <div className="admindashboard-card admindashboard-card-4">
            <h3>📝 Exam Analytics</h3>
            <button className="admindashboard-view-all-btn" onClick={go('/admin/exams')}>View Exams</button>
          </div>
          
          <div className="admindashboard-card admindashboard-card-5">
            <h3>⏰ Leave Management</h3>
            <button className="admindashboard-view-all-btn" onClick={go('/admin/leave-requests')}>View All</button>
          </div>
          
          <div className="admindashboard-card admindashboard-card-6">
            <h3>👥 Student Attendance</h3>
            <button className="admindashboard-view-all-btn" onClick={go('/admin/users/students')}>View All</button>
          </div>
          
          <div className="admindashboard-card admindashboard-card-7">
            <h3>👨‍🏫 Teacher Attendance</h3>
            <button className="admindashboard-view-all-btn" onClick={go('/admin/users/teachers')}>View All</button>
          </div>
          
          <div className="admindashboard-card admindashboard-card-8">
            <h3>📚 Subject Management</h3>
            <button className="admindashboard-view-all-btn" onClick={go('/admin/subject-management')}>Manage All</button>
          </div>
          
          <div className="admindashboard-card admindashboard-card-9">
            <h3>👨‍🏫 Teacher Management</h3>
            <button className="admindashboard-view-all-btn" onClick={go('/admin/users/teachers')}>Manage All</button>
          </div>
          
          <div className="admindashboard-card admindashboard-card-10">
            <h3>👥 Student Management</h3>
            <button className="admindashboard-view-all-btn" onClick={go('/admin/users/students')}>Manage All</button>
          </div>
          
          <div className="admindashboard-card admindashboard-card-11">
            <h3>🔔 System Alerts</h3>
            <button className="admindashboard-view-all-btn" onClick={go('/admin/alerts')}>View All</button>
          </div>
          
          <div className="admindashboard-card admindashboard-card-12">
            <h3>👨‍👩‍👧‍👦 Parent Management</h3>
            <button className="admindashboard-view-all-btn" onClick={go('/admin/users/parents')}>Manage All</button>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
};

export default AdminDashboard;