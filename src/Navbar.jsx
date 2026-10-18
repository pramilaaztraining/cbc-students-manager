import React from 'react';
import './Navbar.css';

export default function Navbar({ setCurrentScreen }) {
  return (
    <header className="floating-navbar-wrapper">
      <div className="floating-nav-container">
        
        {/* Brand Logo & Title */}
        <div className="nav-brand-section" onClick={() => setCurrentScreen('creation')} style={{ cursor: 'pointer' }}>
          <div className="nav-logo-crest">✝</div>
          <div className="nav-brand-titles">
            <span className="nav-brand-main">CHRIST BIBLE COLLEGE</span>
            <span className="nav-brand-sub">Love. Serve. Share.</span>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <nav className="nav-links-section">
          <button onClick={() => setCurrentScreen('creation')} className="nav-item" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>HOME</button>
          
          <div className="nav-dropdown-wrapper">
            <button className="nav-item" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>ABOUT <span>▾</span></button>
            <div className="nav-dropdown-menu">
              <button onClick={() => setCurrentScreen('leadership')} className="dropdown-link" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>Our Leadership</button>
            </div>
          </div>

          {/* CBC Manager Link */}
          <button 
            onClick={() => setCurrentScreen('creation')} 
            className="nav-item nav-manager-btn" 
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: '800', color: '#2563eb' }}
          >
            CBC MANAGER
          </button>

          <a href="#form-section" className="nav-item">SONGBOOK</a>
          <a href="#form-section" className="nav-item">PASTORAL INTERNSHIP</a>
          <a href="#form-section" className="nav-item">MINISTRIES</a>
          
          <button onClick={() => setCurrentScreen('contact')} className="nav-item nav-contact-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>CONTACT</button>
      
      <button onClick={() => setCurrentScreen('courses')} className="nav-item" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>COURSES</button>
        </nav>

      </div>
    </header>
  );
}