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
import TeacherLeaves from './pages/TeacherDashboard/Leaves/TeacherLeaves';

// Timetable Pages
import StudentTimetable from './pages/StudentDashboard/Timetable/StudentTimetable';
import TeacherTimetable from './pages/TeacherDashboard/Timetable/TeacherTimetable';

// Student Pages
import StudentClasses from './pages/StudentDashboard/Classes/StudentClasses';
import StudentAssignments from './pages/StudentDashboard/Assignments/StudentAssignments';
import StudentExams from './pages/StudentDashboard/Exams/StudentExams';
import StudentGrades from './pages/StudentDashboard/Grades/StudentGrades';
import StudentAttendance from './pages/StudentDashboard/Attendance/StudentAttendance';
import StudentProgress from './pages/StudentDashboard/Progress/StudentProgress';
import StudentCounselling from './pages/StudentDashboard/Counselling/StudentCounselling';
import StudentNotifications from './pages/StudentDashboard/Notifications/StudentNotifications';
import StudentMessages from './pages/StudentDashboard/Messages/StudentMessages';
import StudentProfile from './pages/StudentDashboard/Profile/StudentProfile';
import StudentSettings from './pages/StudentDashboard/Settings/StudentSettings';

// Teacher Pages
import TeacherClasses from './pages/TeacherDashboard/Classes/TeacherClasses';
import TeacherStudents from './pages/TeacherDashboard/Students/TeacherStudents';
import TeacherAttendance from './pages/TeacherDashboard/Attendance/TeacherAttendance';
import TeacherExams from './pages/TeacherDashboard/Exams/TeacherExams';
import TeacherProfile from './pages/TeacherDashboard/Profile/TeacherProfile';
import TeacherSettings from './pages/TeacherDashboard/Settings/TeacherSettings';

// Counsellor Pages
import CounsellorStudents from './pages/CounsellorDashboard/Students/CounsellorStudents';
import CounsellorAppointments from './pages/CounsellorDashboard/Appointments/CounsellorAppointments';

// Parent Pages
import ParentChildren from './pages/ParentDashboard/Children/ParentChildren';
import ParentAttendance from './pages/ParentDashboard/Attendance/ParentAttendance';

// Admin Additional Pages
import AdminUnassignedTeachers from './pages/AdminDashboard/UnassignedTeachers/AdminUnassignedTeachers';
import AdminReplacements from './pages/AdminDashboard/Replacements/AdminReplacements';

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
          path="/admin/replacements" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminReplacements />
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
        <Route 
          path="/admin/unassigned-teachers" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminUnassignedTeachers />
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
          path="/teacher/leaves" 
          element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <TeacherLeaves />
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
        <Route 
          path="/teacher/classes" 
          element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <TeacherClasses />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/students" 
          element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <TeacherStudents />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/attendance" 
          element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <TeacherAttendance />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/exams" 
          element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <TeacherExams />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/profile" 
          element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <TeacherProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/settings" 
          element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <TeacherSettings />
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
        <Route 
          path="/student/classes" 
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentClasses />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/assignments" 
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentAssignments />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/exams" 
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentExams />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/grades" 
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentGrades />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/attendance" 
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentAttendance />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/progress" 
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentProgress />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/counselling" 
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentCounselling />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/notifications" 
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentNotifications />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/profile" 
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/settings" 
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentSettings />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/messages" 
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentMessages />
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
        <Route 
          path="/counsellor/students" 
          element={
            <ProtectedRoute allowedRoles={['Counsellor']}>
              <CounsellorStudents />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/counsellor/appointments" 
          element={
            <ProtectedRoute allowedRoles={['Counsellor']}>
              <CounsellorAppointments />
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
        <Route 
          path="/parent/children" 
          element={
            <ProtectedRoute allowedRoles={['Parent']}>
              <ParentChildren />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/parent/attendance" 
          element={
            <ProtectedRoute allowedRoles={['Parent']}>
              <ParentAttendance />
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