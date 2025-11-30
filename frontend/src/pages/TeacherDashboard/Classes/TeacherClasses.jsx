import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './TeacherClasses.css';

const TeacherClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const mockClasses = [
        { id: 1, class_name: '8A', subject: 'Mathematics', students: 30 },
        { id: 2, class_name: '8B', subject: 'Mathematics', students: 28 },
        { id: 3, class_name: '9A', subject: 'Science', students: 32 },
      ];
      setClasses(mockClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
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
      pageTitle="My Classes"
      pageDescription="View your assigned classes"
      userRole="Teacher"
      userName="Teacher User"
      navigationSections={navigationSections}
    >
      <div className="teacherclasses-container">
        <div className="teacherclasses-grid">
          {loading ? (
            <div className="teacherclasses-loading">Loading classes...</div>
          ) : classes.length === 0 ? (
            <div className="teacherclasses-empty">No classes assigned.</div>
          ) : (
            classes.map((classItem) => (
              <div key={classItem.id} className="teacherclasses-card">
                <div className="teacherclasses-card-header">
                  <h3>{classItem.class_name}</h3>
                </div>
                <div className="teacherclasses-card-body">
                  <div className="teacherclasses-info">
                    <span className="teacherclasses-label">Subject:</span>
                    <span className="teacherclasses-value">{classItem.subject}</span>
                  </div>
                  <div className="teacherclasses-info">
                    <span className="teacherclasses-label">Students:</span>
                    <span className="teacherclasses-value">{classItem.students}</span>
                  </div>
                </div>
                <div className="teacherclasses-card-footer">
                  <button className="teacherclasses-btn" onClick={() => navigate('/teacher/students')}>
                    View Students
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherClasses;

