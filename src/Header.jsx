import React from 'react';
import './Header.css';

export default function Header({ activeScreen, setActiveScreen }) {
  return (
    <div className="cbc-manager-header-wrapper">
      
      {/* Main Title & Subtitle */}
      <div className="cbc-dashboard-title-area">
        <h1 className="cbc-main-title">CBC-BTC Manager</h1>
        <p className="cbc-sub-title">
          Student Academic Records & Campus Stay Management (విద్యార్థుల రికార్డుల నిర్వహణ)
        </p>
      </div>

      {/* Action Tab Navigation Buttons */}
      <div className="cbc-tabs-row">
        <button 
          type="button"
          onClick={() => setActiveScreen('creation')}
          className={`cbc-tab-btn ${activeScreen === 'creation' ? 'active' : ''}`}
        >
          1. Student Details Creation
        </button>

        <button 
          type="button"
          onClick={() => setActiveScreen('academics')}
          className={`cbc-tab-btn ${activeScreen === 'academics' ? 'active' : ''}`}
        >
          2. Academic Evaluations
        </button>

        <button 
          type="button"
          onClick={() => setActiveScreen('stayCalendar')}
          className={`cbc-tab-btn ${activeScreen === 'stayCalendar' ? 'active' : ''}`}
        >
          3. Post-Grad Stay & Calendar
        </button>        
      </div>

    </div>
  );
}