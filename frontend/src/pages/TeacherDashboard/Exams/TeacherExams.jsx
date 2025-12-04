import React, { useState } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './TeacherExams.css';

const TeacherExams = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const navigationSections = [
    {
      title: 'MY TEACHING',
      items: [
        { label: 'Teacher Home', icon: '🏠', path: '/teacher/dashboard' },
        { label: 'My Classes', icon: '📚', path: '/teacher/classes' },
        { label: 'Timetable', icon: '📅', path: '/teacher/timetable' },
        { label: 'Students', icon: '🎓', path: '/teacher/students' }
      ]
    },
    {
      title: 'ACADEMIC',
      items: [
        { label: 'Exams', icon: '✍️', path: '/teacher/exams' },
        { label: 'Attendance', icon: '✅', path: '/teacher/attendance' }
      ]
    },
    {
      title: 'LEAVE & DUTIES',
      items: [
        { label: 'Leave Requests', icon: '🏖️', path: '/teacher/leaves' },
        { label: 'Replacements', icon: '🔄', path: '/teacher/replacements' }
      ]
    },
    {
      title: 'PROFILE',
      items: [
        { label: 'Update Profile', icon: '✏️', path: '/teacher/profile' }
      ]
    }
  ];
  const [exams, setExams] = useState([
    { id: 1, name: 'Mid-Term Exam', subject: 'Mathematics', date: '2025-01-15', status: 'upcoming' },
    { id: 2, name: 'Quiz Test', subject: 'Mathematics', date: '2024-12-20', status: 'completed' },
  ]);


  return (
    <DashboardLayout
      pageTitle="Exams"
      pageDescription="Manage exams and marks"
      userRole="Teacher"
      userName={user?.name || "Teacher User"}
      navigationSections={navigationSections}
    >
      <div className="teacherexams-container">
        <div className="teacherexams-grid">
          {exams.map((exam) => (
            <div key={exam.id} className="teacherexams-card">
              <h3>{exam.name}</h3>
              <p>{exam.subject}</p>
              <p>{new Date(exam.date).toLocaleDateString()}</p>
              <button className="teacherexams-btn">Enter Marks</button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherExams;

