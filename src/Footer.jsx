import React from 'react';

export default function Footer() {
  return (
    <footer className="church-footer" style={{ marginTop: '50px', background: '#0f172a', color: '#cbd5e1', padding: '40px 20px' }}>
      <div className="footer-container" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="footer-col footer-brand-col" style={{ flex: '1', minWidth: '280px' }}>
          <div className="footer-logo-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div className="footer-crest" style={{ color: '#38bdf8', fontSize: '1.5rem' }}>✝</div>
            <div className="footer-brand-title">
              <span className="brand-christ" style={{ fontWeight: 'bold', color: '#fff' }}>CHRIST</span> <span className="brand-church" style={{ color: '#38bdf8' }}>BIBLE CHURCH</span>
            </div>
          </div>
          <p className="footer-desc" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
            We are a Bible-believing, Christ-exalting, local church congregation situated in Gauribidanur, Karnataka. Seeking to make disciples of Jesus Christ who glorify God.
          </p>
          <p className="footer-copy" style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '10px' }}>© 2026 CHRIST BIBLE COLLEGE (CBC) BENGALURU.</p>
        </div>

        <div className="footer-col" style={{ flex: '1', minWidth: '220px' }}>
          <h4 className="footer-heading" style={{ color: '#fff', marginBottom: '15px' }}>GATHERING TIMES</h4>
          <div className="footer-gathering-info" style={{ fontSize: '0.9rem' }}>
            <p className="gathering-title" style={{ color: '#38bdf8', fontWeight: 'bold' }}>Sunday Worship Gathering:</p>
            <p className="gathering-time">10:00 AM</p>
            <p className="gathering-title mt-15" style={{ color: '#38bdf8', fontWeight: 'bold', marginTop: '10px' }}>Service Location Chapel:</p>
            <p className="gathering-address">
              #521, Alkapura Gate, Gauribidanur, Karnataka, India
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}