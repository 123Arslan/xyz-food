import React, { useState } from 'react';
import './Contact.css';

const Contact = () => {
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
    console.log('Form Data Submitted:', formData);
    alert('Message sent successfully!');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <div className="contact-hero-section">
        <div className="contact-container">
          <h1 className="contact-title">Get In Touch</h1>
          <p className="contact-description">
            Have questions, suggestions, or want to partner with us? We'd love to hear from you.
          </p>
        </div>
      </div>

      {/* Contact Content Section */}
      <section className="contact-content-section">
        <div className="contact-content-container">
          <div className="contact-grid">
            
            {/* Left Column: Info & Help */}
            <div className="contact-left">
              <h3 className="left-title">Contact Information</h3>
              
              <div className="info-list">
                <div className="info-item">
                  <div className="icon-box">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2a9d8f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  </div>
                  <div className="info-text">
                    <span className="label">Email</span>
                    <span className="value">hello@foodrescue.org</span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="icon-box">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2a9d8f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  </div>
                  <div className="info-text">
                    <span className="label">Phone</span>
                    <span className="value">+1 (555) 123-4567</span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="icon-box">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2a9d8f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </div>
                  <div className="info-text">
                    <span className="label">Address</span>
                    <span className="value">123 Community Drive, City</span>
                  </div>
                </div>
              </div>

              <div className="help-card-green">
                <div className="help-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </div>
                <h4>Need Immediate Help?</h4>
                <p>If you're in urgent need of food, browse our available listings or reach out directly.</p>
              </div>
            </div>

            {/* Right Column: Form */}
            <div className="contact-right">
              <div className="form-card">
                <h3 className="form-title">Send Us a Message</h3>
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name</label>
                      <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Your name" />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="your@email.com" />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Subject</label>
                    <input type="text" name="subject" value={formData.subject} onChange={handleChange} required placeholder="What's this about?" />
                  </div>
                  
                  <div className="form-group">
                    <label>Message</label>
                    <textarea name="message" value={formData.message} onChange={handleChange} required rows="5" placeholder="Tell us more..."></textarea>
                  </div>
                  
                  <button type="submit" className="submit-btn-green">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    Send Message
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER SECTION */}
      <footer className="footer-section">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-col brand-col">
              <h2>FOOD DONATION</h2>
              <p>Making a difference in communities by rescuing surplus food and feeding those in need.</p>
            </div>
            
            <div className="footer-col">
              <h3>Quick Links</h3>
              <ul>
                <li><a href="#">Home</a></li>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Our Impact</a></li>
                <li><a href="#">Contact Us</a></li>
              </ul>
            </div>
            
            <div className="footer-col">
              <h3>Support</h3>
              <ul>
                <li><a href="#">Contact us</a></li>
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>
            
            <div className="footer-col contact-col">
              <h3>Contact Us</h3>
              <ul>
                <li>123 Food Street, Green Town, Pakistan</li>
                <li>📞 +92 343 0686603</li>
                <li>📧 info@fooddonation.com</li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2026 Food Donation Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
