import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from '../../../Components/AdminLayout/AdminLayout';
import { userAPI } from '../../../services/api';
import './AdminUsers.css';

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateSriLankaPhone = (phone) => {
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  const patterns = [
    /^\+947[0-9]{8}$/,
    /^07[0-9]{8}$/,
    /^7[0-9]{8}$/
  ];
  const isValid = patterns.some(pattern => pattern.test(cleanPhone));
  return isValid;
};

const formatSriLankaPhone = (phone) => {
  if (!phone) return '';
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  
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

const validateNIC = (nic) => {
  if (!nic) return false;
  const cleanNIC = nic.replace(/[\s-]/g, '').toUpperCase();
  // Support old format (9 digits + V/X) and new format (12 digits)
  const isValid = /^[0-9]{9}[VX]?$/.test(cleanNIC) || /^[0-9]{12}$/.test(cleanNIC);
  return isValid;
};

const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const score = [
    password.length >= minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar
  ].filter(Boolean).length;
  
  return {
    isValid: score >= 4,
    score,
    feedback: [
      !(password.length >= minLength) && 'At least 8 characters',
      !hasUpperCase && 'Include uppercase letter',
      !hasLowerCase && 'Include lowercase letter',
      !hasNumbers && 'Include a number',
      !hasSpecialChar && 'Include special character'
    ].filter(Boolean).join(', ')
  };
};

