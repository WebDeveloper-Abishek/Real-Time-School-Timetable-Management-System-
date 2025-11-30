import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../Components/DashboardLayout/DashboardLayout';
import './TeacherTimetable.css';

const TeacherTimetable = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [teachertimetableTimetable, setTeachertimetableTimetable] = useState([]);
  const [teachertimetableLoading, setTeachertimetableLoading] = useState(false);
  const [teachertimetableTeacherId, setTeachertimetableTeacherId] = useState('');
  const [teachertimetableAlerts, setTeachertimetableAlerts] = useState([]);

  const teachertimetableAddAlert = (message, type = 'success') => {
    const id = Date.now();
    setTeachertimetableAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setTeachertimetableAlerts(prev => prev.filter(alert => alert.id !== id)), 5000);
  };

  const teachertimetableFetchTimetable = async () => {
    if (!teachertimetableTeacherId) return;
    
    try {
      setTeachertimetableLoading(true);
      const response = await fetch(`http://localhost:5000/api/admin/teacher/timetable?teacher_id=${teachertimetableTeacherId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch timetable');
      }
      const data = await response.json();
      setTeachertimetableTimetable(Array.isArray(data.timetable) ? data.timetable : []);
    } catch (error) {
      console.error('Error fetching timetable:', error);
      teachertimetableAddAlert('Error fetching timetable: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setTeachertimetableLoading(false);
    }
  };

  useEffect(() => {
    // Get teacher ID from user data
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      setTeachertimetableTeacherId(user.id);
    }
  }, []);

  useEffect(() => {
    if (teachertimetableTeacherId) {
      teachertimetableFetchTimetable();
    }
  }, [teachertimetableTeacherId]);

  const teachertimetableGetSlotInfo = (day, slotNumber) => {
    const dayTimetable = teachertimetableTimetable.filter(item => item.day_of_week === day);
    const slot = dayTimetable.find(item => item.slot_id?.slot_number === slotNumber);
    
    if (!slot) {
      return {
        class: '',
        subject: '',
        time: '',
        isDoublePeriod: false,
        isEmpty: true
      };
    }

    return {
      class: slot.class_id?.class_name || '',
      subject: slot.subject_id?.subject_name || '',
      time: `${slot.slot_id?.start_time || ''} - ${slot.slot_id?.end_time || ''}`,
      isDoublePeriod: slot.is_double_period || false,
      isEmpty: false
    };
  };

  const teachertimetableGetSlotType = (slotNumber) => {
    if (slotNumber === 1) return 'Assembly';
    if (slotNumber === 6) return 'Interval';
    return 'Period';
  };

  const teachertimetableGetSlotColor = (slotNumber, isEmpty) => {
    if (slotNumber === 1) return 'teachertimetable-slot-assembly';
    if (slotNumber === 6) return 'teachertimetable-slot-interval';
    if (isEmpty) return 'teachertimetable-slot-empty';
    return 'teachertimetable-slot-period';
  };

  const navigationSections = [
    {
      title: 'My Teaching',
      items: [
        { label: 'Teacher Home', icon: '🏠', path: '/teacher/dashboard' },
        { label: 'My Classes', icon: '📚', path: '/teacher/classes' },
        { label: 'Timetable', icon: '📅', path: '/teacher/timetable' },
        { label: 'Students', icon: '🎓', path: '/teacher/students' }
      ]
    },
    {
      title: 'Replacements',
      items: [
        { label: 'Replacement Requests', icon: '👨‍🏫', path: '/teacher/replacements' },
        { label: 'My Replacements', icon: '📋', path: '/teacher/my-replacements' }
      ]
    }
  ];

  return (
    <DashboardLayout
      pageTitle="My Timetable"
      pageDescription="View your weekly teaching schedule"
      userRole="Teacher"
      userName={user?.name || "Teacher User"}
      navigationSections={navigationSections}
    >
      <div className="teachertimetable-alerts-container">
        {teachertimetableAlerts.map(alert => (
          <div key={alert.id} className={`teachertimetable-alert teachertimetable-alert-${alert.type}`}>
            {alert.message}
          </div>
        ))}
      </div>

      <div className="teachertimetable-container">
        <div className="teachertimetable-header">
          <h1 className="teachertimetable-page-title">My Timetable</h1>
          <p className="teachertimetable-page-subtitle">Your weekly teaching schedule</p>
        </div>

        {teachertimetableLoading ? (
          <div className="teachertimetable-loading">
            <div className="teachertimetable-loading-spinner"></div>
            <p>Loading timetable...</p>
          </div>
        ) : (
          <div className="teachertimetable-timetable-container">
            <div className="teachertimetable-timetable">
              {/* Header Row */}
              <div className="teachertimetable-header-row">
                <div className="teachertimetable-time-column">Time</div>
                <div className="teachertimetable-day-column">Monday</div>
                <div className="teachertimetable-day-column">Tuesday</div>
                <div className="teachertimetable-day-column">Wednesday</div>
                <div className="teachertimetable-day-column">Thursday</div>
                <div className="teachertimetable-day-column">Friday</div>
              </div>

              {/* Timetable Rows (10 slots) */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(slotNumber => (
                <div key={slotNumber} className="teachertimetable-row">
                  {/* Time Column */}
                  <div className="teachertimetable-time-cell">
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
                    const slotInfo = teachertimetableGetSlotInfo(day, slotNumber);
                    const slotType = teachertimetableGetSlotType(slotNumber);
                    const slotColor = teachertimetableGetSlotColor(slotNumber, slotInfo.isEmpty);
                    
                    return (
                      <div key={day} className={`teachertimetable-cell ${slotColor}`}>
                        {slotInfo.isEmpty ? (
                          <div className="teachertimetable-empty-slot">
                            <span className="teachertimetable-slot-type">{slotType}</span>
                          </div>
                        ) : (
                          <div className="teachertimetable-filled-slot">
                            <div className="teachertimetable-class">{slotInfo.class}</div>
                            <div className="teachertimetable-subject">{slotInfo.subject}</div>
                            <div className="teachertimetable-time">{slotInfo.time}</div>
                            {slotInfo.isDoublePeriod && (
                              <div className="teachertimetable-double-period">Double Period</div>
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

export default TeacherTimetable;
