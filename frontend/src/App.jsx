import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';

// Landing Page Components
import HomePage from './pages/HomePage/HomePage';
import LoginPage from './pages/LoginPage/LoginPage';

// Dashboard Components
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard/StudentDashboard';
import ParentDashboard from './pages/ParentDashboard/ParentDashboard';
import CounsellorDashboard from './pages/CounsellorDashboard/CounsellorDashboard';

// Admin Sub-pages
import AdminUsers from './pages/AdminDashboard/Users/AdminUsers';
import AdminSubjects from './pages/AdminDashboard/Subjects/AdminSubjects';
import AdminAcademicYears from './pages/AdminDashboard/AcademicYears/AdminAcademicYears';
import AdminTerms from './pages/AdminDashboard/Terms/AdminTerms';
import AdminClasses from './pages/AdminDashboard/Classes/AdminClasses';
import AdminAssignments from './pages/AdminDashboard/Assignments/AdminAssignments';
import AdminTimetable from './pages/AdminDashboard/Timetable/AdminTimetable';
import AdminLeaves from './pages/AdminDashboard/Leaves/AdminLeaves';
import AdminNotifications from './pages/AdminDashboard/Notifications/AdminNotifications';
import AdminAttendance from './pages/AdminDashboard/Attendance/AdminAttendance';
import AdminExams from './pages/AdminDashboard/Exams/AdminExams';

// Chat Pages
import TeacherChat from './pages/TeacherDashboard/Chat/TeacherChat';
import StudentChat from './pages/StudentDashboard/Chat/StudentChat';
import TeacherReplacements from './pages/TeacherDashboard/Replacements/TeacherReplacements';

// Timetable Pages
import StudentTimetable from './pages/StudentDashboard/Timetable/StudentTimetable';
import TeacherTimetable from './pages/TeacherDashboard/Timetable/TeacherTimetable';

import Navbar from './Components/Navbar/Navbar';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.id) {
    return <Navigate to="/login" replace />;
  }  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Wrapper component to conditionally render navbar
const AppWrapper = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isDashboardPage = location.pathname.includes('/admin') || location.pathname.includes('/teacher') || location.pathname.includes('/student') || 
  location.pathname.includes('/parent') || location.pathname.includes('/counsellor');
  return (
    <>
      {!isLoginPage && !isDashboardPage && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Admin Routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminUsers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users/students" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminUsers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users/teachers" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminUsers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users/parents" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminUsers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users/counsellors" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminUsers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/subjects" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminSubjects />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/academic-years" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminAcademicYears />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/terms" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminTerms />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/classes" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminClasses />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/assignments" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminAssignments />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/timetable" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminTimetable />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/leaves" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminLeaves />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/notifications" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminNotifications />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/attendance" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminAttendance />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/exams" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminExams />
            </ProtectedRoute>
          } 
        />
        
        {/* Teacher Routes */}
        <Route 
          path="/teacher/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/chat" 
          element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <TeacherChat />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/replacements" 
          element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <TeacherReplacements />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/timetable" 
          element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <TeacherTimetable />
            </ProtectedRoute>
          } 
        />
        
        {/* Student Routes */}
        <Route 
          path="/student/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/chat" 
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentChat />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/timetable" 
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentTimetable />
            </ProtectedRoute>
          } 
        />
        
        {/* Parent Routes */}
        <Route 
          path="/parent/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['Parent']}>
              <ParentDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Counsellor Routes */}
        <Route 
          path="/counsellor/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['Counsellor']}>
              <CounsellorDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <AppWrapper />
      </div>
    </Router>
  );
}

export default App;