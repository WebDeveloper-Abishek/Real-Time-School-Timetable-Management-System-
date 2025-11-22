import React from 'react';
import WelcomeSection from '../../Components/WelcomeSection/WelcomeSection';
import AboutSection from '../../Components/AboutSection/AboutSection';
import FeaturesSection from '../../Components/FeaturesSection/FeaturesSection';
import ContactSection from '../../Components/ContactSection/ContactSection';
import Footer from '../../Components/Footer/Footer';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="homepage">
      <WelcomeSection />
      <AboutSection />
      <FeaturesSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default HomePage; 