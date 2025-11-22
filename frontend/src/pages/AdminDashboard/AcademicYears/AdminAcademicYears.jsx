import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../Components/AdminLayout/AdminLayout';
import { academicYearAPI } from '../../../services/api';
import './AdminAcademicYears.css';

const AdminAcademicYears = () => {
  const navigate = useNavigate();
  const [academicYears, setAcademicYears] = useState([]);
  const [filteredYears, setFilteredYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [yearFilter, setYearFilter] = useState('All');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedYearDetails, setSelectedYearDetails] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [yearToDelete, setYearToDelete] = useState(null);
  const [formData, setFormData] = useState({
    year_label: '',
    start_date: '',
    end_date: ''
  });

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

  const fetchAcademicYears = useCallback(async () => {
    setLoading(true);
    try {
      const data = await academicYearAPI.getAcademicYears();
      if (Array.isArray(data)) {
        setAcademicYears(data);
      } else {
        console.warn('Invalid data format received:', data);
        setAcademicYears([]);
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
      if (navigator.onLine) {
        showMessage('Error fetching academic years: ' + (error.message || 'Unknown error'), 'error');
      }
      setAcademicYears([]);
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchAcademicYears();
  }, [fetchAcademicYears]);

  // Filter academic years based on selected filter
  useEffect(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    let filtered = academicYears;
    
    switch (yearFilter) {
      case 'Current':
        filtered = academicYears.filter(year => {
          const startYear = new Date(year.start_date).getFullYear();
          const endYear = new Date(year.end_date).getFullYear();
          return startYear <= currentYear && endYear >= currentYear;
        });
        break;
      case 'Previous':
        filtered = academicYears.filter(year => {
          const endYear = new Date(year.end_date).getFullYear();
          return endYear < currentYear;
        });
        break;
      case 'Next':
        filtered = academicYears.filter(year => {
          const startYear = new Date(year.start_date).getFullYear();
          return startYear > currentYear;
        });
        break;
      default:
        filtered = academicYears;
    }
    
    setFilteredYears(filtered);
  }, [academicYears, yearFilter]);

  // Refresh data when component becomes visible (when navigating back)
  useEffect(() => {
    let refreshTimeout;
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Debounce the refresh to prevent multiple rapid calls
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
          fetchAcademicYears();
        }, 500);
      }
    };

    const handleFocus = () => {
      // Only refresh if we haven't refreshed recently
      const lastRefresh = localStorage.getItem('lastAcademicYearRefresh');
      const now = Date.now();
      if (!lastRefresh || now - parseInt(lastRefresh) > 30000) { // 30 seconds
        fetchAcademicYears();
        localStorage.setItem('lastAcademicYearRefresh', now.toString());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearTimeout(refreshTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchAcademicYears]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'start_date' && value) {
      // Automatically set end date to December 31st of the same year
      const startDate = new Date(value);
      const endDate = new Date(startDate.getFullYear(), 11, 31); // December 31st
      const endDateString = endDate.toISOString().split('T')[0];
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        end_date: endDateString
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation: Check if academic year label is provided
      if (!formData.year_label.trim()) {
        showMessage('Academic year label is required', 'error');
        setLoading(false);
        return;
      }

      // Validation: Check if dates are provided
      if (!formData.start_date || !formData.end_date) {
        showMessage('Start date and end date are required', 'error');
        setLoading(false);
        return;
      }

      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      // Validation: Check if start date is before end date
      if (startDate >= endDate) {
        showMessage('End date must be after start date', 'error');
        setLoading(false);
        return;
      }

      // Validation: Check if start date is after January 1st
      const startYear = startDate.getFullYear();
      const janFirst = new Date(startYear, 0, 1); // January 1st
      if (startDate < janFirst) {
        showMessage('Start date must be on or after January 1st', 'error');
        setLoading(false);
        return;
      }

      // Validation: Check if end date is within December 31st of the same year
      const endYear = endDate.getFullYear();
      const decThirtyFirst = new Date(endYear, 11, 31); // December 31st
      if (endDate > decThirtyFirst) {
        showMessage('End date must be on or before December 31st', 'error');
        setLoading(false);
        return;
      }

      // Validation: Check if start and end dates are in the same year
      if (startYear !== endYear) {
        showMessage('Start date and end date must be in the same year', 'error');
        setLoading(false);
        return;
      }

      
      if (!editingYear) {
        const overlappingYear = academicYears.find(year => {
          const existingStart = new Date(year.start_date);
          const existingEnd = new Date(year.end_date);
          
          return (startDate >= existingStart && startDate <= existingEnd) ||
                 (endDate >= existingStart && endDate <= existingEnd) ||
                 (startDate <= existingStart && endDate >= existingEnd);
        });

        if (overlappingYear) {
          showMessage(`Academic year overlaps with existing year: ${overlappingYear.year_label}`, 'error');
          setLoading(false);
          return;
        }
      }

      const data = editingYear 
        ? await academicYearAPI.updateAcademicYear(editingYear._id, formData)
        : await academicYearAPI.createAcademicYear(formData);

      showMessage(data.message || 'Academic year saved successfully', 'success');
      setShowModal(false);
      setEditingYear(null);
      setFormData({ year_label: '', start_date: '', end_date: '' });
      fetchAcademicYears();
    } catch (error) {
      console.error('Error saving academic year:', error);
      showMessage('Error saving academic year: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (year) => {
    setEditingYear(year);
    setFormData({
      year_label: year.year_label,
      start_date: year.start_date ? new Date(year.start_date).toISOString().split('T')[0] : '',
      end_date: year.end_date ? new Date(year.end_date).toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDeleteClick = (year) => {
    setYearToDelete(year);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!yearToDelete) return;

    setLoading(true);
    try {
      const data = await academicYearAPI.deleteAcademicYear(yearToDelete._id);
      showMessage(data.message || 'Academic year deleted successfully', 'success');
      setShowDeleteModal(false);
      setYearToDelete(null);
      fetchAcademicYears();
    } catch (error) {
      console.error('Error deleting academic year:', error);
      showMessage('Error deleting academic year: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setYearToDelete(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingYear(null);
    setFormData({ year_label: '', start_date: '', end_date: '' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isCurrentYear = (year) => {
    const now = new Date();
    const startDate = new Date(year.start_date);
    const endDate = new Date(year.end_date);
    return now >= startDate && now <= endDate;
  };

  const isPastYear = (year) => {
    const now = new Date();
    const endDate = new Date(year.end_date);
    return now > endDate;
  };

  const isFutureYear = (year) => {
    const now = new Date();
    const startDate = new Date(year.start_date);
    return now < startDate;
  };

  const getYearStatus = (year) => {
    if (isCurrentYear(year)) return 'current';
    if (isPastYear(year)) return 'past';
    if (isFutureYear(year)) return 'future';
    return 'unknown';
  };

  const handleViewTerms = (yearId) => {
    navigate(`/admin/terms?academic_year_id=${yearId}`);
  };

  const handleViewDetails = (year) => {
    setSelectedYearDetails(year);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedYearDetails(null);
  };

  return (
    <AdminLayout 
      pageTitle="Academic Year Management" 
      pageDescription="Manage academic years and terms"
    >
      {/* Alerts */}
      <div className="alerts-container">
        {alerts.map(alert => (
          <div key={alert.id} className={`alert alert-${alert.type}`}>
            {alert.message}
          </div>
        ))}
      </div>

      <div className="academic-years-container">

        {/* Header */}
        <div className="academic-years-header">
          <div className="header-left">
            <h1 className="page-main-title">Academic Year Management</h1>
            <p>Create and manage academic years for your school</p>
          </div>
          <div className="header-right">
            <button 
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              + Add Academic Year
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="academic-years-filters">
          <div className="filter-group">
            <label htmlFor="year-filter">Filter by Year:</label>
            <select
              id="year-filter"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="All">All Years</option>
              <option value="Current">Current Year</option>
              <option value="Previous">Previous Years</option>
              <option value="Next">Next Years</option>
            </select>
          </div>
          {yearFilter !== 'All' && (
            <div className="filter-info">
              <span className="filter-badge">
                Showing {yearFilter.toLowerCase()} years ({filteredYears.length} found)
              </span>
              <button 
                className="btn btn-sm btn-outline"
                onClick={() => setYearFilter('All')}
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>

        {/* Academic Years Grid */}
        <div className="admin-academic-years-grid">
          {loading ? (
            <div className="admin-academic-years-loading">Loading academic years...</div>
          ) : filteredYears.length === 0 ? (
            <div className="admin-academic-years-no-data">
              <div className="admin-academic-years-no-data-icon">📅</div>
              <h3>No Academic Years Found</h3>
              <p>{yearFilter !== 'All' ? `No ${yearFilter.toLowerCase()} years found` : 'Create your first academic year to get started'}</p>
              {yearFilter === 'All' && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowModal(true)}
                >
                  Create Academic Year
                </button>
              )}
            </div>
          ) : (
            filteredYears.map(year => {
              const yearStatus = getYearStatus(year);
              return (
                <div key={year._id} className={`admin-academic-years-card admin-academic-years-card-${yearStatus}`}>
                  <div className="admin-academic-years-card-header">
                    <div className="admin-academic-years-card-title">
                      <span className="admin-academic-years-card-icon">🎓</span>
                      <h3 className="admin-academic-years-card-year-label">{year.year_label}</h3>
                    </div>
                    <div className="admin-academic-years-card-status">
                      {yearStatus === 'current' && (
                        <span className="admin-academic-years-card-badge admin-academic-years-card-badge-current">Current</span>
                      )}
                      {yearStatus === 'past' && (
                        <span className="admin-academic-years-card-badge admin-academic-years-card-badge-completed">Completed</span>
                      )}
                      {yearStatus === 'future' && (
                        <span className="admin-academic-years-card-badge admin-academic-years-card-badge-upcoming">Upcoming</span>
                      )}
                    </div>
                  </div>

                  <div className="admin-academic-years-card-content">
                    <div className="admin-academic-years-card-date-range">
                      <div className="admin-academic-years-card-date-item">
                        <span className="admin-academic-years-card-date-label">
                          <span className="admin-academic-years-card-date-icon">📅</span>
                          Start Date:
                        </span>
                        <span className="admin-academic-years-card-date-value">{formatDate(year.start_date)}</span>
                      </div>
                      <div className="admin-academic-years-card-date-item">
                        <span className="admin-academic-years-card-date-label">
                          <span className="admin-academic-years-card-date-icon">📅</span>
                          End Date:
                        </span>
                        <span className="admin-academic-years-card-date-value">{formatDate(year.end_date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="admin-academic-years-card-actions">
                    <button 
                      className="admin-academic-years-card-btn admin-academic-years-card-btn-terms"
                      onClick={() => handleViewTerms(year._id)}
                    >
                      <span className="admin-academic-years-card-btn-icon">📋</span>
                      View Terms
                    </button>
                    
                    {yearStatus === 'past' && (
                      <>
                        <button 
                          className="admin-academic-years-card-btn admin-academic-years-card-btn-info"
                          onClick={() => handleViewDetails(year)}
                        >
                          <span className="admin-academic-years-card-btn-icon">ℹ️</span>
                          View Details
                        </button>
                        <button 
                          className="admin-academic-years-card-btn admin-academic-years-card-btn-danger"
                          onClick={() => handleDeleteClick(year)}
                        >
                          <span className="admin-academic-years-card-btn-icon">🗑️</span>
                          Delete
                        </button>
                      </>
                    )}
                    
                    {yearStatus === 'current' && (
                      <>
                        <button 
                          className="admin-academic-years-card-btn admin-academic-years-card-btn-edit"
                          onClick={() => handleEdit(year)}
                        >
                          <span className="admin-academic-years-card-btn-icon">✏️</span>
                          Edit
                        </button>
                        <button 
                          className="admin-academic-years-card-btn admin-academic-years-card-btn-danger"
                          onClick={() => handleDeleteClick(year)}
                        >
                          <span className="admin-academic-years-card-btn-icon">🗑️</span>
                          Delete
                        </button>
                      </>
                    )}
                    
                    {yearStatus === 'future' && (
                      <>
                        <button 
                          className="admin-academic-years-card-btn admin-academic-years-card-btn-edit admin-academic-years-card-btn-locked"
                          disabled
                          title="Not available for future years"
                        >
                          <span className="admin-academic-years-card-btn-icon">✏️</span>
                          Edit
                        </button>
                        <button 
                          className="admin-academic-years-card-btn admin-academic-years-card-btn-danger"
                          onClick={() => handleDeleteClick(year)}
                        >
                          <span className="admin-academic-years-card-btn-icon">🗑️</span>
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

        {/* Academic Year Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>{editingYear ? 'Edit Academic Year' : 'Add New Academic Year'}</h3>
                <button className="close-btn" onClick={handleCloseModal}>×</button>
              </div>
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label htmlFor="year_label">Academic Year Label *</label>
                  <input
                    type="text"
                    id="year_label"
                    name="year_label"
                    value={formData.year_label}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 2024-2025"
                    pattern="[0-9]{4}-[0-9]{4}"
                    title="Please enter in format: YYYY-YYYY (e.g., 2024-2025)"
                  />
                  <small className="form-help">
                    Enter the academic year in format: YYYY-YYYY
                  </small>
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
                      min={new Date().getFullYear() + '-01-01'}
                    />
                    <small className="form-help">
                      Academic year start date
                    </small>
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
                      min={formData.start_date || new Date().getFullYear() + '-01-02'}
                    />
                    <small className="form-help">
                      Academic year end date
                    </small>
                  </div>
                </div>
                
                {/* Duration Display */}
                {formData.start_date && formData.end_date && (
                  <div className="form-info">
                    <div className="info-item">
                      <span className="info-label">Duration:</span>
                      <span className="info-value">
                        {(() => {
                          const start = new Date(formData.start_date);
                          const end = new Date(formData.end_date);
                          const diffTime = Math.abs(end - start);
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          const months = Math.floor(diffDays / 30);
                          return `${diffDays} days (${months} months)`;
                        })()}
                      </span>
                    </div>
                  </div>
                )}
                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : (editingYear ? 'Update Academic Year' : 'Create Academic Year')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {showDetailsModal && selectedYearDetails && (
          <div className="modal-overlay">
            <div className="modal details-modal">
              <div className="details-modal-header">
                <div className="header-content">
                  <div className="year-icon">🎓</div>
                  <div className="header-text1">
                    <h3>Academic Year Details</h3>
                    <p>{selectedYearDetails.year_label}</p>
                  </div>
                </div>
                <button className="close-btn" onClick={handleCloseDetailsModal}>×</button>
              </div>
              
              <div className="details-modal-body">
                <div className="year-overview">
                  <div className="overview-card">
                    <div className="card-header">
                      <h4>Year Information</h4>
                      <span className="status-badge completed-badge">Completed</span>
                    </div>
                    <div className="card-content">
                      <div className="info-row">
                        <div className="info-item">
                          <span className="info-label1">Start Date</span>
                          <span className="info-value1">{formatDate(selectedYearDetails.start_date)}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label1">End Date</span>
                          <span className="info-value1">{formatDate(selectedYearDetails.end_date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="terms-section">
                  <div className="section-header">
                    <h4>Academic Terms</h4>
                    <span className="terms-count">3 Terms</span>
                  </div>
                  <div className="terms-grid">
                    <div className="term-card">
                      <div className="term-header">
                        <span className="term-number">Term 1</span>
                        <span className="term-status completed">Completed</span>
                      </div>
                      <div className="term-dates">January 2 - March 31, 2024</div>
                      <div className="term-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{width: '100%'}}></div>
                        </div>
                        <span className="progress-text">100% Complete</span>
                      </div>
                    </div>
                    
                    <div className="term-card">
                      <div className="term-header">
                        <span className="term-number">Term 2</span>
                        <span className="term-status completed">Completed</span>
                      </div>
                      <div className="term-dates">April 1 - June 30, 2024</div>
                      <div className="term-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{width: '100%'}}></div>
                        </div>
                        <span className="progress-text">100% Complete</span>
                      </div>
                    </div>
                    
                    <div className="term-card">
                      <div className="term-header">
                        <span className="term-number">Term 3</span>
                        <span className="term-status completed">Completed</span>
                      </div>
                      <div className="term-dates">July 1 - September 30, 2024</div>
                      <div className="term-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{width: '100%'}}></div>
                        </div>
                        <span className="progress-text">100% Complete</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="details-modal-footer">
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleCloseDetailsModal}
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && yearToDelete && (
          <div className="modal-overlay">
            <div className="modal delete-confirmation-modal">
              <div className="delete-modal-header">
                <div className="delete-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#fef2f2" stroke="#f87171" strokeWidth="2"/>
                    <path d="M15 9l-6 6M9 9l6 6" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3>Delete Academic Year</h3>
                <p>Are you sure you want to delete this academic year?</p>
              </div>
              
              <div className="delete-modal-content">
                <div className="year-info-card">
                  <div className="year-label">{yearToDelete.year_label}</div>
                  <div className="year-dates">
                    {formatDate(yearToDelete.start_date)} - {formatDate(yearToDelete.end_date)}
                  </div>
                </div>
                
                <div className="warning-message">
                  <div className="warning-icon">⚠️</div>
                  <div className="warning-text">
                    <strong>Warning:</strong> This action will permanently delete the academic year and all associated terms. This cannot be undone.
                  </div>
                </div>
              </div>
              
              <div className="delete-modal-actions">
                <button 
                  className="btn btn-cancel"
                  onClick={handleDeleteCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-delete"
                  onClick={handleDeleteConfirm}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete Academic Year'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAcademicYears;
