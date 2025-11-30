import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './StudentAssignments.css';

const StudentAssignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockAssignments = [
        { id: 1, title: 'Mathematics Homework', subject: 'Mathematics', dueDate: '2024-12-25', status: 'pending', description: 'Complete exercises 1-10' },
        { id: 2, title: 'Science Project', subject: 'Science', dueDate: '2024-12-30', status: 'pending', description: 'Research project on photosynthesis' },
        { id: 3, title: 'English Essay', subject: 'English', dueDate: '2024-12-28', status: 'submitted', description: 'Write an essay on climate change' },
      ];
      setAssignments(mockAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = filter === 'all' 
    ? assignments 
    : assignments.filter(a => a.status === filter);

  const navigationSections = [
    {
      title: 'My Dashboard',
      items: [
        { label: 'Student Home', icon: '🏠', path: '/student/dashboard' },
        { label: 'My Timetable', icon: '📅', path: '/student/timetable' },
        { label: 'My Classes', icon: '📚', path: '/student/classes' },
        { label: 'Assignments', icon: '📝', path: '/student/assignments' }
      ]
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'studentassignments-status-submitted';
      case 'pending': return 'studentassignments-status-pending';
      case 'overdue': return 'studentassignments-status-overdue';
      default: return 'studentassignments-status-pending';
    }
  };

  return (
    <DashboardLayout
      pageTitle="My Assignments"
      pageDescription="View and manage your assignments"
      userRole="Student"
      userName="Student User"
      navigationSections={navigationSections}
    >
      <div className="studentassignments-container">
        <div className="studentassignments-header">
          <div className="studentassignments-filters">
            <button 
              className={filter === 'all' ? 'studentassignments-filter-active' : 'studentassignments-filter'}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={filter === 'pending' ? 'studentassignments-filter-active' : 'studentassignments-filter'}
              onClick={() => setFilter('pending')}
            >
              Pending
            </button>
            <button 
              className={filter === 'submitted' ? 'studentassignments-filter-active' : 'studentassignments-filter'}
              onClick={() => setFilter('submitted')}
            >
              Submitted
            </button>
          </div>
        </div>

        <div className="studentassignments-list">
          {loading ? (
            <div className="studentassignments-loading">Loading assignments...</div>
          ) : filteredAssignments.length === 0 ? (
            <div className="studentassignments-empty">No assignments found.</div>
          ) : (
            filteredAssignments.map((assignment) => (
              <div key={assignment.id} className="studentassignments-card">
                <div className="studentassignments-card-header">
                  <h3>{assignment.title}</h3>
                  <span className={`studentassignments-status ${getStatusColor(assignment.status)}`}>
                    {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                  </span>
                </div>
                <div className="studentassignments-card-body">
                  <div className="studentassignments-info">
                    <span className="studentassignments-label">Subject:</span>
                    <span className="studentassignments-value">{assignment.subject}</span>
                  </div>
                  <div className="studentassignments-info">
                    <span className="studentassignments-label">Due Date:</span>
                    <span className="studentassignments-value">{new Date(assignment.dueDate).toLocaleDateString()}</span>
                  </div>
                  <p className="studentassignments-description">{assignment.description}</p>
                </div>
                <div className="studentassignments-card-footer">
                  {assignment.status === 'pending' && (
                    <button className="studentassignments-btn">Submit Assignment</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentAssignments;

