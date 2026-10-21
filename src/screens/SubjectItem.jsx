import React from 'react';

export default function SubjectItem({ 
  subject, 
  evaluation = {}, 
  onChange 
}) {
  const { subject_id, subject_label } = subject;

  return (
    <div style={{ padding: '12px', marginBottom: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
      <strong style={{ display: 'block', marginBottom: '8px', color: '#334155' }}>
        {subject_label}
      </strong>
      
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={!!evaluation.exam} 
            onChange={(e) => onChange(subject_id, 'exam', e.target.checked)}
          /> Exam
        </label>

        <label style={{ cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={!!evaluation.notes} 
            onChange={(e) => onChange(subject_id, 'notes', e.target.checked)}
          /> Notes
        </label>

        <label style={{ cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={!!evaluation.classes} 
            onChange={(e) => onChange(subject_id, 'classes', e.target.checked)}
          /> Classes
        </label>

        <div>
          <span style={{ fontSize: '0.85rem', marginRight: '5px' }}>Permissions:</span>
          <input 
            type="text" 
            value={evaluation.permissions || ''} 
            onChange={(e) => onChange(subject_id, 'permissions', e.target.value)}
            style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          />
        </div>
      </div>
    </div>
  );
}