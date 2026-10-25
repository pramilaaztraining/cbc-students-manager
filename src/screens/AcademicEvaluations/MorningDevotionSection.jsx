import React from 'react';
import './MorningDevotionSection.css';

export default function MorningDevotionSection({ devotion, onChange }) {
  return (
    <div className="devotion-card">
      <h3 className="devotion-title">
        🌅 Practical - Morning Devotion <span className="devotion-telugu-text">(ఉదయం ప్రార్థనా ఆరాధన ప్రాక్టికల్స్)</span>
      </h3>
      <p className="devotion-subtitle">Record participation in morning devotion duties and attendance scoring.</p>

      <div className="devotion-grid">
        <div className="devotion-checkboxes-group">
          <label className="devotion-checkbox-label">
            <input 
              type="checkbox"
              checked={!!devotion.preaching}
              onChange={(e) => onChange('preaching', e.target.checked)}
            /> Preaching / ప్రసంగం
          </label>

          <label className="devotion-checkbox-label">
            <input 
              type="checkbox"
              checked={!!devotion.hosting}
              onChange={(e) => onChange('hosting', e.target.checked)}
            /> Hosting / నిర్వహణ
          </label>

          <label className="devotion-checkbox-label">
            <input 
              type="checkbox"
              checked={!!devotion.singing}
              onChange={(e) => onChange('singing', e.target.checked)}
            /> Singing / పాటలు
          </label>
        </div>

        <div className="devotion-score-group">
          <label className="devotion-score-label">Attendance Score / Marks (0-20):</label>
          <input 
            type="number"
            min="0"
            max="20"
            value={devotion.attendance_score}
            onChange={(e) => onChange('attendance_score', e.target.value)}
            className="devotion-score-input"
          />
        </div>
      </div>
    </div>
  );
}