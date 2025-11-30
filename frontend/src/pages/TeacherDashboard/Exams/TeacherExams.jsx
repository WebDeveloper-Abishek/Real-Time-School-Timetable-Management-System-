import React, { useState } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './TeacherExams.css';

const TeacherExams = () => {
  const [exams, setExams] = useState([
    { id: 1, name: 'Mid-Term Exam', subject: 'Mathematics', date: '2025-01-15', status: 'upcoming' },
    { id: 2, name: 'Quiz Test', subject: 'Mathematics', date: '2024-12-20', status: 'completed' },
  ]);

  const navigationSections = [
    {
      title: 'Academic',
      items: [
        { label: 'Exams', icon: '✍️', path: '/teacher/exams' }
      ]
    }
  ];

  return (
    <DashboardLayout
      pageTitle="Exams"
      pageDescription="Manage exams and marks"
      userRole="Teacher"
      userName="Teacher User"
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

