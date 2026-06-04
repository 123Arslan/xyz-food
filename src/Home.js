import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('Donor');

  const handleActionClick = () => {
    if (role === 'Donor') {
      navigate('/donor-dashboard');
    } else {
      navigate('/receiver-dashboard');
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="hero-section">
        {/* Background Video */}
        {/* Note: I'm using a placeholder video URL. You can replace this with your local video file later, e.g., src="/your-video.mp4" */}
        <video autoPlay loop muted playsInline className="background-video">
          <source src="hero video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="video-overlay"></div>

        {/* Content over video */}
        <div className="home-content">
          <h1 className="main-title">Extra food can feed those in need.</h1>
          <p className="sub-title">Donate today</p>

          <div className="square-buttons">
            <button className="square-btn volunteer-bg" ></button>
            <button className="square-btn food-bg"></button>
          </div>

          <div className="role-selection">
            <div className="role-tabs">
              <button
                className={`role-tab ${role === 'Donor' ? 'active' : ''}`}
                onClick={() => setRole('Donor')}
              >
                Donor
              </button>
              <button
                className={`role-tab ${role === 'Receiver' ? 'active' : ''}`}
                onClick={() => setRole('Receiver')}
              >
                Receiver
              </button>
            </div>

            <div className="action-container">
              {role === 'Donor' ? (
                <button className="action-btn donor-btn" onClick={handleActionClick}>
                  START DONATING
                </button>
              ) : (
                <button className="action-btn receiver-btn" onClick={handleActionClick}>
                  START RECEIVING
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STATS SECTION */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <h2>12,500+</h2>
            <p>Meals Rescued</p>
          </div>
          <div className="stat-item">
            <h2>3,200+</h2>
            <p>Active Donors</p>
          </div>
          <div className="stat-item">
            <h2>8,000+</h2>
            <p>People Fed</p>
          </div>
          <div className="stat-item">
            <h2>50+</h2>
            <p>Cities Covered</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="how-it-works-section">
        <div className="how-it-works-container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Three simple steps to rescue food and make a difference in your community.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <span className="step-number">01</span>
              <div className="step-content">
                <h3 className="step-title">List Your Food</h3>
                <p className="step-desc">
                  Donors post surplus food with pickup details and location.
                </p>
              </div>
            </div>

            <div className="step-card">
              <span className="step-number">02</span>
              <div className="step-content">
                <h3 className="step-title">Find Nearby Food</h3>
                <p className="step-desc">
                  Receivers browse available listings based on their location.
                </p>
              </div>
            </div>

            <div className="step-card">
              <span className="step-number">03</span>
              <div className="step-content">
                <h3 className="step-title">Claim &amp; Collect</h3>
                <p className="step-desc">
                  Claim the food, coordinate pickup, and leave a rating.
                </p>
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

export default Home;
