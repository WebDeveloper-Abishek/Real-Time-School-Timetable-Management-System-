import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../Components/AdminLayout/AdminLayout';
import { academicYearAPI, termsAPI } from '../../../services/api';
import './AdminTerms.css';

const AdminTerms = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [terms, setTerms] = useState([]);
  const [filteredTerms, setFilteredTerms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [termFilter, setTermFilter] = useState('All');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTermDetails, setSelectedTermDetails] = useState(null);
  const [isModalOpening, setIsModalOpening] = useState(false);
  const [formData, setFormData] = useState({
    academic_year_id: '',
    term_number: '',
    start_date: '',
    end_date: ''
  });

  const addAlert = useCallback((message, type = 'success') => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 5000);
  }, []);

  const fetchAcademicYears = useCallback(async () => {
    try {
      const data = await academicYearAPI.getAcademicYears();
      setAcademicYears(data || []);
    } catch (error) {
      console.error('Error fetching academic years:', error);
      addAlert('Error fetching academic years', 'error');
    }
  }, [addAlert]);

  // ✅ Fetch Terms
  const fetchTerms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await termsAPI.getTerms();
      setTerms(data || []);
    } catch (error) {
      console.error('Error fetching terms:', error);
      addAlert('Error fetching terms', 'error');
    } finally {
      setLoading(false);
    }
  }, [addAlert]);

  // ✅ Initial load + refresh when coming back to page
  useEffect(() => {
    fetchAcademicYears();
    fetchTerms();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchAcademicYears();
        fetchTerms();
      }
    };

    const handleFocus = () => {
      fetchAcademicYears();
      fetchTerms();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchAcademicYears, fetchTerms]);

  // ✅ Update selected year from URL params
  useEffect(() => {
    const academicYearId = searchParams.get('academic_year_id');
    if (academicYearId) setSelectedYear(academicYearId);
  }, [searchParams]);

  // Simple filter functions
  const filterByYear = (terms, yearId) => {
    return terms.filter(term => {
      const termYearId = typeof term.academic_year_id === 'string' 
        ? term.academic_year_id 
        : term.academic_year_id?._id;
      return termYearId === yearId;
    });
  };

  const filterByStatus = (terms, status) => {
    const now = new Date();
    
    if (status === 'Current') {
      return terms.filter(term => {
        const start = new Date(term.start_date);
        const end = new Date(term.end_date);
        return now >= start && now <= end;
      });
    }
    
    if (status === 'Previous') {
      return terms.filter(term => {
        const end = new Date(term.end_date);
        return now > end;
      });
    }
    
    if (status === 'Next') {
      return terms.filter(term => {
        const start = new Date(term.start_date);
        return now < start;
      });
    }
    
    return terms;
  };

  // Apply all filters
  useEffect(() => {
    let filtered = terms;
    
    if (selectedYear) {
      filtered = filterByYear(filtered, selectedYear);
    }
    
    if (termFilter !== 'All') {
      filtered = filterByStatus(filtered, termFilter);
    }
    
    setFilteredTerms(filtered);
  }, [terms, selectedYear, termFilter]);


  // ✅ Utility functions
  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const getTermName = (num) =>
    ({ 1: 'First Term', 2: 'Second Term', 3: 'Third Term' }[num] ||
      `Term ${num}`);

  const getAcademicYearName = (yearId) => {
    const year = academicYears.find(
      (y) =>
        y._id ===
        (typeof yearId === 'string' ? yearId : yearId?._id || 'unknown')
    );
    return year ? year.year_label : 'Unknown Year';
  };

  // Simple date calculation functions
  const getTermDates = (termNumber, academicYear) => {
    const year = new Date(academicYear.start_date).getFullYear();
    
    switch (parseInt(termNumber)) {
      case 1:
        return {
          start: academicYear.start_date,
          end: `${year}-04-30`
        };
      case 2:
        return {
          start: `${year}-05-01`,
          end: `${year}-08-31`
        };
      case 3:
        return {
          start: `${year}-09-01`,
          end: academicYear.end_date
        };
      default:
        return { start: '', end: '' };
    }
  };

  const resetFormFields = () => {
    return {
      term_number: '',
      start_date: '',
      end_date: ''
    };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'academic_year_id') {
      // Reset form when academic year changes
      setFormData(prev => ({
        ...prev,
        [name]: value,
        ...resetFormFields()
      }));
    } else if (name === 'term_number' && value && formData.academic_year_id) {
      // Auto-fill dates when term number is selected
      const selectedYear = academicYears.find(year => year._id === formData.academic_year_id);
      if (selectedYear) {
        const dates = getTermDates(value, selectedYear);
        setFormData(prev => ({
          ...prev,
          [name]: value,
          start_date: dates.start,
          end_date: dates.end
        }));
      }
    } else {
      // Regular field update
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Simple validation functions
  const validateForm = () => {
    if (!formData.academic_year_id) {
      addAlert('Please select an academic year', 'error');
      return false;
    }
    if (!formData.term_number) {
      addAlert('Please select a term number', 'error');
      return false;
    }
    if (!formData.start_date || !formData.end_date) {
      addAlert('Please provide valid dates', 'error');
      return false;
    }
    
    const termNumber = parseInt(formData.term_number, 10);
    if (termNumber < 1 || termNumber > 3) {
      addAlert('Term number must be between 1 and 3', 'error');
      return false;
    }
    
    return true;
  };

  const resetForm = () => {
    setFormData({ academic_year_id: '', term_number: '', start_date: '', end_date: '' });
    setEditingTerm(null);
    setShowModal(false);
  };

  const saveTerm = async () => {
    if (editingTerm) {
      return await termsAPI.updateTerm(editingTerm._id, formData);
    } else {
      return await termsAPI.createTerm(formData);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      const data = await saveTerm();
      addAlert(data.message || 'Term saved successfully', 'success');
      resetForm();
      fetchTerms();
    } catch (err) {
      console.error('Error saving term:', err);
      addAlert('Error saving term', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (term) => {
    setEditingTerm(term);
    setFormData({
      academic_year_id: term.academic_year_id._id || term.academic_year_id,
      term_number: term.term_number.toString(),
      start_date: term.start_date ? new Date(term.start_date).toISOString().split('T')[0] : '',
      end_date: term.end_date ? new Date(term.end_date).toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this term?')) return;
    try {
      const data = await termsAPI.deleteTerm(id);
      addAlert(data.message || 'Term deleted', 'success');
      fetchTerms();
    } catch (err) {
      console.error('Error deleting:', err);
      addAlert('Error deleting term', 'error');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTerm(null);
    setFormData({ academic_year_id: '', term_number: '', start_date: '', end_date: '' });
  };


  const getTermYearId = (term) => {
    return typeof term.academic_year_id === 'string' 
      ? term.academic_year_id 
      : term.academic_year_id?._id;
  };

  const getAvailableTermNumbers = (academicYearId) => {
    if (!academicYearId) return [1, 2, 3];
    
    const existingTerms = terms.filter(term => 
      getTermYearId(term) === academicYearId
    );
    
    const usedNumbers = existingTerms.map(term => term.term_number);
    return [1, 2, 3].filter(num => !usedNumbers.includes(num));
  };

  const getTermStatus = (term) => {
    const now = new Date();
    const startDate = new Date(term.start_date);
    const endDate = new Date(term.end_date);
    
    if (now >= startDate && now <= endDate) return 'current';
    if (now > endDate) return 'past';
    if (now < startDate) return 'future';
    return 'unknown';
  };

  const openDetailsModal = (term) => {
    if (showDetailsModal || isModalOpening) return;
    
    setIsModalOpening(true);
    setSelectedTermDetails(term);
    setShowDetailsModal(true);
    
    setTimeout(() => setIsModalOpening(false), 300);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedTermDetails(null);
    setIsModalOpening(false);
  };

  const handleModalClick = (e) => {
    if (e.target === e.currentTarget) {
      closeDetailsModal();
    }
  };

  return (
    <AdminLayout 
      pageTitle="Term Management" 
      pageDescription="Manage terms for academic years"
    >
      {/* Alerts */}
      <div className="terms-alerts-container">
        {alerts.map(alert => (
          <div key={alert.id} className={`terms-alert terms-alert-${alert.type}`}>
            {alert.message}
          </div>
        ))}
      </div>

      <div className="terms-container">

        {/* Header */}
        <div className="terms-page-header">
          <div className="terms-header-left">
            <h1 className="terms-page-title">Term Management</h1>
            <p className="terms-page-description">Create and manage terms for academic years (Maximum 3 terms per year)</p>
          </div>
          <div className="terms-header-right">
            <button 
              className="terms-management-btn terms-management-btn-primary"
              onClick={() => setShowModal(true)}
            >
              + Add Term
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="terms-filters">
          <div className="terms-filters-left">
            <div className="filter-group">
              <label htmlFor="academic-year-filter">Filter by Academic Year:</label>
              <select
                id="academic-year-filter"
                value={selectedYear}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedYear(value);
                  // Update URL parameters
                  if (value) {
                    setSearchParams({ academic_year_id: value });
                  } else {
                    setSearchParams({});
                  }
                }}
              >
                <option value="">All Academic Years</option>
                {academicYears.map(year => (
                  <option key={year._id} value={year._id}>
                    {year.year_label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="term-filter">Filter by Term:</label>
              <select
                id="term-filter"
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value)}
              >
                <option value="All">All Terms</option>
                <option value="Current">Current Term</option>
                <option value="Previous">Previous Terms</option>
                <option value="Next">Next Terms</option>
              </select>
            </div>
            
            {termFilter !== 'All' && (
              <div className="filter-info">
                <span className="filter-badge">
                  Showing {termFilter.toLowerCase()} terms ({filteredTerms.length} found)
                </span>
                <button 
                  className="terms-management-btn terms-management-btn-sm terms-management-btn-outline"
                  onClick={() => setTermFilter('All')}
                >
                  Clear Filter
                </button>
              </div>
            )}
          </div>
          
          {/* Filter Statistics */}
          <div className="terms-filter-stats">
            <div className="terms-stat-item">
              <span className="terms-stat-number">{filteredTerms.length}</span>
              <span className="terms-stat-label">Terms</span>
            </div>
            <div className="terms-stat-item">
              <span className="terms-stat-number">{academicYears.length}</span>
              <span className="terms-stat-label">Academic Years</span>
            </div>
            {selectedYear && (
              <div className="terms-stat-item">
                <span className="terms-stat-number">{filteredTerms.length}</span>
                <span className="terms-stat-label">Filtered</span>
              </div>
            )}
          </div>
        </div>

        {/* Terms Grid */}
        <div className="terms-grid">
          {loading ? (
            <div className="terms-loading">Loading terms...</div>
          ) : filteredTerms.length === 0 ? (
            <div className="terms-no-data">
              <div className="terms-no-data-icon">📚</div>
              <h3>No Terms Found</h3>
              <p>{selectedYear ? 'No terms found for the selected academic year' : 'Create your first term to get started'}</p>
              <button 
                className="terms-management-btn terms-management-btn-primary"
                onClick={() => setShowModal(true)}
              >
                Create Term
              </button>
            </div>
          ) : (
            filteredTerms.map(term => {
              const termStatus = getTermStatus(term);
              return (
                <div key={term._id} className={`terms-card ${termStatus}`}>
                <div className="terms-card-header">
                  <h3 className="terms-card-title">{getTermName(term.term_number)}</h3>
                    {termStatus === 'current' && (
                      <span className="status-badge current-badge">Current</span>
                    )}
                    {termStatus === 'past' && (
                      <span className="status-badge completed-badge">Completed</span>
                    )}
                    {termStatus === 'future' && (
                      <span className="status-badge upcoming-badge">Upcoming</span>
                  )}
                </div>
                <div className="terms-card-content">
                  <div className="terms-academic-year">
                    <span className="terms-year-label">Academic Year:</span>
                    <span className="terms-year-value">{getAcademicYearName(term.academic_year_id)}</span>
                  </div>
                  <div className="terms-date-range">
                    <div className="terms-date-item">
                      <span className="terms-date-label">Start Date:</span>
                      <span className="terms-date-value">{formatDate(term.start_date)}</span>
                    </div>
                    <div className="terms-date-item">
                      <span className="terms-date-label">End Date:</span>
                      <span className="terms-date-value">{formatDate(term.end_date)}</span>
                    </div>
                  </div>
                  
                    </div>
                  <div className="terms-card-actions">
                    {/* Past terms - only View Details and Delete */}
                    {termStatus === 'past' && (
                      <>
                        <button 
                          className="terms-management-btn terms-management-btn-sm terms-management-btn-info"
                          onClick={() => openDetailsModal(term)}
                          disabled={isModalOpening}
                        >
                          {isModalOpening ? 'Loading...' : 'View Details'}
                        </button>
                        <button 
                          className="terms-management-btn terms-management-btn-sm terms-management-btn-danger"
                          onClick={() => handleDelete(term._id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                    
                    {/* Current term - all buttons */}
                    {termStatus === 'current' && (
                      <>
                  <button 
                          className="terms-management-btn terms-management-btn-sm terms-management-btn-assign"
                    onClick={() => navigate(`/admin/classes?term_id=${term._id}`)}
                  >
                    View Classes
                  </button>
                  <button 
                          className="terms-management-btn terms-management-btn-sm terms-management-btn-outline"
                    onClick={() => handleEdit(term)}
                  >
                    Edit
                  </button>
                  <button 
                          className="terms-management-btn terms-management-btn-sm terms-management-btn-danger"
                          onClick={() => handleDelete(term._id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                    
                    {/* Future terms - only locked buttons and Delete */}
                    {termStatus === 'future' && (
                      <>
                        <button 
                          className="terms-management-btn terms-management-btn-sm terms-management-btn-assign locked"
                          disabled
                          title="Not available for future terms"
                        >
                          View Classes
                        </button>
                        <button 
                          className="terms-management-btn terms-management-btn-sm terms-management-btn-outline locked"
                          disabled
                          title="Not available for future terms"
                        >
                          Edit
                        </button>
                        <button 
                          className="terms-management-btn terms-management-btn-sm terms-management-btn-danger"
                    onClick={() => handleDelete(term._id)}
                  >
                    Delete
                  </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Term Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>{editingTerm ? 'Edit Term' : 'Add New Term'}</h3>
                <button className="close-btn" onClick={handleCloseModal}>×</button>
              </div>
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label htmlFor="academic_year_id">Academic Year *</label>
                  <select
                    id="academic_year_id"
                    name="academic_year_id"
                    value={formData.academic_year_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map(year => (
                      <option key={year._id} value={year._id}>
                        {year.year_label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="term_number">Term Number *</label>
                  <select
                    id="term_number"
                    name="term_number"
                    value={formData.term_number}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.academic_year_id}
                  >
                    <option value="">Select Term</option>
                    {editingTerm ? (
                      // When editing, show current term and available terms
                      <>
                        <option value={editingTerm.term_number}>
                          {getTermName(editingTerm.term_number)} (Current)
                        </option>
                        {getAvailableTermNumbers(formData.academic_year_id)
                          .filter(num => num !== editingTerm.term_number)
                          .map(num => (
                            <option key={num} value={num}>
                              {getTermName(num)}
                            </option>
                          ))
                        }
                      </>
                    ) : (
                      // When creating new term, show only available terms
                      getAvailableTermNumbers(formData.academic_year_id).map(num => (
                        <option key={num} value={num}>
                          {getTermName(num)}
                        </option>
                      ))
                    )}
                  </select>
                  {!formData.academic_year_id && (
                    <small className="terms-form-help">Please select an academic year first</small>
                  )}
                  {formData.academic_year_id && getAvailableTermNumbers(formData.academic_year_id).length === 0 && !editingTerm && (
                    <div className="terms-max-terms-alert">
                      <div className="terms-alert-icon">⚠️</div>
                      <div className="terms-alert-content">
                        <strong>Maximum Terms Reached</strong>
                        <p>This academic year already has all 3 terms. You cannot create more terms for this academic year.</p>
                      </div>
                    </div>
                  )}
                  {formData.academic_year_id && formData.term_number && (
                    <small className="terms-form-help terms-form-help-info">
                      Term {formData.term_number} dates will be set automatically based on academic year
                    </small>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="start_date">Start Date *</label>
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="end_date">End Date *</label>
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                {/* Class Assignment Section - Only show when editing */}
                {editingTerm && (
                  <div className="class-assignment-section">
                    <h4>Class Assignments</h4>
                    <p className="section-description">
                      Assign classes to this term. Classes can be created and managed from the Classes page.
                    </p>
                    <div className="class-assignment-info">
                      <div className="info-item">
                        <span className="info-label">Current Classes:</span>
                        <span className="info-value">{editingTerm.classes?.length || 0} classes</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Action:</span>
                        <span className="info-value">
                          <button 
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={() => navigate(`/admin/classes?term_id=${editingTerm._id}`)}
                          >
                            Manage Classes
                          </button>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="modal-actions">
                  <button type="button" className="terms-management-btn terms-management-btn-outline" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="terms-management-btn terms-management-btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : (editingTerm ? 'Update Term' : 'Create Term')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {showDetailsModal && selectedTermDetails && (
          <div className="modal-overlay" onClick={handleModalClick}>
            <div className="modal details-modal" onClick={(e) => e.stopPropagation()}>
              <div className="details-modal-header">
                <div className="header-content">
                  <div className="term-icon">📚</div>
                  <div className="header-text22">
                    <h3>Term Details</h3>
                    <p>{getTermName(selectedTermDetails.term_number)} - {getAcademicYearName(selectedTermDetails.academic_year_id)}</p>
                  </div>
                </div>
                <button 
                  className="close-btn" 
                  onClick={closeDetailsModal}
                  type="button"
                >
                  ×
                </button>
              </div>
              
              <div className="details-modal-body">
                <div className="term-overview">
                  <div className="overview-card">
                    <div className="card-header">
                      <h4>Term Information</h4>
                      <span className="status-badge completed-badge">Completed</span>
                    </div>
                    <div className="card-content">
                      <div className="info-row">
                        <div className="info-item">
                          <span className="info-label1">Start Date</span>
                          <span className="info-value1">{formatDate(selectedTermDetails.start_date)}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label1">End Date</span>
                          <span className="info-value1">{formatDate(selectedTermDetails.end_date)}</span>
                        </div>
                      </div>
                      <div className="info-row">
                        <div className="info-item">
                          <span className="info-label1">Academic Year</span>
                          <span className="info-value1">{getAcademicYearName(selectedTermDetails.academic_year_id)}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label1">Term Number</span>
                          <span className="info-value1">{selectedTermDetails.term_number}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="details-modal-footer">
                <button 
                  type="button" 
                  className="terms-management-btn terms-management-btn-primary" 
                  onClick={closeDetailsModal}
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTerms;
