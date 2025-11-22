import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../Components/AdminLayout/AdminLayout';
import { termsAPI, classAPI, subjectAPI } from '../../../services/api';
import './AdminClasses.css';

const AdminClasses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [selectedClassForDetails, setSelectedClassForDetails] = useState(null);
  
  // Filters
  const [selectedTerm, setSelectedTerm] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    term_id: '',
    grade: '',
    section: '',
    class_name: ''
  });
  
  // Current terms for filtering
  const [currentTerms, setCurrentTerms] = useState([]);
  
  // Bulk assignment states
  const [bulkSourceTerm, setBulkSourceTerm] = useState('');
  const [bulkTargetTerm, setBulkTargetTerm] = useState('');
  const [availableTargetTerms, setAvailableTargetTerms] = useState([]);

  const addAlert = useCallback((message, type = 'success') => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  }, []);

  const showMessage = useCallback((msg, type = 'info') => {
    addAlert(msg, type);
  }, [addAlert]);

  // Initialize data function
  const initializeData = useCallback(async () => {
    try {
      console.log('Attempting to load classes data...');
      const [termsData, classesData, subjectsData] = await Promise.all([
        termsAPI.getTerms(),
        classAPI.getClasses(),
        subjectAPI.getSubjects()
      ]);
      
      console.log('API Response - Terms:', termsData);
      console.log('API Response - Classes:', classesData);
      console.log('API Response - Subjects:', subjectsData);
      console.log('Initial terms loaded:', Array.isArray(termsData) ? termsData.length : 0, 'terms');
      console.log('Initial classes loaded:', Array.isArray(classesData) ? classesData.length : 0, 'classes');
      console.log('Initial subjects loaded:', Array.isArray(subjectsData) ? subjectsData.length : 0, 'subjects');
      
      setTerms(Array.isArray(termsData) ? termsData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
    } catch (error) {
      console.error('Error initializing data:', error);
      showMessage('Error loading data: ' + error.message, 'error');
    }
  }, [showMessage]);


  useEffect(() => {
    initializeData();
  }, [initializeData]);


  // Simple function to get term display name
  const getTermName = (term) => {
    if (!term) return 'Unknown Term';
    
    let termData = term;
    if (typeof term === 'string') {
      termData = terms.find(t => t._id === term);
      if (!termData) return 'Unknown Term';
    }
    
    const termNames = {
      1: 'First Term',
      2: 'Second Term', 
      3: 'Third Term'
    };
    
    const termNumber = termData.term_number;
    const yearLabel = termData.academic_year_id?.year_label || 'Unknown Year';
    return `${termNames[termNumber] || `Term ${termNumber}`} - ${yearLabel}`;
  };

  // Handle URL parameters for term filtering
  useEffect(() => {
    const termId = searchParams.get('term_id');
    if (termId) {
      setSelectedTerm(termId);
    }
  }, [searchParams]);


  // Get ONLY current academic year terms
  const getCurrentAcademicYearTerms = (terms) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    console.log('Current date:', currentDate.toISOString().split('T')[0]);
    console.log('Current year:', currentYear);
    console.log('All terms with academic years:', terms.map(t => ({
      term: t.term_number,
      year: t.academic_year_id?.year_label,
      yearActive: t.academic_year_id?.is_active,
      start: t.start_date,
      end: t.end_date
    })));
    
    // Method 1: Find academic year that contains current date
    const currentAcademicYear = terms.find(term => {
      if (!term.academic_year_id || !term.start_date || !term.end_date) return false;
      
      const termStart = new Date(term.start_date);
      const termEnd = new Date(term.end_date);
      
      return currentDate >= termStart && currentDate <= termEnd;
    });
    
    // Method 2: If no term contains current date, find the active academic year
    let activeAcademicYear = null;
    if (!currentAcademicYear) {
      activeAcademicYear = terms.find(term => {
        return term.academic_year_id?.is_active === true;
      });
    }
    
    // Method 3: If still no match, find academic year that matches current year
    let yearBasedAcademicYear = null;
    if (!currentAcademicYear && !activeAcademicYear) {
      yearBasedAcademicYear = terms.find(term => {
        const yearLabel = term.academic_year_id?.year_label || '';
        return yearLabel.includes(currentYear.toString());
      });
    }
    
    const targetYear = currentAcademicYear || activeAcademicYear || yearBasedAcademicYear;
    
    if (!targetYear) {
      console.log('No current, active, or year-based academic year found');
      return [];
    }
    
    const currentYearId = targetYear.academic_year_id._id;
    console.log('Target academic year ID:', currentYearId);
    console.log('Target academic year label:', targetYear.academic_year_id.year_label);
    console.log('Target academic year active:', targetYear.academic_year_id.is_active);
    
    // Get all terms for the current academic year
    const currentYearTerms = terms.filter(term => {
      const termYearId = typeof term.academic_year_id === 'string' 
        ? term.academic_year_id 
        : term.academic_year_id?._id;
      return termYearId === currentYearId;
    });
    
    console.log('Current year terms found:', currentYearTerms.length);
    console.log('Current year terms:', currentYearTerms.map(t => `${t.term_number} - ${t.academic_year_id?.year_label}`));
    
    return currentYearTerms;
  };

  // Update current terms when terms change
  useEffect(() => {
    const currentYearTerms = getCurrentAcademicYearTerms(terms);
    setCurrentTerms(currentYearTerms);
    
    console.log('=== TERMS DEBUG ===');
    console.log('All terms:', terms.map(t => ({
      id: t._id,
      term: t.term_number,
      year: t.academic_year_id?.year_label,
      yearId: t.academic_year_id?._id
    })));
    console.log('Current year terms:', currentYearTerms.map(t => ({
      id: t._id,
      term: t.term_number,
      year: t.academic_year_id?.year_label
    })));
    
    // Auto-select first term if no source term is selected
    if (currentYearTerms.length > 0 && !bulkSourceTerm) {
      console.log('Auto-selecting first term:', currentYearTerms[0]._id);
      setBulkSourceTerm(currentYearTerms[0]._id);
      
      // Also set the next term
      const firstTerm = currentYearTerms[0];
      if (firstTerm.term_number === 1 && currentYearTerms.length > 1) {
        setBulkTargetTerm(currentYearTerms[1]._id);
        setAvailableTargetTerms([currentYearTerms[1]]);
      } else if (firstTerm.term_number === 2 && currentYearTerms.length > 2) {
        setBulkTargetTerm(currentYearTerms[2]._id);
        setAvailableTargetTerms([currentYearTerms[2]]);
      } else if (firstTerm.term_number === 3) {
        // Look for next year's first term
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        
        const nextYearTerm = terms.find(t => {
          if (t.term_number !== 1) return false;
          if (t.academic_year_id._id === firstTerm.academic_year_id._id) return false;
          
          const targetYearLabel = t.academic_year_id.year_label;
          return targetYearLabel.includes(nextYear.toString());
        });
        
        if (nextYearTerm) {
          setBulkTargetTerm(nextYearTerm._id);
          setAvailableTargetTerms([nextYearTerm]);
        }
      }
    }
  }, [terms, bulkSourceTerm]);

  // Simple validation for bulk assignment
  const validateBulkAssignment = () => {
    if (!bulkSourceTerm || !bulkTargetTerm) {
      showMessage('Please select both source and target terms', 'error');
      return false;
    }
    if (bulkSourceTerm === bulkTargetTerm) {
      showMessage('Source and target terms must be different', 'error');
      return false;
    }
    return true;
  };

  // Get classes from source term
  const getSourceClasses = () => {
    return classes.filter(classItem => {
      const classTermId = typeof classItem.term_id === 'object' 
        ? classItem.term_id._id 
        : classItem.term_id;
      return classTermId === bulkSourceTerm;
    });
  };

  // Move classes to target term
  const moveClassesToTerm = async (classesToMove, targetTermId) => {
    const updatePromises = classesToMove.map(classItem => 
      classAPI.updateClass(classItem._id, {
        ...classItem,
        term_id: targetTermId
      })
    );
    await Promise.all(updatePromises);
  };


  // Handle source term change - SIMPLE VERSION
  const handleSourceTermChange = (sourceTermId) => {
    console.log('Source term changed to:', sourceTermId);
    setBulkSourceTerm(sourceTermId);
    
    if (sourceTermId) {
      // Find the source term
      const sourceTerm = terms.find(term => term._id === sourceTermId);
      console.log('Found source term:', sourceTerm);
      
      if (sourceTerm) {
        const sourceTermNumber = sourceTerm.term_number;
        const sourceYearId = sourceTerm.academic_year_id._id;
        
        console.log('Source term number:', sourceTermNumber, 'Year ID:', sourceYearId);
        
        let nextTerm = null;
        
        // Simple logic: 1→2, 2→3, 3→1 (next year)
        if (sourceTermNumber === 1) {
          nextTerm = terms.find(t => t.term_number === 2 && t.academic_year_id._id === sourceYearId);
        } else if (sourceTermNumber === 2) {
          nextTerm = terms.find(t => t.term_number === 3 && t.academic_year_id._id === sourceYearId);
        } else if (sourceTermNumber === 3) {
          // Find 1st term of next academic year
          // Get current year from source academic year
          const sourceYearLabel = sourceTerm.academic_year_id.year_label;
          const currentYear = new Date().getFullYear();
          const nextYear = currentYear + 1;
          
          console.log('Looking for next year:', nextYear, 'from source year:', sourceYearLabel);
          
          nextTerm = terms.find(t => {
            if (t.term_number !== 1) return false;
            if (t.academic_year_id._id === sourceYearId) return false;
            
            const targetYearLabel = t.academic_year_id.year_label;
            console.log('Checking term:', t.term_number, 'year:', targetYearLabel);
            
            // Check if this is the next academic year
            return targetYearLabel.includes(nextYear.toString());
          });
        }
        
        console.log('Found next term:', nextTerm);
        
        if (nextTerm) {
          setBulkTargetTerm(nextTerm._id);
          setAvailableTargetTerms([nextTerm]);
          console.log('Set target term to:', nextTerm._id);
        } else {
          setBulkTargetTerm('');
          setAvailableTargetTerms([]);
        }
      }
    } else {
      setBulkTargetTerm('');
      setAvailableTargetTerms([]);
    }
  };

  // Reset bulk assignment form
  const resetBulkAssignment = () => {
    setBulkSourceTerm('');
    setBulkTargetTerm('');
    setAvailableTargetTerms([]);
  };

  // Main bulk assignment handler
  const handleBulkTermAssignment = async () => {
    if (!validateBulkAssignment()) return;

    try {
      setLoading(true);
      const sourceClasses = getSourceClasses();

      if (sourceClasses.length === 0) {
        showMessage('No classes found in the source term', 'warning');
        setLoading(false);
        return;
      }

      await moveClassesToTerm(sourceClasses, bulkTargetTerm);
      
      showMessage(`Successfully moved ${sourceClasses.length} classes to the target term`, 'success');
      resetBulkAssignment();
      
      // Refresh classes data
      const updatedData = await classAPI.getClasses();
      setClasses(updatedData || []);
      
    } catch (error) {
      console.error('Error in bulk assignment:', error);
      showMessage('Error moving classes: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate class name
  const generateClassName = (grade, section) => {
    if (grade && section) {
      return `${grade}${section}`;
    }
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-generate class name when grade or section changes
      if (name === 'grade' || name === 'section') {
        newData.class_name = generateClassName(newData.grade, newData.section);
      }
      
      return newData;
    });
  };

  // Simple form validation
  const validateForm = () => {
    if (!formData.term_id || !formData.grade || !formData.section || !formData.class_name) {
      showMessage('All fields are required', 'error');
      return false;
    }
    return true;
  };

  // Check if class already exists
  const checkExistingClass = () => {
    const existingClass = classes.find(cls => 
      cls.term_id === formData.term_id && 
      cls.class_name === formData.class_name &&
      (!editingClass || cls._id !== editingClass._id)
    );

    if (existingClass) {
      showMessage('Class already exists for this term', 'error');
      return false;
    }
    return true;
  };

  // Save class (create or update)
  const saveClass = async () => {
    if (editingClass) {
      return await classAPI.updateClass(editingClass._id, formData);
    } else {
      return await classAPI.createClass(formData);
    }
  };

  // Refresh classes data
  const refreshClasses = async () => {
    const updatedData = await classAPI.getClasses();
    setClasses(updatedData || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!validateForm() || !checkExistingClass()) {
        setLoading(false);
        return;
      }

      const data = await saveClass();
      showMessage(data.message || 'Class saved successfully', 'success');
      handleCloseModal();
      await refreshClasses();
      
    } catch (error) {
      console.error('Error saving class:', error);
      showMessage('Error saving class: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (classData) => {
    setEditingClass(classData);
    setFormData({
      term_id: classData.term_id._id || classData.term_id,
      grade: classData.grade.toString(),
      section: classData.section,
      class_name: classData.class_name
    });
    setShowModal(true);
  };

  const handleDelete = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class?')) {
      return;
    }

    try {
      const data = await classAPI.deleteClass(classId);
      showMessage(data.message || 'Class deleted successfully', 'success');
      await refreshClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      showMessage('Error deleting class: ' + error.message, 'error');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClass(null);
    setFormData({ term_id: '', grade: '', section: '', class_name: '' });
  };

  const handleViewDetails = (classData) => {
    setSelectedClassForDetails(classData);
    setShowViewDetails(true);
  };


  // Simple utility functions
  const getAvailableGrades = () => Array.from({ length: 13 }, (_, i) => i + 1);
  const getAvailableSections = () => ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  // Simple function to get class term ID
  const getClassTermId = (classItem) => {
    return typeof classItem.term_id === 'object' 
      ? classItem.term_id._id 
      : classItem.term_id;
  };

  // Realistic term status based on current date
  const getTermStatus = (term) => {
    const currentDate = new Date();
    const termStart = new Date(term.start_date);
    const termEnd = new Date(term.end_date);
    
    if (currentDate >= termStart && currentDate <= termEnd) {
      return 'current';
    } else if (currentDate > termEnd) {
      return 'past';
    } else {
      return 'future';
    }
  };

  // Get status badge for term
  const getStatusBadge = (status) => {
    switch (status) {
      case 'current':
        return '🟢 Current';
      case 'past':
        return '🔴 Past';
      case 'future':
        return '🟡 Future';
      default:
        return '⚪ Unknown';
    }
  };

  // Filter classes based on selected term
  const filteredClasses = selectedTerm 
    ? classes.filter(classItem => getClassTermId(classItem) === selectedTerm)
    : classes;

  return (
    <AdminLayout 
      pageTitle="Class Management" 
      pageDescription="Manage classes for terms"
    >
      {/* Alerts */}
      <div className="alerts-container">
        {alerts.map(alert => (
          <div key={alert.id} className={`alert alert-${alert.type}`}>
            {alert.message}
          </div>
        ))}
      </div>

      <div className="classes-container">

        {/* Header */}
        <div className="classes-header">
          <div className="header-left">
            <h1 className="page-main-title">Class Management</h1>
            <p>Create and manage classes for terms</p>
          </div>
          <div className="header-right">
            <button 
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              + Add Class
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="classes-filters">
          <div className="filter-group">
            <label htmlFor="term-filter">Filter by Term (Current Academic Year):</label>
            <select
              id="term-filter"
              value={selectedTerm}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedTerm(value);
                if (value) {
                  setSearchParams({ term_id: value });
                } else {
                  setSearchParams({});
                }
              }}
            >
              <option value="">All Current Year Terms</option>
              {currentTerms.map(term => (
                <option key={term._id} value={term._id}>
                  {getTermName(term)}
                </option>
              ))}
            </select>
          </div>
          {selectedTerm && (
            <div className="filter-info">
              <span className="filter-badge">
                Showing classes for: {getTermName(currentTerms.find(t => t._id === selectedTerm))}
              </span>
              <button 
                className="btn btn-sm btn-outline"
                onClick={() => {
                  setSelectedTerm('');
                  setSearchParams({});
                }}
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>

        {/* Bulk Term Assignment Section */}
        <div className="bulk-assignment-section">
          <div className="section-header">
            <h3>🔄 Bulk Term Assignment</h3>
            <p>Move all classes from one term to the next term automatically</p>
          </div>
          <div className="bulk-assignment-controls">
            <div className="filter-group">
              <label htmlFor="source-term">From Term:</label>
              <select
                id="source-term"
                value={bulkSourceTerm}
                onChange={(e) => handleSourceTermChange(e.target.value)}
              >
                {currentTerms.map(term => (
                  <option key={term._id} value={term._id}>
                    {getTermName(term)}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="target-term">To Term:</label>
              <select
                id="target-term"
                value={bulkTargetTerm}
                onChange={(e) => setBulkTargetTerm(e.target.value)}
                disabled={!bulkSourceTerm}
              >
                {availableTargetTerms.map(term => (
                  <option key={term._id} value={term._id}>
                    {getTermName(term)}
                  </option>
                ))}
              </select>
            </div>
            <button 
              className="btn btn-primary"
              onClick={handleBulkTermAssignment}
              disabled={!bulkSourceTerm || !bulkTargetTerm || bulkSourceTerm === bulkTargetTerm}
            >
              🔄 Move All Classes
            </button>
          </div>
        </div>

        {/* Classes Grid */}
        <div className="admin-classes-grid">
          {loading ? (
            <div className="loading">Loading classes...</div>
          ) : filteredClasses.length === 0 ? (
            <div className="no-data">
              <div className="no-data-icon">🏫</div>
              <h3>No Classes Found</h3>
              <p>{selectedTerm ? 'No classes found for the selected term' : 'Create your first class to get started'}</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowModal(true)}
              >
                Create Class
              </button>
            </div>
          ) : (
            filteredClasses.map(classData => {
              // Determine class status based on term using realistic logic
              const classTermId = typeof classData.term_id === 'object' 
                ? classData.term_id._id 
                : classData.term_id;
              const term = terms.find(t => t._id === classTermId);
              
              let classStatus = 'future';
              if (term) {
                classStatus = getTermStatus(term);
              }

              return (
                <div key={classData._id} className={`class-card ${classStatus}`}>
                  <div className="admin-classes-card-header">
                    <div className="admin-classes-card-title">
                      <span className="admin-classes-card-icon">🏫</span>
                      <h3 className="admin-classes-card-name">{classData.class_name}</h3>
                    </div>
                    <div className={`admin-classes-card-badge ${classStatus}`}>
                      {getStatusBadge(classStatus)}
                    </div>
                  </div>
                  
                  <div className="admin-classes-card-content">
                    <div className="admin-classes-card-info-grid">
                      <div className="admin-classes-card-info-item">
                        <div className="admin-classes-card-info-label">
                          <span className="admin-classes-card-info-icon">📚</span>
                          Grade
                        </div>
                        <div className="admin-classes-card-info-value">Grade {classData.grade}</div>
                      </div>
                      
                      <div className="admin-classes-card-info-item">
                        <div className="admin-classes-card-info-label">
                          <span className="admin-classes-card-info-icon">🔤</span>
                          Section
                        </div>
                        <div className="admin-classes-card-info-value">{classData.section}</div>
                      </div>
                      
                      <div className="admin-classes-card-info-item admin-classes-card-info-item-full">
                        <div className="admin-classes-card-info-label">
                          <span className="admin-classes-card-info-icon">📅</span>
                          Term
                        </div>
                        <div className="admin-classes-card-info-value">{getTermName(classData.term_id)}</div>
                      </div>
                      
                      <div className="admin-classes-card-info-item">
                        <div className="admin-classes-card-info-label">
                          <span className="admin-classes-card-info-icon">📖</span>
                          Subjects
                        </div>
                        <div className="admin-classes-card-info-value">
                          {(() => {
                            const termSubjects = subjects.filter(subject => {
                              const subjectTermId = typeof subject.term_id === 'object' 
                                ? subject.term_id._id 
                                : subject.term_id;
                              return subjectTermId === classTermId;
                            });
                            
                            const assignedSubjects = termSubjects.filter(subject => {
                              return classData.teacher_assignments?.some(assignment => {
                                const assignmentSubjectId = typeof assignment.subject_id === 'object' 
                                  ? assignment.subject_id._id 
                                  : assignment.subject_id;
                                return assignmentSubjectId === subject._id;
                              });
                            });
                            
                            return `${assignedSubjects.length}/${termSubjects.length}`;
                          })()}
                        </div>
                      </div>
                      
                      <div className="admin-classes-card-info-item">
                        <div className="admin-classes-card-info-label">
                          <span className="admin-classes-card-info-icon">👨‍🏫</span>
                          Teachers
                        </div>
                        <div className="admin-classes-card-info-value">{classData.teacher_assignments?.length || 0}</div>
                      </div>
                      
                      <div className="admin-classes-card-info-item">
                        <div className="admin-classes-card-info-label">
                          <span className="admin-classes-card-info-icon">👥</span>
                          Students
                        </div>
                        <div className="admin-classes-card-info-value">{classData.students?.length || 0}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="admin-classes-card-actions">
                    <div className="admin-classes-card-actions-row">
                      <button 
                        className="admin-classes-card-btn admin-classes-card-btn-subjects"
                        onClick={() => navigate('/admin/subjects', { 
                          state: { 
                            selectedClass: classData._id,
                            selectedClassName: classData.class_name,
                            selectedTerm: classTermId
                          } 
                        })}
                        title="Assign Subjects"
                      >
                        <span className="admin-classes-card-btn-icon">📚</span>
                        Subjects
                      </button>
                      
                      <button 
                        className="admin-classes-card-btn admin-classes-card-btn-teachers"
                        onClick={() => navigate('/admin/assignments', { 
                          state: { 
                            selectedClass: classData._id,
                            selectedClassName: classData.class_name 
                          } 
                        })}
                        title="Assign Users"
                      >
                        <span className="admin-classes-card-btn-icon">👥</span>
                        Users
                      </button>
                    </div>
                    
                    <div className="admin-classes-card-actions-row">
                      <button 
                        className="admin-classes-card-btn admin-classes-card-btn-view"
                        onClick={() => handleViewDetails(classData)}
                        title="View Details"
                      >
                        <span className="admin-classes-card-btn-icon">👁️</span>
                        View
                      </button>

                      <button 
                        className="admin-classes-card-btn admin-classes-card-btn-edit"
                        onClick={() => handleEdit(classData)}
                        title="Edit Class"
                      >
                        <span className="admin-classes-card-btn-icon">✏️</span>
                        Edit
                      </button>
                      
                      <button 
                        className="admin-classes-card-btn admin-classes-card-btn-danger"
                        onClick={() => handleDelete(classData._id)}
                        title="Delete Class"
                      >
                        <span className="admin-classes-card-btn-icon">🗑️</span>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Class Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>{editingClass ? 'Edit Class' : 'Add New Class'}</h3>
                <button className="close-btn" onClick={handleCloseModal}>×</button>
              </div>
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label htmlFor="term_id">Term (Current Academic Year) *</label>
                  <select
                    id="term_id"
                    name="term_id"
                    value={formData.term_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Term</option>
                    {currentTerms.map(term => (
                      <option key={term._id} value={term._id}>
                        {getTermName(term)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="grade">Grade *</label>
                    <select
                      id="grade"
                      name="grade"
                      value={formData.grade}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Grade</option>
                      {getAvailableGrades().map(grade => (
                        <option key={grade} value={grade}>
                          Grade {grade}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="section">Section *</label>
                    <select
                      id="section"
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Section</option>
                      {getAvailableSections().map(section => (
                        <option key={section} value={section}>
                          Section {section}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="class_name">Class Name *</label>
                  <input
                    type="text"
                    id="class_name"
                    name="class_name"
                    value={formData.class_name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 9A"
                  />
                  <small className="form-help">Class name is auto-generated from grade and section</small>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : (editingClass ? 'Update Class' : 'Create Class')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


        {/* View Details Modal */}
        {showViewDetails && selectedClassForDetails && (
          <div className="modal-overlay">
            <div className="modal modal-large">
              <div className="modal-header">
                <div className="modal-title-section">
                  <h3>👁️ Class Details - {selectedClassForDetails.class_name}</h3>
                  <p className="modal-subtitle">Complete information about this class</p>
                </div>
                <button className="close-btn" onClick={() => setShowViewDetails(false)}>×</button>
              </div>
              <div className="modal-content">
                {/* Class Information */}
                <div className="details-section">
                  <h4>📋 Class Information</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Class Name:</span>
                      <span className="detail-value">{selectedClassForDetails.class_name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Grade:</span>
                      <span className="detail-value">Grade {selectedClassForDetails.grade}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Section:</span>
                      <span className="detail-value">{selectedClassForDetails.section}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Term:</span>
                      <span className="detail-value">{getTermName(selectedClassForDetails.term_id)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Course Limit:</span>
                      <span className="detail-value">{selectedClassForDetails.course_limit || 0} periods</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span className="detail-value">
                        {(() => {
                          const classTermId = typeof selectedClassForDetails.term_id === 'object' 
                            ? selectedClassForDetails.term_id._id 
                            : selectedClassForDetails.term_id;
                          const term = terms.find(t => t._id === classTermId);
                          
                          if (term) {
                            const status = getTermStatus(term);
                            return getStatusBadge(status);
                          }
                          return '⚪ Unknown';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Class Teacher */}
                <div className="details-section">
                  <h4>👨‍🏫 Class Teacher</h4>
                  <div className="assignment-list">
                    {selectedClassForDetails.class_teacher ? (
                      <div className="assignment-item">
                        <div className="item-info">
                          <span className="item-name">{selectedClassForDetails.class_teacher.user_id?.name || 'Not Assigned'}</span>
                          <span className="item-details">Class Teacher</span>
                        </div>
                      </div>
                    ) : (
                      <div className="no-assignments">
                        <span>No class teacher assigned</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subject Assignments */}
                <div className="details-section">
                  <h4>📚 Subject Assignments</h4>
                  <div className="assignment-list">
                    {selectedClassForDetails.teacher_assignments && selectedClassForDetails.teacher_assignments.length > 0 ? (
                      selectedClassForDetails.teacher_assignments.map(assignment => (
                        <div key={assignment._id} className="assignment-item">
                          <div className="item-info">
                            <span className="item-name">{assignment.subject_id?.subject_name || 'Unknown Subject'}</span>
                            <span className="item-details">
                              Teacher: {assignment.user_id?.name || 'Unassigned'} | 
                              Periods: {assignment.course_limit || 0}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-assignments">
                        <span>No subject teachers assigned</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Student Count */}
                <div className="details-section">
                  <h4>👥 Students</h4>
                  <div className="assignment-list">
                    <div className="assignment-item">
                      <div className="item-info">
                        <span className="item-name">Total Students</span>
                        <span className="item-details">{selectedClassForDetails.students?.length || 0} students enrolled</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="details-section">
                  <h4>📊 Quick Statistics</h4>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <span className="stat-number">{selectedClassForDetails.teacher_assignments?.length || 0}</span>
                      <span className="stat-label">Subject Teachers</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-number">{selectedClassForDetails.students?.length || 0}</span>
                      <span className="stat-label">Students</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-number">
                        {(() => {
                          const classTermId = typeof selectedClassForDetails.term_id === 'object' 
                            ? selectedClassForDetails.term_id._id 
                            : selectedClassForDetails.term_id;
                          
                          const termSubjects = subjects.filter(subject => {
                            const subjectTermId = typeof subject.term_id === 'object' 
                              ? subject.term_id._id 
                              : subject.term_id;
                            return subjectTermId === classTermId;
                          });
                          
                          const assignedSubjects = termSubjects.filter(subject => {
                            return selectedClassForDetails.teacher_assignments?.some(assignment => {
                              const assignmentSubjectId = typeof assignment.subject_id === 'object' 
                                ? assignment.subject_id._id 
                                : assignment.subject_id;
                              return assignmentSubjectId === subject._id;
                            });
                          });
                          
                          return `${assignedSubjects.length}/${termSubjects.length}`;
                        })()}
                      </span>
                      <span className="stat-label">Subjects Assigned</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <div className="modal-actions">
                  <button 
                    className="btn btn-outline"
                    onClick={() => setShowViewDetails(false)}
                  >
                    Close Details
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setShowViewDetails(false);
                      handleEdit(selectedClassForDetails);
                    }}
                  >
                    Edit Class
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminClasses;