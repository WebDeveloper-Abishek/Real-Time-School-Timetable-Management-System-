import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './TeacherClasses.css';

const TeacherClasses = () => {
  const navigate = useNavigate();
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
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      const token = localStorage.getItem('token') || '';
      
      if (!userId) {
        console.error('User ID not found');
        setClasses([]);
        return;
      }

      const response = await fetch(`http://localhost:5000/api/teacher/classes?teacher_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch classes: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform the data to match the expected format
      const formattedClasses = Array.isArray(data) ? data.map((classItem) => ({
        id: classItem.id || classItem._id,
        class_name: classItem.class_name,
        subject: classItem.subjects || 'N/A',
        students: classItem.students || 0,
        grade: classItem.grade,
        section: classItem.section
      })) : [];
      
      setClasses(formattedClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };


  return (
    <DashboardLayout
      pageTitle="My Classes"
      pageDescription="View your assigned classes"
      userRole="Teacher"
      userName={user?.name || "Teacher User"}
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
                  <button className="teacherclasses-btn" onClick={() => navigate(`/teacher/students?class_id=${classItem.id}`)}>
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

