const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

    try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const result = await handleResponse(response);
    return result;
  } catch (error) {
    // Error Propagation Testing
    console.error('API request failed:', error);
    throw error;
  }
};

// User Management API
export const userAPI = {
  // Get all users
  getUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/users?${queryString}`);
  },

  // Get single user
  getUser: (id) => apiRequest(`/admin/users/${id}`),

  // Create user
  createUser: (userData) => apiRequest('/admin/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  // Update user
  updateUser: (id, userData) => apiRequest(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),

  // Delete user (soft delete by default)
  deleteUser: (id, permanent = false) => apiRequest(`/admin/users/${id}?permanent=${permanent}`, {
    method: 'DELETE',
  }),

  // Restore user
  restoreUser: (id) => apiRequest(`/admin/users/${id}/restore`, {
    method: 'POST',
  }),

  // Bulk delete users
  bulkDeleteUsers: (userIds, permanent = false) => apiRequest('/admin/users/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ userIds, permanent }),
  }),

  // Bulk restore users
  bulkRestoreUsers: (userIds) => apiRequest('/admin/users/bulk-restore', {
    method: 'POST',
    body: JSON.stringify({ userIds }),
  }),

  // Get user statistics
  getUserStats: () => apiRequest('/admin/users/stats'),

  // Assign parent to student
  assignParentToStudent: (parentId, studentId) => apiRequest('/admin/users/assign-parent', {
    method: 'POST',
    body: JSON.stringify({ parentId, studentId }),
  }),

  // Remove parent from student
  removeParentFromStudent: (parentId, studentId) => apiRequest('/admin/users/remove-parent', {
    method: 'POST',
    body: JSON.stringify({ parentId, studentId }),
  }),

  // Create additional account for existing user
  createAdditionalAccount: (userId, accountData) => apiRequest(`/admin/users/${userId}/accounts`, {
    method: 'POST',
    body: JSON.stringify(accountData),
  }),

  // Get all accounts for a specific user
  getUserAccounts: (userId) => apiRequest(`/admin/users/${userId}/accounts`),

  // Profile management
  getProfile: () => apiRequest('/auth/profile'),
  updateProfile: (profileData) => apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  }),
};

// Academic Years API
export const academicYearAPI = {
  // Get all academic years
  getAcademicYears: () => apiRequest('/admin/academic-years'),

  // Get single academic year
  getAcademicYear: (id) => apiRequest(`/admin/academic-years/${id}`),

  // Create academic year
  createAcademicYear: (yearData) => apiRequest('/admin/academic-years', {
    method: 'POST',
    body: JSON.stringify(yearData),
  }),

  // Update academic year
  updateAcademicYear: (id, yearData) => apiRequest(`/admin/academic-years/${id}`, {
    method: 'PUT',
    body: JSON.stringify(yearData),
  }),

  // Delete academic year
  deleteAcademicYear: (id) => apiRequest(`/admin/academic-years/${id}`, {
    method: 'DELETE',
  }),
};

// Terms API
export const termsAPI = {
  // Get all terms
  getTerms: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    console.log('termsAPI.getTerms called with params:', params);
    console.log('Query string:', queryString);
    console.log('Full URL:', `/admin/terms?${queryString}`);
    return apiRequest(`/admin/terms?${queryString}`);
  },

  // Get single term
  getTerm: (id) => apiRequest(`/admin/terms/${id}`),

  // Create term
  createTerm: (termData) => apiRequest('/admin/terms', {
    method: 'POST',
    body: JSON.stringify(termData),
  }),

  // Update term
  updateTerm: (id, termData) => apiRequest(`/admin/terms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(termData),
  }),

  // Delete term
  deleteTerm: (id) => apiRequest(`/admin/terms/${id}`, {
    method: 'DELETE',
  }),
};

