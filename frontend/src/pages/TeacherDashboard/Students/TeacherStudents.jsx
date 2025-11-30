import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './TeacherStudents.css';

const TeacherStudents = () => {
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

  const navigationSections = [
    {
      title: 'My Teaching',
      items: [
        { label: 'My Classes', icon: '📚', path: '/teacher/classes' },
        { label: 'My Students', icon: '🎓', path: '/teacher/students' }
      ]
    }
  ];

  return (
    <DashboardLayout
      pageTitle="My Students"
      pageDescription="View your students"
      userRole="Teacher"
      userName="Teacher User"
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

