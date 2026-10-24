import React from 'react';

export default function MorningDevotionSection({ devotion, onChange }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
      <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>
        🌅 Practical - Morning Devotion <span style={{ color: '#64748b', fontWeight: 'normal', fontSize: '0.8rem' }}>(ఉదయం ప్రార్థనా ఆరాధన ప్రాక్టికల్స్)</span>
      </h3>
      <p style={{ margin: '0 0 15px 0', fontSize: '0.82rem', color: '#64748b' }}>Record participation in morning devotion duties and attendance scoring.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
            <input 
              type="checkbox"
              checked={!!devotion.preaching}
              onChange={(e) => onChange('preaching', e.target.checked)}
            /> Preaching / ప్రసంగం
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
            <input 
              type="checkbox"
              checked={!!devotion.hosting}
              onChange={(e) => onChange('hosting', e.target.checked)}
            /> Hosting / నిర్వహణ
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
            <input 
              type="checkbox"
              checked={!!devotion.singing}
              onChange={(e) => onChange('singing', e.target.checked)}
            /> Singing / పాటలు
          </label>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Attendance Score / Marks (0-20):</label>
          <input 
            type="number"
            min="0"
            max="20"
            value={devotion.attendance_score}
            onChange={(e) => onChange('attendance_score', e.target.value)}
            style={{ width: '120px', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}
          />
        </div>
      </div>
    </div>
  );
}