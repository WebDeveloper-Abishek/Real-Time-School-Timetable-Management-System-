import React, { useState } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './ParentAttendance.css';

const ParentAttendance = () => {
  const [attendance] = useState([
    { date: '2024-12-19', status: 'Present', child: 'John Smith' },
    { date: '2024-12-18', status: 'Present', child: 'John Smith' },
    { date: '2024-12-17', status: 'Absent', child: 'John Smith' },
  ]);

  const navigationSections = [
    {
      title: 'My Children',
      items: [
        { label: 'Attendance', icon: '✅', path: '/parent/attendance' }
      ]
    }
  ];

  return (
    <DashboardLayout
      pageTitle="Children Attendance"
      pageDescription="Track your children's attendance"
      userRole="Parent"
      userName="Parent User"
      navigationSections={navigationSections}
    >
      <div className="parentattendance-container">
        <div className="parentattendance-table-container">
          <table className="parentattendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Child</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record, index) => (
                <tr key={index}>
                  <td>{new Date(record.date).toLocaleDateString()}</td>
                  <td>{record.child}</td>
                  <td>
                    <span className={`parentattendance-status parentattendance-status-${record.status.toLowerCase()}`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ParentAttendance;

