import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const backendUrl = 'http://localhost:5000';
      const loginUrl = `${backendUrl}/api/auth/login`;
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('API endpoint not found. Check if backend routes are correct.');
          return;
        }
        if (response.status === 0) {
          setError('Cannot connect to backend. Check if server is running on port 5000.');
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || `Server error: ${response.status}`);
        return;
      }

      const data = await response.json();

      if (!data.token || !data.user) {
        setError('Invalid response from server');
        return;
      }
        
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user)); 
      const role = data.user?.role;
      console.log('Redirecting based on role:', role);
      
      switch (role) {
        case 'Admin':
          console.log('Redirecting to admin dashboard');
          navigate('/admin/dashboard');
          break;
        case 'Teacher':
          console.log('Redirecting to teacher dashboard');
          navigate('/teacher/dashboard');
          break;
        case 'Student':
          console.log('Redirecting to student dashboard');
          navigate('/student/dashboard');
          break;
        case 'Parent':
          console.log('Redirecting to parent dashboard');
          navigate('/parent/dashboard');
          break;
        case 'Counsellor':
          console.log('Redirecting to counsellor dashboard');
          navigate('/counsellor/dashboard');
          break;
        default:
          console.log('Unknown role, redirecting to home');
          navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please check if backend server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="login-page">
      {/* Back to Home Button */}
      <button className="back-to-home-btn" onClick={handleBackToHome} title="Back to Home">
        ←
      </button>
      
      <div className="login-container">
        <div className="login-form">
          <h1 className="form-title">Login</h1>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Enter your username"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Signing In...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
