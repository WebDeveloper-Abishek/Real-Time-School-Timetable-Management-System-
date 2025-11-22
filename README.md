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

### **Backend Structure**
```
backend/
├── src/
│   ├── models/          # MongoDB schemas
│   ├── controllers/     # Business logic
│   ├── routes/          # API endpoints
│   ├── config/          # Database & middleware
│   └── utils/           # Helper functions
├── server.js            # Main server file
├── test-data.js         # Test data generator
└── package.json
```

### **Frontend Structure**
```
frontend/
├── src/
│   ├── pages/           # Dashboard components
│   ├── Components/      # Reusable components
│   ├── assets/          # Images & static files
│   └── main.jsx         # App entry point
├── index.html
└── package.json
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

## 🧪 **Testing**

### **Test Accounts**
After running `npm run test-data`:

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `password123` |
| Teacher | `johnsmith` | `password123` |
| Student | `alicewilson` | `password123` |
| Parent | `davidwilson` | `password123` |
| Counsellor | `lisaanderson` | `password123` |

### **Testing Scenarios**
See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing instructions.

## 🔧 **API Endpoints**

### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/register-admin` - Admin registration
- `POST /api/auth/create-test-user` - Create test users

### **Admin APIs**
- `GET/POST/PUT/DELETE /api/admin/users` - User management
- `GET/POST/PUT/DELETE /api/admin/academic` - Academic setup
- `GET/POST/PUT/DELETE /api/admin/subjects` - Subject management
- `GET/POST/PUT/DELETE /api/admin/classes` - Class management
- `GET/POST/PUT/DELETE /api/admin/assignments` - Teacher assignments
- `GET/POST/PUT/DELETE /api/admin/timetable` - Timetable management
- `GET/POST/PUT/DELETE /api/admin/leaves` - Leave management

### **User-Specific APIs**
- `GET /api/student/timetable` - Student timetable
- `GET /api/student/notifications` - Student notifications
- `GET /api/parent/children` - Parent children list
- `GET /api/parent/child-timetable` - Child timetable
- `GET /api/chat/users` - Chat users list
- `POST /api/chat/send` - Send message
- `GET /api/chat/conversation` - Get conversation

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

## 🚀 **Deployment**

### **Backend Deployment**
```bash
# Set environment variables
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret

# Deploy to your preferred platform
npm start
```

### **Frontend Deployment**
```bash
# Build for production
npm run build

# Deploy to Vercel, Netlify, or your preferred platform
```

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

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 **Support**

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the [TESTING_GUIDE.md](./TESTING_GUIDE.md) for troubleshooting

---

**Built with ❤️ for modern school management**
