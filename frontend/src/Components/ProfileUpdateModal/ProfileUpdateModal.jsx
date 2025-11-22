import React, { useState, useEffect } from 'react';
import './ProfileUpdateModal.css';

// Validation functions (moved from utils/validation.js)
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateSriLankaPhone = (phone) => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const patterns = [
    /^\+947[0-9]{8}$/,
    /^07[0-9]{8}$/,
    /^7[0-9]{8}$/
  ];
  return patterns.some(pattern => pattern.test(cleanPhone));
};

const formatSriLankaPhone = (phone) => {
  if (!phone) return '';
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  if (cleanPhone.startsWith('+947')) {
    return `+94 ${cleanPhone.slice(3, 5)} ${cleanPhone.slice(5, 8)} ${cleanPhone.slice(8)}`;
  }
  
  if (cleanPhone.startsWith('07')) {
    return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6)}`;
  }
  
  if (cleanPhone.startsWith('7') && cleanPhone.length === 9) {
    return `07${cleanPhone.slice(1, 4)} ${cleanPhone.slice(4, 7)} ${cleanPhone.slice(7)}`;
  }
  
  return phone;
};

const ProfileUpdateModal = ({ isOpen, onClose, onUpdate, onNotificationRefresh }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      testConnection();
      fetchProfile();
    }
  }, [isOpen]);

  const testConnection = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Testing connection with token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch('http://localhost:5000/api/auth/test-profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Connection test result:', data);
    } catch (error) {
      console.error('Connection test failed:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        showMessage('No authentication token found. Please login again.', 'error');
        return;
      }

      console.log('Fetching profile from:', 'http://localhost:5000/api/auth/profile');
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Profile response status:', response.status);
      const data = await response.json();
      console.log('Profile response data:', data);

      if (response.ok) {
        setFormData({
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        console.log('Profile data set successfully:', data.user);
      } else {
        console.error('Profile fetch failed:', data);
        showMessage(data.message || 'Error fetching profile', 'error');
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
      showMessage('Error fetching profile: ' + error.message, 'error');
    }
  };

  const showMessage = (msg, type = 'info') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(''), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field
    setValidationErrors(prev => ({
      ...prev,
      [name]: ''
    }));

    // Validate specific fields
    if (name === 'email' && value) {
      if (!validateEmail(value)) {
        setValidationErrors(prev => ({
          ...prev,
          email: 'Please enter a valid email address'
        }));
      }
    }

    if (name === 'phone' && value) {
      if (!validateSriLankaPhone(value)) {
        setValidationErrors(prev => ({
          ...prev,
          phone: 'Please enter a valid Sri Lanka phone number (e.g., +94 76 374 3475 or 0768923434)'
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setValidationErrors({});

    try {
      // Validate all fields
      const errors = {};
      
      if (!formData.name.trim()) {
        errors.name = 'Name is required';
      }
      
      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
      
      if (!formData.phone.trim()) {
        errors.phone = 'Phone number is required';
      } else if (!validateSriLankaPhone(formData.phone)) {
        errors.phone = 'Please enter a valid Sri Lanka phone number (e.g., +94 76 374 3475 or 0768923434)';
      }

      // Password validation
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match!';
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        showMessage('Please fix the validation errors before submitting.', 'error');
        setLoading(false);
        return;
      }

      // Prepare update data
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formatSriLankaPhone(formData.phone)
      };

      // Add password fields if changing password
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      // Make API call
      const token = localStorage.getItem('token');
      console.log('Update profile - Token exists:', token ? 'Yes' : 'No');
      console.log('Update profile - Data being sent:', updateData);
      
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      console.log('Update profile - Response status:', response.status);
      const data = await response.json();
      console.log('Update profile - Response data:', data);

      if (response.ok) {
        showMessage('Profile updated successfully!', 'success');
        // Refresh notifications if callback provided
        if (onNotificationRefresh) {
          onNotificationRefresh();
        }
        setTimeout(() => {
          onUpdate(data.user);
          onClose();
        }, 1000);
      } else {
        showMessage(data.message || 'Update failed', 'error');
      }
    } catch (error) {
      console.error('Update error:', error);
      showMessage('Error updating profile: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="profile-modal">
        <div className="modal-header">
          <h2>Update Profile</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        {/* Message */}
        {message && (
          <div className={`message message-${message.type}`}>
            {message.text}
          </div>
        )}

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Profile Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className={validationErrors.name ? 'error' : ''}
                />
                {validationErrors.name && (
                  <div className="error-message">{validationErrors.name}</div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={validationErrors.email ? 'error' : ''}
                  placeholder="example@email.com"
                />
                {validationErrors.email && (
                  <div className="error-message">{validationErrors.email}</div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className={validationErrors.phone ? 'error' : ''}
                  placeholder="+94 76 374 3475 or 0768923434"
                />
                {validationErrors.phone && (
                  <div className="error-message">{validationErrors.phone}</div>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Change Password (Optional)</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={validationErrors.confirmPassword ? 'error' : ''}
                />
                {validationErrors.confirmPassword && (
                  <div className="error-message">{validationErrors.confirmPassword}</div>
                )}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileUpdateModal;
