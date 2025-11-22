import React from 'react';
import './WelcomeSection.css';

const WelcomeSection = () => (
  <section className='welcome-section' id='welcome'>
    <div className='welcome-content'>
      <h1>Advanced School Timetable Management System</h1>
      <p className='welcome-subtitle'>Transform your educational institution with intelligent scheduling and comprehensive management</p>
      <div className='welcome-buttons'>
        <button className='btn-primary'>Get Started</button>
        <button className='btn-secondary'>Learn More</button>
      </div>
    </div>
  </section>
);

export default WelcomeSection; 