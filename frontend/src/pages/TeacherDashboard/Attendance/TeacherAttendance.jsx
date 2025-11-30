import React, { useState } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './TeacherAttendance.css';

const TeacherAttendance = () => {
  const [students, setStudents] = useState([
    { id: 1, name: 'John Smith', rollNumber: '001', status: 'present' },
    { id: 2, name: 'Jane Doe', rollNumber: '002', status: 'present' },
  ]);

  const toggleStatus = (id) => {
    setStudents(students.map(s => 
      s.id === id ? { ...s, status: s.status === 'present' ? 'absent' : 'present' } : s
    ));
  };

  const navigationSections = [
    {
      title: 'Academic',
      items: [
        { label: 'Attendance', icon: '✅', path: '/teacher/attendance' }
      ]
    }
  ];

  return (
    <DashboardLayout
      pageTitle="Mark Attendance"
      pageDescription="Mark student attendance"
      userRole="Teacher"
      userName="Teacher User"
      navigationSections={navigationSections}
    >
      <div className="teacheraccontainer">
        <div className="teacherattendance-card">
          <div className="teacherattendance-header">
            <h3>Class 8A - Mathematics</h3>
            <span>Period 2 - {new Date().toLocaleDateString()}</span>
          </div>
          <div className="teacherattendance-list">
            {students.map((student) => (
              <div key={student.id} className="teacherattendance-item">
                <span>{student.rollNumber}</span>
                <span>{student.name}</span>
                <button 
                  className={`teacherattendance-toggle ${student.status}`}
                  onClick={() => toggleStatus(student.id)}
                >
                  {student.status === 'present' ? 'Present' : 'Absent'}
                </button>
              </div>
            ))}
          </div>
          <div className="teacherattendance-footer">
            <button className="teacherattendance-save">Save Attendance</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherAttendance;

