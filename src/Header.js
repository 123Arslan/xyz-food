import React, { useState } from 'react';

import './Header.css';

const Header = ({ onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavigation = (action, e) => {
    if (e) e.preventDefault();
    setIsMenuOpen(false); // Close menu on mobile after click
    if (onNavigate) {
      onNavigate(action);
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo">
          <a href="/" onClick={(e) => handleNavigation('home', e)}>

            <span className="logo-text">Food</span> Donation
          </a>
        </div>

        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <ul className="nav-links">
            <li><a href="#home" onClick={(e) => handleNavigation('home', e)}>Home</a></li>
            <li><a href="#about" onClick={(e) => handleNavigation('about', e)}>About</a></li>
            <li><a href="#donor" onClick={(e) => handleNavigation('donor', e)}>Donor</a></li>
            <li><a href="#request" onClick={(e) => handleNavigation('request', e)}>Request</a></li>
            <li><a href="#impact" onClick={(e) => handleNavigation('impact', e)}>Our Impact</a></li>
            <li><a href="#contact" onClick={(e) => handleNavigation('contact', e)}>Contact Us</a></li>
          </ul>

          <div className="nav-buttons">
            <button className="btn-login" onClick={() => handleNavigation('login')}>Login</button>
            <button className="btn-signup" onClick={() => handleNavigation('signup')}>Sign Up</button>
          </div>
        </div>

        <div className={`mobile-toggle ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>
    </header>
  );
};

export default Header;
