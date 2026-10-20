import React from 'react';

export default function StudentSelectDropdown({ rows, selectedStudentId, onStudentChange }) {
  return (
    <div className="input-group" style={{ position: 'relative' }}>
      <label>Select Student from Directory <span className="telugu-label">జాబితా నుండి విద్యార్థిని ఎంచుకోండి</span></label>
      <select 
        value={selectedStudentId} 
        onChange={(e) => onStudentChange(e.target.value)} 
        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', background: '#fff' }}
      >
        <option value="">-- Choose student from directory --</option>
        {rows.map(row => (
          <option key={row.id} value={row.id}>
            ID: {row.id} - {row.first_name} {row.last_name} {row.district ? `(${row.district})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}