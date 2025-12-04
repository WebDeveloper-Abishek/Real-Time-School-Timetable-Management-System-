import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../Components/AdminLayout/AdminLayout';
import './AdminTimetable.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8]; // Only academic periods 1-8

const AdminTimetable = () => {
  const navigate = useNavigate();
  
  // State with unique prefixes
  const [admintimetableTerms, setAdmintimetableTerms] = useState([]);
  const [admintimetableClasses, setAdmintimetableClasses] = useState([]);
  const [admintimetableSubjects, setAdmintimetableSubjects] = useState([]);
  const [admintimetableTeachers, setAdmintimetableTeachers] = useState([]);
  const [admintimetableSlots, setAdmintimetableSlots] = useState([]);
  const [admintimetableAlerts, setAdmintimetableAlerts] = useState([]);
  const [admintimetableLoading, setAdmintimetableLoading] = useState(false);
  const [admintimetableShowSlotModal, setAdmintimetableShowSlotModal] = useState(false);
  const [admintimetableGenerating, setAdmintimetableGenerating] = useState(false);
  
  // Filters
  const [admintimetableSelectedTerm, setAdmintimetableSelectedTerm] = useState('');
  const [admintimetableSelectedClass, setAdmintimetableSelectedClass] = useState('');
  const [admintimetableSelectedDay, setAdmintimetableSelectedDay] = useState('Monday');
  const [admintimetableViewMode, setAdmintimetableViewMode] = useState('week'); // 'week' or 'day'
  
  // Form for manual slot creation
  const [admintimetableSlotForm, setAdmintimetableSlotForm] = useState({
    period_index: 1,
    subject_id: '',
    teacher_id: '',
    start_time: '07:30',
    end_time: '08:15',
    slot_type: 'Period',
    is_double_period: false
  });

  const admintimetableAddAlert = (message, type = 'success') => {
    const id = Date.now();
    setAdmintimetableAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setAdmintimetableAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  };

  const admintimetableFetchTerms = async () => {
    try {
      // First try to get current term
      try {
        const currentTermR = await fetch('http://localhost:5000/api/admin/terms/current');
        if (currentTermR.ok) {
          const currentTerm = await currentTermR.json();
          // Then fetch all terms
          const allTermsR = await fetch('http://localhost:5000/api/admin/terms');
          const allTerms = await allTermsR.json();
          const termsArray = Array.isArray(allTerms) ? allTerms : [];
          setAdmintimetableTerms(termsArray);
          // Auto-select current term
          if (currentTerm && currentTerm._id) {
            setAdmintimetableSelectedTerm(currentTerm._id);
          }
          return;
        }
      } catch (e) {
        console.log('Could not fetch current term, continuing with all terms...');
      }
      
      // Fallback: fetch all terms
      const r = await fetch('http://localhost:5000/api/admin/terms');
      const data = await r.json();
      const termsArray = Array.isArray(data) ? data : [];
      setAdmintimetableTerms(termsArray);
      
      // Try to auto-select active term
      const activeTerm = termsArray.find(t => t.is_active === true);
      if (activeTerm && activeTerm._id) {
        setAdmintimetableSelectedTerm(activeTerm._id);
      }
    } catch (error) {
      admintimetableAddAlert('Error fetching terms', 'error');
    }
  };

  const admintimetableFetchClasses = async (termId) => {
    try {
      const r = await fetch(`http://localhost:5000/api/admin/classes?term_id=${termId}`);
      const data = await r.json();
      if (Array.isArray(data)) {
        // Sort classes by grade (ascending) then by section (ascending)
        const sortedClasses = [...data].sort((a, b) => {
          const gradeA = parseInt(a.grade) || 0;
          const gradeB = parseInt(b.grade) || 0;
          if (gradeA !== gradeB) {
            return gradeA - gradeB;
          }
          return (a.section || '').localeCompare(b.section || '');
        });
        setAdmintimetableClasses(sortedClasses);
      } else {
        setAdmintimetableClasses([]);
      }
    } catch (error) {
      admintimetableAddAlert('Error fetching classes', 'error');
    }
  };

  const admintimetableFetchSubjects = async () => {
    try {
      const r = await fetch('http://localhost:5000/api/admin/subjects');
      const data = await r.json();
      setAdmintimetableSubjects(Array.isArray(data) ? data : []);
    } catch (error) {
      admintimetableAddAlert('Error fetching subjects', 'error');
    }
  };

  const admintimetableFetchTeachers = async () => {
    try {
      const r = await fetch('http://localhost:5000/api/admin/users?role=Teacher');
      const data = await r.json();
      const teachers = Array.isArray(data.users) ? data.users : (Array.isArray(data) ? data : []);
      setAdmintimetableTeachers(teachers.filter(t => t && t.role === 'Teacher'));
    } catch (error) {
      admintimetableAddAlert('Error fetching teachers', 'error');
    }
  };

  const admintimetableFetchSlots = async (termId, classId, day) => {
    try {
      setAdmintimetableLoading(true);
      const r = await fetch(`http://localhost:5000/api/admin/slots?term_id=${termId}&class_id=${classId}&day_of_week=${day}`);
      const data = await r.json();
      setAdmintimetableSlots(data || []);
    } catch (error) {
      admintimetableAddAlert('Error fetching timetable slots', 'error');
      setAdmintimetableSlots([]);
    } finally {
      setAdmintimetableLoading(false);
    }
  };

  useEffect(() => {
    admintimetableFetchTerms();
    admintimetableFetchSubjects();
    admintimetableFetchTeachers();
  }, []);

  useEffect(() => {
    if (admintimetableSelectedTerm) {
      admintimetableFetchClasses(admintimetableSelectedTerm);
      setAdmintimetableSelectedClass('');
    }
  }, [admintimetableSelectedTerm]);

  useEffect(() => {
    if (admintimetableSelectedTerm && admintimetableSelectedClass && admintimetableSelectedDay) {
      admintimetableFetchSlots(admintimetableSelectedTerm, admintimetableSelectedClass, admintimetableSelectedDay);
    }
  }, [admintimetableSelectedTerm, admintimetableSelectedClass, admintimetableSelectedDay]);

  const admintimetableAddSlot = async (e) => {
    e.preventDefault();
    
    if (!admintimetableSelectedClass || !admintimetableSelectedTerm) {
      admintimetableAddAlert('Please select term and class', 'error');
      return;
    }

    try {
      const body = {
        ...admintimetableSlotForm,
        class_id: admintimetableSelectedClass,
        term_id: admintimetableSelectedTerm,
        day_of_week: admintimetableSelectedDay
      };
      
      await fetch('http://localhost:5000/api/admin/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      admintimetableAddAlert('Timetable slot added successfully', 'success');
      setAdmintimetableShowSlotModal(false);
      await admintimetableFetchSlots(admintimetableSelectedTerm, admintimetableSelectedClass, admintimetableSelectedDay);
    } catch (error) {
      admintimetableAddAlert('Error adding timetable slot', 'error');
    }
  };

  const admintimetableGenerateAllTimetables = async () => {
    if (!admintimetableSelectedTerm) {
      admintimetableAddAlert('Please select a term first', 'error');
      return;
    }

    const term = admintimetableTerms.find(t => t._id === admintimetableSelectedTerm);
    const termLabel = term ? `Term ${term.term_number}` : 'this term';

    if (!window.confirm(`Generate AI-powered timetables for ALL classes in ${termLabel}? This will create timetables for all classes based on course limits and teacher availability. This may take a few minutes.`)) {
      return;
    }

    try {
      setAdmintimetableGenerating(true);
      admintimetableAddAlert('🚀 Generating timetables for all classes... This may take a few minutes.', 'info');
      
      // Call AI generation endpoint for all classes
      const response = await fetch('http://localhost:5000/api/admin/timetable/generate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term_id: admintimetableSelectedTerm
        })
      });

      if (response.ok) {
        const result = await response.json();
        const successCount = result.results?.success?.length || 0;
        const failedCount = result.results?.failed?.length || 0;
        
        if (failedCount === 0) {
          admintimetableAddAlert(`✅ Successfully generated timetables for all ${successCount} classes! ✨`, 'success');
        } else {
          admintimetableAddAlert(`⚠️ Generated timetables for ${successCount} classes. ${failedCount} classes failed. Check console for details.`, 'warning');
        }
        
        // Refresh classes list and current view if a class is selected
        await admintimetableFetchClasses(admintimetableSelectedTerm);
        if (admintimetableSelectedClass) {
          await admintimetableFetchSlots(admintimetableSelectedTerm, admintimetableSelectedClass, admintimetableSelectedDay);
        }
      } else {
        const error = await response.json();
        admintimetableAddAlert('Error generating timetables: ' + (error.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error generating all timetables:', error);
      admintimetableAddAlert('Error generating timetables: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setAdmintimetableGenerating(false);
    }
  };

  const admintimetableGenerateTimetable = async () => {
    if (!admintimetableSelectedClass || !admintimetableSelectedTerm) {
      admintimetableAddAlert('Please select term and class', 'error');
      return;
    }

    if (!window.confirm('Generate AI-powered timetable for this class? This will use course limits and teacher availability.')) {
      return;
    }

    try {
      setAdmintimetableGenerating(true);
      admintimetableAddAlert('Generating timetable using AI algorithm...', 'info');
      
      // Call AI generation endpoint
      const response = await fetch('http://localhost:5000/api/admin/timetable/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term_id: admintimetableSelectedTerm,
          class_id: admintimetableSelectedClass
        })
      });

      if (response.ok) {
        admintimetableAddAlert('Timetable generated successfully! ✨', 'success');
        await admintimetableFetchSlots(admintimetableSelectedTerm, admintimetableSelectedClass, admintimetableSelectedDay);
      } else {
        const error = await response.json();
        admintimetableAddAlert('Error generating timetable: ' + (error.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error generating timetable:', error);
      admintimetableAddAlert('Error generating timetable: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setAdmintimetableGenerating(false);
    }
  };

  const admintimetableGetSlotForPeriod = (period) => {
    return admintimetableSlots.find(slot => slot.period_index === period);
  };

  const admintimetableGetSlotClass = (slot) => {
    if (!slot) return 'admintimetable-slot-empty';
    
    switch (slot.slot_type) {
      case 'Assembly':
        return 'admintimetable-slot-assembly';
      case 'Break':
        return 'admintimetable-slot-break';
      case 'Anthem':
        return 'admintimetable-slot-anthem';
      default:
        return 'admintimetable-slot-period';
    }
  };

  return (
    <AdminLayout
      pageTitle="Timetable Management"
      pageDescription="AI-powered automated timetable generation and management"
    >
      {/* Alerts */}
      <div className="admintimetable-alerts-container">
        {admintimetableAlerts.map(alert => (
          <div key={alert.id} className={`admintimetable-alert admintimetable-alert-${alert.type}`}>
            {alert.message}
          </div>
        ))}
      </div>

      <div className="admintimetable-container">
        {/* Header */}
        <div className="admintimetable-header">
          <div className="admintimetable-header-left">
            <h1 className="admintimetable-page-title">Timetable Management</h1>
            <p className="admintimetable-page-subtitle">AI-powered automated timetable generation based on course limits</p>
          </div>
          <div className="admintimetable-header-right">
            <button
              className="admintimetable-btn admintimetable-btn-generate-all"
              onClick={admintimetableGenerateAllTimetables}
              disabled={!admintimetableSelectedTerm || admintimetableGenerating}
              style={{ marginRight: '10px' }}
            >
              {admintimetableGenerating ? '⚡ Generating All...' : '🚀 Generate All Timetables'}
            </button>
            <button
              className="admintimetable-btn admintimetable-btn-generate"
              onClick={admintimetableGenerateTimetable}
              disabled={!admintimetableSelectedClass || admintimetableGenerating}
            >
              {admintimetableGenerating ? '⚡ Generating...' : '⚡ Generate AI Timetable'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="admintimetable-filters">
          <div className="admintimetable-filter-group">
            <label htmlFor="admintimetable-term-filter">Term:</label>
            <select
              id="admintimetable-term-filter"
              value={admintimetableSelectedTerm}
              onChange={(e) => setAdmintimetableSelectedTerm(e.target.value)}
              className="admintimetable-filter-select"
            >
          <option value="">Select Term</option>
              {admintimetableTerms.map(term => (
                <option key={term._id} value={term._id}>
                  Term {term.term_number} - {term.academic_year_id?.year_label || ''}
                </option>
              ))}
        </select>
          </div>
          
          <div className="admintimetable-filter-group">
            <label htmlFor="admintimetable-class-filter">Class:</label>
            <select
              id="admintimetable-class-filter"
              value={admintimetableSelectedClass}
              onChange={(e) => setAdmintimetableSelectedClass(e.target.value)}
              className="admintimetable-filter-select"
              disabled={!admintimetableSelectedTerm}
            >
          <option value="">Select Class</option>
              {admintimetableClasses.map(cls => (
                <option key={cls._id} value={cls._id}>
                  {cls.class_name} (Grade {cls.grade})
                </option>
              ))}
        </select>
          </div>
          
          <div className="admintimetable-filter-group">
            <label htmlFor="admintimetable-day-filter">Day:</label>
            <select
              id="admintimetable-day-filter"
              value={admintimetableSelectedDay}
              onChange={(e) => setAdmintimetableSelectedDay(e.target.value)}
              className="admintimetable-filter-select"
              disabled={!admintimetableSelectedClass}
            >
              {DAYS.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
        </select>
      </div>

          <div className="admintimetable-filter-actions">
            <button
              className="admintimetable-btn admintimetable-btn-add"
              onClick={() => setAdmintimetableShowSlotModal(true)}
              disabled={!admintimetableSelectedClass}
            >
              ➕ Add Manual Slot
            </button>
          </div>
        </div>

        {/* Timetable View */}
        {admintimetableSelectedClass && admintimetableSelectedTerm ? (
          <div className="admintimetable-view-section">
            <div className="admintimetable-view-header">
              <h2 className="admintimetable-view-title">
                Timetable: {admintimetableClasses.find(c => c._id === admintimetableSelectedClass)?.class_name} - {admintimetableSelectedDay}
              </h2>
            </div>
            
            {admintimetableLoading ? (
              <div className="admintimetable-loading-container">
                <div className="admintimetable-loading">Loading timetable...</div>
              </div>
            ) : (
              <div className="admintimetable-grid">
                {PERIODS.map(period => {
                  const slot = admintimetableGetSlotForPeriod(period);
                  return (
                    <div
                      key={period}
                      className={`admintimetable-slot ${admintimetableGetSlotClass(slot)}`}
                    >
                      <div className="admintimetable-slot-header">
                        <span className="admintimetable-period-number">Period {period}</span>
                        {slot && (
                          <span className="admintimetable-slot-time">
                            {slot.start_time} - {slot.end_time}
                          </span>
                        )}
                      </div>
                      
                      <div className="admintimetable-slot-content">
                        {slot ? (
                          <>
                            <div className="admintimetable-slot-subject">
                              {slot.slot_type === 'Period' ? (
                                <>
                                  <span className="admintimetable-subject-icon">📚</span>
                                  <span className="admintimetable-subject-name">
                                    {slot.subject_id?.subject_name || 'Unknown Subject'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="admintimetable-special-icon">
                                    {slot.slot_type === 'Assembly' ? '🎪' : slot.slot_type === 'Break' ? '☕' : '🎵'}
                                  </span>
                                  <span className="admintimetable-special-type">{slot.slot_type}</span>
                                </>
                              )}
                            </div>
                            
                            {slot.slot_type === 'Period' && slot.teacher_id && (
                              <div className="admintimetable-slot-teacher">
                                <span className="admintimetable-teacher-icon">👨‍🏫</span>
                                <span className="admintimetable-teacher-name">
                                  {slot.teacher_id?.name || 'Unassigned'}
                                </span>
                              </div>
                            )}
                            
                            {slot.is_double_period && (
                              <div className="admintimetable-double-badge">
                                Double Period
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="admintimetable-empty-slot">
                            <span className="admintimetable-empty-icon">➕</span>
                            <span className="admintimetable-empty-text">Empty Slot</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Weekly Overview */}
            <div className="admintimetable-weekly-overview">
              <h3 className="admintimetable-overview-title">Weekly Overview</h3>
              <div className="admintimetable-days-tabs">
                {DAYS.map(day => (
                  <button
                    key={day}
                    className={`admintimetable-day-tab ${admintimetableSelectedDay === day ? 'admintimetable-day-tab-active' : ''}`}
                    onClick={() => setAdmintimetableSelectedDay(day)}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="admintimetable-no-selection">
            <div className="admintimetable-no-selection-icon">📅</div>
            <h3>Select Term and Class</h3>
            <p>Choose a term and class to view or generate timetable</p>
          </div>
        )}

        {/* Manual Slot Modal */}
        {admintimetableShowSlotModal && (
          <div className="admintimetable-modal-overlay">
            <div className="admintimetable-modal">
              <div className="admintimetable-modal-header">
                <h2>Add Manual Timetable Slot</h2>
                <button
                  className="admintimetable-close-btn"
                  onClick={() => setAdmintimetableShowSlotModal(false)}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={admintimetableAddSlot} className="admintimetable-modal-form">
                <div className="admintimetable-form-row">
                  <div className="admintimetable-form-group">
                    <label htmlFor="admintimetable-period">Period *</label>
                    <select
                      id="admintimetable-period"
                      value={admintimetableSlotForm.period_index}
                      onChange={(e) => setAdmintimetableSlotForm({...admintimetableSlotForm, period_index: Number(e.target.value)})}
                      className="admintimetable-form-select"
                    >
                      {PERIODS.map(p => (
                        <option key={p} value={p}>Period {p}</option>
                      ))}
        </select>
                  </div>
                  
                  <div className="admintimetable-form-group">
                    <label htmlFor="admintimetable-slot-type">Slot Type *</label>
                    <select
                      id="admintimetable-slot-type"
                      value={admintimetableSlotForm.slot_type}
                      onChange={(e) => setAdmintimetableSlotForm({...admintimetableSlotForm, slot_type: e.target.value})}
                      className="admintimetable-form-select"
                    >
          <option value="Period">Period</option>
          <option value="Assembly">Assembly</option>
          <option value="Break">Break</option>
          <option value="Anthem">Anthem</option>
        </select>
                  </div>
                </div>
                
                {admintimetableSlotForm.slot_type === 'Period' && (
                  <>
                    <div className="admintimetable-form-row">
                      <div className="admintimetable-form-group">
                        <label htmlFor="admintimetable-subject">Subject *</label>
                        <select
                          id="admintimetable-subject"
                          value={admintimetableSlotForm.subject_id}
                          onChange={(e) => setAdmintimetableSlotForm({...admintimetableSlotForm, subject_id: e.target.value})}
                          className="admintimetable-form-select"
                          required
                        >
                          <option value="">Select Subject</option>
                          {admintimetableSubjects.map(subject => (
                            <option key={subject._id} value={subject._id}>
                              {subject.subject_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="admintimetable-form-group">
                        <label htmlFor="admintimetable-teacher">Teacher *</label>
                        <select
                          id="admintimetable-teacher"
                          value={admintimetableSlotForm.teacher_id}
                          onChange={(e) => setAdmintimetableSlotForm({...admintimetableSlotForm, teacher_id: e.target.value})}
                          className="admintimetable-form-select"
                          required
                        >
                          <option value="">Select Teacher</option>
                          {admintimetableTeachers.map(teacher => (
                            <option key={teacher._id} value={teacher._id}>
                              {teacher.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="admintimetable-form-group">
                      <label className="admintimetable-checkbox-label">
                        <input
                          type="checkbox"
                          checked={admintimetableSlotForm.is_double_period}
                          onChange={(e) => setAdmintimetableSlotForm({...admintimetableSlotForm, is_double_period: e.target.checked})}
                          className="admintimetable-checkbox"
                        />
                        <span>Double Period (Consecutive)</span>
        </label>
                    </div>
                  </>
                )}
                
                <div className="admintimetable-form-row">
                  <div className="admintimetable-form-group">
                    <label htmlFor="admintimetable-start-time">Start Time *</label>
                    <input
                      type="time"
                      id="admintimetable-start-time"
                      value={admintimetableSlotForm.start_time}
                      onChange={(e) => setAdmintimetableSlotForm({...admintimetableSlotForm, start_time: e.target.value})}
                      required
                      className="admintimetable-form-input"
                    />
                  </div>
                  
                  <div className="admintimetable-form-group">
                    <label htmlFor="admintimetable-end-time">End Time *</label>
                    <input
                      type="time"
                      id="admintimetable-end-time"
                      value={admintimetableSlotForm.end_time}
                      onChange={(e) => setAdmintimetableSlotForm({...admintimetableSlotForm, end_time: e.target.value})}
                      required
                      className="admintimetable-form-input"
                    />
                  </div>
                </div>
                
                <div className="admintimetable-modal-actions">
                  <button
                    type="button"
                    className="admintimetable-btn admintimetable-btn-outline"
                    onClick={() => setAdmintimetableShowSlotModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admintimetable-btn admintimetable-btn-primary"
                  >
                    Add Slot
                  </button>
                </div>
      </form>
            </div>
          </div>
        )}
    </div>
    </AdminLayout>
  );
};

export default AdminTimetable;
