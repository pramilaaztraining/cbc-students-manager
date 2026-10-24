import React from 'react';
import './EvaluationsScreen.css';

export default function EvaluationsScreen({ 
  selectedStudentId, 
  evalData, 
  setEvalData, 
  handleSubmit 
}) {
  // Extract morning devotion state or fallback to default values
  const devotion = evalData?.morning_devotion || {
    preaching: false,
    hosting: false,
    singing: false,
    attendance_score: 0
  };

  const handleDevotionChange = (field, value) => {
    setEvalData(prev => ({
      ...prev,
      morning_devotion: {
        ...(prev.morning_devotion || { preaching: false, hosting: false, singing: false, attendance_score: 0 }),
        [field]: value
      }
    }));
  };

  return (
    <div className="evaluations-container">
      
      {/* ── Existing Lecturer Evaluation Cards Go Here ── */}
      {/* (e.g., Life of Christ, Evangelism, etc.) */}

      {/* 🌟 NEW SUB-SECTION: Practical - Morning Devotion */}
      <div className="devotion-practical-card">
        <h3 className="devotion-practical-title">
          🌅 Practical - Morning Devotion <span className="telugu-subtext" style={{ color: '#64748b', fontWeight: 'normal', fontSize: '0.85rem' }}>(ఉదయం ప్రార్థనా ఆరాధన ప్రాక్టికల్స్)</span>
        </h3>
        <p className="devotion-practical-subtitle">Record participation in morning devotion duties and attendance scoring.</p>

        <div className="devotion-grid">
          
          {/* Duties Checkboxes */}
          <div className="devotion-checkboxes">
            <label className="devotion-checkbox-label">
              <input 
                type="checkbox"
                checked={devotion.preaching}
                onChange={(e) => handleDevotionChange('preaching', e.target.checked)}
              />
              Preaching / ప్రసంగం
            </label>

            <label className="devotion-checkbox-label">
              <input 
                type="checkbox"
                checked={devotion.hosting}
                onChange={(e) => handleDevotionChange('hosting', e.target.checked)}
              />
              Hosting / నిర్వహణ
            </label>

            <label className="devotion-checkbox-label">
              <input 
                type="checkbox"
                checked={devotion.singing}
                onChange={(e) => handleDevotionChange('singing', e.target.checked)}
              />
              Singing / పాటలు
            </label>
          </div>

          {/* Attendance Marks Input */}
          <div className="devotion-attendance-box">
            <label>Attendance Score / Marks (0-20):</label>
            <input 
              type="number"
              min="0"
              max="20"
              value={devotion.attendance_score}
              onChange={(e) => handleDevotionChange('attendance_score', Number(e.target.value))}
              className="devotion-attendance-input"
            />
          </div>

        </div>
      </div>

      {/* Main Save Button */}
      <div style={{ marginTop: '25px' }}>
        <button 
          type="button" 
          onClick={handleSubmit}
          className="save-eval-btn"
          style={{ width: '100%', padding: '12px' }}
        >
          Save Academic Evaluations {selectedStudentId ? `[ID: ${selectedStudentId}]` : ''}
        </button>
      </div>

    </div>
  );
}