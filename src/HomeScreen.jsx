import React from 'react';
import './HomeScreen.css';

export default function HomeScreen({ setActiveScreen }) {
  return (
    <div className="home-screen-wrapper">
      
      {/* Hero Section with the Bible Training Group Image */}
      <div 
        className="hero-banner-container"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&q=80&w=1600')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="hero-overlay-content">
          <h1 className="welcome-tagline-small">— Welcome to CBC Bengaluru</h1>
          <h1 className="hero-main-title">THE MINISTRY OF THE WORD AND DISCIPLESHIP</h1> 
          <p className="hero-bible-verse">
            ""Whoever wants to be my disciple must deny themselves and take up their cross daily and follow me."
<span>LUKE 9:23</span>
          </p>
          <div className="hero-buttons-row">
            <button onClick={() => setActiveScreen('contact')} className="btn-plan-visit">
              PLAN YOUR VISIT
            </button>
            <button onClick={() => setActiveScreen('courses')} className="btn-browse-sermons">
              BROWSE COURSES
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Info Cards Bar */}
      <div className="info-cards-bar">
        
        {/* Card 1: Worship Time */}
        <div className="info-card-item">
          <div className="info-icon">⏰</div>
          <div className="info-text-group">
            <h4>Sunday Worship Gathering</h4>
            <p>10:00 AM</p>
          </div>
        </div>

        {/* Card 2: Worship Location */}
        <div className="info-card-item">
          <div className="info-icon">📍</div>
          <div className="info-text-group">
            <h4>Worship Location</h4>
            <p>#521, Alkapura Gate, Gauribidanur, Karnataka, India</p>
          </div>
        </div>

        {/* Card 3: Contact Office */}
        <div className="info-card-item">
          <div className="info-icon">📞</div>
          <div className="info-text-group">
            <h4>Contact Office</h4>
            <p>Prof. Stephen Suresh Babu: +91 8074852725</p>
            <p>Prof. Rajshekar Sir: +91 8885831588</p>
          </div>
        </div>

      </div>

    </div>
  );
}