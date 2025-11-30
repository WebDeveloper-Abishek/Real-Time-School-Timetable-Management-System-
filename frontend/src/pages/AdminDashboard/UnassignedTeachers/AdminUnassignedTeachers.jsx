import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../Components/AdminLayout/AdminLayout';
import './AdminUnassignedTeachers.css';

const AdminUnassignedTeachers = () => {
  const [unassignedAssignments, setUnassignedAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [replacing, setReplacing] = useState(null); // assignment_id being replaced

  useEffect(() => {
    fetchUnassignedAssignments();
    fetchTeachers();
  }, []);

  const addAlert = (message, type = 'success') => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  };

  const fetchUnassignedAssignments = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/unassigned-teachers');
      const data = await response.json();
      setUnassignedAssignments(data.assignments || []);
    } catch (error) {
      console.error('Error fetching unassigned assignments:', error);
      addAlert('Error fetching unassigned teacher assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/users?role=Teacher');
      const data = await response.json();
      const teachersList = data.users || data || [];
      setTeachers(teachersList.filter(t => 
        t.role === 'Teacher' && 
        t.nic_number !== 'UNASSIGNED_SYSTEM' &&
        !t.is_deleted
      ));
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleReplace = async (assignmentId, teacherId) => {
    if (!teacherId) {
      addAlert('Please select a teacher', 'error');
      return;
    }

    try {
      setReplacing(assignmentId);
      const response = await fetch('http://localhost:5000/api/admin/unassigned-teachers/replace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId,
          teacher_id: teacherId
        })
      });

      const data = await response.json();

      if (response.ok) {
        addAlert(`Successfully assigned ${data.assignment.user_id?.name || 'teacher'}`, 'success');
        await fetchUnassignedAssignments();
      } else {
        addAlert(data.message || 'Error replacing teacher', 'error');
      }
    } catch (error) {
      console.error('Error replacing teacher:', error);
      addAlert('Error replacing teacher: ' + error.message, 'error');
    } finally {
      setReplacing(null);
    }
  };

  const handleRemoveAll = async () => {
    if (!window.confirm('Are you sure you want to remove ALL unassigned teacher assignments? This cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/unassigned-teachers', {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        addAlert(`Removed ${data.removed} unassigned assignments`, 'success');
        await fetchUnassignedAssignments();
      } else {
        addAlert(data.message || 'Error removing assignments', 'error');
      }
    } catch (error) {
      console.error('Error removing assignments:', error);
      addAlert('Error removing assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout
      pageTitle="Unassigned Teachers"
      pageDescription="Manage assignments with unassigned teachers and replace them with real teachers"
    >
      <div className="unassignedteachers-container">
        {/* Alerts */}
        <div className="unassignedteachers-alerts">
          {alerts.map(alert => (
            <div key={alert.id} className={`unassignedteachers-alert unassignedteachers-alert-${alert.type}`}>
              {alert.message}
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="unassignedteachers-header">
          <div>
            <h1>Unassigned Teachers Management</h1>
            <p>Find and replace assignments that have unassigned teachers with real teachers</p>
          </div>
          {unassignedAssignments.length > 0 && (
            <button 
              className="unassignedteachers-btn-danger" 
              onClick={handleRemoveAll}
              disabled={loading}
            >
              🗑️ Remove All Unassigned
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="unassignedteachers-stats">
          <div className="unassignedteachers-stat-card">
            <h3>{unassignedAssignments.length}</h3>
            <p>Unassigned Assignments</p>
          </div>
        </div>

        {/* Assignments List */}
        {loading ? (
          <div className="unassignedteachers-loading">Loading unassigned assignments...</div>
        ) : unassignedAssignments.length === 0 ? (
          <div className="unassignedteachers-empty">
            <div className="unassignedteachers-empty-icon">✅</div>
            <h3>No Unassigned Teachers</h3>
            <p>All assignments have real teachers assigned!</p>
          </div>
        ) : (
          <div className="unassignedteachers-list">
            {unassignedAssignments.map((assignment) => (
              <div key={assignment._id} className="unassignedteachers-card">
                <div className="unassignedteachers-card-header">
                  <div>
                    <h3>{assignment.subject_id?.subject_name || 'Unknown Subject'}</h3>
                    <p className="unassignedteachers-class-name">
                      Class: {assignment.class_id?.class_name || 'Unknown Class'}
                    </p>
                  </div>
                  <span className="unassignedteachers-badge-warning">Unassigned</span>
                </div>
                
                <div className="unassignedteachers-card-body">
                  <div className="unassignedteachers-assign-form">
                    <label>Select Teacher to Assign:</label>
                    <select
                      className="unassignedteachers-select"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleReplace(assignment._id, e.target.value);
                        }
                      }}
                      disabled={replacing === assignment._id}
                    >
                      <option value="">Select a teacher...</option>
                      {teachers.map(teacher => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.name} ({teacher.email || 'No email'})
                        </option>
                      ))}
                    </select>
                    {replacing === assignment._id && (
                      <span className="unassignedteachers-loading-text">Assigning...</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUnassignedTeachers;

