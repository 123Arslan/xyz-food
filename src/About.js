import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <div className="about-hero-section">
        <div className="about-container">
          <h1 className="about-title">About FoodRescue</h1>
          <p className="about-description">
            We're on a mission to eliminate food waste by creating a seamless connection between food donors and those who need it most.
          </p>
        </div>
      </div>

      {/* Mission & Vision Section */}
      <section className="mission-vision-section">
        <div className="mission-vision-container">
          {/* Mission Card */}
          <div className="mv-card">
            <div className="mv-icon">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <h2>Our Mission</h2>
            <p>
              To create a world where no edible food goes to waste while people go hungry. We leverage technology to bridge the gap between surplus food and those in need, making food donation effortless and impactful.
            </p>
          </div>

          {/* Vision Card */}
          <div className="mv-card">
            <div className="mv-icon">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                <path d="M2 12h20"></path>
              </svg>
            </div>
            <h2>Our Vision</h2>
            <p>
              A future where every community has a thriving food rescue network, where technology empowers individuals and businesses to contribute to food security and environmental sustainability.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="core-values-section">
        <div className="core-values-container">
          <h2 className="section-title">Our Core Values</h2>

          <div className="values-grid">
            {/* Compassion */}
            <div className="value-card">
              <div className="value-icon">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </div>
              <h3>Compassion</h3>
              <p>Every meal shared is an act of kindness that ripples through communities.</p>
            </div>

            {/* Sustainability */}
            <div className="value-card">
              <div className="value-icon">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
                </svg>
              </div>
              <h3>Sustainability</h3>
              <p>Reducing food waste to protect our planet for future generations.</p>
            </div>

            {/* Community */}
            <div className="value-card">
              <div className="value-icon">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3>Community</h3>
              <p>Building bridges between those who have and those who need.</p>
            </div>

            {/* Accessibility */}
            <div className="value-card">
              <div className="value-icon">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path>
                  <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"></path>
                  <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"></path>
                  <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path>
                </svg>
              </div>
              <h3>Accessibility</h3>
              <p>Making food rescue easy and accessible for everyone, everywhere.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="our-story-section">
        <div className="our-story-container">
          <h2 className="section-title">Our Story</h2>
          <div className="story-content">
            <div className="story-text">
              <p>
                FoodRescue was born from a simple observation: restaurants throw away tons of perfectly good food every day while families go hungry just blocks away.
              </p>
              <p>
                We built this platform as a final year project with the belief that technology can solve this disconnect. Our location-based matching system makes it easy for anyone to donate or find food in their neighborhood.
              </p>
            </div>
            <div className="story-image">
              <img src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80" alt="Volunteers packing food" />
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

export default About;
