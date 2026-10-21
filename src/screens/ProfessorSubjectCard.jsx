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
  const handleFileUpload = (subjectId, e) => {
    const file = e.target.files[0];
    if (file) {
      onChange(subjectId, 'video_file_name', file.name);
    }
  };

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
            <div className="subjects-column-grid">
              {subjects.map(sub => {
                const ev = evaluationsMap[sub.subject_id] || {
                  exam: false,
                  notes: false,
                  classes: false,
                  permissions: '0',
                  video_file_name: ''
                };

                return (
                  <div key={sub.subject_id} className="subject-column-card">
                    {/* Subject Name (Key Hidden) */}
                    <div className="subject-column-title">
                      {sub.subject_label}
                    </div>

                    {/* Controls: Exam, Notes, Classes, Permissions */}
                    <div className="subject-controls-inline">
                      <label className="control-label">
                        <input 
                          type="checkbox"
                          checked={!!ev.exam}
                          onChange={(e) => onChange(sub.subject_id, 'exam', e.target.checked)}
                        /> 
                        Exam
                      </label>

                      <label className="control-label">
                        <input 
                          type="checkbox"
                          checked={!!ev.notes}
                          onChange={(e) => onChange(sub.subject_id, 'notes', e.target.checked)}
                        /> 
                        Notes
                      </label>

                      <label className="control-label">
                        <input 
                          type="checkbox"
                          checked={!!ev.classes}
                          onChange={(e) => onChange(sub.subject_id, 'classes', e.target.checked)}
                        /> 
                        Classes
                      </label>

                      <div className="permissions-wrapper">
                        <span>Perm (0-20):</span>
                        <input 
                          type="number"
                          min="0"
                          max="20"
                          value={ev.permissions}
                          onChange={(e) => onChange(sub.subject_id, 'permissions', e.target.value)}
                          className="styled-number-input"
                        />
                      </div>
                    </div>

                    {/* Video Upload Button & Active File Preview */}
                    <div className="video-upload-row">
                      <label className="upload-file-btn">
                        📁 Upload Video
                        <input 
                          type="file" 
                          accept="video/*"
                          style={{ display: 'none' }} 
                          onChange={(e) => handleFileUpload(sub.subject_id, e)}
                        />
                      </label>

                      {ev.video_file_name ? (
                        <span className="file-selected-badge" title={ev.video_file_name}>
                          ✓ {ev.video_file_name}
                        </span>
                      ) : (
                        <span className="no-file-text">
                          No video selected
                        </span>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}