/**
 * Shared navigation configuration for all Teacher pages
 * This ensures consistent sidebar navigation across all teacher dashboard pages
 */

export const teacherNavigationSections = [
  {
    title: 'MY TEACHING',
    items: [
      { label: 'Teacher Home', icon: '🏠', path: '/teacher/dashboard' },
      { label: 'My Classes', icon: '📚', path: '/teacher/classes' },
      { label: 'Timetable', icon: '📅', path: '/teacher/timetable' },
      { label: 'Students', icon: '🎓', path: '/teacher/students' }
    ]
  },
  {
    title: 'ACADEMIC',
    items: [
      { label: 'Assignments', icon: '📝', path: '/teacher/assignments' },
      { label: 'Exams', icon: '✍️', path: '/teacher/exams' },
      { label: 'Grades', icon: '📊', path: '/teacher/grades' },
      { label: 'Attendance', icon: '✅', path: '/teacher/attendance' }
    ]
  },
  {
    title: 'LEAVE & DUTIES',
    items: [
      { label: 'Leave Requests', icon: '🏖️', path: '/teacher/leaves' },
      { label: 'Replacements', icon: '🔄', path: '/teacher/replacements' },
      { label: 'Duties', icon: '⚡', path: '/teacher/duties' }
    ]
  },
  {
    title: 'PROFILE',
    items: [
      { label: 'Update Profile', icon: '✏️', path: '/teacher/profile' },
      { label: 'Settings', icon: '⚙️', path: '/teacher/settings' }
    ]
  }
];

