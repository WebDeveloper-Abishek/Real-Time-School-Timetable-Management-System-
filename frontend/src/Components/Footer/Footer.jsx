import React from 'react';
import './Footer.css';
import SocialIcons from './SocialIcons';
import logoWhite from '../../assets/logo-white.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='footer'>
      <div className='footer-container'>
        {/* Main Footer Content */}
        <div className='footer-content'>
          {/* Company Info Section */}
          <div className='footer-section company-info'>
            <div className='footer-logo'>
              <img src={logoWhite} alt="Eduford Logo" className='footer-logo-img' />
              <p>Transforming Education Management</p>
            </div>
            <p className='company-description'>
              Empowering educational institutions with comprehensive management solutions 
              that streamline operations and enhance learning experiences.
            </p>
            <SocialIcons />
          </div>

          {/* Quick Links Section */}
          <div className='footer-section'>
            <h4>Quick Links</h4>
            <ul className='footer-links'>
              <li><a href="#home">Home</a></li>
              <li><a href="#about">About Us</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#contact">Contact</a></li>
              <li><a href="#demo">Request Demo</a></li>
            </ul>
          </div>

          {/* Services Section */}
          <div className='footer-section'>
            <h4>Services</h4>
            <ul className='footer-links'>
              <li><a href="#timetable">Timetable Management</a></li>
              <li><a href="#attendance">Attendance Tracking</a></li>
              <li><a href="#exams">Exam Management</a></li>
              <li><a href="#reports">Analytics & Reports</a></li>
              <li><a href="#support">Technical Support</a></li>
            </ul>
          </div>

          {/* Contact Info Section */}
          <div className='footer-section contact-info'>
            <h4>Get in Touch</h4>
            <div className='contact-item1'>
              <span className='contact-iconf'>📍</span>
              <div>
                <p>121, Bambalapitiya Rd</p>
                <p>Colombo 04, Sri Lanka</p>
              </div>
            </div>
            <div className='contact-item1'>
              <span className='contact-iconf'>📞</span>
              <div>
                <p>+94 76 176 7078</p>
                <p>+94 11 234 4356</p>
              </div>
            </div>
            <div className='contact-item1'>
              <span className='contact-iconf'>✉️</span>
              <div>
                <p>SupportEduford@gmail.com</p>
                <p>CustomerSupport@eduford.edu</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className='footer-bottom'>
          <div className='footer-bottom-content'>
            <p>&copy; {currentYear} Eduford. All rights reserved.</p>
            <div className='footer-legal'>
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
              <a href="#cookies">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
