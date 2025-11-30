import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminLayout from '../../../Components/AdminLayout/AdminLayout';
import { academicYearAPI, termsAPI, classAPI, userAPI, subjectAPI } from '../../../services/api';
import './AdminAssignments.css';

const AdminAssignments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management with unique names
  const [assignmentClasses, setAssignmentClasses] = useState([]);
  const [assignmentSubjects, setAssignmentSubjects] = useState([]);
  const [assignmentTeachers, setAssignmentTeachers] = useState([]);
  const [assignmentStudents, setAssignmentStudents] = useState([]);
  const [assignmentAlerts, setAssignmentAlerts] = useState([]);
  
  // Selection states with unique names - Check for navigation state first
  const getInitialClassId = () => {
    // Check if navigation state was passed (from classes page)
    if (location.state?.selectedClass) {
      return location.state.selectedClass;
    }
    return '';
  };
  
  const [assignmentSelectedClass, setAssignmentSelectedClass] = useState(getInitialClassId());
  
  // Assignment states with unique names
  const [assignmentTeacherAssignments, setAssignmentTeacherAssignments] = useState([]);
  const [assignmentStudentAssignments, setAssignmentStudentAssignments] = useState([]);
  const [assignmentClassSubjects, setAssignmentClassSubjects] = useState([]); // Subjects assigned to selected class
  const [assignmentAllTeacherAssignments, setAssignmentAllTeacherAssignments] = useState([]); // All teacher assignments for validation
  
  // Editing states
  const [assignmentEditingClassId, setAssignmentEditingClassId] = useState(null);
  const [assignmentEditingSubjectId, setAssignmentEditingSubjectId] = useState(null);
  const [assignmentEditCourseLimit, setAssignmentEditCourseLimit] = useState(1);
  
  // Form display control
  const [assignmentActiveForm, setAssignmentActiveForm] = useState('subject-teacher'); // 'teacher', 'student', or 'subject-teacher'
  const [assignmentViewMode, setAssignmentViewMode] = useState('assign'); // 'assign' or 'edit'
  
  // Form states with unique names
  const [assignmentTeacherForm, setAssignmentTeacherForm] = useState({
    teacher_id: ''
  });
  const [assignmentStudentForm, setAssignmentStudentForm] = useState({
    student_id: ''
  });
  const [assignmentSubjectTeacherForm, setAssignmentSubjectTeacherForm] = useState({
    subject_id: '',
    teacher_id: '',
    course_limit: 1
  });
  
  // Special multi-slot forms for Religion and Language subjects
  // Religion: ONE course limit for all 4 subjects combined
  const [assignmentReligionForm, setAssignmentReligionForm] = useState({
    hinduism: { teacher_id: '' },
    christianity: { teacher_id: '' },
    muslim: { teacher_id: '' },
    buddhism: { teacher_id: '' },
    course_limit: 1 // Single course limit for all 4 religion subjects
  });
  
  const [assignmentLanguageForm, setAssignmentLanguageForm] = useState({
    tamil: { teacher_id: '' },
    sinhala: { teacher_id: '' },
    course_limit: 1 // Single course limit for both Tamil and Sinhala subjects
  });

  // Loading states
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentInitialLoading, setAssignmentInitialLoading] = useState(true);
  const [assignmentClassDataLoading, setAssignmentClassDataLoading] = useState(false);

  // Alert system with unique names
  const assignmentAddAlert = (message, type = 'success') => {
    const id = Date.now();
    setAssignmentAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setAssignmentAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  };

  // Fetch functions with unique names
  const assignmentFetchClasses = async () => {
    try {
      const data = await classAPI.getClasses();
      if (data && Array.isArray(data)) {
        // Sort classes by grade (ascending) then by section (ascending)
        const sortedClasses = [...data].sort((a, b) => {
          const gradeA = parseInt(a.grade) || 0;
          const gradeB = parseInt(b.grade) || 0;
          if (gradeA !== gradeB) {
            return gradeA - gradeB;
          }
          // If same grade, sort by section
          return (a.section || '').localeCompare(b.section || '');
        });
        setAssignmentClasses(sortedClasses);
      } else {
        setAssignmentClasses([]);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      assignmentAddAlert('Error fetching classes', 'error');
    }
  };



  const assignmentFetchTeachers = async () => {
    try {
      const data = await userAPI.getUsers({ role: 'Teacher' });
      const teachers = data.users || data || [];
      // Additional filtering to ensure only teachers are shown
      const filteredTeachers = teachers.filter(user => user.role === 'Teacher');
      setAssignmentTeachers(filteredTeachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      assignmentAddAlert('Error fetching teachers', 'error');
    }
  };

  // Get class teachers (teachers assigned as class teachers)
  const assignmentGetClassTeachers = () => {
    try {
      const classTeacherDetails = assignmentGetClassTeacherDetails();
      return classTeacherDetails?.teacher ? [classTeacherDetails.teacher] : [];
    } catch (error) {
      console.error('Error getting class teachers:', error);
      return [];
    }
  };

  const assignmentFetchStudents = async () => {
    try {
      const data = await userAPI.getUsers({ role: 'Student' });
      const students = data.users || data || [];
      // Additional filtering to ensure only students are shown
      const filteredStudents = students.filter(user => user.role === 'Student');
      setAssignmentStudents(filteredStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      assignmentAddAlert('Error fetching students', 'error');
    }
  };

  const assignmentUpdateClassInfo = (updatedClass) => {
    if (!updatedClass || !updatedClass._id) return;
    setAssignmentClasses(prevClasses => {
      if (!Array.isArray(prevClasses) || prevClasses.length === 0) {
        return prevClasses;
      }
      return prevClasses.map(cls => {
        if (!cls || cls._id !== updatedClass._id) return cls;
        return {
          ...cls,
          class_teacher: updatedClass.class_teacher ?? cls?.class_teacher,
          class_teacher_id: updatedClass.class_teacher_id ?? cls?.class_teacher_id
        };
      });
    });
  };

  const assignmentFetchTeacherAssignments = async (classId) => {
    try {
      const data = await classAPI.getClass(classId);
      setAssignmentTeacherAssignments(data.teacher_assignments || []);
      assignmentUpdateClassInfo(data);
    } catch (error) {
      console.error('Error fetching teacher assignments:', error);
      setAssignmentTeacherAssignments([]);
    }
  };

  const assignmentFetchStudentAssignments = async (classId) => {
    try {
      const data = await classAPI.getClass(classId);
      // Ensure students is an array and filter out any null/undefined values
      const students = Array.isArray(data.students) 
        ? data.students.filter(s => s !== null && s !== undefined && s._id && s.role === 'Student')
        : [];
      console.log('Fetched students for class:', classId, students.length, 'students');
      setAssignmentStudentAssignments(students);
    } catch (error) {
      console.error('Error fetching student assignments:', error);
      setAssignmentStudentAssignments([]);
    }
  };

  const assignmentFetchClassSubjects = async (classId) => {
    try {
      const response = await subjectAPI.getSubjectsForClass(classId);
      // Handle response structure - could be array or object with subjects property
      let subjectsArray = [];
      if (Array.isArray(response)) {
        subjectsArray = response;
      } else if (response && Array.isArray(response.subjects)) {
        subjectsArray = response.subjects;
      } else if (response && response.data && Array.isArray(response.data.subjects)) {
        subjectsArray = response.data.subjects;
      }
      setAssignmentClassSubjects(subjectsArray);
    } catch (error) {
      console.error('Error fetching class subjects:', error);
      setAssignmentClassSubjects([]);
    }
  };

  const assignmentFetchAllSubjects = async () => {
    try {
      const data = await subjectAPI.getSubjects();
      setAssignmentSubjects(data || []);
    } catch (error) {
      console.error('Error fetching all subjects:', error);
      assignmentAddAlert('Error fetching subjects', 'error');
    }
  };

  const assignmentFetchAllTeacherAssignments = async () => {
    try {
      const data = await classAPI.getAllTeacherAssignments();
      setAssignmentAllTeacherAssignments(data || []);
    } catch (error) {
      console.error('Error fetching all teacher assignments:', error);
      setAssignmentAllTeacherAssignments([]);
    }
  };

  // Helper function to check if teacher can be assigned to a subject
  const assignmentCanTeacherBeAssigned = (teacherId, subjectId) => {
    if (!teacherId || !subjectId) return true;
    
    // Get all assignments for this teacher
    const teacherAssignments = assignmentAllTeacherAssignments.filter(
      assignment => assignment.user_id?._id === teacherId || assignment.user_id === teacherId
    );
    
    // Get unique subject IDs for this teacher
    const uniqueSubjectIds = new Set();
    teacherAssignments.forEach(assignment => {
      const subjId = assignment.subject_id?._id || assignment.subject_id;
      if (subjId) {
        uniqueSubjectIds.add(subjId.toString());
      }
    });
    
    // Check if the new subject is already in teacher's assignments
    const isNewSubject = !uniqueSubjectIds.has(subjectId.toString());
    
    // If it's a new subject and teacher already has 2 subjects, reject
    if (isNewSubject && uniqueSubjectIds.size >= 2) {
      return false;
    }
    
    return true;
  };


  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setAssignmentInitialLoading(true);
      try {
        await Promise.all([
          assignmentFetchClasses(),
          assignmentFetchTeachers(),
          assignmentFetchStudents(),
          assignmentFetchAllSubjects()
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
        assignmentAddAlert('Error loading initial data. Please refresh the page.', 'error');
      } finally {
        setAssignmentInitialLoading(false);
      }
    };
    
    initializeData();
  }, []);

  // Update selected class and subject when navigation state changes
  useEffect(() => {
    try {
      if (location.state?.selectedClass) {
        setAssignmentSelectedClass(location.state.selectedClass);
        // Clear navigation state to prevent re-triggering
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      // Handle selectedSubject from Subjects page
      if (location.state?.selectedSubject) {
        setAssignmentSubjectTeacherForm(prev => ({
          ...prev,
          subject_id: location.state.selectedSubject
        }));
        // Set active form to subject-teacher assignment
        setAssignmentActiveForm('subject-teacher');
        // Clear navigation state to prevent re-triggering
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('Error handling navigation state:', error);
      assignmentAddAlert('Error processing navigation. Please try again.', 'error');
    }
  }, [location.state]);

  // Refresh teacher assignments when subject changes for validation
  useEffect(() => {
    if (assignmentSubjectTeacherForm.subject_id) {
      assignmentFetchAllTeacherAssignments();
    }
  }, [assignmentSubjectTeacherForm.subject_id]);

  // Handle class change
  useEffect(() => {
    const fetchClassData = async () => {
      if (assignmentSelectedClass) {
        setAssignmentClassDataLoading(true);
        try {
          // Fetch all class-related data in parallel
          const [classData, subjectsData] = await Promise.all([
            classAPI.getClass(assignmentSelectedClass),
            subjectAPI.getSubjectsForClass(assignmentSelectedClass)
          ]);
          
          // Update class info
          assignmentUpdateClassInfo(classData);
          
          // Set teacher assignments
          setAssignmentTeacherAssignments(classData.teacher_assignments || []);
          
          // Set student assignments - ensure proper filtering
          const students = Array.isArray(classData.students) 
            ? classData.students.filter(s => s !== null && s !== undefined && s._id && s.role === 'Student')
            : [];
          console.log('Fetched students for class:', assignmentSelectedClass, students.length, 'students');
          setAssignmentStudentAssignments(students);
          
          // Set class subjects - handle response structure
          let subjectsArray = [];
          if (Array.isArray(subjectsData)) {
            subjectsArray = subjectsData;
          } else if (subjectsData && Array.isArray(subjectsData.subjects)) {
            subjectsArray = subjectsData.subjects;
          } else if (subjectsData && subjectsData.data && Array.isArray(subjectsData.data.subjects)) {
            subjectsArray = subjectsData.data.subjects;
          }
          setAssignmentClassSubjects(subjectsArray);
        } catch (error) {
          console.error('Error fetching class data:', error);
          assignmentAddAlert('Error loading class data. Please try again.', 'error');
          setAssignmentTeacherAssignments([]);
          setAssignmentStudentAssignments([]);
          setAssignmentClassSubjects([]);
        } finally {
          setAssignmentClassDataLoading(false);
        }
      } else {
        setAssignmentTeacherAssignments([]);
        setAssignmentStudentAssignments([]);
        setAssignmentClassSubjects([]);
      }
    };
    
    // Only fetch if initial loading is complete
    if (!assignmentInitialLoading) {
      fetchClassData();
    }
  }, [assignmentSelectedClass, assignmentInitialLoading]);

  // Form handlers with unique names
  const assignmentHandleTeacherFormChange = (e) => {
    const { name, value } = e.target;
    setAssignmentTeacherForm(prev => ({
        ...prev,
      [name]: value
    }));
  };


  const assignmentHandleStudentFormChange = (e) => {
    const { name, value } = e.target;
    setAssignmentStudentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const assignmentHandleSubjectTeacherFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'course_limit') {
      // Allow typing freely - only parse on blur or if value is empty
      const numValue = value === '' ? '' : parseInt(value);
      setAssignmentSubjectTeacherForm(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? '' : numValue
      }));
    } else {
      setAssignmentSubjectTeacherForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const assignmentHandleCourseLimitBlur = (e) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 0) {
      setAssignmentSubjectTeacherForm(prev => ({
        ...prev,
        course_limit: 0
      }));
    } else if (value > 50) {
      setAssignmentSubjectTeacherForm(prev => ({
        ...prev,
        course_limit: 50
      }));
      assignmentAddAlert('Course limit cannot exceed 50. Value has been capped at 50.', 'warning');
    } else {
      setAssignmentSubjectTeacherForm(prev => ({
        ...prev,
        course_limit: value
      }));
    }
  };

  // Assignment handlers with unique names

  const assignmentHandleTeacherAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentSelectedClass || !assignmentTeacherForm.teacher_id) {
      assignmentAddAlert('Please select a class and teacher', 'error');
      return;
    }

    setAssignmentLoading(true);
    try {
      await classAPI.assignClassTeacher(
        assignmentSelectedClass,
        assignmentTeacherForm.teacher_id
      );
      assignmentAddAlert('Class teacher assigned successfully!', 'success');
      setAssignmentTeacherForm({
        teacher_id: ''
      });
      
      // Refresh class data to get updated info
      const updatedClass = await classAPI.getClass(assignmentSelectedClass);
      assignmentUpdateClassInfo(updatedClass);
      setAssignmentTeacherAssignments(updatedClass.teacher_assignments || []);
    } catch (error) {
      console.error('Error assigning class teacher:', error);
      assignmentAddAlert('Error assigning class teacher: ' + error.message, 'error');
    } finally {
      setAssignmentLoading(false);
    }
  };

  const assignmentHandleStudentAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentSelectedClass || !assignmentStudentForm.student_id) {
      assignmentAddAlert('Please select a class and student', 'error');
      return;
    }

    setAssignmentLoading(true);
    try {
      await classAPI.assignStudentToClass(assignmentSelectedClass, assignmentStudentForm.student_id);
      assignmentAddAlert('Student assigned successfully!', 'success');
      setAssignmentStudentForm({ student_id: '' });
      
      // Refresh class data to get updated student list
      const updatedClass = await classAPI.getClass(assignmentSelectedClass);
      const students = Array.isArray(updatedClass.students) 
        ? updatedClass.students.filter(s => s !== null && s !== undefined && s._id && s.role === 'Student')
        : [];
      setAssignmentStudentAssignments(students);
    } catch (error) {
      console.error('Error assigning student:', error);
      assignmentAddAlert('Error assigning student: ' + error.message, 'error');
    } finally {
      setAssignmentLoading(false);
    }
  };

  const assignmentHandleSubjectTeacherAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentSelectedClass || !assignmentSubjectTeacherForm.subject_id || !assignmentSubjectTeacherForm.teacher_id) {
      assignmentAddAlert('Please select a subject and teacher', 'error');
      return;
    }

    // Validate course limit is between 0 and 50
    const courseLimit = assignmentSubjectTeacherForm.course_limit;
    if (courseLimit === '' || isNaN(courseLimit) || courseLimit < 0) {
      assignmentAddAlert('Course limit must be between 0 and 50', 'error');
      return;
    }
    // Cap at 50 if above
    const finalCourseLimit = courseLimit > 50 ? 50 : courseLimit;
    if (courseLimit > 50) {
      assignmentAddAlert('Course limit cannot exceed 50. Using 50 as the limit.', 'error');
    }

    setAssignmentLoading(true);
    try {
      await classAPI.assignTeacherToSubject(
        assignmentSubjectTeacherForm.teacher_id,
        assignmentSubjectTeacherForm.subject_id,
        assignmentSelectedClass,
        finalCourseLimit
      );
      assignmentAddAlert('Teacher assigned to subject successfully!', 'success');
      setAssignmentSubjectTeacherForm({
        subject_id: '',
        teacher_id: '',
        course_limit: 1
      });
      await Promise.all([
        assignmentFetchTeacherAssignments(assignmentSelectedClass),
        assignmentFetchClassSubjects(assignmentSelectedClass),
        assignmentFetchAllTeacherAssignments() // Refresh teacher assignments for validation
      ]);
    } catch (error) {
      console.error('Error assigning teacher to subject:', error);
      assignmentAddAlert('Error assigning teacher: ' + error.message, 'error');
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Edit course limit handlers
  const assignmentHandleEditCourseLimit = (classId, subjectId, currentLimit) => {
    setAssignmentEditingClassId(classId);
    setAssignmentEditingSubjectId(subjectId);
    setAssignmentEditCourseLimit(currentLimit);
  };

  const assignmentHandleSaveCourseLimit = async () => {
    if (!assignmentEditingClassId || !assignmentEditingSubjectId) return;

    // Validate course limit is between 0 and 50
    if (assignmentEditCourseLimit < 0 || assignmentEditCourseLimit > 50) {
      assignmentAddAlert('Course limit must be between 0 and 50', 'error');
      return;
    }

    setAssignmentLoading(true);
    try {
      // Check if this is a grouped subject (Religion or Language)
      const isReligionGrouped = assignmentEditingSubjectId === 'religion-grouped';
      const isLanguageGrouped = assignmentEditingSubjectId === 'language-grouped';
      
      // Calculate current total course limits for validation
      // For grouped subjects, we need to handle them specially (count as 1 subject)
      let currentTotal = 0;
      const religionSubjects = new Set();
      const languageSubjects = new Set();
      
      assignmentClassSubjects.forEach(classSubject => {
        const subjectName = classSubject.subject_name || classSubject.subject_id?.subject_name;
        const courseLimit = classSubject.course_limit || 0;
        
        if (subjectName && assignmentIsReligionSubject(subjectName)) {
          // Religion subjects share one course limit - only count once
          if (religionSubjects.size === 0) {
            currentTotal += courseLimit;
            religionSubjects.add(subjectName);
          }
        } else if (subjectName && assignmentIsLanguageSubject(subjectName)) {
          // Tamil and Sinhala share one course limit - only count once
          if (languageSubjects.size === 0) {
            currentTotal += courseLimit;
            languageSubjects.add(subjectName);
          }
        } else {
          // Regular subject - count normally
          currentTotal += courseLimit;
        }
      });
      
      // Calculate new total after update
      let newTotal = currentTotal;
      let currentGroupLimit = 0;
      
      if (isReligionGrouped) {
        // Find current Religion course limit
        const religionSubject = assignmentClassSubjects.find(s => {
          const subjectName = s.subject_name || s.subject_id?.subject_name;
          return subjectName && assignmentIsReligionSubject(subjectName);
        });
        currentGroupLimit = religionSubject?.course_limit || 0;
        // Remove current Religion limit and add new one
        newTotal = currentTotal - currentGroupLimit + assignmentEditCourseLimit;
      } else if (isLanguageGrouped) {
        // Find current Language (Tamil/Sinhala) course limit
        const languageSubject = assignmentClassSubjects.find(s => {
          const subjectName = s.subject_name || s.subject_id?.subject_name;
          return subjectName && assignmentIsLanguageSubject(subjectName);
        });
        currentGroupLimit = languageSubject?.course_limit || 0;
        // Remove current Language limit and add new one
        newTotal = currentTotal - currentGroupLimit + assignmentEditCourseLimit;
      } else {
        // Regular subject - find current limit and replace
        const subjectData = assignmentClassSubjects.find(s => {
          const subjectId = s._id || s.subject_id?._id || s.subject_id;
          return subjectId === assignmentEditingSubjectId || 
                 subjectId?.toString() === assignmentEditingSubjectId?.toString();
        });
        currentGroupLimit = subjectData?.course_limit || 0;
        newTotal = currentTotal - currentGroupLimit + assignmentEditCourseLimit;
      }
      
      // Estimate max limit (backend will validate, but we can warn if it seems too high)
      // Default max is typically around 160-176 periods (20-22 weekdays * 8 periods)
      const estimatedMaxLimit = 176;
      
      if (newTotal > estimatedMaxLimit) {
        const remaining = estimatedMaxLimit - (currentTotal - currentGroupLimit);
        assignmentAddAlert(
          `Warning: Total course limits (${newTotal} periods) may exceed the maximum allowed (${estimatedMaxLimit} periods). ` +
          `Remaining available: ${remaining} periods. The backend will validate this.`,
          'warning'
        );
        // Continue anyway - backend will validate
      }
      
      if (isReligionGrouped || isLanguageGrouped) {
        // For grouped subjects, we need to find all related assignments and update them all
        let assignmentsToUpdate = [];
        
        if (isReligionGrouped) {
          // Find all Religion subject assignments
          const religionSubject = assignmentFindSubjectByName('Religion');
          if (religionSubject) {
            assignmentsToUpdate = assignmentClassSubjects
              .filter(s => {
                const subjectId = s._id || s.subject_id?._id || s.subject_id;
                const subjectName = s.subject_name || s.subject_id?.subject_name;
                return (subjectId === religionSubject._id?.toString()) ||
                       (subjectName && assignmentIsReligionSubject(subjectName));
              })
              .flatMap(s => s.assignments || [])
              .filter(a => a && a._id);
          }
        } else if (isLanguageGrouped) {
          // Find all Tamil and Sinhala subject assignments
          const tamilSubject = assignmentFindSubjectByName('Tamil');
          const sinhalaSubject = assignmentFindSubjectByName('Sinhala');
          
          assignmentsToUpdate = assignmentClassSubjects
            .filter(s => {
              const subjectId = s._id || s.subject_id?._id || s.subject_id;
              const subjectName = s.subject_name || s.subject_id?.subject_name;
              return (tamilSubject && subjectId === tamilSubject._id?.toString()) ||
                     (sinhalaSubject && subjectId === sinhalaSubject._id?.toString()) ||
                     (subjectName && assignmentIsLanguageSubject(subjectName));
            })
            .flatMap(s => s.assignments || [])
            .filter(a => a && a._id);
        }
        
        if (assignmentsToUpdate.length === 0) {
          assignmentAddAlert('Could not find assignments to update. Please ensure teachers are assigned to these subjects first.', 'error');
          setAssignmentLoading(false);
          return;
        }
        
        // Update all assignments for the grouped subject sequentially
        // This ensures proper validation since Religion/Language subjects share one course limit
        const errors = [];
        for (const assignment of assignmentsToUpdate) {
          try {
            await subjectAPI.updateClassSubjectCourseLimit(assignment._id, assignmentEditCourseLimit);
          } catch (error) {
            errors.push(error.message || error.toString());
            // If one fails, stop updating others
            break;
          }
        }
        
        if (errors.length > 0) {
          assignmentAddAlert(`Error updating course limit: ${errors[0]}`, 'error');
        } else {
          assignmentAddAlert('Course limit updated successfully for all related assignments!', 'success');
        }
      } else {
        // Regular subject - find the subject assignment
        const subjectData = assignmentClassSubjects.find(s => {
          const subjectId = s._id || s.subject_id?._id || s.subject_id;
          return subjectId === assignmentEditingSubjectId || 
                 subjectId?.toString() === assignmentEditingSubjectId?.toString();
        });

        if (subjectData) {
          // Get the assignment ID from the assignments array
          const assignmentId = subjectData.assignments?.[0]?._id;
          
          if (!assignmentId) {
            assignmentAddAlert('Could not find assignment ID. Please ensure a teacher is assigned to this subject first.', 'error');
            setAssignmentLoading(false);
            return;
          }
          
          await subjectAPI.updateClassSubjectCourseLimit(
            assignmentId,
            assignmentEditCourseLimit
          );
          assignmentAddAlert('Course limit updated successfully!', 'success');
        } else {
          assignmentAddAlert('Subject not found', 'error');
          setAssignmentLoading(false);
          return;
        }
      }
      
      // Refresh data after update
      if (assignmentSelectedClass === assignmentEditingClassId) {
        await assignmentFetchClassSubjects(assignmentSelectedClass);
      }
      
      setAssignmentEditingClassId(null);
      setAssignmentEditingSubjectId(null);
    } catch (error) {
      console.error('Error updating course limit:', error);
      assignmentAddAlert('Error updating course limit: ' + error.message, 'error');
    } finally {
      setAssignmentLoading(false);
    }
  };

  const assignmentHandleRemoveSubjectFromClass = async (subjectData, classId) => {
    // Check if this is a grouped subject (Religion or Language)
    const isGrouped = subjectData._id === 'religion-grouped' || subjectData._id === 'language-grouped';
    const subjectName = subjectData.subject_name || 'this subject';
    
    if (!window.confirm(
      isGrouped 
        ? `Are you sure you want to remove ${subjectName} from the class? This will remove ALL teacher assignments for ${subjectName}.`
        : 'Are you sure you want to remove this subject from the class? This will also remove all teacher assignments for this subject.'
    )) {
      return;
    }

    try {
      // If it's a grouped subject, remove all assignments from the grouped subjects
      if (isGrouped && subjectData.groupedSubjects && Array.isArray(subjectData.groupedSubjects)) {
        // Remove all assignments for all subjects in the group
        const removePromises = subjectData.groupedSubjects.flatMap(groupedSubject => {
          const assignments = groupedSubject.assignments || [];
          return assignments.map(assignment => {
            const assignmentId = assignment._id;
            if (assignmentId) {
              return subjectAPI.removeSubjectFromClass(assignmentId);
            }
            return Promise.resolve();
          });
        });
        
        await Promise.all(removePromises);
        assignmentAddAlert(`${subjectName} removed from class successfully!`, 'success');
      } else {
        // Regular subject - remove all assignments for this subject
        const assignments = subjectData.assignments || [];
        if (assignments.length === 0) {
          // Fallback to single assignment ID
          const assignmentId = subjectData._id || 
                              subjectData.assignment_id || 
                              subjectData.id;
          
          if (!assignmentId) {
            assignmentAddAlert('Could not find assignment ID', 'error');
            return;
          }
          
          await subjectAPI.removeSubjectFromClass(assignmentId);
        } else {
          // Remove all assignments
          const removePromises = assignments.map(assignment => {
            const assignmentId = assignment._id;
            if (assignmentId) {
              return subjectAPI.removeSubjectFromClass(assignmentId);
            }
            return Promise.resolve();
          });
          
          await Promise.all(removePromises);
        }
        assignmentAddAlert('Subject removed from class successfully!', 'success');
      }
      
      if (assignmentSelectedClass === classId) {
        // Refresh all data so removed subject appears back in dropdown
        // This ensures course limit totals are recalculated correctly
        await Promise.all([
          assignmentFetchClassSubjects(assignmentSelectedClass),
          assignmentFetchTeacherAssignments(assignmentSelectedClass),
          assignmentFetchAllTeacherAssignments()
        ]);
        // Clear form if the removed subject was selected
        if (assignmentSubjectTeacherForm.subject_id === subjectData._id?.toString() || 
            assignmentSubjectTeacherForm.subject_id === subjectData.subject_id?._id?.toString()) {
          setAssignmentSubjectTeacherForm(prev => ({
            ...prev,
            subject_id: '',
            teacher_id: ''
          }));
        }
      }
    } catch (error) {
      console.error('Error removing subject from class:', error);
      assignmentAddAlert('Error removing subject: ' + error.message, 'error');
    }
  };

  // Remove assignment handlers with unique names
  const assignmentHandleRemoveTeacherAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to remove this teacher assignment? This action cannot be undone.')) {
      return;
    }
    
    setAssignmentLoading(true);

    try {
      // Use the removeSubjectFromClass API to properly delete the assignment
      await subjectAPI.removeSubjectFromClass(assignmentId);
      assignmentAddAlert('Teacher assignment removed successfully!', 'success');
      // Refresh all data so removed teacher appears back in dropdown and list updates
      await Promise.all([
        assignmentFetchTeacherAssignments(assignmentSelectedClass),
        assignmentFetchClassSubjects(assignmentSelectedClass),
        assignmentFetchAllTeacherAssignments()
      ]);
      // Clear form if the removed teacher was selected
      setAssignmentSubjectTeacherForm(prev => ({
        ...prev,
        teacher_id: ''
      }));
    } catch (error) {
      console.error('Error removing teacher assignment:', error);
      assignmentAddAlert('Error removing teacher assignment: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setAssignmentLoading(false);
    }
  };

  const assignmentHandleRemoveStudentAssignment = async (studentId) => {
    if (!window.confirm('Are you sure you want to remove this student from the class?')) {
      return;
    }

    try {
      await classAPI.removeStudentFromClass(assignmentSelectedClass, studentId);
      assignmentAddAlert('Student removed from class successfully!', 'success');
      
      // Refresh class data to get updated student list
      const updatedClass = await classAPI.getClass(assignmentSelectedClass);
      const students = Array.isArray(updatedClass.students) 
        ? updatedClass.students.filter(s => s !== null && s !== undefined && s._id && s.role === 'Student')
        : [];
      setAssignmentStudentAssignments(students);
    } catch (error) {
      console.error('Error removing student assignment:', error);
      assignmentAddAlert('Error removing student assignment: ' + error.message, 'error');
    }
  };

  const assignmentHandleRemoveClassTeacher = async (teacherId) => {
    if (!window.confirm('Are you sure you want to remove this class teacher from the class?')) {
      return;
    }

    try {
      await classAPI.removeTeacherFromClass(assignmentSelectedClass, teacherId);
      assignmentAddAlert('Class teacher removed from class successfully!', 'success');
      // Refresh class data to get updated info
      const updatedClass = await classAPI.getClass(assignmentSelectedClass);
      assignmentUpdateClassInfo(updatedClass);
      setAssignmentTeacherAssignments(updatedClass.teacher_assignments || []);
    } catch (error) {
      console.error('Error removing class teacher:', error);
      assignmentAddAlert('Error removing class teacher: ' + error.message, 'error');
    }
  };

  // Get selected class info
  const assignmentGetSelectedClassInfo = () => {
    return assignmentClasses.find(cls => cls._id === assignmentSelectedClass);
  };

  // Normalize class teacher data regardless of backend shape
  const assignmentGetClassTeacherDetails = () => {
    const selectedClass = assignmentGetSelectedClassInfo();
    if (!selectedClass) return null;

    const directTeacherFromAssignment = selectedClass.class_teacher?.user_id;
    if (directTeacherFromAssignment) {
      return {
        id: directTeacherFromAssignment._id || directTeacherFromAssignment.id || directTeacherFromAssignment,
        teacher: {
          ...directTeacherFromAssignment,
          name: directTeacherFromAssignment.name || directTeacherFromAssignment.full_name || 'Unknown Teacher'
        }
      };
    }

    if (selectedClass.class_teacher?.name) {
      const teacherObj = selectedClass.class_teacher;
      return {
        id: teacherObj._id || teacherObj.id,
        teacher: {
          ...teacherObj,
          name: teacherObj.name || teacherObj.full_name || 'Unknown Teacher'
        }
      };
    }

    if (selectedClass.class_teacher_id) {
      if (typeof selectedClass.class_teacher_id === 'object') {
        const teacherObj = selectedClass.class_teacher_id;
        return {
          id: teacherObj._id || teacherObj.id,
          teacher: {
            ...teacherObj,
            name: teacherObj.name || teacherObj.full_name || 'Unknown Teacher'
          }
        };
      }

      const classTeacherId = selectedClass.class_teacher_id;
      const teacherFromList = assignmentTeachers.find(t => {
        if (!t || !t._id) return false;
        return t._id === classTeacherId || t._id?.toString() === classTeacherId?.toString();
      });

      if (teacherFromList) {
        return {
          id: teacherFromList._id,
          teacher: teacherFromList
        };
      }

      return {
        id: classTeacherId,
        teacher: {
          _id: classTeacherId,
          name: 'Unknown Teacher'
        }
      };
    }

    return null;
  };

  // Get all teachers for display (class teacher + subject teachers)
  const assignmentGetAllTeachersForDisplay = () => {
    const teachers = [];
    const teacherIdsAdded = new Set(); // Track unique teacher IDs to avoid duplicates
    const selectedClass = assignmentGetSelectedClassInfo();
    
    // Add class teacher if assigned
    const classTeacherDetails = assignmentGetClassTeacherDetails();
    if (classTeacherDetails?.teacher) {
      const teacherId = classTeacherDetails.id?.toString() || classTeacherDetails.teacher?._id?.toString();
      if (teacherId) {
        teacherIdsAdded.add(teacherId);
        teachers.push({
          _id: `class-teacher-${classTeacherDetails.id}`,
          teacher: classTeacherDetails.teacher,
          teacherId: classTeacherDetails.id, // Store teacher ID separately for removal
          type: 'class_teacher',
          label: 'Class Teacher'
        });
      }
    }
    
    // Add subject-specific teacher assignments
    if (assignmentTeacherAssignments && Array.isArray(assignmentTeacherAssignments)) {
      assignmentTeacherAssignments.forEach(assignment => {
        if (assignment?.user_id && assignment?.subject_id) {
          const teacherId = assignment.user_id._id?.toString() || assignment.user_id?.toString();
          // Check if this teacher is already added (as class teacher)
          const isClassTeacher = classTeacherDetails?.teacher && 
            (classTeacherDetails.id?.toString() === teacherId || 
             classTeacherDetails.teacher._id?.toString() === teacherId);
          
          teachers.push({
            _id: assignment._id,
            teacher: assignment.user_id,
            subject: assignment.subject_id,
            course_limit: assignment.course_limit,
            type: 'subject_teacher',
            label: assignment.subject_id?.subject_name || 'Unknown Subject',
            isAlsoClassTeacher: isClassTeacher // Flag to show this teacher is also class teacher
          });
        }
      });
    }
    
    return teachers;
  };

  // Get unique count of teachers (deduplicate if same teacher is class teacher and subject teacher)
  const assignmentGetUniqueTeacherCount = () => {
    const teacherIds = new Set();
    const classTeacherDetails = assignmentGetClassTeacherDetails();
    
    // Add class teacher ID
    if (classTeacherDetails?.teacher) {
      const teacherId = classTeacherDetails.id?.toString() || classTeacherDetails.teacher?._id?.toString();
      if (teacherId) teacherIds.add(teacherId);
    }
    
    // Add subject teacher IDs
    if (assignmentTeacherAssignments && Array.isArray(assignmentTeacherAssignments)) {
      assignmentTeacherAssignments.forEach(assignment => {
        if (assignment?.user_id) {
          const teacherId = assignment.user_id._id?.toString() || assignment.user_id?.toString();
          if (teacherId) teacherIds.add(teacherId);
        }
      });
    }
    
    return teacherIds.size;
  };

  // Get term name
  const assignmentGetTermName = (term) => {
    if (!term) return 'Unknown Term';
    const termNames = {
      1: 'First Term',
      2: 'Second Term',
      3: 'Third Term'
    };
    const termNumber = term.term_number;
    const yearLabel = term.academic_year_id?.year_label || 'Unknown Year';
    return `${termNames[termNumber] || `Term ${termNumber}`} - ${yearLabel}`;
  };

  // Helper function to check if a subject is Religion
  const assignmentIsReligionSubject = (subjectName) => {
    if (!subjectName) return false;
    const name = subjectName.toLowerCase().trim();
    // Check for "Religion" or any religion-specific subject
    return name === 'religion' || 
           name.includes('religion') ||
           name === 'hinduism' ||
           name === 'christianity' ||
           name === 'muslim' ||
           name === 'islam' ||
           name === 'buddhism';
  };

  // Helper function to check if a subject is Language (Tamil/Sinhala)
  const assignmentIsLanguageSubject = (subjectName) => {
    if (!subjectName) return false;
    const name = subjectName.toLowerCase().trim();
    // Check for Tamil, Sinhala, or Language (including combined names like "Sinhala / Tamil")
    // Also handle variations with slashes, dashes, or other separators
    const normalizedName = name.replace(/[\/\-\s]+/g, ' ').trim();
    return name === 'tamil' || 
           name === 'sinhala' || 
           normalizedName.includes('tamil') ||
           normalizedName.includes('sinhala') ||
           name.includes('tamil') ||
           name.includes('sinhala') ||
           name.includes('language');
  };

  // Helper function to find subject by name (case-insensitive)
  const assignmentFindSubjectByName = (subjectName) => {
    if (!assignmentSubjects || !Array.isArray(assignmentSubjects)) return null;
    const name = subjectName.toLowerCase().trim();
    return assignmentSubjects.find(subj => {
      const subjName = (subj.subject_name || '').toLowerCase().trim();
      return subjName === name || subjName.includes(name);
    });
  };

  // Handle Religion form changes
  const assignmentHandleReligionFormChange = (religionType, field, value) => {
    if (field === 'course_limit') {
      // Course limit is shared for all religion subjects
      setAssignmentReligionForm(prev => ({
        ...prev,
        course_limit: value
      }));
    } else {
      // Teacher assignment is per religion
      setAssignmentReligionForm(prev => ({
        ...prev,
        [religionType]: {
          ...prev[religionType],
          [field]: value
        }
      }));
    }
  };

  // Handle Language form changes
  const assignmentHandleLanguageFormChange = (languageType, field, value) => {
    if (field === 'course_limit') {
      // Course limit is shared for both language subjects
      setAssignmentLanguageForm(prev => ({
        ...prev,
        course_limit: value
      }));
    } else {
      // Teacher assignment is per language
      setAssignmentLanguageForm(prev => ({
        ...prev,
        [languageType]: {
          ...prev[languageType],
          [field]: value
        }
      }));
    }
  };

  // Handle Religion assignment submission
  // All 4 religion types share ONE "Religion" subject and ONE course limit (counted as 1 subject for validation)
  const assignmentHandleReligionAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentSelectedClass) {
      assignmentAddAlert('Please select a class first', 'error');
      return;
    }

    // Validate that all 4 religions have teachers and a shared course limit
    const sharedCourseLimit = assignmentReligionForm.course_limit || 0;
    if (sharedCourseLimit <= 0) {
      assignmentAddAlert('Please enter a course limit for religion subjects', 'error');
      return;
    }

    // Find the "Religion" subject (single subject for all religion types)
    const religionSubject = assignmentFindSubjectByName('Religion');
    if (!religionSubject) {
      assignmentAddAlert('Religion subject not found. Please create a "Religion" subject first.', 'error');
      return;
    }

    // Check if all teachers are assigned
    const missingTeachers = [];
    for (const religionType of ['hinduism', 'christianity', 'muslim', 'buddhism']) {
      if (!assignmentReligionForm[religionType]?.teacher_id) {
        missingTeachers.push(religionType);
      }
    }

    if (missingTeachers.length > 0) {
      assignmentAddAlert(`Please assign teachers for: ${missingTeachers.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}`, 'error');
      return;
    }

    setAssignmentLoading(true);
    const errors = [];
    const successes = [];

    try {
      // Assign all 4 religion types using the SAME "Religion" subject
      // Each religion type gets its own teacher assignment
      // The backend will count them as 1 subject for course limit validation
      for (const religionType of ['hinduism', 'christianity', 'muslim', 'buddhism']) {
        const formData = assignmentReligionForm[religionType];
        if (formData.teacher_id) {
          try {
            // Use the same Religion subject_id for all, but different teachers
            // Pass religion_type in the request body for backend to track
            await classAPI.assignTeacherToSubject(
              formData.teacher_id,
              religionSubject._id,
              assignmentSelectedClass,
              sharedCourseLimit, // Same course limit for all 4
              religionType // Pass religion type as metadata
            );
            successes.push(`${religionType.charAt(0).toUpperCase() + religionType.slice(1)} assigned`);
          } catch (error) {
            // Collect error messages but don't show individual ones
            errors.push(error.message);
          }
        }
      }

      if (successes.length > 0 && errors.length === 0) {
        assignmentAddAlert(`Religion subjects assigned successfully! Total course limit: ${sharedCourseLimit} periods (counted as 1 subject)`, 'success');
        // Reset form
        setAssignmentReligionForm({
          hinduism: { teacher_id: '' },
          christianity: { teacher_id: '' },
          muslim: { teacher_id: '' },
          buddhism: { teacher_id: '' },
          course_limit: 1
        });
        // Clear selected subject to return to regular subject assignment form
        setAssignmentSubjectTeacherForm({
          subject_id: '',
          teacher_id: '',
          course_limit: 1
        });
        // Refresh data
        await Promise.all([
          assignmentFetchClassSubjects(assignmentSelectedClass),
          assignmentFetchTeacherAssignments(assignmentSelectedClass),
          assignmentFetchAllTeacherAssignments()
        ]);
      } else if (errors.length > 0) {
        // Show ONE combined error message for all religion assignments
        const uniqueErrors = [...new Set(errors)]; // Remove duplicates
        assignmentAddAlert(`Religion subjects assignment failed: ${uniqueErrors[0]}`, 'error');
      }
    } catch (error) {
      assignmentAddAlert('Error assigning religion subjects: ' + error.message, 'error');
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Handle Language assignment submission
  // Both Tamil and Sinhala share ONE course limit (counted as 1 subject for validation)
  const assignmentHandleLanguageAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentSelectedClass) {
      assignmentAddAlert('Please select a class first', 'error');
      return;
    }

    // Validate that both languages have teachers and a shared course limit
    const sharedCourseLimit = assignmentLanguageForm.course_limit || 0;
    if (sharedCourseLimit <= 0) {
      assignmentAddAlert('Please enter a course limit for language subjects', 'error');
      return;
    }

    setAssignmentLoading(true);
    const errors = [];
    const successes = [];

    try {
      const languageSubjects = {
        tamil: assignmentFindSubjectByName('Tamil'),
        sinhala: assignmentFindSubjectByName('Sinhala')
      };

      // Check if subjects exist
      const missingSubjects = [];
      for (const [languageType, subject] of Object.entries(languageSubjects)) {
        if (!subject) {
          missingSubjects.push(languageType);
        }
      }

      if (missingSubjects.length > 0) {
        assignmentAddAlert(`Language subjects not found: ${missingSubjects.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}. Please create these subjects first.`, 'error');
        setAssignmentLoading(false);
        return;
      }

      // Check if all teachers are assigned
      const missingTeachers = [];
      for (const languageType of ['tamil', 'sinhala']) {
        if (!assignmentLanguageForm[languageType]?.teacher_id) {
          missingTeachers.push(languageType);
        }
      }

      if (missingTeachers.length > 0) {
        assignmentAddAlert(`Please assign teachers for: ${missingTeachers.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}`, 'error');
        setAssignmentLoading(false);
        return;
      }

      // Assign both language subjects using the SAME shared course limit
      for (const [languageType, subject] of Object.entries(languageSubjects)) {
        const formData = assignmentLanguageForm[languageType];
        if (subject && formData.teacher_id) {
          try {
            await classAPI.assignTeacherToSubject(
              formData.teacher_id,
              subject._id,
              assignmentSelectedClass,
              sharedCourseLimit // Same course limit for both
            );
            successes.push(`${languageType.charAt(0).toUpperCase() + languageType.slice(1)} assigned`);
          } catch (error) {
            // Collect error messages but don't show individual ones
            errors.push(error.message);
          }
        }
      }

      if (successes.length > 0 && errors.length === 0) {
        assignmentAddAlert(`Language subjects assigned successfully! Total course limit: ${sharedCourseLimit} periods (counted as 1 subject)`, 'success');
        // Reset form
        setAssignmentLanguageForm({
          tamil: { teacher_id: '' },
          sinhala: { teacher_id: '' },
          course_limit: 1
        });
        // Clear selected subject to return to regular subject assignment form
        setAssignmentSubjectTeacherForm({
          subject_id: '',
          teacher_id: '',
          course_limit: 1
        });
        // Refresh data
        await Promise.all([
          assignmentFetchClassSubjects(assignmentSelectedClass),
          assignmentFetchTeacherAssignments(assignmentSelectedClass),
          assignmentFetchAllTeacherAssignments()
        ]);
      } else if (errors.length > 0) {
        // Show ONE combined error message for all language assignments
        const uniqueErrors = [...new Set(errors)]; // Remove duplicates
        assignmentAddAlert(`Language subjects assignment failed: ${uniqueErrors[0]}`, 'error');
      }
    } catch (error) {
      assignmentAddAlert('Error assigning language subjects: ' + error.message, 'error');
    } finally {
      setAssignmentLoading(false);
    }
  };

  return (
    <AdminLayout 
      pageTitle="Assignment Management" 
      pageDescription="Manage teacher and student assignments to classes"
    >
      {/* Alerts */}
      <div className="assignment-alerts-container">
        {assignmentAlerts.map(alert => (
          <div key={alert.id} className={`assignment-alert assignment-alert-${alert.type}`}>
            {alert.message}
          </div>
        ))}
      </div>

      <div className="assignment-management-container">
      {/* Header */}
        <div className="assignment-management-header">
          <div className="assignment-header-left">
            <h1 className="assignment-page-main-title">Assignment Management</h1>
            <p>Manage teacher and student assignments to classes</p>
        </div>
          <div className="assignment-header-right">
          <button 
              className="assignment-btn assignment-btn-primary"
              onClick={() => navigate('/admin/classes')}
          >
              Manage Classes
          </button>
        </div>
      </div>

        {/* Selection Filters */}
        <div className="assignment-selection-filters">
          <div className="assignment-filter-group">
            <label htmlFor="assignment-class-filter">Select Class:</label>
            <select 
              id="assignment-class-filter"
              value={assignmentSelectedClass}
              onChange={(e) => setAssignmentSelectedClass(e.target.value)}
              className="assignment-filter-select"
            >
              <option value="">Select Class</option>
              {assignmentClasses && Array.isArray(assignmentClasses) && assignmentClasses.map(cls => (
                <option key={cls._id} value={cls._id}>
                  {cls.class_name || 'Unknown'} (Grade {cls.grade || 'N/A'}, Section {cls.section || 'N/A'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading Indicator */}
        {assignmentInitialLoading && (
          <div className="assignment-loading-container">
            <div className="assignment-loading-spinner"></div>
            <p>Loading assignment data...</p>
          </div>
        )}

        {/* Class Information */}
        {assignmentSelectedClass && !assignmentInitialLoading && (
          <div className="assignment-class-info" style={{ position: 'relative' }}>
            {assignmentClassDataLoading && (
              <div className="assignment-loading-overlay">
                <div className="assignment-loading-spinner"></div>
                <span>Loading class data...</span>
              </div>
            )}
            <h3>Class Information</h3>
            <div className="assignment-class-details">
              <div className="assignment-class-detail-item">
                <span className="assignment-class-detail-label">Class:</span>
                <span className="assignment-class-detail-value">{assignmentGetSelectedClassInfo()?.class_name}</span>
              </div>
              <div className="assignment-class-detail-item">
                <span className="assignment-class-detail-label">Grade:</span>
                <span className="assignment-class-detail-value">{assignmentGetSelectedClassInfo()?.grade}</span>
              </div>
              <div className="assignment-class-detail-item">
                <span className="assignment-class-detail-label">Section:</span>
                <span className="assignment-class-detail-value">{assignmentGetSelectedClassInfo()?.section}</span>
              </div>
              <div className="assignment-class-detail-item assignment-class-detail-item-highlight">
                <span className="assignment-class-detail-label">📖 Subjects:</span>
                <span className="assignment-class-detail-value assignment-class-detail-value-bold">
                  {assignmentClassSubjects.length} assigned
                </span>
              </div>
              <div className="assignment-class-detail-item assignment-class-detail-item-highlight">
                <span className="assignment-class-detail-label">👨‍🏫 Teachers:</span>
                <span className="assignment-class-detail-value assignment-class-detail-value-bold">
                  {assignmentGetUniqueTeacherCount()} assigned
                </span>
              </div>
              <div className="assignment-class-detail-item assignment-class-detail-item-highlight">
                <span className="assignment-class-detail-label">👥 Students:</span>
                <span className="assignment-class-detail-value assignment-class-detail-value-bold">
                  {assignmentStudentAssignments.length} enrolled
                </span>
              </div>
              <div className="assignment-class-detail-item">
                <span className="assignment-class-detail-label">Class Teacher:</span>
                <span className="assignment-class-detail-value">
                  {(() => {
                    const classTeacherDetails = assignmentGetClassTeacherDetails();
                    if (classTeacherDetails?.teacher) {
                      return classTeacherDetails.teacher.name || 'Unknown Teacher';
                    }
                    return 'Not Assigned';
                  })()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Message when subject is selected but no class */}
        {!assignmentSelectedClass && assignmentSubjectTeacherForm.subject_id && !assignmentInitialLoading && (
          <div className="assignment-alert assignment-alert-info" style={{ margin: '20px 0', padding: '15px' }}>
            <strong>Subject Selected:</strong> Please select a class to assign a teacher to this subject.
          </div>
        )}

        {/* Assignment Actions */}
        {assignmentSelectedClass && (
          <div className="assignment-actions-section">
            {/* Form Toggle Buttons */}
            <div className="assignment-form-toggle">
              <button 
                type="button"
                className={`assignment-toggle-btn ${assignmentActiveForm === 'subject-teacher' ? 'active' : ''}`}
                onClick={() => setAssignmentActiveForm('subject-teacher')}
              >
                Assign Subject Teacher
              </button>
              <button 
                type="button"
                className={`assignment-toggle-btn ${assignmentActiveForm === 'teacher' ? 'active' : ''}`}
                onClick={() => setAssignmentActiveForm('teacher')}
              >
                Assign Class Teacher
              </button>
              <button 
                type="button"
                className={`assignment-toggle-btn ${assignmentActiveForm === 'student' ? 'active' : ''}`}
                onClick={() => setAssignmentActiveForm('student')}
              >
                Assign Student
              </button>
            </div>
            
            <div className="assignment-actions-grid">
              {/* Subject Teacher Assignment Form */}
              {assignmentActiveForm === 'subject-teacher' && (
              <div className="assignment-form-card">
                <div className="assignment-form-header">
                  <h3>Assign Teacher to Subject</h3>
                  <p className="assignment-form-description">
                    Assign a teacher to teach a subject for <strong>{assignmentGetSelectedClassInfo()?.class_name || 'the selected class'}</strong>.
                  </p>
                </div>
                
                {/* Special UI for Religion and Language subjects */}
                {(() => {
                  const selectedSubject = assignmentSubjects.find(s => s._id === assignmentSubjectTeacherForm.subject_id);
                  const isReligion = selectedSubject && assignmentIsReligionSubject(selectedSubject.subject_name);
                  const isLanguage = selectedSubject && assignmentIsLanguageSubject(selectedSubject.subject_name);
                  
                  if (isReligion) {
                    return (
                      <form onSubmit={assignmentHandleReligionAssignment} className="assignment-form">
                        <div className="assignment-special-subject-header">
                          <h4>Religion Subjects - Assign Teachers for Each Religion</h4>
                          <p>Assign separate teachers for each religion subject. All 4 religion subjects (Hinduism, Christianity, Muslim, Buddhism) share ONE course limit and are counted as 1 subject for validation purposes.</p>
                        </div>
                        
                        <div className="assignment-religion-course-limit-section">
                          <div className="assignment-form-group">
                            <label>Course Limit (Shared for All Religion Subjects):</label>
                            <input
                              type="number"
                              value={assignmentReligionForm.course_limit}
                              onChange={(e) => assignmentHandleReligionFormChange(null, 'course_limit', parseInt(e.target.value) || 0)}
                              min="0"
                              max="50"
                              className="assignment-form-input"
                              required
                            />
                            <small className="assignment-form-help">
                              This course limit applies to all 4 religion subjects combined (counted as 1 subject for validation)
                            </small>
                          </div>
                        </div>
                        
                        <div className="assignment-multi-slot-container">
                          {['hinduism', 'christianity', 'muslim', 'buddhism'].map((religionType) => {
                            const religionSubject = assignmentFindSubjectByName('Religion');
                            const formData = assignmentReligionForm[religionType];
                            
                            // Check if this religion type (teacher) is already assigned to Religion subject in this class
                            const isAssigned = assignmentTeacherAssignments.some(assignment => {
                              const assignmentSubjectId = assignment.subject_id?._id?.toString() || assignment.subject_id?.toString();
                              const assignmentClassId = assignment.class_id?._id?.toString() || assignment.class_id?.toString();
                              const assignmentTeacherId = assignment.user_id?._id?.toString() || assignment.user_id?.toString();
                              
                              // Check if this teacher is already assigned to Religion subject in this class
                              return assignmentSubjectId === religionSubject?._id?.toString() &&
                                     assignmentClassId === assignmentSelectedClass?.toString() &&
                                     assignmentTeacherId === formData?.teacher_id;
                            });
                            
                            return (
                              <div key={religionType} className="assignment-slot-card">
                                <h5>{religionType.charAt(0).toUpperCase() + religionType.slice(1)}</h5>
                                {isAssigned && formData?.teacher_id ? (
                                  <p className="assignment-slot-assigned">Teacher already assigned for this religion type</p>
                                ) : (
                                  <div className="assignment-form-group">
                                    <label>Teacher:</label>
                                    <select
                                      value={formData?.teacher_id || ''}
                                      onChange={(e) => assignmentHandleReligionFormChange(religionType, 'teacher_id', e.target.value)}
                                      className="assignment-form-select"
                                      required
                                    >
                                      <option value="">Select Teacher</option>
                                      {assignmentTeachers
                                        .filter(teacher => {
                                          if (!teacher || teacher.role !== 'Teacher') return false;
                                          
                                          // Check if teacher can be assigned (max 2 subjects rule)
                                          if (!assignmentCanTeacherBeAssigned(teacher._id, religionSubject?._id)) {
                                            return false;
                                          }
                                          
                                          // Check if this teacher is already assigned to Religion subject in this class
                                          const teacherId = teacher._id?.toString();
                                          const isAlreadyAssigned = assignmentTeacherAssignments.some(assignment => {
                                            const assignmentSubjectId = assignment.subject_id?._id?.toString() || assignment.subject_id?.toString();
                                            const assignmentClassId = assignment.class_id?._id?.toString() || assignment.class_id?.toString();
                                            const assignmentTeacherId = assignment.user_id?._id?.toString() || assignment.user_id?.toString();
                                            
                                            return assignmentSubjectId === religionSubject?._id?.toString() &&
                                                   assignmentClassId === assignmentSelectedClass?.toString() &&
                                                   assignmentTeacherId === teacherId;
                                          });
                                          
                                          // Filter out already assigned teachers
                                          return !isAlreadyAssigned;
                                        })
                                        .map(teacher => (
                                          <option key={teacher._id} value={teacher._id}>
                                            {teacher.name}
                                          </option>
                                        ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                          <button 
                            type="button" 
                            className="assignment-btn assignment-btn-secondary"
                            onClick={() => {
                              setAssignmentSubjectTeacherForm({
                                subject_id: '',
                                teacher_id: '',
                                course_limit: 1
                              });
                            }}
                            disabled={assignmentLoading}
                          >
                            ← Select Different Subject
                          </button>
                          <button 
                            type="submit" 
                            className="assignment-btn assignment-btn-assign"
                            disabled={assignmentLoading}
                          >
                            {assignmentLoading ? 'Assigning...' : 'Assign All Religion Subjects'}
                          </button>
                        </div>
                      </form>
                    );
                  }
                  
                  // Special UI for Language subjects (isLanguage already declared above)
                  if (isLanguage) {
                    return (
                      <form onSubmit={assignmentHandleLanguageAssignment} className="assignment-form">
                        <div className="assignment-special-subject-header">
                          <h4>Language Subjects - Assign Teachers for Tamil and Sinhala</h4>
                          <p>Assign separate teachers for Tamil and Sinhala. Both language subjects share ONE course limit and are counted as 1 subject for validation purposes.</p>
                        </div>
                        
                        <div className="assignment-religion-course-limit-section">
                          <div className="assignment-form-group">
                            <label>Course Limit (Shared for Both Language Subjects):</label>
                            <input
                              type="number"
                              value={assignmentLanguageForm.course_limit}
                              onChange={(e) => assignmentHandleLanguageFormChange(null, 'course_limit', parseInt(e.target.value) || 0)}
                              min="0"
                              max="50"
                              className="assignment-form-input"
                              required
                            />
                            <small className="assignment-form-help">
                              This course limit applies to both Tamil and Sinhala subjects combined (counted as 1 subject for validation)
                            </small>
                          </div>
                        </div>
                        
                        <div className="assignment-multi-slot-container">
                          {['tamil', 'sinhala'].map((languageType) => {
                            const languageSubject = assignmentFindSubjectByName(languageType.charAt(0).toUpperCase() + languageType.slice(1));
                            const formData = assignmentLanguageForm[languageType];
                            
                            // Check if this language type (teacher) is already assigned to this language subject in this class
                            const isAssigned = assignmentTeacherAssignments.some(assignment => {
                              const assignmentSubjectId = assignment.subject_id?._id?.toString() || assignment.subject_id?.toString();
                              const assignmentClassId = assignment.class_id?._id?.toString() || assignment.class_id?.toString();
                              const assignmentTeacherId = assignment.user_id?._id?.toString() || assignment.user_id?.toString();
                              
                              // Check if this teacher is already assigned to this language subject in this class
                              return assignmentSubjectId === languageSubject?._id?.toString() &&
                                     assignmentClassId === assignmentSelectedClass?.toString() &&
                                     assignmentTeacherId === formData?.teacher_id;
                            });
                            
                            return (
                              <div key={languageType} className="assignment-slot-card">
                                <h5>{languageType.charAt(0).toUpperCase() + languageType.slice(1)}</h5>
                                {isAssigned && formData?.teacher_id ? (
                                  <p className="assignment-slot-assigned">Teacher already assigned for this language</p>
                                ) : (
                                  <div className="assignment-form-group">
                                    <label>Teacher:</label>
                                    <select
                                      value={formData?.teacher_id || ''}
                                      onChange={(e) => assignmentHandleLanguageFormChange(languageType, 'teacher_id', e.target.value)}
                                      className="assignment-form-select"
                                      required
                                    >
                                      <option value="">Select Teacher</option>
                                      {assignmentTeachers
                                        .filter(teacher => {
                                          if (!teacher || teacher.role !== 'Teacher') return false;
                                          
                                          // Check if teacher can be assigned (max 2 subjects rule)
                                          if (!assignmentCanTeacherBeAssigned(teacher._id, languageSubject?._id)) {
                                            return false;
                                          }
                                          
                                          // Check if this teacher is already assigned to this language subject in this class
                                          const teacherId = teacher._id?.toString();
                                          const isAlreadyAssigned = assignmentTeacherAssignments.some(assignment => {
                                            const assignmentSubjectId = assignment.subject_id?._id?.toString() || assignment.subject_id?.toString();
                                            const assignmentClassId = assignment.class_id?._id?.toString() || assignment.class_id?.toString();
                                            const assignmentTeacherId = assignment.user_id?._id?.toString() || assignment.user_id?.toString();
                                            
                                            return assignmentSubjectId === languageSubject?._id?.toString() &&
                                                   assignmentClassId === assignmentSelectedClass?.toString() &&
                                                   assignmentTeacherId === teacherId;
                                          });
                                          
                                          // Filter out already assigned teachers
                                          return !isAlreadyAssigned;
                                        })
                                        .map(teacher => (
                                          <option key={teacher._id} value={teacher._id}>
                                            {teacher.name}
                                          </option>
                                        ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                          <button 
                            type="button" 
                            className="assignment-btn assignment-btn-secondary"
                            onClick={() => {
                              setAssignmentSubjectTeacherForm({
                                subject_id: '',
                                teacher_id: '',
                                course_limit: 1
                              });
                            }}
                            disabled={assignmentLoading}
                          >
                            ← Select Different Subject
                          </button>
                          <button 
                            type="submit" 
                            className="assignment-btn assignment-btn-assign"
                            disabled={assignmentLoading}
                          >
                            {assignmentLoading ? 'Assigning...' : 'Assign All Language Subjects'}
                          </button>
                        </div>
                      </form>
                    );
                  }
                  
                  // Regular single subject form
                  return (
                    <form onSubmit={assignmentHandleSubjectTeacherAssignment} className="assignment-form">
                      <div className="assignment-form-row">
                    <div className="assignment-form-group">
                      <label htmlFor="assignment-subject-select">Subject:</label>
                      <select 
                        id="assignment-subject-select"
                        name="subject_id"
                        value={assignmentSubjectTeacherForm.subject_id}
                        onChange={assignmentHandleSubjectTeacherFormChange}
                        required
                        className="assignment-form-select"
                      >
                        <option value="">Select Subject</option>
                        {assignmentSubjects && Array.isArray(assignmentSubjects) && assignmentSubjects.length > 0 ? (
                          assignmentSubjects
                            .filter(subject => {
                              if (!subject || subject.is_active === false) return false;
                              // Filter out subjects already assigned to this class (class-wise filtering)
                              if (assignmentSelectedClass && assignmentClassSubjects.length > 0) {
                                const subjectId = subject._id?.toString();
                                const isAlreadyAssigned = assignmentClassSubjects.some(assignedSubject => {
                                  const assignedId = assignedSubject._id?.toString() || 
                                                    assignedSubject.subject_id?._id?.toString() ||
                                                    assignedSubject.subject_id?.toString();
                                  return assignedId === subjectId;
                                });
                                return !isAlreadyAssigned;
                              }
                              return true;
                            })
                            .map(subject => {
                              const subjectId = subject._id;
                              const subjectName = subject.subject_name || 'Unknown Subject';
                              return (
                                <option key={subjectId} value={subjectId}>
                                  {subjectName}
                                </option>
                              );
                            })
                        ) : (
                          <option value="" disabled>No subjects available</option>
                        )}
                      </select>
                      <small className="assignment-form-help">
                        {assignmentSelectedClass && assignmentClassSubjects.length > 0 
                          ? `${assignmentClassSubjects.length} subject(s) already assigned to this class - hidden from list`
                          : 'All available subjects are shown'}
                      </small>
                    </div>

                    <div className="assignment-form-group">
                      <label htmlFor="assignment-subject-teacher-select">Teacher:</label>
                      <select 
                        id="assignment-subject-teacher-select"
                        name="teacher_id"
                        value={assignmentSubjectTeacherForm.teacher_id}
                        onChange={assignmentHandleSubjectTeacherFormChange}
                        required
                        className="assignment-form-select"
                      >
                        <option value="">Select Teacher</option>
                        {assignmentTeachers && Array.isArray(assignmentTeachers) && assignmentTeachers
                          .filter(teacher => {
                            // Only filter out non-teachers or deleted teachers
                            if (!teacher || teacher.role !== 'Teacher' || teacher.is_deleted || teacher.nic_number === 'UNASSIGNED_SYSTEM') return false;
                            
                            // Show ALL teachers - no filtering by existing assignments
                            // Just check if teacher can be assigned to selected subject (max 2 different subjects)
                            if (assignmentSubjectTeacherForm.subject_id) {
                              return assignmentCanTeacherBeAssigned(teacher._id, assignmentSubjectTeacherForm.subject_id);
                            }
                            return true;
                          })
                          .map(teacher => {
                            // Get teacher's current subjects for display
                            const teacherAssignments = assignmentAllTeacherAssignments.filter(
                              assignment => assignment.user_id?._id === teacher._id || assignment.user_id === teacher._id
                            );
                            const uniqueSubjectIds = new Set();
                            teacherAssignments.forEach(assignment => {
                              const subjId = assignment.subject_id?._id || assignment.subject_id;
                              if (subjId) uniqueSubjectIds.add(subjId.toString());
                            });
                            const subjectCount = uniqueSubjectIds.size;
                            const canAssign = !assignmentSubjectTeacherForm.subject_id || 
                              assignmentCanTeacherBeAssigned(teacher._id, assignmentSubjectTeacherForm.subject_id);
                            
                            return (
                              <option 
                                key={teacher._id} 
                                value={teacher._id}
                                disabled={!canAssign}
                              >
                                {teacher.name || 'Unknown Teacher'}
                                {subjectCount >= 2 && !canAssign ? ' (Max 2 subjects reached)' : 
                                 subjectCount > 0 ? ` (${subjectCount} subject${subjectCount > 1 ? 's' : ''})` : ''}
                              </option>
                            );
                          })}
                      </select>
                    </div>

                    <div className="assignment-form-group">
                      <label htmlFor="assignment-subject-course-limit">Course Limit (Periods):</label>
                      <input 
                        type="number" 
                        id="assignment-subject-course-limit"
                        name="course_limit"
                        value={assignmentSubjectTeacherForm.course_limit === '' ? '' : assignmentSubjectTeacherForm.course_limit}
                        onChange={assignmentHandleSubjectTeacherFormChange}
                        onBlur={assignmentHandleCourseLimitBlur}
                        min="0"
                        max="50"
                        required
                        className="assignment-form-input"
                      />
                      <small className="assignment-form-help">
                        Number of periods per month (0-50). Values above 50 will be capped automatically.
                      </small>
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="assignment-btn assignment-btn-assign"
                    disabled={assignmentLoading || !assignmentSubjectTeacherForm.subject_id || !assignmentSubjectTeacherForm.teacher_id}
                  >
                    {assignmentLoading ? 'Assigning...' : 'Assign Teacher to Subject'}
                  </button>
                    </form>
                  );
                })()}
              </div>
              )}

              {/* Class Teacher Assignment Form */}
              {assignmentActiveForm === 'teacher' && (
              <div className="assignment-form-card">
                <div className="assignment-form-header">
                  <h3>Assign Class Teacher</h3>
                  <p className="assignment-form-description">
                    Assign a class teacher to <strong>{assignmentGetSelectedClassInfo()?.class_name || 'the selected class'}</strong>. 
                    The class teacher will be responsible for managing this class. Subjects are assigned to teachers separately.
                  </p>
            </div>
                {(() => {
                  // Check if class already has a class teacher
                  const selectedClass = assignmentClasses.find(c => c && c._id === assignmentSelectedClass);
                  const currentClassTeacherId = selectedClass?.class_teacher_id?._id || selectedClass?.class_teacher_id;
                  const classTeacherDetails = assignmentGetClassTeacherDetails();
                  const hasClassTeacher = !!classTeacherDetails?.teacher;
                  
                  if (hasClassTeacher) {
                    return (
                      <div className="assignment-form" style={{ padding: '20px' }}>
                        <div className="assignment-alert assignment-alert-warning" style={{ marginBottom: '20px' }}>
                          <strong>Class Teacher Already Assigned</strong>
                          <p style={{ margin: '10px 0 0 0' }}>
                            This class already has a class teacher assigned: <strong>{classTeacherDetails.teacher.name || 'Unknown Teacher'}</strong>.
                          </p>
                          <p style={{ margin: '10px 0 0 0' }}>
                            Please remove the current class teacher from the "Class Teacher" section below before assigning a new one.
                          </p>
                        </div>
                        <div style={{ 
                          opacity: 0.6, 
                          pointerEvents: 'none',
                          position: 'relative'
                        }}>
                          <div className="assignment-form-group">
                            <label htmlFor="assignment-teacher-select">Teacher:</label>
                            <select 
                              id="assignment-teacher-select"
                              name="teacher_id"
                              value=""
                              disabled
                              className="assignment-form-select"
                            >
                              <option value="">Select Teacher (Disabled - Remove current class teacher first)</option>
                            </select>
                          </div>
                          <button 
                            type="button" 
                            className="assignment-btn assignment-btn-assign"
                            disabled
                            style={{ cursor: 'not-allowed' }}
                          >
                            Assign Class Teacher (Disabled)
                          </button>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <form onSubmit={assignmentHandleTeacherAssignment} className="assignment-form">
                  <div className="assignment-form-group">
                    <label htmlFor="assignment-teacher-select">Teacher:</label>
                <select 
                      id="assignment-teacher-select"
                      name="teacher_id"
                      value={assignmentTeacherForm.teacher_id}
                      onChange={assignmentHandleTeacherFormChange}
                  required
                      className="assignment-form-select"
                >
          <option value="">Select Teacher</option>
                      {(() => {
                        try {
                          if (!assignmentTeachers || !Array.isArray(assignmentTeachers)) {
                            return <option value="" disabled>No teachers available</option>;
                          }
                          
                          // Get current class teacher if any
                          const selectedClass = assignmentClasses.find(c => c && c._id === assignmentSelectedClass);
                          const currentClassTeacherId = selectedClass?.class_teacher_id?._id || selectedClass?.class_teacher_id;
                          
                          // Get all teachers who are already class teachers for other classes
                          const teachersAlreadyClassTeachers = new Set();
                          assignmentClasses.forEach(cls => {
                            if (cls && cls._id && cls._id !== assignmentSelectedClass) {
                              // Check class_teacher_id field
                              const classTeacherId = cls.class_teacher_id?._id || cls.class_teacher_id;
                              if (classTeacherId) {
                                teachersAlreadyClassTeachers.add(classTeacherId.toString());
                              }
                              
                              // Check class_teacher object if it exists
                              if (cls.class_teacher) {
                                // Check if class_teacher has user_id
                                if (cls.class_teacher.user_id) {
                                  const teacherId = cls.class_teacher.user_id?._id || cls.class_teacher.user_id;
                                  if (teacherId) {
                                    teachersAlreadyClassTeachers.add(teacherId.toString());
                                  }
                                }
                                // Check if class_teacher itself is the teacher object
                                if (cls.class_teacher._id) {
                                  teachersAlreadyClassTeachers.add(cls.class_teacher._id.toString());
                                }
                              }
                            }
                          });
                          
                          // Show ALL teachers - don't filter, just disable if already class teacher elsewhere
                          return assignmentTeachers
                            .filter(teacher => {
                              // Only filter out non-teachers, deleted teachers, or unassigned teacher
                              if (!teacher || teacher.role !== 'Teacher' || teacher.is_deleted || teacher.nic_number === 'UNASSIGNED_SYSTEM') {
                                return false;
                              }
                              return true;
                            })
                            .map(teacher => {
                              const teacherId = teacher._id?.toString();
                              
                              // Check if teacher is class teacher for another class (not current class)
                              const isClassTeacherElsewhere = teachersAlreadyClassTeachers.has(teacherId) && 
                                                             teacherId !== currentClassTeacherId?.toString();
                              
                              return (
                              <option 
                                key={teacher._id} 
                                value={teacher._id}
                                disabled={isClassTeacherElsewhere}
                              >
                                  {teacher.name || 'Unknown Teacher'}
                                  {isClassTeacherElsewhere ? ' (Already Class Teacher for Another Class)' : ''}
                              </option>
                              );
                            });
                        } catch (error) {
                          console.error('Error rendering teachers:', error);
                          return (
                            <option value="" disabled>
                              Error loading teachers
                            </option>
                          );
                        }
                      })()}
        </select>
                    <small className="assignment-form-help">
                      Select a teacher to assign as the class teacher for <strong>{assignmentGetSelectedClassInfo()?.class_name || 'this class'}</strong>. 
                      Teachers who are already class teachers for other classes are not available for selection.
                    </small>
              </div>
              
                      <button 
                        type="submit" 
                        className="assignment-btn assignment-btn-assign"
                        disabled={assignmentLoading || !assignmentTeacherForm.teacher_id}
                      >
                        {assignmentLoading ? 'Assigning...' : `Assign Class Teacher to ${assignmentGetSelectedClassInfo()?.class_name || 'Class'}`}
                      </button>
                    </form>
                  );
                })()}
              </div>
              )}
              
              {/* Student Assignment Form */}
              {assignmentActiveForm === 'student' && (
              <div className="assignment-form-card">
                <div className="assignment-form-header">
              <h3>Assign Student to Class</h3>
            </div>
                <form onSubmit={assignmentHandleStudentAssignment} className="assignment-form">
                  <div className="assignment-form-group">
                    <label htmlFor="assignment-student-select">Student:</label>
                <select 
                      id="assignment-student-select"
                      name="student_id"
                      value={assignmentStudentForm.student_id}
                      onChange={assignmentHandleStudentFormChange}
                  required
                      className="assignment-form-select"
                >
                  <option value="">Select Student</option>
                      {assignmentStudents && Array.isArray(assignmentStudents) && assignmentStudents
                        .filter(student => {
                          if (!student || student.role !== 'Student') return false;
                          const isAlreadyAssigned = assignmentStudentAssignments && Array.isArray(assignmentStudentAssignments)
                            ? assignmentStudentAssignments.some(sa => sa && sa._id === student._id)
                            : false;
                          const hasClassAssignment = student.class_assignments && Array.isArray(student.class_assignments)
                            ? student.class_assignments.some(ca => ca && ca.class_id)
                            : false;
                          return !isAlreadyAssigned && !hasClassAssignment;
                        })
                        .map(student => (
                    <option key={student._id} value={student._id}>
                      {student.name || 'Unknown Student'}
                    </option>
                  ))}
                </select>
              </div>
              
                  <button 
                    type="submit" 
                    className="assignment-btn assignment-btn-assign"
                    disabled={assignmentLoading}
                  >
                    {assignmentLoading ? 'Assigning...' : 'Assign Student'}
                  </button>
                </form>
              </div>
              )}
            </div>
          </div>
        )}

        {/* Current Assignments */}
        {assignmentSelectedClass && (
          <div className="assignment-current-assignments">
            <div className="assignment-assignments-grid">
              {/* Class Subjects */}
              {assignmentClassSubjects.length > 0 && (
                <div className="assignment-assignments-card">
                  <div className="assignment-assignments-header">
                    <h3>Subjects Assigned to This Class</h3>
                    <span className="assignment-count-badge">
                      {(() => {
                        // Count grouped subjects correctly (Religion as 1, Tamil/Sinhala as 1)
                        const religionCount = assignmentClassSubjects.filter(s => {
                          const name = s.subject_name || s.subject_id?.subject_name;
                          return assignmentIsReligionSubject(name);
                        }).length > 0 ? 1 : 0;
                        const languageCount = assignmentClassSubjects.filter(s => {
                          const name = s.subject_name || s.subject_id?.subject_name;
                          return assignmentIsLanguageSubject(name);
                        }).length > 0 ? 1 : 0;
                        const regularCount = assignmentClassSubjects.filter(s => {
                          const name = s.subject_name || s.subject_id?.subject_name;
                          return !assignmentIsReligionSubject(name) && !assignmentIsLanguageSubject(name);
                        }).length;
                        return religionCount + languageCount + regularCount;
                      })()} subjects
                    </span>
                  </div>
                  <div className="assignment-assignments-list">
                    {assignmentClassSubjects && Array.isArray(assignmentClassSubjects) && assignmentClassSubjects.length > 0 ? (
                      (() => {
                        // Group Religion subjects together and Tamil/Sinhala together
                        const groupedSubjects = new Map();
                        const religionSubjects = [];
                        const languageSubjects = [];
                        
                        assignmentClassSubjects.forEach(classSubject => {
                          const subjectName = classSubject.subject_name || 
                                            classSubject.subject_id?.subject_name || 
                                            (typeof classSubject.subject_id === 'object' ? classSubject.subject_id?.subject_name : 'Unknown Subject');
                          const subjectNameLower = subjectName.toLowerCase().trim();
                          
                          // Check if it's a Religion subject
                          if (assignmentIsReligionSubject(subjectName)) {
                            religionSubjects.push(classSubject);
                          } 
                          // Check if it's a Language subject (Tamil or Sinhala)
                          else if (assignmentIsLanguageSubject(subjectName)) {
                            languageSubjects.push(classSubject);
                          } 
                          // Regular subject
                          else {
                            const subjectId = classSubject._id || classSubject.subject_id?._id || classSubject.subject_id;
                            groupedSubjects.set(subjectId, classSubject);
                          }
                        });
                        
                        // Group Religion subjects into one entry
                        if (religionSubjects.length > 0) {
                          const religionSubject = {
                            _id: 'religion-grouped',
                            subject_name: 'Religion',
                            course_limit: Math.max(...religionSubjects.map(s => s.course_limit || 0)),
                            assignments: religionSubjects.flatMap(s => s.assignments || []),
                            groupedSubjects: religionSubjects // Store original subjects for removal
                          };
                          groupedSubjects.set('religion-grouped', religionSubject);
                        }
                        
                        // Group Language subjects (Tamil and Sinhala) into one entry
                        if (languageSubjects.length > 0) {
                          const languageSubject = {
                            _id: 'language-grouped',
                            subject_name: 'Tamil / Sinhala',
                            course_limit: Math.max(...languageSubjects.map(s => s.course_limit || 0)),
                            assignments: languageSubjects.flatMap(s => s.assignments || []),
                            groupedSubjects: languageSubjects // Store original subjects for removal
                          };
                          groupedSubjects.set('language-grouped', languageSubject);
                        }
                        
                        return Array.from(groupedSubjects.values()).map(classSubject => {
                          const subjectId = classSubject._id || classSubject.subject_id?._id || classSubject.subject_id;
                          const subjectName = classSubject.subject_name || 
                                            classSubject.subject_id?.subject_name || 
                                            (typeof classSubject.subject_id === 'object' ? classSubject.subject_id?.subject_name : 'Unknown Subject');
                          const courseLimit = classSubject.course_limit || 1;
                          const isEditing = assignmentEditingClassId === assignmentSelectedClass && 
                                           assignmentEditingSubjectId === subjectId;
                          
                          return (
                            <div key={subjectId} className="assignment-assignment-item">
                              <div className="assignment-assignment-info">
                                <span className="assignment-assignment-subject">{subjectName}</span>
                                {isEditing ? (
                                  <div className="assignment-edit-course-limit" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                                    <input
                                      type="number"
                                      min="0"
                                      max="50"
                                      value={assignmentEditCourseLimit}
                                      onChange={(e) => {
                                        const value = parseInt(e.target.value) || 0;
                                        setAssignmentEditCourseLimit(value >= 0 && value <= 50 ? value : assignmentEditCourseLimit);
                                      }}
                                      className="assignment-edit-input"
                                      style={{ width: '80px', padding: '4px 8px' }}
                                    />
                                    <button
                                      className="assignment-btn assignment-btn-sm assignment-btn-success"
                                      onClick={assignmentHandleSaveCourseLimit}
                                      disabled={assignmentLoading}
                                    >
                                      Save
                                    </button>
                                    <button
                                      className="assignment-btn assignment-btn-sm assignment-btn-secondary"
                                      onClick={() => {
                                        setAssignmentEditingClassId(null);
                                        setAssignmentEditingSubjectId(null);
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="assignment-assignment-limit">Course Limit: {courseLimit} periods</span>
                                    <span className="assignment-assignment-teachers">
                                      ({classSubject.assignments?.length || 0} teacher{classSubject.assignments?.length !== 1 ? 's' : ''})
                                    </span>
                                  </>
                                )}
                              </div>
                              {!isEditing && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    className="assignment-btn assignment-btn-sm assignment-btn-edit"
                                    onClick={() => assignmentHandleEditCourseLimit(
                                      assignmentSelectedClass,
                                      subjectId,
                                      courseLimit
                                    )}
                                  >
                                    Edit Limit
                                  </button>
                                  <button
                                    className="assignment-btn assignment-btn-sm assignment-btn-danger"
                                    onClick={() => assignmentHandleRemoveSubjectFromClass(
                                      classSubject,
                                      assignmentSelectedClass
                                    )}
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()
                    ) : (
                      <div className="assignment-no-assignments">
                        <span>No subjects assigned to this class</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Subject-Teacher Assignments */}
              <div className="assignment-assignments-card">
                <div className="assignment-assignments-header">
                  <h3>Subject-Teacher Assignments</h3>
                  <span className="assignment-count-badge">
                    {(() => {
                      const subjectTeacherAssignments = assignmentGetAllTeachersForDisplay()
                        .filter(t => t.type === 'subject_teacher');
                      return `${subjectTeacherAssignments.length} assigned`;
                    })()}
                  </span>
                </div>
                <div className="assignment-assignments-list">
                  {(() => {
                    const subjectTeachers = assignmentGetAllTeachersForDisplay()
                      .filter(t => t.type === 'subject_teacher');
                    if (subjectTeachers.length > 0) {
                      return subjectTeachers.map(teacherItem => (
                        <div key={teacherItem._id} className="assignment-assignment-item">
                          <div className="assignment-assignment-info">
                            <span className="assignment-assignment-teacher">
                              {teacherItem.teacher?.name || 'Unknown'}
                              {teacherItem.isAlsoClassTeacher && (
                                <span style={{ marginLeft: '8px', fontSize: '0.85em', color: '#0066cc', fontWeight: 'bold' }}>
                                  (Class Teacher)
                                </span>
                              )}
                            </span>
                            <span className="assignment-assignment-subject">{teacherItem.label}</span>
                            <span className="assignment-assignment-limit">({teacherItem.course_limit || 1} periods/month)</span>
                          </div>
                          <button 
                            className="assignment-btn assignment-btn-danger assignment-btn-sm"
                            onClick={() => assignmentHandleRemoveTeacherAssignment(teacherItem._id)}
                          >
                            Remove
                          </button>
                        </div>
                      ));
                    } else {
                      return (
                        <div className="assignment-no-assignments">
                          <span>No subject-teacher assignments. Use the form above to assign teachers to subjects.</span>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Class Teacher Assignments */}
              <div className="assignment-assignments-card">
                <div className="assignment-assignments-header">
                  <h3>Class Teacher</h3>
                  <span className="assignment-count-badge">
                    {(() => {
                      const classTeachers = assignmentGetAllTeachersForDisplay()
                        .filter(t => t.type === 'class_teacher');
                      return `${classTeachers.length} assigned`;
                    })()}
                  </span>
                </div>
                <div className="assignment-assignments-list">
                  {(() => {
                    const classTeacher = assignmentGetAllTeachersForDisplay()
                      .find(t => t.type === 'class_teacher');
                    if (classTeacher) {
                      const teacherId = classTeacher.teacherId || classTeacher.teacher?._id || classTeacher.teacher?.id;
                      return (
                        <div className="assignment-assignment-item">
                          <div className="assignment-assignment-info">
                            <span className="assignment-assignment-teacher">{classTeacher.teacher?.name || 'Unknown'}</span>
                            <span className="assignment-assignment-role">{classTeacher.label}</span>
                          </div>
                          <button 
                            className="assignment-btn assignment-btn-danger assignment-btn-sm"
                            onClick={() => assignmentHandleRemoveClassTeacher(teacherId)}
                          >
                            Remove
                          </button>
                        </div>
                      );
                    } else {
                      return (
                        <div className="assignment-no-assignments">
                          <span>No class teacher assigned</span>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Student Assignments */}
              <div className="assignment-assignments-card">
                <div className="assignment-assignments-header">
                  <h3>Current Student Assignments</h3>
                  <span className="assignment-count-badge">
                    {assignmentStudentAssignments.length} assigned
                  </span>
                </div>
                <div className="assignment-assignments-list">
                  {assignmentClassDataLoading ? (
                    <div className="assignment-no-assignments">
                      <span>Loading students...</span>
                    </div>
                  ) : assignmentStudentAssignments.length > 0 ? (
                    assignmentStudentAssignments.map(student => {
                      if (!student || !student._id) return null;
                      return (
                        <div key={student._id} className="assignment-assignment-item">
                          <div className="assignment-assignment-info">
                            <span className="assignment-assignment-student">
                              {student.name || 'Unknown Student'}
                            </span>
                            <span className="assignment-assignment-role">
                              {student.role || 'Student'}
                            </span>
                          </div>
                          <button 
                            className="assignment-btn assignment-btn-danger assignment-btn-sm"
                            onClick={() => assignmentHandleRemoveStudentAssignment(student._id)}
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="assignment-no-assignments">
                      <span>No students assigned to this class</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Selection Message */}
        {!assignmentSelectedClass && (
          <div className="assignment-no-selection">
            <div className="assignment-no-selection-icon">📚</div>
            <h3>Select a Class to Manage Assignments</h3>
            <p>Select a class to start managing teacher and student assignments</p>
        </div>
      )}
    </div>
    </AdminLayout>
  );
};

export default AdminAssignments;