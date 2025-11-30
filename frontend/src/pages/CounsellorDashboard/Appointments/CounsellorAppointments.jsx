import React, { useState } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './CounsellorAppointments.css';

const CounsellorAppointments = () => {
  const [appointments] = useState([
    { id: 1, student: 'John Smith', date: '2024-12-25', time: '10:00 AM', status: 'scheduled' },
    { id: 2, student: 'Jane Doe', date: '2024-12-26', time: '11:00 AM', status: 'scheduled' },
  ]);

  const navigationSections = [
    {
      title: 'My Dashboard',
      items: [
        { label: 'Appointments', icon: '📋', path: '/counsellor/appointments' }
      ]
    }
  ];

  return (
    <DashboardLayout
      pageTitle="Appointments"
      pageDescription="Manage counselling appointments"
      userRole="Counsellor"
      userName="Counsellor User"
      navigationSections={navigationSections}
    >
      <div className="counsellorappointments-container">
        <div className="counsellorappointments-list">
          {appointments.map((apt) => (
            <div key={apt.id} className="counsellorappointments-card">
              <h3>{apt.student}</h3>
              <p>{new Date(apt.date).toLocaleDateString()} at {apt.time}</p>
              <span className="counsellorappointments-status">{apt.status}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CounsellorAppointments;

