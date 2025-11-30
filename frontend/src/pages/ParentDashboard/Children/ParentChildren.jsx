import React, { useState } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './ParentChildren.css';

const ParentChildren = () => {
  const [children] = useState([
    { id: 1, name: 'John Smith', class_name: '8A', grade: 'A' },
    { id: 2, name: 'Jane Smith', class_name: '6B', grade: 'A+' },
  ]);

  const navigationSections = [
    {
      title: 'My Children',
      items: [
        { label: 'My Children', icon: '👨‍👩‍👧‍👦', path: '/parent/children' }
      ]
    }
  ];

  return (
    <DashboardLayout
      pageTitle="My Children"
      pageDescription="View your children's information"
      userRole="Parent"
      userName="Parent User"
      navigationSections={navigationSections}
    >
      <div className="parentchildren-container">
        <div className="parentchildren-grid">
          {children.map((child) => (
            <div key={child.id} className="parentchildren-card">
              <h3>{child.name}</h3>
              <p>Class: {child.class_name}</p>
              <p>Grade: {child.grade}</p>
              <button className="parentchildren-btn">View Details</button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ParentChildren;

