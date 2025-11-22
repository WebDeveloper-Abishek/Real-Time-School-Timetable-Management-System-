import React from 'react';
import './AboutSection.css';

const AboutSection = () => (
  <section className='about-section' id='about'>
    <div className='about-container'>
      <div className='about-content'>
        <h2>About Eduford</h2>
        <p className='about-description'>
          Eduford is a leading educational technology company dedicated to transforming how schools manage their daily operations. 
          Since our founding in 2020, we've been committed to creating innovative solutions that make education more efficient, 
          accessible, and engaging for everyone involved in the learning process.
        </p>
        <p className='about-story'>
          Our journey began with a simple vision: to eliminate the chaos of manual school management. Today, we serve over 500 schools 
          worldwide, helping them streamline everything from class scheduling to student progress tracking. We believe that when 
          administrative tasks are simplified, educators can focus on what matters most – teaching and inspiring students.
        </p>
        
        <div className='about-stats'>
          <div className='a-stat-item'>
            <h3>500+</h3>
            <p>Schools Worldwide</p>
          </div>
          <div className='a-stat-item'>
            <h3>50,000+</h3>
            <p>Students Empowered</p>
          </div>
          <div className='a-stat-item'>
            <h3>5,000+</h3>
            <p>Teachers Supported</p>
          </div>
          <div className='a-stat-item'>
            <h3>99.9%</h3>
            <p>System Reliability</p>
          </div>
        </div>
      </div>
      
      <div className='about-values'>
        <div className='values-grid'>
          <div className='value-item'>
            <div className='value-icon'>🎯</div>
            <h4>Our Mission</h4>
            <p>To simplify school management through cutting-edge technology, enabling educators to focus on what they do best – inspiring and nurturing young minds.</p>
          </div>
          <div className='value-item'>
            <div className='value-icon'>👁️</div>
            <h4>Our Vision</h4>
            <p>To create a world where every school has access to powerful, intuitive tools that make education more effective and enjoyable for everyone involved.</p>
          </div>
          <div className='value-item'>
            <div className='value-icon'>⭐</div>
            <h4>Our Values</h4>
            <p>We are driven by excellence, innovation, and genuine care for the education community. Every feature we build reflects our commitment to making a real difference.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default AboutSection;
