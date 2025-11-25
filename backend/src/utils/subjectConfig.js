// Grade-specific subject configuration with course limits
// Based on Sri Lankan curriculum standards

export const getSubjectsByGrade = (grade) => {
  const gradeSubjects = {
    // Grades 1-3: English, Maths, Science, Tamil, Religion, PT, Environmental Studies
    1: ['English', 'Mathematics', 'Science', 'Tamil', 'Religion', 'PT', 'Environmental Studies'],
    2: ['English', 'Mathematics', 'Science', 'Tamil', 'Religion', 'PT', 'Environmental Studies'],
    3: ['English', 'Mathematics', 'Science', 'Tamil', 'Religion', 'PT', 'Environmental Studies'],
    
    // Grades 4-5: Same as 1-3 + Art, Information Technology, Sinhala
    4: ['English', 'Mathematics', 'Science', 'Tamil', 'Religion', 'PT', 'Environmental Studies', 'Art', 'Information Technology', 'Sinhala'],
    5: ['English', 'Mathematics', 'Science', 'Tamil', 'Religion', 'PT', 'Environmental Studies', 'Art', 'Information Technology', 'Sinhala'],
    
    // Grades 6-9: English, Maths, Science, History, Religion, Tamil/Sinhala, Information Technology, Health Science, Geography, Civics, Library, Art/Music, PT
    6: ['English', 'Mathematics', 'Science', 'History', 'Religion', 'Tamil', 'Sinhala', 'Information Technology', 'Health Science', 'Geography', 'Civics', 'Library', 'Art', 'Music', 'PT'],
    7: ['English', 'Mathematics', 'Science', 'History', 'Religion', 'Tamil', 'Sinhala', 'Information Technology', 'Health Science', 'Geography', 'Civics', 'Library', 'Art', 'Music', 'PT'],
    8: ['English', 'Mathematics', 'Science', 'History', 'Religion', 'Tamil', 'Sinhala', 'Information Technology', 'Health Science', 'Geography', 'Civics', 'Library', 'Art', 'Music', 'PT'],
    9: ['English', 'Mathematics', 'Science', 'History', 'Religion', 'Tamil', 'Sinhala', 'Information Technology', 'Health Science', 'Geography', 'Civics', 'Library', 'Art', 'Music', 'PT'],
    
    // Grades 10-11: English, Maths, Science, History, Religion, Tamil/Sinhala, Commerce, Information Technology/Health, Art/Music, PT
    10: ['English', 'Mathematics', 'Science', 'History', 'Religion', 'Tamil', 'Sinhala', 'Commerce', 'Information Technology', 'Health Science', 'Art', 'Music', 'PT'],
    11: ['English', 'Mathematics', 'Science', 'History', 'Religion', 'Tamil', 'Sinhala', 'Commerce', 'Information Technology', 'Health Science', 'Art', 'Music', 'PT']
  };
  
  return gradeSubjects[grade] || [];
};

// Course limits (periods per week) for each subject by grade
export const getCourseLimit = (grade, subjectName) => {
  const subjectLower = subjectName.toLowerCase();
  
  // Core subjects (higher priority, more periods)
  const coreSubjects = ['english', 'mathematics', 'science'];
  const languageSubjects = ['tamil', 'sinhala'];
  const humanitiesSubjects = ['history', 'geography', 'civics'];
  
  // Determine base limit based on subject type and grade
  if (coreSubjects.includes(subjectLower)) {
    // Core subjects: 5-6 periods for lower grades, 6-7 for higher grades
    return grade <= 5 ? 5 : grade <= 9 ? 6 : 7;
  }
  
  if (languageSubjects.includes(subjectLower)) {
    // Language subjects: 4-5 periods
    return grade <= 5 ? 4 : 5;
  }
  
  if (subjectLower === 'religion') {
    // Religion: 2-3 periods
    return grade <= 5 ? 2 : 3;
  }
  
  if (subjectLower === 'pt' || subjectLower === 'physical training') {
    // PT: 2 periods
    return 2;
  }
  
  if (subjectLower === 'environmental studies') {
    // Environmental Studies: 3-4 periods (only grades 1-5)
    return grade <= 3 ? 4 : 3;
  }
  
  if (subjectLower === 'art' || subjectLower === 'music') {
    // Art/Music: 2 periods
    return 2;
  }
  
  if (subjectLower === 'information technology' || subjectLower === 'it') {
    // IT: 2-3 periods
    return grade <= 5 ? 2 : 3;
  }
  
  if (subjectLower === 'health science' || subjectLower === 'health') {
    // Health Science: 2 periods
    return 2;
  }
  
  if (humanitiesSubjects.includes(subjectLower)) {
    // History, Geography, Civics: 3-4 periods
    return grade <= 9 ? 3 : 4;
  }
  
  if (subjectLower === 'commerce') {
    // Commerce: 4-5 periods (only grades 10-11)
    return 4;
  }
  
  if (subjectLower === 'library') {
    // Library: 1 period
    return 1;
  }
  
  // Default for any other subject
  return 3;
};

// Get all unique subjects across all grades
export const getAllSubjects = () => {
  const allSubjects = new Set();
  for (let grade = 1; grade <= 11; grade++) {
    getSubjectsByGrade(grade).forEach(subject => allSubjects.add(subject));
  }
  return Array.from(allSubjects).sort();
};

// Check if a subject is available for a specific grade
export const isSubjectAvailableForGrade = (subjectName, grade) => {
  const gradeSubjects = getSubjectsByGrade(grade);
  return gradeSubjects.includes(subjectName);
};

