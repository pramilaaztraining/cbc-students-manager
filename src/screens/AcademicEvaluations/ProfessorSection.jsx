import React from 'react';
import SubjectCard from './SubjectCard';

export default function ProfessorSection({ prof, isCollapsed, onToggle, formData, onChange }) {
  const lecturerData = formData[prof.lecturerKey] || {};

  return (
    <div className="collapsible-panel">
      <div className="panel-header" onClick={() => onToggle(prof.lecturerKey)}>
        <div className="panel-header-text">
          <span className="panel-title">Lecturer: <strong>{prof.lecturerName}</strong></span>
        </div>
        <span className="toggle-icon">{isCollapsed ? '▼' : '▲'}</span>
      </div>
      {!isCollapsed && (
        <div className="panel-body">
          <div className="subjects-grid">
            {prof.subjects.map(sub => (
              <SubjectCard 
                key={sub.key} 
                sub={sub} 
                lecturerKey={prof.lecturerKey} 
                lecturerData={lecturerData} 
                onChange={onChange} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}