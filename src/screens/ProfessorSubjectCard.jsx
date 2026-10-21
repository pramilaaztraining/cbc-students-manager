import React from 'react';
import './ProfessorSubjectCard.css';

export default function ProfessorSubjectCard({ 
  prof, 
  subjects, 
  evaluationsMap, 
  onChange, 
  isCollapsed, 
  onToggle 
}) {
  return (
    <div className="prof-subject-card">
      {/* Card Header */}
      <div 
        className="prof-card-header"
        onClick={() => onToggle(prof.professor_id)}
      >
        <div className="prof-title-wrapper">
          <span className="prof-badge">Prof</span>
          <h3>{prof.lecturer_name}</h3>
        </div>
        <span className={`collapse-icon ${isCollapsed ? 'collapsed' : ''}`}>
          ▼
        </span>
      </div>

      {/* Card Body */}
      {!isCollapsed && (
        <div className="prof-card-body">
          {subjects.length === 0 ? (
            <p className="no-subjects-text">No subjects assigned to this professor.</p>
          ) : (
            subjects.map(sub => {
              const ev = evaluationsMap[sub.subject_id] || {
                exam: false,
                notes: false,
                classes: false,
                permissions: '0',
                video_file_name: ''
              };

              return (
                <div key={sub.subject_id} className="subject-evaluation-row">
                  <div className="subject-header-bar">
                    <span className="subject-title">{sub.subject_label}</span>
                    <span className="subject-code-tag">{sub.subject_key}</span>
                  </div>

                  <div className="evaluation-controls-grid">
                    {/* Checkboxes Group */}
                    <div className="checkbox-group-card">
                      <label className="checkbox-label">
                        <input 
                          type="checkbox"
                          checked={!!ev.exam}
                          onChange={(e) => onChange(sub.subject_id, 'exam', e.target.checked)}
                        />
                        <span>Exam</span>
                      </label>

                      <label className="checkbox-label">
                        <input 
                          type="checkbox"
                          checked={!!ev.notes}
                          onChange={(e) => onChange(sub.subject_id, 'notes', e.target.checked)}
                        />
                        <span>Notes</span>
                      </label>

                      <label className="checkbox-label">
                        <input 
                          type="checkbox"
                          checked={!!ev.classes}
                          onChange={(e) => onChange(sub.subject_id, 'classes', e.target.checked)}
                        />
                        <span>Classes</span>
                      </label>
                    </div>

                    {/* Permissions Input (0-20) */}
                    <div className="input-field-block">
                      <label>Permissions <small>(0-20)</small></label>
                      <input 
                        type="number"
                        min="0"
                        max="20"
                        value={ev.permissions !== undefined ? ev.permissions : '0'}
                        onChange={(e) => onChange(sub.subject_id, 'permissions', e.target.value)}
                        className="styled-number-input"
                      />
                    </div>

                    {/* Video File Input */}
                    <div className="input-field-block video-block">
                      <label>Video File Reference</label>
                      <div className="input-with-icon">
                        <span className="input-icon">📹</span>
                        <input 
                          type="text"
                          placeholder="e.g., session_01.mp4"
                          value={ev.video_file_name || ''}
                          onChange={(e) => onChange(sub.subject_id, 'video_file_name', e.target.value)}
                          className="styled-text-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}