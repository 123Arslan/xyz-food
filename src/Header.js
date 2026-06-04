import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout, isDonor, isReceiver, isAdmin } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false); // Close menu on mobile after click
  };

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo">
          <Link to="/" onClick={handleLinkClick}>
            <span className="logo-text">Food</span> Donation
          </Link>
        </div>

        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <ul className="nav-links">
            <li><Link to="/" onClick={handleLinkClick}>Home</Link></li>
            <li><Link to="/about" onClick={handleLinkClick}>About</Link></li>
            {isDonor && <li><Link to="/donor-dashboard" onClick={handleLinkClick}>Donor Dashboard</Link></li>}
            {isReceiver && <li><Link to="/receiver-dashboard" onClick={handleLinkClick}>Receiver Dashboard</Link></li>}
            {isAdmin && <li><Link to="/admin" onClick={handleLinkClick}>Admin Dashboard</Link></li>}
            <li><Link to="/impact" onClick={handleLinkClick}>Our Impact</Link></li>
            <li><Link to="/contact" onClick={handleLinkClick}>Contact Us</Link></li>
          </ul>

          <div className="nav-buttons">
            {isAuthenticated ? (
              <button className="btn-signup animate-pulse" onClick={handleLogout}>Log Out</button>
            ) : (
              <>
                <button className="btn-login" onClick={() => { handleLinkClick(); navigate('/login'); }}>Login</button>
                <button className="btn-signup" onClick={() => { handleLinkClick(); navigate('/signup'); }}>Sign Up</button>
              </>
            )}
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
