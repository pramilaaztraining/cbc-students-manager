import React from 'react';

export default function SubjectCard({ sub, lecturerKey, lecturerData, onChange }) {
  const examField = `${sub.key}Exam`;
  const notesField = `${sub.key}Notes`;
  const classesField = `${sub.key}Classes`;
  const permissionsField = `${sub.key}Permissions`;
  const videoField = `${sub.key}VideoFileName`;

  return (
    <div className="subject-card">
      <div className="subject-title-wrapper">
        <h4 className="subject-title">{sub.label}</h4>
        {sub.telugu && <span className="subject-telugu">({sub.telugu})</span>}
      </div>

      <div className="checkbox-group">
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={!!lecturerData[examField]} 
            onChange={(e) => onChange(e, lecturerKey, examField, 'checkbox')} 
          />
          Exam Completed
        </label>

        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={!!lecturerData[notesField]} 
            onChange={(e) => onChange(e, lecturerKey, notesField, 'checkbox')} 
          />
          Notes Completed
        </label>

        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={!!lecturerData[classesField]} 
            onChange={(e) => onChange(e, lecturerKey, classesField, 'checkbox')} 
          />
          All Classes Attended
        </label>
      </div>

      <div className="permissions-row">
        <span className="permissions-label">Permissions:</span>
        <input 
          type="number" 
          min="0"
          className="permissions-input"
          value={lecturerData[permissionsField] || 0} 
          onChange={(e) => onChange(e, lecturerKey, permissionsField, 'number')} 
        />
      </div>

      <hr className="card-divider" />

      <div className="upload-section">
        <span className="upload-label">Upload Video:</span>
        <div className="file-input-wrapper">
          <input 
            type="file" 
            id={`file-${lecturerKey}-${sub.key}`}
            accept="video/*"
            onChange={(e) => onChange(e, lecturerKey, videoField, 'file')} 
            style={{ display: 'none' }}
          />
          <label htmlFor={`file-${lecturerKey}-${sub.key}`} className="choose-file-btn">Choose File</label>
          <span className="file-name-display">
            {lecturerData[videoField] || 'No file chosen'}
          </span>
        </div>
      </div>
    </div>
  );
}