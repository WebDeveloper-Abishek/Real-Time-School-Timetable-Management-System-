import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './ParentChildren.css';

const ParentChildren = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const { parentAPI } = await import('../../../services/api');
      const response = await parentAPI.getParentChildren();

      if (response?.success) {
        setChildren(response.children || []);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigationSections = [
    {
      title: 'My Children',
      items: [
        { label: 'Parent Home', icon: '🏠', path: '/parent/dashboard' },
        { label: 'My Children', icon: '👨‍👩‍👧‍👦', path: '/parent/children' },
        { label: 'Attendance', icon: '✅', path: '/parent/attendance' }
      ]
    },
    {
      title: 'Profile',
      items: [
        { label: 'Update Profile', icon: '✏️', path: '/parent/profile' }
      ]
    }
  ];

  return (
    <DashboardLayout
      pageTitle="My Children"
      pageDescription="View your children's information"
      userRole="Parent"
      userName={user?.name || "Parent User"}
      navigationSections={navigationSections}
    >
      <div className="parentchildren-container">
        <div className="parentchildren-grid">
          {loading ? (
            <div className="parentchildren-loading">Loading children...</div>
          ) : children.length === 0 ? (
            <div className="parentchildren-empty">No children linked to your account.</div>
          ) : (
            children.map((child) => (
              <div key={child._id || child.id} className="parentchildren-card">
                <div className="parentchildren-avatar">👶</div>
              <h3>{child.name}</h3>
                <p>Class: {child.class_name || 'Not Assigned'}</p>
                <p>Role: {child.role}</p>
              <button className="parentchildren-btn">View Details</button>
            </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ParentChildren;

