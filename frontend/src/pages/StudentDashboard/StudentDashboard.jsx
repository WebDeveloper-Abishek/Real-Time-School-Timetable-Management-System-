import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../Components/DashboardLayout/DashboardLayout';
import ProfileUpdateModal from '../../Components/ProfileUpdateModal/ProfileUpdateModal';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalSubjects: 0,
      todayAttendance: 0,
      upcomingExams: 0,
      pendingAssignments: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (currentTerm) {
      fetchDashboardData();
    }
  }, [currentTerm]);

  const fetchCurrentTerm = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch('http://localhost:5000/api/teacher/terms/current', {
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      
      if (!userId) {
        await fetchCurrentTerm();
        setLoading(false);
        return;
      }

      if (!currentTerm) {
        await fetchCurrentTerm();
      }

      const stats = {
        totalSubjects: 0,
        todayAttendance: 0,
        upcomingExams: 0,
        pendingAssignments: 0
      };

      try {
        const { studentAPI } = await import('../../services/api');
        const timetableResponse = await studentAPI.getStudentTimetable({ student_id: userId });
        
        if (timetableResponse && Array.isArray(timetableResponse)) {
          const uniqueSubjects = new Set(timetableResponse.map(slot => slot.subject_id?._id || slot.subject_id));
          stats.totalSubjects = uniqueSubjects.size;
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }

      try {
        if (currentTerm?._id) {
          const { attendanceAPI } = await import('../../services/api');
          const today = new Date().toISOString().split('T')[0];
          const attendanceResponse = await attendanceAPI.getStudentAttendance({
            student_id: userId,
            term_id: currentTerm._id,
            start_date: today,
            end_date: today
          });
          
          if (attendanceResponse?.success) {
            const attendanceList = Array.isArray(attendanceResponse.attendance) 
              ? attendanceResponse.attendance 
              : Object.values(attendanceResponse.attendance || {}).flat();
            
            const present = attendanceList.filter(a => a.status === 'Present').length;
            const total = attendanceList.length;
            stats.todayAttendance = total > 0 ? Math.round((present / total) * 100) : 0;
          } else if (attendanceResponse?.statistics) {
            stats.todayAttendance = parseFloat(attendanceResponse.statistics.presentPercentage || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
      }

      try {
        if (currentTerm?._id) {
          const { examAPI } = await import('../../services/api');
          const examResponse = await examAPI.getStudentExamMarks({
            student_id: userId,
            term_id: currentTerm._id
          });
          
          if (examResponse?.success) {
            const examMarks = examResponse.exam_marks || [];
            const now = new Date();
            const upcoming = examMarks.filter(exam => {
              const examDate = new Date(exam.exam_date);
              return examDate > now;
            });
            stats.upcomingExams = upcoming.length;
          }
        }
      } catch (error) {
        console.error('Error fetching exams:', error);
      }

      stats.pendingAssignments = 0;
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
        { label: 'Update Profile', icon: '✏️', path: '/student/profile', onClick: handleProfileUpdate }
      ]
    }
  ];

  if (loading) {
    return (
      <DashboardLayout
        pageTitle="Student Dashboard"
        pageDescription="Loading dashboard data..."
        userRole="Student"
        userName={user?.name || "Student User"}
        navigationSections={navigationSections}
      >
        <div className="studentdash-loading-container">
          <div className="studentdash-loading">Loading Dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      pageTitle="Student Dashboard"
      pageDescription="Welcome back! Here's your learning journey today."
      userRole="Student"
      userName={user?.name || "Student User"}
      navigationSections={navigationSections}
    >
      {/* Quick Stats Cards */}
      <section className="studentdash-stats-section">
        <div className="studentdash-stats-grid">
          <div className="studentdash-stat-card studentdash-primary">
            <div className="studentdash-stat-icon studentdash-subjects">📚</div>
            <div className="studentdash-stat-content">
              <h3 className="studentdash-stat-value">{dashboardData.stats.totalSubjects}</h3>
              <p className="studentdash-stat-label">My Subjects</p>
              <span className="studentdash-stat-change studentdash-info">Active this term</span>
            </div>
          </div>
          
          <div className="studentdash-stat-card studentdash-success">
            <div className="studentdash-stat-icon studentdash-attendance">✅</div>
            <div className="studentdash-stat-content">
              <h3 className="studentdash-stat-value">{dashboardData.stats.todayAttendance}%</h3>
              <p className="studentdash-stat-label">My Attendance</p>
              <span className="studentdash-stat-change studentdash-positive">Excellent record!</span>
            </div>
          </div>
          
          <div className="studentdash-stat-card studentdash-warning">
            <div className="studentdash-stat-icon studentdash-exams">📝</div>
            <div className="studentdash-stat-content">
              <h3 className="studentdash-stat-value">{dashboardData.stats.upcomingExams}</h3>
              <p className="studentdash-stat-label">Upcoming Exams</p>
              <span className="studentdash-stat-change studentdash-warning">Next week</span>
            </div>
          </div>

          <div className="studentdash-stat-card studentdash-info">
            <div className="studentdash-stat-icon studentdash-assignments">📋</div>
            <div className="studentdash-stat-content">
              <h3 className="studentdash-stat-value">{dashboardData.stats.pendingAssignments}</h3>
              <p className="studentdash-stat-label">Pending Tasks</p>
              <span className="studentdash-stat-change studentdash-info">Due this week</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="studentdash-quick-actions-section">
        <h2 className="studentdash-section-title">Quick Actions</h2>
        <div className="studentdash-quick-actions-grid">
          <button className="studentdash-quick-action-card" onClick={go('/student/timetable')}>
            <div className="studentdash-action-icon">📅</div>
            <h3>View Timetable</h3>
            <p>Check your daily schedule</p>
          </button>
          
          <button className="studentdash-quick-action-card" onClick={go('/student/attendance')}>
            <div className="studentdash-action-icon">✅</div>
            <h3>View Attendance</h3>
            <p>Track your attendance record</p>
          </button>
          
          <button className="studentdash-quick-action-card" onClick={go('/student/exams')}>
            <div className="studentdash-action-icon">📊</div>
            <h3>Exams & Grades</h3>
            <p>View your marks and grades</p>
          </button>
          
          <button className="studentdash-quick-action-card" onClick={go('/student/counselling')}>
            <div className="studentdash-action-icon">🧠</div>
            <h3>Counselling</h3>
            <p>Book counselling sessions</p>
          </button>
        </div>
      </section>

      {/* 12 Cards Grid Section */}
      <section className="studentdash-cards-grid-section">
        <div className="studentdash-cards-grid">
          <div className="studentdash-card studentdash-card-1">
            <h3>📅 Today's Schedule</h3>
            <button className="studentdash-view-all-btn" onClick={go('/student/timetable')}>View Full Timetable</button>
          </div>
          
          <div className="studentdash-card studentdash-card-2">
            <h3>📚 My Subjects</h3>
            <button className="studentdash-view-all-btn" onClick={go('/student/subjects')}>View All Subjects</button>
          </div>
          
          <div className="studentdash-card studentdash-card-3">
            <h3>✅ Attendance Record</h3>
            <button className="studentdash-view-all-btn" onClick={go('/student/attendance')}>View Details</button>
          </div>
          
          <div className="studentdash-card studentdash-card-4">
            <h3>📝 Exam Schedule</h3>
            <button className="studentdash-view-all-btn" onClick={go('/student/exams')}>View Exams</button>
          </div>

          <div className="studentdash-card studentdash-card-6">
            <h3>📋 Assignments</h3>
            <button className="studentdash-view-all-btn" onClick={go('/student/assignments')}>View All</button>
          </div>
          
          <div className="studentdash-card studentdash-card-7">
            <h3>🧠 Counselling</h3>
            <button className="studentdash-view-all-btn" onClick={go('/student/counselling')}>Book Session</button>
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

export default StudentDashboard;
