import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo_light from '../../assets/logo-white.png';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('welcome');

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['welcome', 'features', 'about', 'contact'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className='navbar'>
      <Link to='/' className='navbar-logo'>
        <img src={logo_light} alt='Eduford Logo' className='logo' />
      </Link>
      
      {/* Desktop Navigation */}
      <div className='navbar-links'>
        <button 
          onClick={() => scrollToSection('welcome')} 
          className={`link ${activeSection === 'welcome' ? 'active' : ''}`}
        >
          Home
        </button>
        <button 
          onClick={() => scrollToSection('about')} 
          className={`link ${activeSection === 'about' ? 'active' : ''}`}
        >
          About Us
        </button>
        <button 
          onClick={() => scrollToSection('features')} 
          className={`link ${activeSection === 'features' ? 'active' : ''}`}
        >
          Features
        </button>
        <button 
          onClick={() => scrollToSection('contact')} 
          className={`link ${activeSection === 'contact' ? 'active' : ''}`}
        >
          Contact Us
        </button>
      </div>
      
      <div className='navbar-buttons'>
        <Link to='/login' className='login-btn'>Login</Link>
      </div>

      {/* Hamburger Menu Button */}
      <button className='hamburger-menu' onClick={toggleMenu}>
        <span className={`hamburger-line ${isMenuOpen ? 'active' : ''}`}></span>
        <span className={`hamburger-line ${isMenuOpen ? 'active' : ''}`}></span>
        <span className={`hamburger-line ${isMenuOpen ? 'active' : ''}`}></span>
      </button>

      {/* Mobile Side Navigation */}
      <div className={`side-nav ${isMenuOpen ? 'open' : ''}`}>
        <div className='side-nav-content'>
          <div className='side-nav-logo'>
            <img src={logo_light} alt='Eduford Logo' className='logo' />
          </div>
          <div className='side-nav-links'>
            <button 
              onClick={() => scrollToSection('welcome')} 
              className={`side-link ${activeSection === 'welcome' ? 'active' : ''}`}
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('about')} 
              className={`side-link ${activeSection === 'about' ? 'active' : ''}`}
            >
              About Us
            </button>
            <button 
              onClick={() => scrollToSection('features')} 
              className={`side-link ${activeSection === 'features' ? 'active' : ''}`}
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('contact')} 
              className={`side-link ${activeSection === 'contact' ? 'active' : ''}`}
            >
              Contact Us
            </button>
          </div>
          <div className='side-nav-buttons'>
            <Link to='/login' className='side-login-btn'>Login</Link>
          </div>
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {isMenuOpen && <div className='menu-overlay' onClick={toggleMenu}></div>}
    </nav>
  );
};

export default Navbar;