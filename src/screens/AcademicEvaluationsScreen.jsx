import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AcademicEvaluationsScreen.css';

export default function AcademicEvaluationsScreen({ 
  formData, 
  setFormData, 
  handleSubmit, 
  rows, 
  handleEdit 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [professorsData, setProfessorsData] = useState([]);
  const [loadingProfessors, setLoadingProfessors] = useState(true);
  const [error, setError] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({});

  // Fetch dynamic professors and subjects from the backend database on mount
  useEffect(() => {
    const fetchProfessors = async () => {
      try {
        setLoadingProfessors(true);
        const res = await fetch('/api/professor-subjects');
        const contentType = res.headers.get("content-type");
        
        if (!res.ok || !contentType || !contentType.includes("application/json")) {
          throw new Error('Failed to fetch professor configurations from the server.');
        }
        
        const data = await res.json();
        setProfessorsData(data);

        const initialCollapseState = {};
        data.forEach((prof, index) => {
          initialCollapseState[prof.lecturerKey] = index !== 0;
        });
        setCollapsedSections(initialCollapseState);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingProfessors(false);
      }
    };

    fetchProfessors();
  }, []);

  // Synchronize selected student ID with formData.id safely
  useEffect(() => {
    if (formData && formData.id) {
      setSelectedStudentId(String(formData.id));
    } else {
      setSelectedStudentId('');
    }
  }, [formData]);

  const toggleSection = (sectionKey) => {
    setCollapsedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const handleChange = (e, lecturerKey, fieldKey, type) => {
    if (!lecturerKey) {
      const { name, value } = e.target;
      if (typeof setFormData === 'function') {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      let value;
      if (type === 'checkbox') {
        value = e.target.checked;
      } else if (type === 'file') {
        const file = e.target.files[0];
        value = file ? file.name : '';
      } else if (type === 'number' && fieldKey.includes('Permissions')) {
        const num = Number(e.target.value);
        value = isNaN(num) ? 0 : Math.max(0, num);
      } else {
        value = e.target.value;
      }

      if (typeof setFormData === 'function') {
        setFormData(prev => ({
          ...prev,
          [lecturerKey]: {
            ...(prev[lecturerKey] || {}),
            [fieldKey]: value
          }
        }));
      }
    }
  };

  const filteredSummaryRows = rows.filter(row => 
    (row.first_name && row.first_name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (row.last_name && row.last_name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (row.district && row.district.toLowerCase().includes(searchTerm.toLowerCase())) ||
    String(row.id).includes(searchTerm)
  );

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('Academic Records Summary', 14, 15);

    const tableRows = filteredSummaryRows.map((row, index) => {
      const formatProfSummary = (obj, subjectsList) => {
        if (!obj || !subjectsList) return 'N/A';
        return subjectsList.map(sub => {
          const k = sub.key;
          const fullName = sub.label;
          const ex = obj[`${k}Exam`] ? '[Yes]' : '[No]';
          const notes = obj[`${k}Notes`] ? '[Yes]' : '[No]';
          const cls = obj[`${k}Classes`] ? '[Yes]' : '[No]';
          const perm = obj[`${k}Permissions`] || 0;
          return `${fullName}\n  Ex: ${ex} | Notes: ${notes} | Classes: ${cls} | Permissions: ${perm}`;
        }).join('\n\n');
      };

      const rowData = [
        row.id || index + 1,
        `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'N/A',
        row.district || 'N/A'
      ];

      professorsData.forEach(prof => {
        rowData.push(formatProfSummary(row[prof.lecturerKey], prof.subjects));
      });

      return rowData;
    });

    const tableColumns = [
      'ID', 
      'Full Name', 
      'District', 
      ...professorsData.map(p => p.lecturerName)
    ];

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save('academic-records-summary.pdf');
  };

  const renderSubjectCards = (lecturerKey, subjectsList) => {
    if (!subjectsList) return null;

    return (
      <div className="subjects-grid">
        {subjectsList.map((sub) => {
          const examField = `${sub.key}Exam`;
          const notesField = `${sub.key}Notes`;
          const classesField = `${sub.key}Classes`;
          const permissionsField = `${sub.key}Permissions`;
          const videoField = `${sub.key}VideoFileName`;

          const lecturerData = formData[lecturerKey] || {};

          return (
            <div key={sub.key} className="subject-card">
              <div className="subject-title-wrapper">
                <h4 className="subject-title">{sub.label}</h4>
                {sub.telugu && <span className="subject-telugu">({sub.telugu})</span>}
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={!!lecturerData[examField]} 
                    onChange={(e) => handleChange(e, lecturerKey, examField, 'checkbox')} 
                  />
                  Exam Completed
                </label>

                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={!!lecturerData[notesField]} 
                    onChange={(e) => handleChange(e, lecturerKey, notesField, 'checkbox')} 
                  />
                  Notes Completed
                </label>

                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={!!lecturerData[classesField]} 
                    onChange={(e) => handleChange(e, lecturerKey, classesField, 'checkbox')} 
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
                  onChange={(e) => handleChange(e, lecturerKey, permissionsField, 'number')} 
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
                    onChange={(e) => handleChange(e, lecturerKey, videoField, 'file')} 
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
        })}
      </div>
    );
  };

  const studentFullName = `${formData.first_name || ''} ${formData.last_name || ''}`.trim();

  return (
    <div className="screen-section">
      <div className="section-intro">
        <h2>Section 2: Academic Evaluations</h2>
        <p className="subtitle">Search for a student to edit/update their academic evaluations, exams, and notes.</p>
      </div>

      <div className="form-card search-card">
        <h4>🔍 Quick Search Table <span className="telugu-text">(పట్టికను వెతకండి)</span></h4>
        <input 
          type="text" 
          placeholder="Type name or ID to filter table..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="search-input"
        />
      </div>

      <form onSubmit={handleSubmit} className="form-card">
        <h3>
          Update Academic Evaluations for: <span className="selected-student">{studentFullName || 'Select a student below'}</span>
          {formData.id && <span style={{ fontSize: '0.85rem', color: '#2563eb', marginLeft: '10px', fontWeight: 'bold' }}>[Target ID: {formData.id}]</span>}
        </h3>
        
        {formData.id && <input type="hidden" name="id" value={formData.id} />}

        <div className="input-group" style={{ position: 'relative' }}>
          <label>Select Student from Directory <span className="telugu-label">జాబితా నుండి విద్యార్థిని ఎంచుకోండి</span></label>
          <select 
            value={selectedStudentId} 
            onChange={(e) => {
              const val = e.target.value;
              setSelectedStudentId(val);
              
              if (!val) {
                setFormData({ id: null, first_name: '', last_name: '', email: '', course: '', batch: '', district: '', phone: '', photoLink: '', photoUrl: '', stephen: {}, rajshekar: {}, sampath: {} });
                return;
              }

              const found = rows.find(r => String(r.id) === val);
              if (found) {
                setFormData({ ...found });
              }
            }} 
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

        <div className="professors-section-wrapper" style={{ marginTop: '20px' }}>
          {loadingProfessors ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>Loading professors and subjects from database...</p>
          ) : error ? (
            <p style={{ textAlign: 'center', color: '#ef4444' }}>Error: {error}</p>
          ) : (
            professorsData.map(prof => (
              <div key={prof.lecturerKey} className="collapsible-panel">
                <div className="panel-header" onClick={() => toggleSection(prof.lecturerKey)}>
                  <div className="panel-header-text">
                    <span className="panel-title">Lecturer: <strong>{prof.lecturerName}</strong></span>
                  </div>
                  <span className="toggle-icon">{collapsedSections[prof.lecturerKey] ? '▼' : '▲'}</span>
                </div>
                {!collapsedSections[prof.lecturerKey] && (
                  <div className="panel-body">
                    {renderSubjectCards(prof.lecturerKey, prof.subjects)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="form-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button type="submit" className="save-btn">
            {formData.id ? `Update Academic Records [ID: ${formData.id}]` : 'Save Academic Records'}
          </button>
        </div>
      </form>

      <div className="summary-section" style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3>Academic Records Summary</h3>
          <button type="button" onClick={exportToPDF} style={{ padding: '10px 18px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            📥 Export Table to PDF
          </button>
        </div>

        <div className="table-wrapper">
          {loadingProfessors ? (
            <p style={{ padding: '20px', textAlign: 'center' }}>Loading summary table...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>District</th>
                  {professorsData.map(prof => (
                    <th key={prof.lecturerKey}>{prof.lecturerName}</th>
                  ))}
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSummaryRows.length > 0 ? (
                  filteredSummaryRows.map((row) => (
                    <tr key={row.id}>
                      <td><code>{row.id}</code></td>
                      <td><strong>{row.first_name} {row.last_name}</strong></td>
                      <td>{row.district || 'N/A'}</td>
                      {professorsData.map(prof => (
                        <td key={prof.lecturerKey}>Summary Recorded</td>
                      ))}
                      <td>
                        <button type="button" onClick={() => handleEdit(row, 'academics')} className="edit-btn">
                          Edit Academics
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4 + professorsData.length} className="no-data">No matching records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}