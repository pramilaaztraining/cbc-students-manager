import React from 'react';
import './StudentSelectDropdown.css';

export default function StudentSelectDropdown({ rows, selectedStudentId, onStudentChange }) {
  return (
    <div className="student-select-group">
      <label className="student-select-label">
        Select Student from Directory <span className="telugu-label">జాబితా నుండి విద్యార్థిని ఎంచుకోండి</span>
      </label>
      <select 
        value={selectedStudentId} 
        onChange={(e) => onStudentChange(e.target.value)} 
        className="student-select-dropdown"
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