const AdminUsers = () => {
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [roleFilter, setRoleFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Student',
    dateOfBirth: '',
    gender: 'Male',
    username: '',
    password: '',
    nicNumber: ''
  });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
    isValid: false
  });
  const [validationErrors, setValidationErrors] = useState({});

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users...');
      
      const response = await userAPI.getUsers();
      console.log('Fetch users response received:', {
        type: typeof response,
        hasUsers: !!response.users,
        usersLength: response.users?.length,
        isArray: Array.isArray(response)
      });
      
      // Handle different response structures
      let usersData = [];
      if (Array.isArray(response)) {
        usersData = response;
      } else if (response.users && Array.isArray(response.users)) {
        usersData = response.users;
      } else if (response.data && Array.isArray(response.data)) {
        usersData = response.data;
      }
      
      console.log('Processed users data:', usersData.length, 'users loaded');
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      addAlert('Error fetching users: ' + error.message, 'error');
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter users based on role and search term
  useEffect(() => {
    let filtered = users;

    // Filter by role
    if (roleFilter !== 'All') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.account?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.account?.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  }, [users, roleFilter, searchTerm]);

  // Set role filter based on URL path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/students')) {
      setRoleFilter('Student');
    } else if (path.includes('/teachers')) {
      setRoleFilter('Teacher');
    } else if (path.includes('/parents')) {
      setRoleFilter('Parent');
    } else if (path.includes('/counsellors')) {
      setRoleFilter('Counsellor');
    } else {
      setRoleFilter('All');
    }
  }, [location.pathname]);

  const addAlert = (message, type = 'success') => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    console.log(`Input changed: ${name} = ${value}`);
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      console.log('Updated form data:', newData);
      return newData;
    });

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

    if (name === 'nicNumber' && value) {
      if (!validateNIC(value)) {
        setValidationErrors(prev => ({
          ...prev,
          nicNumber: 'Please enter a valid Sri Lanka NIC number'
        }));
      }
    }

    // Check password strength when password field changes
    if (name === 'password') {
      if (!value) {
        setPasswordStrength({ score: 0, feedback: '', isValid: false });
      } else {
        const passwordValidation = validatePassword(value);
        setPasswordStrength({
          score: passwordValidation.score,
          feedback: passwordValidation.feedback,
          isValid: passwordValidation.isValid
        });
      }
    }
  };

  const clearForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'Student',
      dateOfBirth: '',
      gender: 'Male',
      username: '',
      password: '',
      nicNumber: ''
    });
    setPasswordStrength({ score: 0, feedback: '', isValid: false });
    setValidationErrors({});
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setValidationErrors({});
    
    // Validate all required fields
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (formData.email && !validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone && !validateSriLankaPhone(formData.phone)) {
      console.log('Phone validation failed for:', formData.phone);
      errors.phone = 'Please enter a valid Sri Lanka phone number (e.g., +94 76 374 3475 or 0768923434)';
    }
    
    if (!formData.nicNumber.trim()) {
      errors.nicNumber = 'NIC number is required';
    } else if (!validateNIC(formData.nicNumber)) {
      console.log('NIC validation failed for:', formData.nicNumber);
      errors.nicNumber = 'Please enter a valid Sri Lanka NIC number';
    }
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }
    
    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (!passwordStrength.isValid) {
      console.log('Password validation failed. Strength:', passwordStrength);
      errors.password = 'Password does not meet strength requirements';
    }
    
    // Set validation errors
    if (Object.keys(errors).length > 0) {
      console.log('Validation errors found:', errors);
      setValidationErrors(errors);
      addAlert('Please fix the validation errors before submitting.', 'error');
      return;
    }

    console.log('No validation errors, proceeding with user creation...');

    try {
      // Prepare data for backend (convert to snake_case)
      const userData = {
        name: formData.name,
        role: formData.role,
        username: formData.username,
        password: formData.password,
        email: formData.email,
        phone: formatSriLankaPhone(formData.phone),
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        nic_number: formData.nicNumber
      };

      console.log('Creating user with data:', userData);
      console.log('Form data before processing:', formData);
      console.log('API endpoint:', '/api/admin/users');
      console.log('Date format check - dateOfBirth:', formData.dateOfBirth);
      console.log('NIC format check - nicNumber:', formData.nicNumber);
      console.log('Phone format check - phone:', formData.phone, 'formatted:', formatSriLankaPhone(formData.phone));

      const response = await userAPI.createUser(userData);
      console.log('Create user response:', response);     
      // Always show success message
      addAlert('User created successfully!');
      // Log success for debugging
      console.log('User created successfully:', response);
      
      setShowCreateForm(false);
      clearForm(); // Use the clearForm function
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error creating user:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      addAlert('Error creating user: ' + error.message, 'error');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault(); 
    // Validate password strength if password is provided
    if (formData.password && !passwordStrength.isValid) {
      addAlert('Please enter a stronger password that meets the requirements.', 'error');
      return;
    }

    try {
      const userData = {
        name: formData.name,
        role: formData.role,
        email: formData.email,
        phone: formatSriLankaPhone(formData.phone), // Apply formatting on update too
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        nic_number: formData.nicNumber
      };

      // Add password only if it's provided and valid
      if (formData.password && passwordStrength.isValid) {
        userData.password = formData.password;
      }

      await userAPI.updateUser(editingUser._id, userData);
      
      setShowUpdateForm(false);
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'Student',
        dateOfBirth: '',
        gender: 'Male',
        username: '',
        password: '',
        nicNumber: ''
      });
      setPasswordStrength({ score: 0, feedback: '', isValid: false });
      addAlert('User updated successfully!');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user:', error);
      addAlert('Error updating user: ' + error.message, 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This will deactivate their account but preserve their data.')) {
      try {
        await userAPI.deleteUser(userId, false); // Soft delete
        addAlert('User deleted successfully!');
        fetchUsers(); // Refresh the list
      } catch (error) {
        console.error('Error deleting user:', error);
        addAlert('Error deleting user: ' + error.message, 'error');
      }
    }
  };

  const openUpdateForm = (user) => {
    setEditingUser(user);
    const formDataToSet = {
      name: user.name || '',
      email: user.account?.email || '',
      phone: user.account?.phone || '',
      role: user.role || 'Student',
      dateOfBirth: user.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : '',
      gender: user.gender || 'Male',
      username: user.account?.username || '',
      password: '', // Don't show current password
      nicNumber: user.nic_number || ''
    };
    setFormData(formDataToSet);
    setPasswordStrength({ score: 0, feedback: '', isValid: false }); // Reset password strength for update form
    setShowUpdateForm(true);
  };

  const showUserDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const getRoleColor = (role) => {
    const colors = {
      'Admin': 'badge-purple',
      'Teacher': 'badge-success',
      'Student': 'badge-info',
      'Parent': 'badge-warning',
      'Counsellor': 'badge-danger'
    };
    return colors[role] || 'badge-info';
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'badge-success' : 'badge-danger';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getPageTitle = () => {
    if (roleFilter === 'Student') return 'Student Management';
    if (roleFilter === 'Teacher') return 'Teacher Management';
    if (roleFilter === 'Parent') return 'Parent Management';
    if (roleFilter === 'Counsellor') return 'Counsellor Management';
    return 'User Management';
  };

  const getPageDescription = () => {
    if (roleFilter === 'Student') return 'Manage student accounts and information';
    if (roleFilter === 'Teacher') return 'Manage teacher accounts and assignments';
    if (roleFilter === 'Parent') return 'Manage parent accounts and student links';
    if (roleFilter === 'Counsellor') return 'Manage counsellor accounts and schedules';
    return 'Manage all user accounts and system access';
  };

  if (loading) {
    return (
      <AdminLayout 
        pageTitle="Loading..." 
        pageDescription="Please wait while we load the data"
      >
        <div className="loading-container">
          <div className="loading">Loading Users...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      pageTitle={getPageTitle()} 
      pageDescription={getPageDescription()}
    >
      {/* Alerts */}
      <div className="alerts-container">
        {alerts.map(alert => (
          <div key={alert.id} className={`alert alert-${alert.type}`}>
            {alert.message}
          </div>
        ))}
      </div>

      <div className="users-container">
        {/* Header */}
        <div className="users-header">
          <div className="header-left">
            <h1>{getPageTitle()}</h1>
            <p>{getPageDescription()}</p>
          </div>
          <div className="header-right">
            <button 
              className="btn btn-primary"
              onClick={() => {
                clearForm();
                setShowCreateForm(true);
              }}
            >
              Create User
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-container">
          <div className="filter-group">
            <label htmlFor="role-filter">Filter by Role:</label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Users</option>
              <option value="Student">Students</option>
              <option value="Teacher">Teachers</option>
              <option value="Parent">Parents</option>
              <option value="Counsellor">Counsellors</option>
              <option value="Admin">Admins</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="search">Search:</label>
            <input
              id="search"
              type="text"
              placeholder="Search by name, email, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
          </div>
          
          <div className="filter-stats">
            <span className="stats-text">
              Showing {filteredUsers.length} of {users.length} users
            </span>
          </div>
        </div>

        {/* Create User Form */}
        {showCreateForm && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Create New User</h2>
                <div className="security-notice">
                  <span className="security-icon">🔒</span>
                  Secure Admin Interface
                </div>
                <button 
                  className="close-btn"
                  onClick={() => {
                    clearForm();
                    setShowCreateForm(false);
                  }}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="user-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-lpignore="true"
                      data-form-type="other"
                      className={validationErrors.name ? 'error' : ''}
                    />
                    {validationErrors.name && (
                      <div className="error-message">{validationErrors.name}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Username *</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-lpignore="true"
                      data-form-type="other"
                      className={validationErrors.username ? 'error' : ''}
                    />
                    {validationErrors.username && (
                      <div className="error-message">{validationErrors.username}</div>
                    )}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={validationErrors.email ? 'error' : ''}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-lpignore="true"
                      data-form-type="other"
                    />
                    {validationErrors.email && (
                      <div className="error-message">{validationErrors.email}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={validationErrors.phone ? 'error' : ''}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-lpignore="true"
                      data-form-type="other"
                    />
                    {validationErrors.phone && (
                      <div className="error-message">{validationErrors.phone}</div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Role *</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Student">Student</option>
                      <option value="Teacher">Teacher</option>
                      <option value="Parent">Parent</option>
                      <option value="Admin">Admin</option>
                      <option value="Counsellor">Counsellor</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-form-type="other"
                    />
                    {formData.password && (
                      <div className="password-strength">
                        <div className="strength-bar">
                          <div 
                            className={`strength-fill strength-${passwordStrength.score >= 4 ? 'strong' : passwordStrength.score >= 2 ? 'medium' : 'weak'}`}
                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          ></div>
                        </div>
                        <div className={`strength-text strength-text-${passwordStrength.score >= 4 ? 'strong' : passwordStrength.score >= 2 ? 'medium' : 'weak'}`}>
                          {passwordStrength.score >= 4 ? 'Strong' : passwordStrength.score >= 2 ? 'Medium' : 'Weak'}
                        </div>
                        {passwordStrength.feedback && (
                          <div className="strength-feedback">
                            {passwordStrength.feedback}
                          </div>
                        )}
                      </div>
                    )}
                    {validationErrors.password && (
                      <div className="error-message">{validationErrors.password}</div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>NIC Number *</label>
                    <input
                      type="text"
                      name="nicNumber"
                      value={formData.nicNumber}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., 1234567890123"
                      className={validationErrors.nicNumber ? 'error' : ''}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-lpignore="true"
                      data-form-type="other"
                    />
                    {validationErrors.nicNumber && (
                      <div className="error-message">{validationErrors.nicNumber}</div>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => {
                    clearForm();
                    setShowCreateForm(false);
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create User
                  </button>
                  </div>
              </form>
            </div>
          </div>
        )}

        {/* Update User Form */}
        {showUpdateForm && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Update User</h2>
                <div className="security-notice">
                  <span className="security-icon">🔒</span>
                  Secure Admin Interface
                </div>
                <button 
                  className="close-btn"
                  onClick={() => setShowUpdateForm(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleUpdateUser} className="user-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
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
                    <label>Username</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      disabled
                      className="disabled-input"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={validationErrors.email ? 'error' : ''}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-lpignore="true"
                      data-form-type="other"
                    />
                    {validationErrors.email && (
                      <div className="error-message">{validationErrors.email}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={validationErrors.phone ? 'error' : ''}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-lpignore="true"
                      data-form-type="other"
                    />
                    {validationErrors.phone && (
                      <div className="error-message">{validationErrors.phone}</div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Role *</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Student">Student</option>
                      <option value="Teacher">Teacher</option>
                      <option value="Parent">Parent</option>
                      <option value="Admin">Admin</option>
                      <option value="Counsellor">Counsellor</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password (leave blank to keep current)</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-form-type="other"
                    />
                    {formData.password && (
                      <div className="password-strength">
                        <div className="strength-bar">
                          <div 
                            className={`strength-fill strength-${passwordStrength.score >= 4 ? 'strong' : passwordStrength.score >= 2 ? 'medium' : 'weak'}`}
                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          ></div>
                        </div>
                        <div className={`strength-text strength-text-${passwordStrength.score >= 4 ? 'strong' : passwordStrength.score >= 2 ? 'medium' : 'weak'}`}>
                          {passwordStrength.score >= 4 ? 'Strong' : passwordStrength.score >= 2 ? 'Medium' : 'Weak'}
                        </div>
                        {passwordStrength.feedback && (
                          <div className="strength-feedback">
                            {passwordStrength.feedback}
                          </div>
                        )}
                      </div>
                    )}
                    {validationErrors.password && (
                      <div className="error-message">{validationErrors.password}</div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>NIC Number *</label>
                    <input
                      type="text"
                      name="nicNumber"
                      value={formData.nicNumber}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., 1234567890123"
                      className={validationErrors.nicNumber ? 'error' : ''}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-lpignore="true"
                      data-form-type="other"
                    />
                    {validationErrors.nicNumber && (
                      <div className="error-message">{validationErrors.nicNumber}</div>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowUpdateForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update User
                  </button>
                  </div>
              </form>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="users-list">
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th style={{textAlign: 'center'}}>Name</th>
                  <th style={{textAlign: 'center'}}>Username</th>
                  <th style={{textAlign: 'center'}}>Email</th>
                  <th style={{textAlign: 'center'}}>Role</th>
                  <th style={{textAlign: 'center'}}>Phone</th>
                  <th style={{textAlign: 'center'}}>Status</th>
                  <th style={{textAlign: 'center'}}>Created</th>
                  <th style={{textAlign: 'center'}}>Actions</th>
                </tr>
              </thead>
                <tbody>
                  {filteredUsers.map(user => (
                  <tr key={user._id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {user.name ? user.name.charAt(0) : 'U'}
                        </div>
                        <div>
                          <div className="user-name">{user.name || 'N/A'}</div>
                          <div className="user-gender">{user.gender || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{user.account?.username || 'N/A'}</td>
                    <td>{user.account?.email || 'N/A'}</td>
                    <td>
                      <span className={`badge ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.account?.phone || 'N/A'}</td>
                    <td>
                      <span className={`badge ${getStatusColor(user.account?.is_active)}`}>
                        {user.account?.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-sm btn-info"
                          onClick={() => showUserDetails(user)}
                        >
                          Show Details
                        </button>
                        <button 
                          className="btn btn-sm btn-purple"
                          onClick={() => openUpdateForm(user)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Details Modal */}
        {showDetailsModal && selectedUser && (
          <div className="modal-overlay">
            <div className="modal user-details-modal">
              <div className="modal-header">
                <h2>User Details</h2>
                <button 
                  className="close-btn"
                  onClick={() => setShowDetailsModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-content">
                <div className="user-details-grid">
                  <div className="detail-section">
                    <h3>Personal Information</h3>
                    <div className="detail-item">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{selectedUser.name || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Role:</span>
                      <span className={`badge ${getRoleColor(selectedUser.role)}`}>
                        {selectedUser.role}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Gender:</span>
                      <span className="detail-value">{selectedUser.gender || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Date of Birth:</span>
                      <span className="detail-value">{formatDate(selectedUser.date_of_birth)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">NIC Number:</span>
                      <span className="detail-value">{selectedUser.nic_number || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Account Information</h3>
                    <div className="detail-item">
                      <span className="detail-label">Username:</span>
                      <span className="detail-value">{selectedUser.account?.username || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{selectedUser.account?.email || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{selectedUser.account?.phone || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span className={`badge ${getStatusColor(selectedUser.account?.is_active)}`}>
                        {selectedUser.account?.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Account Created:</span>
                      <span className="detail-value">{formatDate(selectedUser.account?.createdAt)}</span>
                    </div>
                  </div>

                  {selectedUser.role === 'Student' && selectedUser.class_assignments && selectedUser.class_assignments.length > 0 && (
                    <div className="detail-section">
                      <h3>Assigned Classes</h3>
                      {selectedUser.class_assignments.map((assignment, index) => (
                        <div key={index} className="detail-item">
                          <span className="detail-label">Class:</span>
                          <span className="detail-value">
                            {assignment.class_id?.class_name || 'N/A'} 
                            {assignment.class_id?.grade && ` (Grade ${assignment.class_id.grade})`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedUser.role === 'Teacher' && selectedUser.class_assignments && selectedUser.class_assignments.length > 0 && (
                    <div className="detail-section">
                      <h3>Assigned Classes & Subjects</h3>
                      {selectedUser.class_assignments.map((assignment, index) => (
                        <div key={index} className="detail-item">
                          <span className="detail-label">Class:</span>
                          <span className="detail-value">
                            {assignment.class_id?.class_name || 'N/A'} 
                            {assignment.is_class_teacher && ' (Class Teacher)'}
                            {assignment.class_id?.grade && ` - Grade ${assignment.class_id.grade}`}
                          </span>
                        </div>
                      ))}
                      {selectedUser.subject_assignments && selectedUser.subject_assignments.length > 0 && (
                        <div className="subject-assignments">
                          <h4>Subject Assignments:</h4>
                          {selectedUser.subject_assignments.map((assignment, index) => (
                            <div key={index} className="detail-item">
                              <span className="detail-label">Subject:</span>
                              <span className="detail-value">
                                {assignment.subject_name || 'N/A'} 
                                {assignment.course_limit && ` (${assignment.course_limit} periods)`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="detail-section">
                    <h3>System Information</h3>
                    <div className="detail-item">
                      <span className="detail-label">User Created:</span>
                      <span className="detail-value">{formatDate(selectedUser.createdAt)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Last Updated:</span>
                      <span className="detail-value">{formatDate(selectedUser.updatedAt)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Total Accounts:</span>
                      <span className="detail-value">{selectedUser.totalAccounts || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
