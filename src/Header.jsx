import React from 'react';

export default function Header({ activeScreen, setActiveScreen, exportToPDF }) {
  return (
    <header className="app-header">
      <div className="header-content">
        <h1>CBC-BTC Manager</h1>
        <p className="header-subtitle">
          Student Academic Records & Campus Stay Management <span className="telugu-text">(విద్యార్థుల రికార్డుల నిర్వహణ)</span>
        </p>
        
        <nav className="app-nav-menu" style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '15px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveScreen('creation')} 
            style={{ background: activeScreen === 'creation' ? '#2563eb' : '#1e293b', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            1. Student Details Creation
          </button>
          <button 
            onClick={() => setActiveScreen('academics')} 
            style={{ background: activeScreen === 'academics' ? '#2563eb' : '#1e293b', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            2. Academic Evaluations
          </button>
          <button 
            onClick={() => setActiveScreen('stayCalendar')} 
            style={{ background: activeScreen === 'stayCalendar' ? '#2563eb' : '#1e293b', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            3. Post-Grad Stay & Calendar
          </button>
          <button onClick={exportToPDF} style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            📥 Download PDF
          </button>
        </nav>
      </div>
    </header>
  );
}