import React, { useState, useEffect, useCallback} from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../Components/AdminLayout/AdminLayout';
import { termsAPI, subjectAPI, academicYearAPI, classAPI } from '../../../services/api';
import './AdminSubjects.css';

const AdminSubjects = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State
  const [subjects, setSubjects] = useState([]);
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [alerts, setAlerts] = useState([]);
  
  // Filters - Now term-based only
  const [selectedTerm, setSelectedTerm] = useState(searchParams.get('term_id') || '');
  const [selectedClass, setSelectedClass] = useState(searchParams.get('class_id') || '');
  
  // Form data
  const [formData, setFormData] = useState({
    subject_name: '',
    course_limit: '1',
    term_id: '',
    classLimits: {}
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
          setClasses(classesData);
        } else {
          setClasses([]);
        }

        // Load subjects
        console.log('Attempting to load subjects...');
        const subjectsData = await subjectAPI.getSubjects();
        console.log('API Response:', subjectsData);
        console.log('Initial subjects loaded:', Array.isArray(subjectsData) ? subjectsData.length : 0, 'subjects');
        console.log('Terms loaded:', termsData.length);
        console.log('Classes loaded:', classesData.length);
        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      } catch (error) {
        console.error('Error initializing data:', error);
        showMessage('Error loading data: ' + error.message, 'error');
      }
    };
    
    initializeData();
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = {};
    if (selectedTerm) params.term_id = selectedTerm;
    if (selectedClass) params.class_id = selectedClass;
    setSearchParams(params);
  }, [selectedTerm, selectedClass, setSearchParams]);

  // Fetch subjects when filters change - TERM-BASED FILTERING
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        // Always fetch all subjects first, then filter on frontend
        const data = await subjectAPI.getSubjects();
        const allSubjects = Array.isArray(data) ? data : [];
        
        // Apply filtering
        let filteredSubjects = allSubjects;
        
        // Filter by term if selected
        if (selectedTerm) {
          filteredSubjects = filteredSubjects.filter(subject => {
            // If subject has no term assigned, don't include it when filtering by specific term
            if (!subject.term_id) return false;
            
            // If subject has term, check if it matches selected term
            const subjectTermId = typeof subject.term_id === 'object' 
              ? subject.term_id._id 
              : subject.term_id;
            
            return subjectTermId === selectedTerm;
          });
        }
        
        // Filter by class if selected
        if (selectedClass) {
          filteredSubjects = filteredSubjects.filter(subject => {
            // Check if this subject has assignments for the selected class
            if (!subject.assignments || !Array.isArray(subject.assignments)) {
              return false;
            }
            
            return subject.assignments.some(assignment => {
              const assignmentClassId = typeof assignment.class_id === 'object' 
                ? assignment.class_id._id 
                : assignment.class_id;
              return assignmentClassId === selectedClass;
            });
          });
        }
        
        console.log('Subjects loaded:', filteredSubjects.length, 'subjects');
        setSubjects(filteredSubjects);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        showMessage('Error fetching subjects: ' + error.message, 'error');
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubjects();
  }, [selectedTerm, selectedClass]);

  // Reset class filter when term changes
  useEffect(() => {
    if (selectedTerm) {
      setSelectedClass('');
    }
  }, [selectedTerm]);

  // Fetch terms when academic year changes - REMOVED selectedAcademicYear dependency

  const fetchTerms = async (academicYearId = null) => {
    try {
      const params = academicYearId ? { academic_year_id: academicYearId } : {};
      const data = await termsAPI.getTerms(params);
      
      if (data && Array.isArray(data)) {
        setTerms(data);
      } else {
        setTerms([]);
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
      setTerms([]);
    }
  };

  const fetchSubjectsData = async () => {
    setLoading(true);
    try {
      // Always fetch all subjects first, then filter on frontend
      const data = await subjectAPI.getSubjects();
      const allSubjects = Array.isArray(data) ? data : [];
      
      // Apply filtering
      let filteredSubjects = allSubjects;
      
      // Filter by term if selected
      if (selectedTerm) {
        filteredSubjects = filteredSubjects.filter(subject => {
          if (!subject.term_id) return false;
          const subjectTermId = typeof subject.term_id === 'object' 
            ? subject.term_id._id 
            : subject.term_id;
          return subjectTermId === selectedTerm;
        });
      }
      
      // Filter by class if selected
      if (selectedClass) {
        filteredSubjects = filteredSubjects.filter(subject => {
          if (!subject.assignments || !Array.isArray(subject.assignments)) {
            return false;
          }
          return subject.assignments.some(assignment => {
            const assignmentClassId = typeof assignment.class_id === 'object' 
              ? assignment.class_id._id 
              : assignment.class_id;
            return assignmentClassId === selectedClass;
          });
        });
      }
      
        console.log('fetchSubjectsData: Subjects loaded:', filteredSubjects.length, 'subjects');
        console.log('Selected term:', selectedTerm);
        console.log('Selected class:', selectedClass);
        console.log('Filtered subjects:', filteredSubjects);
        setSubjects(filteredSubjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      showMessage('Error fetching subjects: ' + error.message, 'error');
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };



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
      // Basic validation
      if (!formData.subject_name.trim()) {
        showMessage('Subject name is required', 'error');
        return;
      }

      if (!formData.course_limit || formData.course_limit < 1) {
        showMessage('Course limit must be at least 1', 'error');
        return;
      }

      // Term is optional during creation

      const subjectData = {
        subject_name: formData.subject_name.trim(),
        course_limit: parseInt(formData.course_limit),
        term_id: formData.term_id || null
      };

      const response = editingSubject 
        ? await subjectAPI.updateSubject(editingSubject._id, subjectData)
        : await subjectAPI.createSubject(subjectData);
      
      if (!response) {
        showMessage('Error: Failed to save subject', 'error');
        return;
      }
      
      showMessage(
        `Subject "${formData.subject_name}" ${editingSubject ? 'updated' : 'created'} successfully`,
        'success'
      );
      
      // Close modal and reset form
      setShowModal(false);
      setEditingSubject(null);
      setFormData({ subject_name: '', course_limit: '1', term_id: '' });

      // Refresh subjects to show the new/updated subject
      await fetchSubjectsData();
      
      // Also refresh the terms data to ensure everything is up to date
        await fetchTerms();

    } catch (error) {
      console.error('Error saving subject:', error);
      showMessage('Error saving subject: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (subject) => {
    // Extract class-specific limits from assignments
    const classLimits = {};
    if (subject.assignments && Array.isArray(subject.assignments)) {
      subject.assignments.forEach(assignment => {
        const classId = assignment.class_id?._id || assignment.class_id;
        if (classId) {
          classLimits[classId] = assignment.course_limit || subject.course_limit || 1;
        }
      });
    }
    
    setEditingSubject(subject);
    setFormData({
      subject_name: subject.subject_name,
      course_limit: subject.course_limit.toString(),
      term_id: subject.term_id?._id || subject.term_id || '',
      classLimits: classLimits
    });
    
    setShowModal(true);
  };

  const handleDelete = async (subjectId) => {
    if (!window.confirm('Are you sure you want to delete this subject? This will also remove all teacher assignments.')) {
      return;
    }

    try {
      await subjectAPI.deleteSubject(subjectId);
      showMessage('Subject deleted successfully', 'success');
      await fetchSubjectsData();
      
      // Also refresh the terms data to ensure everything is up to date
        await fetchTerms();
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
    setFormData({ subject_name: '', course_limit: '1', term_id: '' });
  };

  const handleOpenModal = async () => {
    // Ensure terms are loaded
    if (terms.length === 0) {
      await fetchTerms();
    }
    
    // Reset form data for new subject
    setFormData({ subject_name: '', course_limit: '1', term_id: '', classLimits: {} });
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
              {classAssignment.user_id?.name || 'Not Assigned'}
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




  // Debug: Check if component is rendering
  console.log('AdminSubjects rendering - subjects:', subjects.length, 'loading:', loading, 'selectedTerm:', selectedTerm);

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
            <p>Create and manage subjects with teacher assignments</p>
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


        {/* Enhanced Filters - Term and Class Based */}
        <div className="subjects-filters">
          <div className="filters-header">
            <h3>📊 Subject Filtering & Management</h3>
            <p>Filter subjects by term and class to manage course limits</p>
          </div>
          
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="term-filter">
                <span className="filter-icon">📅</span>
                Filter by Term:
              </label>
              <select
                id="term-filter"
                value={selectedTerm}
                onChange={(e) => {
                  setSelectedTerm(e.target.value);
                  setSelectedClass(''); // Reset class when term changes
                }}
              >
                <option value="">All Terms</option>
                {terms.map(term => (
                  <option key={term._id} value={term._id}>
                    {getTermName(term)}
                  </option>
                ))}
              </select>
              {selectedTerm && (
                <div className="filter-info">
                  <span className="info-icon">ℹ️</span>
                  <span>Showing subjects for {getTermName(terms.find(t => t._id === selectedTerm))}</span>
                </div>
              )}
            </div>
            
            {selectedTerm && (
              <div className="filter-group">
                <label htmlFor="class-filter">
                  <span className="filter-icon">🏫</span>
                  Filter by Class:
                </label>
                <select
                  id="class-filter"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">All Classes in Term</option>
                  {classes
                    .filter(classItem => {
                      // Only show classes assigned to the selected term
                      const classTermId = typeof classItem.term_id === 'object' 
                        ? classItem.term_id._id 
                        : classItem.term_id;
                      return classTermId === selectedTerm;
                    })
                    .map(classItem => (
                      <option key={classItem._id} value={classItem._id}>
                        {classItem.class_name} (Grade {classItem.grade})
                      </option>
                    ))}
                </select>
                {selectedClass && (
                  <div className="filter-info">
                    <span className="info-icon">ℹ️</span>
                    <span>Showing subjects for {classes.find(c => c._id === selectedClass)?.class_name}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="filter-actions">
              <button 
                className="btn btn-outline"
                onClick={() => {
                  setSelectedTerm('');
                  setSelectedClass('');
                }}
              >
                🔄 Clear Filters
              </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleOpenModal}
                  disabled={!selectedTerm}
                >
                  ➕ Add Subject to Term
                </button>
            </div>
          </div>

          {/* Filter Summary */}
          {(selectedTerm || selectedClass) && (
            <div className="filter-summary">
              <div className="summary-header">
                <span className="summary-icon">📋</span>
                <span>Filter Summary</span>
              </div>
              <div className="summary-content">
                {selectedTerm && (
                  <div className="summary-item">
                    <span className="summary-label">Term:</span>
                    <span className="summary-value">{getTermName(terms.find(t => t._id === selectedTerm))}</span>
                  </div>
                )}
                {selectedClass && (
                  <div className="summary-item">
                    <span className="summary-label">Class:</span>
                    <span className="summary-value">{classes.find(c => c._id === selectedClass)?.class_name}</span>
                  </div>
                )}
                <div className="summary-item">
                  <span className="summary-label">Subjects Found:</span>
                  <span className="summary-value">{subjects.length}</span>
                </div>
              </div>
            </div>
          )}
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
                {selectedTerm && selectedTerm !== ''
                  ? selectedClass
                    ? `No subjects found for ${classes.find(c => c._id === selectedClass)?.class_name || 'selected class'} in ${terms.find(t => t._id === selectedTerm) ? getTermName(terms.find(t => t._id === selectedTerm)) : 'selected term'}`
                    : `No subjects assigned to ${terms.find(t => t._id === selectedTerm) ? getTermName(terms.find(t => t._id === selectedTerm)) : 'selected term'}`
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
            subjects.map((subject) => (
              <div key={subject._id} className="subject-card-clean">
                {/* Header Section */}
                <div className="subject-card-header">
                  <div className="subject-name-section">
                    <h3 className="subject-name">{subject.subject_name}</h3>
                    <span className="subject-type-badge">
                      {subject.subject_type || 'Core'}
                    </span>
                  </div>
                  <div className="subject-base-limit">
                    <span className="base-limit-icon">⏰</span>
                    <span className="base-limit-text">{subject.course_limit || 0} periods</span>
                  </div>
                </div>
                
                {/* Term Assignment */}
                <div className="subject-term-section">
                  <div className="term-label">
                    <span className="term-icon">📅</span>
                    <span>Term:</span>
                  </div>
                  <span className={`term-badge ${subject.term_id ? 'assigned' : 'unassigned'}`}>
                    {subject.term_id ? '✅' : '⏳'} {getTermName(subject.term_id)}
                  </span>
                </div>
                
                {/* Class-Specific Course Limits */}
                <div className="subject-class-limits">
                  <div className="class-limits-header">
                    <span className="limits-icon">📊</span>
                    <span>Class Course Limits</span>
                    <span className="limits-summary">
                      {(() => {
                        const termClasses = classes.filter(classItem => {
                          const classTermId = typeof classItem.term_id === 'object' 
                            ? classItem.term_id._id 
                            : classItem.term_id;
                          return classTermId === (subject.term_id?._id || subject.term_id);
                        });
                        
                        const assignedClasses = termClasses.filter(classItem => {
                          return subject.assignments?.some(assignment => {
                            const assignmentClassId = typeof assignment.class_id === 'object' 
                              ? assignment.class_id._id 
                              : assignment.class_id;
                            return assignmentClassId === classItem._id;
                          });
                        });
                        
                        return `${assignedClasses.length}/${termClasses.length} classes assigned`;
                      })()}
                    </span>
                  </div>
                  <div className="class-limits-content">
                    {(() => {
                      const termClasses = classes.filter(classItem => {
                        const classTermId = typeof classItem.term_id === 'object' 
                          ? classItem.term_id._id 
                          : classItem.term_id;
                        return classTermId === (subject.term_id?._id || subject.term_id);
                      });
                      
                      if (termClasses.length === 0) {
                        return (
                          <div className="no-classes-message">
                            <span className="warning-icon">⚠️</span>
                            <span>No classes assigned to this term</span>
                          </div>
                        );
                      }
                      
                      return termClasses.map(classItem => {
                        const assignment = subject.assignments?.find(assignment => {
                          const assignmentClassId = typeof assignment.class_id === 'object' 
                            ? assignment.class_id._id 
                            : assignment.class_id;
                          return assignmentClassId === classItem._id;
                        });
                        
                        const courseLimit = assignment?.course_limit || subject.course_limit || 0;
                        const isAssigned = !!assignment;
                        
                        return (
                          <div key={classItem._id} className={`class-limit-item ${isAssigned ? 'assigned' : 'unassigned'}`}>
                            <div className="class-info">
                              <span className="class-name">{classItem.class_name}</span>
                              <span className="grade-info">Grade {classItem.grade}</span>
                              {classItem.section && (
                                <span className="section-info">Section {classItem.section}</span>
                              )}
                            </div>
                            <div className="limit-info">
                              <div className="limit-value-section">
                                <span className="limit-value">{courseLimit} periods</span>
                                <span className={`limit-status ${courseLimit > 0 ? 'valid' : 'invalid'}`}>
                                  {courseLimit > 0 ? '✅' : '❌'}
                                </span>
                              </div>
                              <span className={`assignment-status ${isAssigned ? 'assigned' : 'unassigned'}`}>
                                {isAssigned ? '✅ Assigned' : '⏳ Available'}
                              </span>
                            </div>
                            {assignment && (
                              <div className="teacher-info">
                                <span className="teacher-name">
                                  👨‍🏫 {assignment.user_id?.name || 'Unassigned'}
                                </span>
                                <span className="assignment-date">
                                  Assigned: {new Date(assignment.createdAt || Date.now()).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                  
                  {/* Course Limit Validation */}
                  <div className="course-limit-validation">
                    <div className="validation-header">
                      <span className="validation-icon">🔍</span>
                      <span>Course Limit Analysis</span>
                    </div>
                    <div className="validation-content">
                      {(() => {
                        const termClasses = classes.filter(classItem => {
                          const classTermId = typeof classItem.term_id === 'object' 
                            ? classItem.term_id._id 
                            : classItem.term_id;
                          return classTermId === (subject.term_id?._id || subject.term_id);
                        });
                        
                        const totalPeriods = termClasses.reduce((total, classItem) => {
                          const assignment = subject.assignments?.find(assignment => {
                            const assignmentClassId = typeof assignment.class_id === 'object' 
                              ? assignment.class_id._id 
                              : assignment.class_id;
                            return assignmentClassId === classItem._id;
                          });
                          return total + (assignment?.course_limit || subject.course_limit || 0);
                        }, 0);
                        
                        const assignedClasses = termClasses.filter(classItem => {
                          return subject.assignments?.some(assignment => {
                            const assignmentClassId = typeof assignment.class_id === 'object' 
                              ? assignment.class_id._id 
                              : assignment.class_id;
                            return assignmentClassId === classItem._id;
                          });
                        });
                        
                        return (
                          <div className="validation-stats">
                            <div className="stat-item">
                              <span className="stat-label">Total Classes:</span>
                              <span className="stat-value">{termClasses.length}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Assigned Classes:</span>
                              <span className="stat-value">{assignedClasses.length}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Total Periods:</span>
                              <span className="stat-value">{totalPeriods}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Status:</span>
                              <span className={`stat-value ${assignedClasses.length > 0 ? 'success' : 'warning'}`}>
                                {assignedClasses.length > 0 ? 'Ready for Timetable' : 'Needs Assignment'}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="subject-actions">
                  <button 
                    className="action-btn edit-btn"
                    onClick={() => handleEdit(subject)}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(subject._id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))
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
                
                <div className="form-group">
                  <label htmlFor="course_limit">Course Limit (Periods per Week) *</label>
                  <input
                    type="number"
                    id="course_limit"
                    name="course_limit"
                    value={formData.course_limit}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="40"
                    placeholder="e.g., 5"
                  />
                  <small className="form-help">Maximum periods per term</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="term_id">Assign to Term</label>
                  <select
                    id="term_id"
                    name="term_id"
                    value={formData.term_id}
                    onChange={handleInputChange}
                    disabled={terms.length === 0}
                  >
                    <option value="">
                      {terms.length === 0 ? 'Loading terms...' : 'Select a term (required)'}
                    </option>
                    {terms.map(term => (
                      <option key={term._id} value={term._id}>
                        {getTermName(term)}
                      </option>
                    ))}
                  </select>
                  <small className="form-help">
                    Assign this subject to a specific term
                  </small>
                </div>

                {/* Class-Specific Course Limits */}
                {formData.term_id && (
                  <div className="form-group">
                    <label>Class-Specific Course Limits</label>
                    <div className="class-limits-section">
                      <div className="class-limits-header">
                        <span>Configure course limits for each class in this term</span>
                        <small className="form-help">Leave blank to use default limit</small>
                      </div>
                      <div className="class-limits-grid">
                        {(() => {
                          const termClasses = classes.filter(classItem => {
                            const classTermId = typeof classItem.term_id === 'object' 
                              ? classItem.term_id._id 
                              : classItem.term_id;
                            return classTermId === formData.term_id;
                          });
                          
                          return termClasses.map(classItem => (
                            <div key={classItem._id} className="class-limit-input">
                              <label htmlFor={`class_limit_${classItem._id}`}>
                                {classItem.class_name} (Grade {classItem.grade})
                              </label>
                              <input
                                type="number"
                                id={`class_limit_${classItem._id}`}
                                name={`class_limit_${classItem._id}`}
                                value={formData.classLimits?.[classItem._id] || ''}
                                onChange={(e) => {
                                  const newClassLimits = {
                                    ...formData.classLimits,
                                    [classItem._id]: e.target.value
                                  };
                                  setFormData(prev => ({
                                    ...prev,
                                    classLimits: newClassLimits
                                  }));
                                }}
                                min="0"
                                max="40"
                                placeholder={`Default: ${formData.course_limit}`}
                              />
                            </div>
                          ));
                        })()}
                      </div>
                      {classes.filter(classItem => {
                        const classTermId = typeof classItem.term_id === 'object' 
                          ? classItem.term_id._id 
                          : classItem.term_id;
                        return classTermId === formData.term_id;
                      }).length === 0 && (
                        <div className="no-classes-message">
                          No classes assigned to this term yet
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
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