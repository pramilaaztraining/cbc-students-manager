import React from 'react';
import './Navbar.css';

export default function Navbar({ setCurrentScreen }) {
  return (
    <header className="floating-navbar-wrapper">
      <div className="floating-nav-container">
        
        <div className="nav-brand-section" onClick={() => setCurrentScreen('home')} style={{ cursor: 'pointer' }}>
          <div className="nav-logo-crest">✝</div>
          <div className="nav-brand-titles">
            <span className="nav-brand-main">CHRIST BIBLE COLLEGE</span>
            <span className="nav-brand-sub">Love. Serve. Share.</span>
          </div>
        </div>

        <nav className="nav-links-section">
          <button onClick={() => setCurrentScreen('home')} className="nav-item" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>HOME</button>
          <a href="#form-section" className="nav-item">ABOUT <span>v</span></a>
          <a href="#form-section" className="nav-item">SONGBOOK</a>
          <a href="#form-section" className="nav-item">PASTORAL INTERNSHIP</a>
          <a href="#form-section" className="nav-item">MINISTRIES</a>
          {/* Clicking Contact switches the active screen state */}
          <button onClick={() => setCurrentScreen('contact')} className="nav-item nav-contact-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>CONTACT</button>
        </nav>

      </div>
    </header>
  );
}