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
  
  // Filters - Class-based only
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
    if (selectedClass) params.class_id = selectedClass;
    setSearchParams(params);
  }, [selectedClass, setSearchParams]);

  // Fetch subjects when filters change - CLASS-BASED FILTERING ONLY
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        // Always fetch all subjects first, then filter on frontend
        const data = await subjectAPI.getSubjects();
        const allSubjects = Array.isArray(data) ? data : [];
        
        // Apply filtering - only by class
        let filteredSubjects = allSubjects;
        
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
        console.log('Selected class:', selectedClass);
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
  }, [selectedClass]);

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
      
      // Apply filtering - only by class
      let filteredSubjects = allSubjects;
      
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
      console.log('Selected class:', selectedClass);
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
        course_limit: parseInt(formData.course_limit)
        // term_id will be auto-assigned to Third Term by backend
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
  console.log('AdminSubjects rendering - subjects:', subjects.length, 'loading:', loading, 'selectedClass:', selectedClass);

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


        {/* Enhanced Filters - Class Based Only */}
        <div className="subjects-filters">
          <div className="filters-header">
            <h3>📊 Subject Filtering & Management</h3>
            <p>Filter subjects by class to view course limits</p>
          </div>
          
          <div className="filters-grid">
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
                <option value="">All Classes</option>
                {classes.map(classItem => (
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
            
            <div className="filter-actions">
              <button 
                className="btn btn-outline"
                onClick={() => {
                  setSelectedClass('');
                }}
              >
                🔄 Clear Filter
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleOpenModal}
              >
                ➕ Add Subject
              </button>
            </div>
          </div>

          {/* Filter Summary */}
          {selectedClass && (
            <div className="filter-summary">
              <div className="summary-header">
                <span className="summary-icon">📋</span>
                <span>Filter Summary</span>
              </div>
              <div className="summary-content">
                <div className="summary-item">
                  <span className="summary-label">Class:</span>
                  <span className="summary-value">{classes.find(c => c._id === selectedClass)?.class_name}</span>
                </div>
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
              // Get class-specific assignment if class is selected
              const classAssignment = selectedClass ? subject.assignments?.find(assignment => {
                const assignmentClassId = typeof assignment.class_id === 'object' 
                  ? assignment.class_id._id 
                  : assignment.class_id;
                return assignmentClassId === selectedClass;
              }) : null;
              
              const courseLimit = classAssignment?.course_limit || subject.course_limit || 0;
              const teacherName = classAssignment?.user_id?.name || 'Not Assigned';
              const isAssigned = !!classAssignment;
              
              return (
                <div key={subject._id} className="subject-card-large">
                  {/* Subject Name - Large and Prominent */}
                  <div className="card-large-header">
                    <h2 className="card-large-title">{subject.subject_name}</h2>
                  </div>
                  
                  {/* Class-Specific Information */}
                  {selectedClass ? (
                    <div className="card-large-content">
                      <div className="class-info-large">
                        <div className="info-row">
                          <span className="info-label">Class:</span>
                          <span className="info-value">{classes.find(c => c._id === selectedClass)?.class_name || 'Unknown'}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Course Limit:</span>
                          <span className="info-value highlight">{courseLimit} periods</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Assigned:</span>
                          <span className={`info-value ${isAssigned ? 'success' : 'warning'}`}>
                            {isAssigned ? '✅ Yes' : '❌ No'}
                          </span>
                        </div>
                        {isAssigned && (
                          <div className="info-row">
                            <span className="info-label">Teacher:</span>
                            <span className="info-value">{teacherName}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="progress-section">
                        <div className="progress-label">
                          <span>Course Limit Status</span>
                          <span className="progress-value">{courseLimit} / {courseLimit} periods</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="card-large-content">
                      <div className="no-class-selected">
                        <p>Select a class to view course limits</p>
                        <div className="default-info">
                          <span>Default Course Limit: {subject.course_limit || 0} periods</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="card-large-actions">
                    <button 
                      className="btn-large btn-edit-large"
                      onClick={() => handleEdit(subject)}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      className="btn-large btn-delete-large"
                      onClick={() => handleDelete(subject._id)}
                    >
                      🗑️ Delete
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
                  <label htmlFor="term_id">Term Assignment</label>
                  <input
                    type="text"
                    id="term_id"
                    value="Third Term (Auto-assigned)"
                    disabled
                    className="disabled-input"
                  />
                  <small className="form-help">
                    All subjects are automatically assigned to the Third Term
                  </small>
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