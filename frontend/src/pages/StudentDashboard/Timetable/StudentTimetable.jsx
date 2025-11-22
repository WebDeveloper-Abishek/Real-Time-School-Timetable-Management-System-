import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './StudentTimetable.css';

const StudentTimetable = () => {
  const [studenttimetableTimetable, setStudenttimetableTimetable] = useState([]);
  const [studenttimetableLoading, setStudenttimetableLoading] = useState(false);
  const [studenttimetableSelectedClass, setStudenttimetableSelectedClass] = useState('');
  const [studenttimetableAlerts, setStudenttimetableAlerts] = useState([]);

  const studenttimetableAddAlert = (message, type = 'success') => {
    const id = Date.now();
    setStudenttimetableAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setStudenttimetableAlerts(prev => prev.filter(alert => alert.id !== id)), 5000);
  };

  const studenttimetableFetchTimetable = async () => {
    if (!studenttimetableSelectedClass) return;
    
    try {
      setStudenttimetableLoading(true);
      const response = await fetch(`/api/student/timetable?class_id=${studenttimetableSelectedClass}`);
      const data = await response.json();
      setStudenttimetableTimetable(data.timetable || []);
    } catch (error) {
      studenttimetableAddAlert('Error fetching timetable', 'error');
    } finally {
      setStudenttimetableLoading(false);
    }
  };

  useEffect(() => {
    // Get student's class from user data
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.class_id) {
      setStudenttimetableSelectedClass(user.class_id);
    }
  }, []);

  useEffect(() => {
    if (studenttimetableSelectedClass) {
      studenttimetableFetchTimetable();
    }
  }, [studenttimetableSelectedClass]);

  const studenttimetableGetSlotInfo = (day, slotNumber) => {
    const dayTimetable = studenttimetableTimetable.filter(item => item.day_of_week === day);
    const slot = dayTimetable.find(item => item.slot_id?.slot_number === slotNumber);
    
    if (!slot) {
      return {
        subject: '',
        teacher: '',
        time: '',
        isDoublePeriod: false,
        isEmpty: true
      };
    }

    return {
      subject: slot.subject_id?.subject_name || '',
      teacher: slot.teacher_id?.name || '',
      time: `${slot.slot_id?.start_time || ''} - ${slot.slot_id?.end_time || ''}`,
      isDoublePeriod: slot.is_double_period || false,
      isEmpty: false
    };
  };

  const studenttimetableGetSlotType = (slotNumber) => {
    if (slotNumber === 1) return 'Assembly';
    if (slotNumber === 6) return 'Interval';
    return 'Period';
  };

  const studenttimetableGetSlotColor = (slotNumber, isEmpty) => {
    if (slotNumber === 1) return 'studenttimetable-slot-assembly';
    if (slotNumber === 6) return 'studenttimetable-slot-interval';
    if (isEmpty) return 'studenttimetable-slot-empty';
    return 'studenttimetable-slot-period';
  };

  const navigationSections = [
    {
      title: 'My Dashboard',
      items: [
        { label: 'Student Home', icon: '🏠', path: '/student/dashboard' },
        { label: 'My Timetable', icon: '📅', path: '/student/timetable' },
        { label: 'My Classes', icon: '📚', path: '/student/classes' },
        { label: 'Assignments', icon: '📝', path: '/student/assignments' }
      ]
    },
    {
      title: 'Communication',
      items: [
        { label: 'Chat Center', icon: '💬', path: '/student/chat' },
        { label: 'Messages', icon: '📧', path: '/student/messages' },
        { label: 'Notifications', icon: '🔔', path: '/student/notifications' }
      ]
    }
  ];

  return (
    <DashboardLayout
      pageTitle="My Timetable"
      pageDescription="View your weekly class schedule"
      userRole="Student"
      userName="Student User"
      navigationSections={navigationSections}
    >
      <div className="studenttimetable-alerts-container">
        {studenttimetableAlerts.map(alert => (
          <div key={alert.id} className={`studenttimetable-alert studenttimetable-alert-${alert.type}`}>
            {alert.message}
          </div>
        ))}
      </div>

      <div className="studenttimetable-container">
        <div className="studenttimetable-header">
          <h1 className="studenttimetable-page-title">My Timetable</h1>
          <p className="studenttimetable-page-subtitle">Your weekly class schedule</p>
        </div>

        {studenttimetableLoading ? (
          <div className="studenttimetable-loading">
            <div className="studenttimetable-loading-spinner"></div>
            <p>Loading timetable...</p>
          </div>
        ) : (
          <div className="studenttimetable-timetable-container">
            <div className="studenttimetable-timetable">
              {/* Header Row */}
              <div className="studenttimetable-header-row">
                <div className="studenttimetable-time-column">Time</div>
                <div className="studenttimetable-day-column">Monday</div>
                <div className="studenttimetable-day-column">Tuesday</div>
                <div className="studenttimetable-day-column">Wednesday</div>
                <div className="studenttimetable-day-column">Thursday</div>
                <div className="studenttimetable-day-column">Friday</div>
              </div>

              {/* Timetable Rows (10 slots) */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(slotNumber => (
                <div key={slotNumber} className="studenttimetable-row">
                  {/* Time Column */}
                  <div className="studenttimetable-time-cell">
                    {slotNumber === 1 && '07:00 - 07:30'}
                    {slotNumber === 2 && '07:30 - 08:15'}
                    {slotNumber === 3 && '08:15 - 09:00'}
                    {slotNumber === 4 && '09:00 - 09:45'}
                    {slotNumber === 5 && '09:45 - 10:30'}
                    {slotNumber === 6 && '10:30 - 10:45'}
                    {slotNumber === 7 && '10:45 - 11:30'}
                    {slotNumber === 8 && '11:30 - 12:15'}
                    {slotNumber === 9 && '12:15 - 13:00'}
                    {slotNumber === 10 && '13:00 - 13:45'}
                  </div>

                  {/* Day Columns */}
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                    const slotInfo = studenttimetableGetSlotInfo(day, slotNumber);
                    const slotType = studenttimetableGetSlotType(slotNumber);
                    const slotColor = studenttimetableGetSlotColor(slotNumber, slotInfo.isEmpty);
                    
                    return (
                      <div key={day} className={`studenttimetable-cell ${slotColor}`}>
                        {slotInfo.isEmpty ? (
                          <div className="studenttimetable-empty-slot">
                            <span className="studenttimetable-slot-type">{slotType}</span>
                          </div>
                        ) : (
                          <div className="studenttimetable-filled-slot">
                            <div className="studenttimetable-subject">{slotInfo.subject}</div>
                            <div className="studenttimetable-teacher">{slotInfo.teacher}</div>
                            <div className="studenttimetable-time">{slotInfo.time}</div>
                            {slotInfo.isDoublePeriod && (
                              <div className="studenttimetable-double-period">Double Period</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentTimetable;
