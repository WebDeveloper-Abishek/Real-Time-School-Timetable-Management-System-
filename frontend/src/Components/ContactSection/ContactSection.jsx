import React, { useState } from 'react';
import './ContactSection.css';

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <section className='contact-section' id='contact'>
      <div className='contact-container'>
        <div className='contact-header'>
          <h2>Get in Touch</h2>
          <p className='contact-description'>
            Ready to transform your educational institution? Contact our team for a personalized demo 
            and discover how Eduford can revolutionize your school management.
          </p>
        </div>
        
        <div className='contact-content'>
          <div className='left-section'>
            <div className='map-container'>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.123456789!2d79.8562!3d6.9271!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2593b8b8b8b8b%3A0x8b8b8b8b8b8b8b8b!2sBambalapitiya%20Rd%2C%20Colombo%2004%2C%20Sri%20Lanka!5e0!3m2!1sen!2slk!4v1234567890123!5m2!1sen!2slk"
                width="100%"
                height="250"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Eduford Company Location"
              ></iframe>
              <div className='map-address'>
                <div className='contact-item'>
                  <div className='contact-icon location-icon'>📍</div>
                  <div>
                    <h4>Visit Us</h4>
                    <p>Eduford Company</p>
                    <p>121, Bambalapitiya Rd</p>
                    <p>Colombo 04, Sri Lanka</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className='contact-info-card'>
              <div className='contact-details'>
                <div className='contact-item'>
                  <div className='contact-icon email-icon'>@</div>
                  <div>
                    <h4>Email Us</h4>
                    <p>SupportEduford@gmail.com</p>
                    <p>CustomerSupport@eduford.edu</p>
                  </div>
                </div>
                
                <div className='contact-item'>
                  <div className='contact-icon phone-icon'>📞</div>
                  <div>
                    <h4>Call Us</h4>
                    <p>Mobile: +94 76 176 7078</p>
                    <p>Office: +94 11 234 4356</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className='contact-form-card'>
            <form className='contact-form' onSubmit={handleSubmit}>
              <h3>Send us a Message</h3>
              
              <div className='form-row'>
                <div className='form-group'>
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className='form-group'>
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email address"
                  />
                </div>
              </div>
              
              <div className='form-group'>
                <label htmlFor="subject">Subject *</label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a subject</option>
                  <option value="demo">Request Demo</option>
                  <option value="pricing">Pricing Information</option>
                  <option value="support">Technical Support</option>
                  <option value="partnership">Partnership</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className='form-group'>
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="Tell us how we can help you..."
                  rows="5"
                />
              </div>
              
              <button type="submit" className='submit-btn'>
                Send Message
                <span className='btn-icon'>→</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
