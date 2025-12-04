# 🏫 Integrated School Management & Real-Time Timetable System

A comprehensive, full-featured school management system built with the **MERN stack** (MongoDB, Express.js, React with Vite, Node.js) featuring real-time timetable management, automated teacher replacement, attendance tracking, and mental health support.

## 🚀 **Quick Start**

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd timetablesystem
```

2. **Backend Setup**
```bash
cd backend
npm install
```

3. **Frontend Setup**
```bash
cd frontend
npm install
```

4. **Environment Configuration**
```bash
# Create .env file in backend directory
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

5. **Start the Application**
```bash
# Terminal 1 - Start Backend
cd backend
npm start

# Terminal 2 - Start Frontend
cd frontend
npm run dev
```

6. **Create Test Data**
```bash
cd backend
npm run test-data
```

## 📋 **System Overview**

### **Core Features**
- ✅ **Role-based Authentication** (Admin, Teacher, Student, Parent, Counsellor)
- ✅ **Real-time Timetable Management** with automated teacher replacement
- ✅ **Course Progress Tracking** with limit management per term
- ✅ **Attendance System** (daily and period-level)
- ✅ **Leave Management** with replacement logic
- ✅ **Mental Health Support** with counsellor scheduling
- ✅ **Real-time Chat & Notifications**
- ✅ **Fee Management** for parents
- ✅ **Exam & Marks Management**
- ✅ **School Events & Calendar**

### **User Roles & Dashboards**

| Role | Dashboard | Key Features |
|------|-----------|--------------|
| **Admin** | `/admin/dashboard` | User management, academic setup, timetable builder, leave approvals |
| **Teacher** | `/teacher/dashboard` | Personal timetable, attendance marking, exam marks, replacement prompts |
| **Student** | `/student/dashboard` | Class timetable, notifications, chat, mental health reporting |
| **Parent** | `/parent/dashboard` | Children management, attendance tracking, fee payments |
| **Counsellor** | `/counsellor/dashboard` | Student management, meeting scheduling, progress tracking |

## 🏗️ **System Architecture**

### **Backend** (Node.js + Express + MongoDB)
```
backend/
├── src/
│   ├── models/           # 20+ MongoDB schemas (User, Class, Timetable, etc.)
│   ├── controllers/      # Business logic (Auth, Academic, Attendance, Exams)
│   ├── routes/           # 15+ API route modules
│   ├── services/         # Core services (Timetable generation, Replacements)
│   └── middleware/       # Authentication & Authorization
├── server.js             # Express server + Socket.io
└── test-data.js          # Database seeding script
```

### **Frontend** (React + Vite)
```
frontend/
├── src/
│   ├── pages/            # 35+ dashboard pages (Admin, Teacher, Student, Parent, Counsellor)
│   ├── Components/       # Reusable UI components (Layout, Modals, Chat, Notifications)
│   ├── services/         # API integration layer
│   └── assets/           # Images and static resources
└── vite.config.js        # Build configuration
```

## 🗄️ **Database Schema**

### **Core Entities**
- **User** - Unified entity for all roles (Student, Teacher, Parent, Admin, Counsellor)
- **Account** - Authentication and login credentials
- **AcademicYear** - Academic year management
- **Term** - Term-wise organization (3 terms per year)
- **Class** - Grade and section management
- **Subject** - Subject catalog
- **TeacherAssignment** - Teacher-subject-class assignments with course limits
- **TimetableSlot** - Fixed daily schedule (8 periods + assembly/break/anthem)
- **LeaveRecord** - Teacher leave management
- **ReplacementAssignment** - Automated replacement logic
- **Attendance** - Student attendance tracking
- **Notification** - Real-time notifications
- **Chat** - User-to-user messaging

### **Key Relationships**
- Students ↔ Classes (via StudentClass)
- Parents ↔ Students (via StudentParentLink)
- Teachers ↔ Subjects ↔ Classes (via TeacherAssignment)
- Timetables ↔ Slots ↔ Subjects ↔ Teachers (interconnected)

## 🔄 **Real-Time Features**

### **Timetable Management**
- **Dynamic Updates**: Real-time timetable adjustments for teacher absences
- **Automated Replacement**: Intelligent teacher substitution based on availability and course limits
- **Course Progress**: Automatic tracking of syllabus coverage per term
- **Conflict Prevention**: Ensures no timetable clashes during replacements

### **Communication System**
- **Real-time Chat**: Instant messaging between all user types
- **Notifications**: Live updates for timetable changes, attendance, and events
- **Meeting Scheduling**: Non-conflicting appointment booking for counsellors

## 🎯 **Key Algorithms**

### **Teacher Replacement Logic**
1. **Availability Check**: Find teachers with free slots during absence
2. **Subject Match**: Ensure replacement teacher teaches subjects in student timetable
3. **Course Limit Priority**: Select teacher with highest pending course limits
4. **Acceptance Workflow**: Prompt replacement teacher for acceptance
5. **Fallback Logic**: If declined, find next eligible teacher
6. **Real-time Updates**: Update all affected timetables immediately

### **Course Progress Tracking**
- **Term-based Limits**: Course limits reset per term
- **Automatic Reduction**: Limits decrease as periods are completed
- **Progress Monitoring**: Real-time tracking of syllabus coverage
- **Term Management**: Admin controls term creation and limit resets


## 🔒 **Security Features**

- **JWT Authentication** with role-based access control
- **Password Hashing** using bcrypt
- **Protected Routes** for all user dashboards
- **Input Validation** and sanitization
- **CORS Configuration** for secure API access

## 📱 **Responsive Design**

- **Mobile-First** approach with Tailwind CSS
- **Cross-Platform** compatibility
- **Modern UI/UX** with intuitive navigation
- **Accessibility** compliant design

## 🛠️ **Technologies Used**

### **Backend**
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing

### **Frontend**
- **React** - UI library
- **Vite** - Build tool
- **React Router** - Client-side routing
- **CSS3** - Styling
- **JavaScript ES6+** - Modern JavaScript
