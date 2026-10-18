import React from 'react';
import './Navbar.css';

export default function Navbar() {
  return (
    <header className="floating-navbar-wrapper">
      <div className="floating-nav-container">
        
        {/* Left: Logo & Brand Title */}
        <div className="nav-brand-section">
          <div className="nav-logo-crest">✝</div>
          <div className="nav-brand-titles">
            <span className="nav-brand-main">CHRIST BIBLE COLLEGE</span>
            <span className="nav-brand-sub">Love. Serve. Share.</span>
          </div>
        </div>

        {/* Right: Navigation Links */}
        <nav className="nav-links-section">
          <a href="#form-section" className="nav-item">ABOUT <span>v</span></a>
          <a href="#form-section" className="nav-item">SONGBOOK</a>
          <a href="#form-section" className="nav-item">PASTORAL INTERNSHIP</a>
          <a href="#form-section" className="nav-item">MINISTRIES</a>
          <a href="#form-section" className="nav-item nav-contact-btn">CONTACT</a>
        </nav>

      </div>
    </header>
  );
}