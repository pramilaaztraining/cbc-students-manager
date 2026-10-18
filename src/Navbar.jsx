import React from 'react';
import './Navbar.css';

export default function Navbar({ activeScreen, setCurrentScreen }) {
  return (
    <header className="floating-navbar-wrapper">
      <div className="floating-nav-container">
        
        {/* Brand Logo & Title */}
        <div className="nav-brand-section" onClick={() => setCurrentScreen('home')} style={{ cursor: 'pointer' }}>
          <div className="nav-logo-crest">✝</div>
          <div className="nav-brand-titles">
            <span className="nav-brand-main">CHRIST BIBLE COLLEGE</span>
            <span className="nav-brand-sub">Love. Serve. Share.</span>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <nav className="nav-links-section">
          
          {/* HOME */}
          <button 
            onClick={() => setCurrentScreen('home')} 
            className={`nav-item ${activeScreen === 'home' ? 'active-nav-item' : ''}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            HOME
          </button>
          
          <div className="nav-dropdown-wrapper">
            <button 
              className={`nav-item ${activeScreen === 'leadership' ? 'active-nav-item' : ''}`} 
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ABOUT <span>▾</span>
            </button>
            <div className="nav-dropdown-menu">
              <button onClick={() => setCurrentScreen('leadership')} className="dropdown-link" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>Our Leadership</button>
            </div>
          </div>

          {/* CBC MANAGER */}
          <button 
            onClick={() => setCurrentScreen('creation')} 
            className={`nav-item ${['creation', 'academics', 'stayCalendar'].includes(activeScreen) ? 'active-nav-item' : ''}`} 
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            CBC MANAGER
          </button>

          {/* COURSES */}
          <button 
            onClick={() => setCurrentScreen('courses')} 
            className={`nav-item ${activeScreen === 'courses' ? 'active-nav-item' : ''}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            COURSES
          </button>

          <a href="#form-section" className="nav-item">SONGBOOK</a>
          <a href="#form-section" className="nav-item">PASTORAL INTERNSHIP</a>
          <a href="#form-section" className="nav-item">MINISTRIES</a>
          
          {/* CONTACT */}
          <button 
            onClick={() => setCurrentScreen('contact')} 
            className={`nav-item ${activeScreen === 'contact' ? 'active-nav-item' : ''}`} 
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            CONTACT
          </button>
        </nav>

      </div>
    </header>
  );
}