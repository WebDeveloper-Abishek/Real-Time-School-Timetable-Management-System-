import React, { useState } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './CounsellorStudents.css';

const CounsellorStudents = () => {
  const [students] = useState([
    { id: 1, name: 'John Smith', class_name: '8A', status: 'active' },
    { id: 2, name: 'Jane Doe', class_name: '9B', status: 'active' },
  ]);

  const navigationSections = [
    {
      title: 'My Dashboard',
      items: [
        { label: 'My Students', icon: '🎓', path: '/counsellor/students' }
      ]
    }
  ];

  return (
    <DashboardLayout
      pageTitle="My Students"
      pageDescription="Manage student cases"
      userRole="Counsellor"
      userName="Counsellor User"
      navigationSections={navigationSections}
    >
      <div className="counsellorstudents-container">
        <div className="counsellorstudents-grid">
          {students.map((student) => (
            <div key={student.id} className="counsellorstudents-card">
              <h3>{student.name}</h3>
              <p>{student.class_name}</p>
              <button className="counsellorstudents-btn">View Case</button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CounsellorStudents;

