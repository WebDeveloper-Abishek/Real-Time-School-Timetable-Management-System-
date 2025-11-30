import React, { useState, useEffect, useCallback} from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import AdminLayout from '../../../Components/AdminLayout/AdminLayout';
import { termsAPI, subjectAPI, academicYearAPI, classAPI } from '../../../services/api';
import './AdminSubjects.css';

const AdminSubjects = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [subjects, setSubjects] = useState([]);
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [selectedClassData, setSelectedClassData] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingCourseLimit, setEditingCourseLimit] = useState(null);
  
  // Filters - Class-based only
  // Check for navigation state first, then URL params
  const getInitialClassId = () => {
    // Check if navigation state was passed (from classes page)
    if (location.state?.selectedClass) {
      return location.state.selectedClass;
    }
    // Fallback to URL parameter
    return searchParams.get('class_id') || '';
  };
  
  const [selectedClass, setSelectedClass] = useState(getInitialClassId());
  
  // Form data - simplified: just subject name, auto-assign to current term
  const [formData, setFormData] = useState({
    subject_name: ''
  });


  useEffect(() => {
    const initializeData = async () => {
      try {
    
        const academicYearsData = await academicYearAPI.getAcademicYears();
        if (academicYearsData && Array.isArray(academicYearsData)) {
          setAcademicYears(academicYearsData);
        } else {
          setAcademicYears([]);
        }

        // Load terms
        const termsData = await termsAPI.getTerms();
        if (termsData && Array.isArray(termsData)) {
          setTerms(termsData);
        } else {
          setTerms([]);
        }

        // Load classes
        const classesData = await classAPI.getClasses();
        if (classesData && Array.isArray(classesData)) {
          // Sort classes by grade (ascending) then by section (ascending)
          const sortedClasses = [...classesData].sort((a, b) => {
            const gradeA = parseInt(a.grade) || 0;
            const gradeB = parseInt(b.grade) || 0;
            if (gradeA !== gradeB) {
              return gradeA - gradeB;
            }
            // If same grade, sort by section
            return (a.section || '').localeCompare(b.section || '');
          });
          setClasses(sortedClasses);
        } else {
          setClasses([]);
        }

        // Load subjects
        const subjectsData = await subjectAPI.getSubjects();
        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      } catch (error) {
        console.error('Error initializing data:', error);
        showMessage('Error loading data: ' + error.message, 'error');
      }
    };
    
    initializeData();
  }, []);

  // Update selected class when navigation state changes
  useEffect(() => {
    if (location.state?.selectedClass) {
      const classId = location.state.selectedClass;
      if (classId !== selectedClass) {
        setSelectedClass(classId);
      }
      // Clear navigation state to prevent re-triggering on back navigation
      if (location.state) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [location.state]);

  // Update URL when filters change
  useEffect(() => {
    const params = {};
    if (selectedClass) params.class_id = selectedClass;
    setSearchParams(params);
  }, [selectedClass, setSearchParams]);

  // Fetch subjects when filters change - Show All or Filter by Class
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        // If a class is selected, show only subjects assigned to that class with course limits
        if (selectedClass) {
          const response = await subjectAPI.getSubjectsForClass(selectedClass);
          
          if (response && response.subjects) {
            // Store class data
            setSelectedClassData(response.class);
            
            // Transform the response to match the expected format
            // Backend returns: { _id, subject_name, term_id, course_limit, assignments: [...] }
            // IMPORTANT: Only show subjects that have assignments with teachers
            const formattedSubjects = response.subjects
              .filter(subject => {
                // Only include subjects that have assignments with teachers
                const assignments = subject.assignments || [];
                return assignments.length > 0 && assignments.some(assignment => 
                  assignment.teacher_id || assignment.user_id
                );
              })
              .map(subject => ({
                _id: subject._id,
                subject_name: subject.subject_name,
                term_id: subject.term_id,
                course_limit: subject.course_limit,
                class_course_limit: subject.course_limit,
                assignments: subject.assignments || [],
                is_assigned: true, // All subjects here are assigned (we filtered above)
                is_available: true
              }));
            
            setSubjects(formattedSubjects);
          } else {
            setSubjects([]);
            setSelectedClassData(null);
          }
        } else {
          // "Show All" - show all subjects (all 15+ subjects, including newly added)
          const data = await subjectAPI.getSubjects();
          const allSubjects = Array.isArray(data) ? data : [];
          setSubjects(allSubjects);
          setSelectedClassData(null);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
        showMessage('Error fetching subjects: ' + error.message, 'error');
        setSubjects([]);
        setSelectedClassData(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubjects();
  }, [selectedClass]);




  const showMessage = useCallback((message, type = 'info') => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic validation - only subject name needed
      if (!formData.subject_name.trim()) {
        showMessage('Subject name is required', 'error');
        return;
      }

      // Simple subject data - course limits are handled in Admin Assignments page
      const subjectData = {
        subject_name: formData.subject_name.trim()
        // No course_limit or class_assignments - those are managed in Admin Assignments
        // Backend will auto-assign to current active term
      };

      const response = editingSubject 
        ? await subjectAPI.updateSubject(editingSubject._id, subjectData)
        : await subjectAPI.createSubject(subjectData);
      
      if (!response) {
        showMessage('Error: Failed to save subject', 'error');
        return;
      }
      
      showMessage(
        `Subject "${formData.subject_name}" ${editingSubject ? 'updated' : 'created'} successfully. Course limits are managed in the Assignments page.`,
        'success'
      );
      
      // Close modal and reset form
      setShowModal(false);
      setEditingSubject(null);
      setFormData({ subject_name: '' });

      // Refresh subjects to show the new/updated subject
      if (selectedClass) {
        // If filtering by class, refresh class-specific subjects
        const response = await subjectAPI.getSubjectsForClass(selectedClass);
        if (response && response.subjects) {
          setSelectedClassData(response.class);
          const formattedSubjects = response.subjects.map(subject => ({
            _id: subject._id,
            subject_name: subject.subject_name,
            term_id: subject.term_id,
            course_limit: subject.course_limit,
            class_course_limit: subject.course_limit,
            assignments: subject.assignments || [],
            is_assigned: (subject.assignments && subject.assignments.length > 0) || false,
            is_available: true
          }));
          setSubjects(formattedSubjects);
        }
      } else {
        // Show all subjects
        const data = await subjectAPI.getSubjects();
        setSubjects(Array.isArray(data) ? data : []);
      }

    } catch (error) {
      console.error('Error saving subject:', error);
      showMessage('Error saving subject: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (subject) => {
    setEditingSubject(subject);
    setFormData({
      subject_name: subject.subject_name
      // Course limits are managed in Assignments page, not here
    });
    
    setShowModal(true);
  };

  const handleDelete = async (subjectId) => {
    if (!window.confirm('Are you sure you want to delete this subject? This will also remove all teacher assignments and class assignments.')) {
      return;
    }

    try {
      await subjectAPI.deleteSubject(subjectId);
      showMessage('Subject deleted successfully', 'success');
      
      // Refresh subjects based on current filter
      if (selectedClass) {
        const response = await subjectAPI.getSubjectsForClass(selectedClass);
        if (response && response.subjects) {
          setSelectedClassData(response.class);
          const formattedSubjects = response.subjects.map(subject => ({
            _id: subject._id,
            subject_name: subject.subject_name,
            term_id: subject.term_id,
            course_limit: subject.course_limit,
            class_course_limit: subject.course_limit,
            assignments: subject.assignments || [],
            is_assigned: (subject.assignments && subject.assignments.length > 0) || false,
            is_available: true
          }));
          setSubjects(formattedSubjects);
        }
      } else {
        const data = await subjectAPI.getSubjects();
        setSubjects(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      showMessage('Error deleting subject: ' + error.message, 'error');
    }
  };

  const handleAssignTeacher = (subject) => {
    navigate('/admin/assignments', { 
      state: { 
        selectedSubject: subject._id,
        selectedSubjectName: subject.subject_name 
      } 
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSubject(null);
    setFormData({ subject_name: '' });
  };

  const handleOpenModal = async () => {
    // Ensure classes are loaded
    if (classes.length === 0) {
      const classesData = await classAPI.getClasses();
      if (classesData && Array.isArray(classesData)) {
        // Sort classes by grade (ascending) then by section (ascending)
        const sortedClasses = [...classesData].sort((a, b) => {
          const gradeA = parseInt(a.grade) || 0;
          const gradeB = parseInt(b.grade) || 0;
          if (gradeA !== gradeB) {
            return gradeA - gradeB;
          }
          return (a.section || '').localeCompare(b.section || '');
        });
        setClasses(sortedClasses);
      }
    }
    
    // Reset form data for new subject
    setFormData({ subject_name: '', course_limit: '1' });
    setEditingSubject(null);

    setShowModal(true);
  };


  const getTermName = (termId) => {
    if (!termId) {
      return "Create Term"; // Show "Create Term" for subjects without term assignment
    }
    
    let termObj = termId;
    
    // If termId is a string, find it in the terms array
    if (typeof termId === "string") {
      termObj = terms.find(t => t._id === termId);
    }
    
    // If termId is an object (populated from backend), use it directly
    if (typeof termId === "object" && termId.term_number) {
      termObj = termId;
    }
    
    if (!termObj || !termObj.term_number) {
      return "Create Term"; // Show "Create Term" if term data is incomplete
    }
    
    const termNames = { 
      1: "First Term", 
      2: "Second Term", 
      3: "Third Term" 
    };
    
    const yearLabel = typeof termObj.academic_year_id === "object"
      ? termObj.academic_year_id.year_label
      : "Unknown Year";
    
    return `${termNames[termObj.term_number] || `Term ${termObj.term_number}`} - ${yearLabel}`;
  };

  const getTotalAssignedCourseLimit = (subject) => {
    if (!subject.assignments || !Array.isArray(subject.assignments)) return 0;
    return subject.assignments.reduce((total, assignment) => {
      return total + (assignment.course_limit || 0);
    }, 0);
  };

  const getRemainingCourseLimit = (subject) => {
    const totalAssigned = getTotalAssignedCourseLimit(subject);
    return Math.max(0, (subject.course_limit || 0) - totalAssigned);
  };

  const renderClassSpecificLimits = (subject) => {
    if (!selectedClass) {
      return (
        <>
          <div className="admin-subjects-limit-item">
            <span className="admin-subjects-limit-label-new">Total:</span>
            <span className="admin-subjects-limit-value-new">{subject.course_limit || 0}</span>
          </div>
          <div className="admin-subjects-limit-item">
            <span className="admin-subjects-limit-label-new">Remaining:</span>
            <span className={`admin-subjects-limit-remaining-new ${getRemainingCourseLimit(subject) === 0 ? 'warning' : 'success'}`}>
              {getRemainingCourseLimit(subject)}
            </span>
          </div>
        </>
      );
    }

    const classAssignment = subject.assignments?.find(assignment => {
      const assignmentClassId = typeof assignment.class_id === 'object' 
        ? assignment.class_id._id 
        : assignment.class_id;
      return assignmentClassId === selectedClass;
    });
    
    if (classAssignment) {
      return (
        <>
          <div className="admin-subjects-limit-item">
            <span className="admin-subjects-limit-label-new">Class Limit:</span>
            <span className="admin-subjects-limit-value-new">{classAssignment.course_limit || 0}</span>
          </div>
          <div className="admin-subjects-limit-item">
            <span className="admin-subjects-limit-label-new">Teacher:</span>
            <span className="admin-subjects-limit-value-new">
              {classAssignment.teacher_id?.name || classAssignment.user_id?.name || 'Not Assigned'}
            </span>
          </div>
        </>
      );
    } else {
      return (
        <div className="admin-subjects-limit-item full-width">
          <span className="admin-subjects-limit-label-new">Status:</span>
          <span className="admin-subjects-limit-remaining-new warning">Not Assigned to Class</span>
        </div>
      );
    }
  };

  // Handle updating course limit for a subject in a class
  const handleUpdateCourseLimit = async (subject, newLimit) => {
    if (!selectedClass || !subject._id) {
      showMessage('Cannot update course limit: Class or subject not selected', 'error');
      return;
    }

    // Validate course limit is between 0 and 50
    if (newLimit < 0 || newLimit > 50) {
      showMessage('Course limit must be between 0 and 50', 'error');
      return;
    }

    setLoading(true);
    try {
      // When a class is selected, all assignments in the array are already for that class
      // (backend filters by class_id before returning)
      const assignments = subject.assignments || [];
      
      if (assignments.length === 0) {
        showMessage('Subject is not assigned to this class yet. Please assign it first.', 'error');
        setLoading(false);
        return;
      }

      // Update all assignments for this subject in this class to the same course limit
      // This ensures consistency if multiple teachers teach the same subject
      const updatePromises = assignments.map(assignment => {
        if (assignment._id) {
          return subjectAPI.updateClassSubjectCourseLimit(assignment._id, newLimit);
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      showMessage('Course limit updated successfully!', 'success');
      
      // Refresh the subjects data
      const response = await subjectAPI.getSubjectsForClass(selectedClass);
      if (response && response.subjects) {
        const formattedSubjects = response.subjects.map(subject => ({
          _id: subject._id,
          subject_name: subject.subject_name,
          term_id: subject.term_id,
          course_limit: subject.course_limit,
          class_course_limit: subject.course_limit,
          assignments: subject.assignments || [],
          is_assigned: (subject.assignments && subject.assignments.length > 0) || false,
          is_available: true
        }));
        setSubjects(formattedSubjects);
      }
    } catch (error) {
      showMessage('Error updating course limit: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };





  return (
    <AdminLayout 
      pageTitle="Subject Management" 
      pageDescription="Manage subjects and teacher assignments"
    >
      {/* Alerts */}
      <div className="alerts-container">
        {alerts.map(alert => (
          <div key={alert.id} className={`alert alert-${alert.type}`}>
            {alert.message}
          </div>
        ))}
      </div>

      <div className="subjects-container">
        {/* Header */}
        <div className="subjects-header">
          <div className="header-left">
             <h1 className="page-main-title">Subject Management</h1>
          </div>
          <div className="header-right">
            <button 
              className="btn btn-primary"
              onClick={handleOpenModal}
            >
              + Add Subject
            </button>
          </div>
        </div>


        {/* Filters - Show All or Filter by Class */}
        <div className="subjects-filters">
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="class-filter">
                <span className="filter-icon">🔍</span>
                Filter Options:
              </label>
              <select
                id="class-filter"
                className="filter-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Show All</option>
                {classes.map(classItem => (
                  <option key={classItem._id} value={classItem._id}>
                    {classItem.class_name} (Grade {classItem.grade}, Section {classItem.section})
                  </option>
                ))}
              </select>
              {selectedClass && (
                <div className="filter-info">
                  <span className="info-icon">ℹ️</span>
                  <span>Showing only subjects assigned to {classes.find(c => c._id === selectedClass)?.class_name}</span>
                </div>
              )}
              {!selectedClass && (
                <div className="filter-info">
                  <span className="info-icon">ℹ️</span>
                  <span>Showing all subjects ({subjects.length} total)</span>
                </div>
              )}
            </div>
            
            <div className="filter-actions">
              {selectedClass && (
                <>
                  <button 
                    className="btn btn-outline"
                    onClick={() => setSelectedClass('')}
                    title="Clear filter and show all subjects"
                  >
                    🔍 Clear Filter
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/admin/assignments', { 
                      state: { selectedClass: selectedClass } 
                    })}
                    title="Manage subject assignments for this class"
                  >
                    📋 Manage Assignments
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Subjects Grid */}
        <div className="subjects-grid">
          {loading ? (
            <div className="loading">Loading subjects...</div>
          ) : subjects.length === 0 ? (
            <div className="no-data">
              <div className="no-data-icon">📚</div>
              <h3>No Subjects Found</h3>
              <p>
                {selectedClass
                  ? `No subjects found for ${classes.find(c => c._id === selectedClass)?.class_name || 'selected class'}`
                  : 'No subjects found. Create your first subject to get started.'
                }
              </p>
              <button 
                className="btn btn-primary"
                onClick={handleOpenModal}
              >
                Create Subject
              </button>
            </div>
          ) : (
            subjects.map((subject) => {
              // Get course limit from subject data
              // Backend returns course_limit which is the max of all assignments for this subject in this class
              const courseLimit = subject.course_limit || 0;
              
              // Get teacher info from assignments array
              const assignments = subject.assignments || [];
              const teacherAssignment = assignments.length > 0 ? assignments[0] : null;
              // Backend returns teacher_id in assignments array (not user_id)
              const teacherName = teacherAssignment?.teacher_id?.name || teacherAssignment?.user_id?.name || 'Not Assigned';
              const isAssigned = subject.is_assigned || (assignments.length > 0);
              
              // Get class name
              const className = selectedClassData?.class_name || classes.find(c => c._id === selectedClass)?.class_name || 'Unknown';
              
              return (
                <div key={subject._id} className="subject-card-modern">
                  {/* Subject Header */}
                  <div className="subject-card-header">
                    <h3 className="subject-card-title">{subject.subject_name}</h3>
                  </div>
                  
                  {/* Card Content */}
                  <div className="subject-card-body">
                    {selectedClass ? (
                      <>
                        {/* Class Badge */}
                        <div className="subject-info-badge class-badge">
                          <span className="badge-icon">🏫</span>
                          <div className="badge-content">
                            <span className="badge-label">Class</span>
                            <span className="badge-value">{className}</span>
                          </div>
                        </div>
                        
                        {/* Course Limit Badge - Editable */}
                        <div className="subject-info-badge limit-badge editable-badge">
                          <span className="badge-icon">⏱️</span>
                          <div className="badge-content">
                            <span className="badge-label">Periods per Month</span>
                            <div className="badge-value-container">
                              {editingCourseLimit === subject._id ? (
                                <div className="course-limit-edit">
                                  <input
                                    type="number"
                                    min="0"
                                    max="50"
                                    defaultValue={courseLimit}
                                    className="course-limit-input-inline"
                                    onBlur={(e) => {
                                      const newLimit = parseInt(e.target.value) || courseLimit;
                                      if (newLimit !== courseLimit && newLimit >= 0 && newLimit <= 50) {
                                        handleUpdateCourseLimit(subject, newLimit);
                                      }
                                      setEditingCourseLimit(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.target.blur();
                                      } else if (e.key === 'Escape') {
                                        setEditingCourseLimit(null);
                                      }
                                    }}
                                    autoFocus
                                  />
                                </div>
                              ) : (
                                <span 
                                  className="badge-value highlight editable-value"
                                  onClick={() => setEditingCourseLimit(subject._id)}
                                  title="Click to edit course limit"
                                >
                                  {courseLimit} {courseLimit === 1 ? 'period' : 'periods'} ✏️
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div className={`subject-info-badge status-badge ${isAssigned ? 'assigned' : 'unassigned'}`}>
                          <span className="badge-icon">{isAssigned ? '✅' : '⏳'}</span>
                          <div className="badge-content">
                            <span className="badge-label">Status</span>
                            <span className="badge-value">{isAssigned ? 'Assigned' : 'Unassigned'}</span>
                          </div>
                        </div>
                        
                        {/* Teacher Info */}
                        {isAssigned && (
                          <div className="subject-info-badge teacher-badge">
                            <span className="badge-icon">👨‍🏫</span>
                            <div className="badge-content">
                              <span className="badge-label">Teacher</span>
                              <span className="badge-value">{teacherName}</span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="subject-assignment-info">
                        {/* Assignment Status */}
                        {(() => {
                          const assignments = subject.assignments || [];
                          const isAssigned = assignments.length > 0;
                          
                          return (
                            <>
                              <div className={`subject-info-badge status-badge ${isAssigned ? 'assigned' : 'unassigned'}`}>
                                <span className="badge-icon">{isAssigned ? '✅' : '❌'}</span>
                                <div className="badge-content">
                                  <span className="badge-label">Assigned</span>
                                  <span className="badge-value">{isAssigned ? 'Yes' : 'No'}</span>
                                </div>
                              </div>
                              
                              {/* Class Assignments List - Simplified */}
                              {isAssigned && assignments.length > 0 && (
                                <div className="subject-class-assignments-simple">
                                  <div className="class-assignments-list-simple">
                                    {(() => {
                                      // Get unique classes (in case same class appears multiple times with different teachers)
                                      const uniqueClasses = new Map();
                                      assignments.forEach((assignment) => {
                                        const classData = assignment.class_id;
                                        if (classData) {
                                          const classId = typeof classData === 'object' ? classData._id : classData;
                                          const className = typeof classData === 'object' ? classData.class_name : 'Unknown Class';
                                          if (classId && !uniqueClasses.has(classId)) {
                                            uniqueClasses.set(classId, className);
                                          }
                                        }
                                      });
                                      
                                      return Array.from(uniqueClasses.entries()).map(([classId, className], index) => (
                                        <span key={classId || index} className="class-name-simple">
                                          {className}
                                        </span>
                                      ));
                                    })()}
                                  </div>
                                </div>
                              )}
                              
                              {!isAssigned && (
                                <div className="subject-no-assignments">
                                  <p>This subject is not assigned to any class yet.</p>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  
                  {/* Card Actions */}
                  <div className="subject-card-actions">
                    <button 
                      className="card-action-btn edit-btn"
                      onClick={() => handleEdit(subject)}
                      title="Edit Subject"
                    >
                      <span className="btn-icon">✏️</span>
                      <span className="btn-text">Edit</span>
                    </button>
                    <button 
                      className="card-action-btn delete-btn"
                      onClick={() => handleDelete(subject._id)}
                      title="Delete Subject"
                    >
                      <span className="btn-icon">🗑️</span>
                      <span className="btn-text">Delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Subject Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h3>
                <button className="close-btn" onClick={handleCloseModal}>×</button>
              </div>
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label htmlFor="subject_name">Subject Name *</label>
                  <input
                    type="text"
                    id="subject_name"
                    name="subject_name"
                    value={formData.subject_name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Mathematics, English, Science"
                  />
                </div>
                
                <div className="form-info">
                  <p className="form-info-text">
                    ℹ️ <strong>Note:</strong> Only course limits are managed class-wise.
                  </p>
                </div>

                
                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : (editingSubject ? 'Update Subject' : 'Create Subject')}
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

export default AdminSubjects;