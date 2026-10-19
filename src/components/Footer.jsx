import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="church-footer">
      <div className="footer-container">
        
        {/* Left Column: Logo & Description */}
        <div className="footer-col footer-brand-col">
          <div className="footer-logo-row">
            <div className="footer-crest">✝</div>
            <div className="footer-brand-title">
              <span className="brand-christ">CHRIST</span>
              <span className="brand-church">BIBLE COLLEGE</span>
            </div>
          </div>
          <p className="footer-desc">
            We are a Bible-believing, Christ-exalting, local church congregation situated in Gauribidanur, Karnataka. Seeking to make disciples of Jesus Christ who glorify God.
          </p>
          <p className="footer-copy">© 2026 CHRIST BIBLE COLLEGE BENGALURU.</p>
        </div>

        {/* Middle Column: Quick Links */}
        <div className="footer-col">
          <h4 className="footer-heading">QUICK LINKS</h4>
          <ul className="footer-links">
            <li><a href="#form-section">Sunday Service</a></li>
            <li><a href="#form-section">About Our Church</a></li>
            <li><a href="#form-section">What We Believe</a></li>
            <li><a href="#form-section">Our Leadership</a></li>
            <li><a href="#form-section">Sermon Archives</a></li>
            <li><a href="#form-section">Ministries & Events</a></li>
            <li><a href="#form-section">Plan a Visit</a></li>
          </ul>
        </div>

        {/* Right Column: Gathering Times & Chapel Location */}
        <div className="footer-col">
          <h4 className="footer-heading">GATHERING TIMES</h4>
          <div className="footer-gathering-info">
            <p className="gathering-title">Sunday Worship Gathering:</p>
            <p className="gathering-time">10:00 AM</p>
            <p className="gathering-title mt-15">Service Location Chapel:</p>
            <p className="gathering-address">
              #521, Alkapura Gate, Gauribidanur, Karnataka, India
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}