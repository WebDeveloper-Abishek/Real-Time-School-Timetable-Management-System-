import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './TeacherStudents.css';

const TeacherStudents = () => {
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
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const mockStudents = [
        { id: 1, name: 'John Smith', class_name: '8A', roll_number: '001' },
        { id: 2, name: 'Jane Doe', class_name: '8A', roll_number: '002' },
      ];
      setStudents(mockStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <DashboardLayout
      pageTitle="My Students"
      pageDescription="View your students"
      userRole="Teacher"
      userName={user?.name || "Teacher User"}
      navigationSections={navigationSections}
    >
      <div className="teacherstudents-container">
        <div className="teacherstudents-table-container">
          <table className="teacherstudents-table">
            <thead>
              <tr>
                <th>Roll Number</th>
                <th>Name</th>
                <th>Class</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="teacherstudents-loading">Loading students...</td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="4" className="teacherstudents-empty">No students found.</td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.roll_number}</td>
                    <td>{student.name}</td>
                    <td>{student.class_name}</td>
                    <td>
                      <button className="teacherstudents-btn">View Profile</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherStudents;

