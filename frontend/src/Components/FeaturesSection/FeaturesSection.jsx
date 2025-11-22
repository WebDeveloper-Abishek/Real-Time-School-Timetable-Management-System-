import React from 'react';
import './FeaturesSection.css';

const FeaturesSection = () => (
  <section className='features-section' id='features'>
    <div className='features-container'>
      <h2>Complete Digital School Ecosystem</h2>
      <p className='features-subtitle'>A unified platform that seamlessly integrates all stakeholders : students, teachers, parents, counsellors and administrators into one intelligent, real-time school management system</p>
      
      {/* Core Features */}
      <h3 className='core-features-title'>Core Features</h3>
      <div className='core-features'>
        <div className='feature-card core-card'>
          <div className='feature-icon'>🎯</div>
          <h3>Intelligent Timetable Generation</h3>
          <p>Revolutionary scheduling that creates perfect timetables for both students and teachers. The system balances course limits across three terms, respects double/triple periods, and ensures zero conflicts while maintaining academic continuity throughout the year.</p>
          <div className='feature-benefits'>
            <span>✓ Course Limit Balancing</span>
            <span>✓ Zero Conflict Resolution</span>
            <span>✓ Double/Triple Periods</span>
            <span>✓ Student & Teacher Views</span>
          </div>
        </div>
        
        <div className='feature-card core-card'>
          <div className='feature-icon'>🔄</div>
          <h3>Automated Teacher Substitution</h3>
          <p>Smart replacement system that instantly finds qualified substitutes when teachers are absent. Uses intelligent algorithms to match subject expertise, prioritize course completion, and maintain academic continuity with automatic escalation and admin override capabilities.</p>
          <div className='feature-benefits'>
            <span>✓ Instant Auto-Replacement</span>
            <span>✓ Subject Expertise Matching</span>
            <span>✓ Course Priority Algorithm</span>
            <span>✓ Escalation & Override</span>
          </div>
        </div>
        
        <div className='feature-card core-card'>
          <div className='feature-icon'>💚</div>
          <h3>Mental Health & Counselling Support</h3>
          <p>Comprehensive mental health platform with dedicated counsellor schedules, confidential appointment booking, secure chat sessions, and progress tracking. Students can access support outside regular hours while parents receive appropriate updates on their child's wellbeing.</p>
          <div className='feature-benefits'>
            <span>✓ Flexible Counsellor Scheduling</span>
            <span>✓ Confidential Chat Sessions</span>
            <span>✓ Progress Tracking</span>
            <span>✓ Parent Communication</span>
          </div>
        </div>
      </div>

      {/* Additional Features */}
      <h3 className='additional-title'>Additional Features</h3>
      <div className='additional-features'>
        <div className='feature-card'>
          <div className='feature-icon'>👥</div>
          <h3>Unified User Management</h3>
          <p>Single entity system where all stakeholders—students, teachers, parents, counsellors, and administrators—are modeled under one common User structure with personalized dashboards and role-specific access.</p>
        </div>
        
        <div className='feature-card'>
          <div className='feature-icon'>📊</div>
          <h3>Advanced Attendance Tracking</h3>
          <p>Dual-level attendance system tracking both daily and period-by-period attendance with instant parent notifications for missed classes or early departures, plus comprehensive teacher leave management.</p>
        </div>
        
        <div className='feature-card'>
          <div className='feature-icon'>💬</div>
          <h3>Smart Communication System</h3>
          <p>Intelligent messaging platform with automatic meeting rescheduling when teacher slots are used for replacements, direct chats between all stakeholders, and school-wide broadcast capabilities.</p>
        </div>
        
        <div className='feature-card'>
          <div className='feature-icon'>📚</div>
          <h3>Academic Year Structure</h3>
          <p>Complete academic management with three-term structure, class creation with grades and sections, subject assignment, and course limit setting to guide automated timetable generation.</p>
        </div>
        
        <div className='feature-card'>
          <div className='feature-icon'>📝</div>
          <h3>Exam & Assessment Management</h3>
          <p>Comprehensive exam system with frozen timetables during exam weeks, mark tracking, grade calculation, and performance analytics with automatic course limit pausing during assessments.</p>
        </div>
        
        <div className='feature-card'>
          <div className='feature-icon'>📅</div>
          <h3>Intelligent Leave Management</h3>
          <p>Advanced leave system supporting full day, first half, and second half leave applications with automatic replacement triggers, approval workflows, and comprehensive tracking of affected periods.</p>
        </div>
      </div>
    </div>
  </section>
);

export default FeaturesSection;