// Classes API
export const classAPI = {
  // Get all classes
  getClasses: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/classes?${queryString}`);
  },

  // Get single class
  getClass: (id) => apiRequest(`/admin/classes/${id}`),

  // Create class
  createClass: (classData) => apiRequest('/admin/classes', {
    method: 'POST',
    body: JSON.stringify(classData),
  }),

  // Update class
  updateClass: (id, classData) => apiRequest(`/admin/classes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(classData),
  }),

  // Delete class
  deleteClass: (id) => apiRequest(`/admin/classes/${id}`, {
    method: 'DELETE',
  }),

  // Assign class teacher
  assignClassTeacher: (classId, teacherId) => apiRequest('/admin/classes/assign-teacher', {
    method: 'POST',
    body: JSON.stringify({ class_id: classId, teacher_id: teacherId }),
  }),

  // Assign student to class
  assignStudentToClass: (classId, studentId) => apiRequest('/admin/classes/assign-student', {
    method: 'POST',
    body: JSON.stringify({ class_id: classId, student_id: studentId }),
  }),

  // Remove student from class
  removeStudentFromClass: (classId, studentId) => apiRequest('/admin/classes/remove-student', {
    method: 'DELETE',
    body: JSON.stringify({ class_id: classId, student_id: studentId }),
  }),

  // Assign teacher to class
  assignTeacherToClass: (classId, teacherId) => apiRequest('/admin/classes/assign-teacher', {
    method: 'POST',
    body: JSON.stringify({ class_id: classId, teacher_id: teacherId }),
  }),

  // Get all teacher assignments
  getAllTeacherAssignments: () => apiRequest('/admin/classes/teacher-assignments'),

  // Remove teacher from class
  removeTeacherFromClass: (classId, teacherId) => apiRequest('/admin/classes/remove-teacher', {
    method: 'DELETE',
    body: JSON.stringify({ class_id: classId, teacher_id: teacherId }),
  }),

  // Assign teacher to subject
  assignTeacherToSubject: (teacherId, subjectId, classId, courseLimit, religionType = null) => apiRequest('/admin/classes/assign-subject', {
    method: 'POST',
    body: JSON.stringify({ 
      teacher_id: teacherId, 
      subject_id: subjectId, 
      class_id: classId, 
      course_limit: courseLimit,
      religion_type: religionType // Optional: for tracking religion type when using Religion subject
    }),
  }),

  // Get class teachers
  getClassTeachers: (classId) => apiRequest(`/admin/classes/${classId}/teachers`),

  // Update course limit
  updateCourseLimit: (assignmentId, courseLimit) => apiRequest(`/admin/assignments/${assignmentId}/course-limit`, {
    method: 'PUT',
    body: JSON.stringify({ course_limit: courseLimit }),
  }),

  // Update teacher assignment
  updateTeacherAssignment: (assignmentId, assignmentData) => apiRequest(`/admin/assignments/${assignmentId}`, {
    method: 'PUT',
    body: JSON.stringify(assignmentData),
  }),
};

// Subjects API
export const subjectAPI = {
  // Get all subjects
  getSubjects: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/subjects?${queryString}`);
  },

  // Get single subject
  getSubject: (id) => apiRequest(`/admin/subjects/${id}`),

  // Create subject
  createSubject: (subjectData) => apiRequest('/admin/subjects', {
    method: 'POST',
    body: JSON.stringify(subjectData),
  }),

  // Update subject
  updateSubject: (id, subjectData) => apiRequest(`/admin/subjects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(subjectData),
  }),

  // Delete subject
  deleteSubject: (id) => apiRequest(`/admin/subjects/${id}`, {
    method: 'DELETE',
  }),

  // Restore subject
  restoreSubject: (id) => apiRequest(`/admin/subjects/${id}/restore`, {
    method: 'POST',
  }),

  // Get subjects by term
  getSubjectsByTerm: (termId) => apiRequest(`/admin/terms/${termId}/subjects`),

  // Assign subject to term
  assignSubjectToTerm: (subjectId, termId) => apiRequest('/admin/subjects/assign-to-term', {
    method: 'POST',
    body: JSON.stringify({ subject_id: subjectId, term_id: termId }),
  }),

  // Remove subject from term
  removeSubjectFromTerm: (subjectId) => apiRequest('/admin/subjects/remove-from-term', {
    method: 'POST',
    body: JSON.stringify({ subject_id: subjectId }),
  }),

  // Get available terms for subject progression
  getAvailableTerms: (subjectId) => apiRequest(`/admin/subjects/${subjectId}/available-terms`),

  // Get available teachers for subject assignment
  getAvailableTeachers: (subjectId, classId) => {
    const params = new URLSearchParams();
    if (subjectId) params.append('subject_id', subjectId);
    if (classId) params.append('class_id', classId);
    return apiRequest(`/admin/subjects/available-teachers?${params.toString()}`);
  },

  // Get subjects for a specific class
  getSubjectsForClass: (classId) => apiRequest(`/admin/classes/${classId}/subjects`),

  // Assign subjects to class with course limits
  assignSubjectsToClass: (classId, subjectAssignments) => apiRequest('/admin/classes/assign-subjects', {
    method: 'POST',
    body: JSON.stringify({
      class_id: classId,
      subject_assignments: subjectAssignments
    }),
  }),

  // Update course limit for class-subject assignment
  updateClassSubjectCourseLimit: (assignmentId, courseLimit) => apiRequest('/admin/classes/subject-assignments/update', {
    method: 'PUT',
    body: JSON.stringify({
      assignment_id: assignmentId,
      course_limit: courseLimit
    }),
  }),

  // Remove subject from class
  removeSubjectFromClass: (assignmentId) => apiRequest('/admin/classes/subject-assignments/remove', {
    method: 'POST',
    body: JSON.stringify({
      assignment_id: assignmentId
    }),
  }),
};

// Auth API
export const authAPI = {
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  logout: () => apiRequest('/auth/logout', {
    method: 'POST',
  }),
};

export default {
  userAPI,
  authAPI,
  academicYearAPI,
  termsAPI,
  classAPI,
  subjectAPI,
};
