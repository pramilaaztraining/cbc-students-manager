import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AcademicEvaluationsScreen.css';

export default function AcademicEvaluationsScreen({ 
  formData, 
  setFormData, 
  handleSubmit, 
  rows, 
  handleEdit, 
  stephenKeys, 
  rajkeys, 
  sampathKeys 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  
  useEffect(() => {
    if (formData && formData.id) {
      setSelectedStudentId(String(formData.id));
    } else {
      setSelectedStudentId('');
    }
  }, [formData?.id]);

  const [collapsedSections, setCollapsedSections] = useState({
    stephen: false,
    rajshekar: true,
    sampath: true
  });

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const subjectNameMap = {
    synoptic: 'Synoptic Gospels',
    actsEpistles: 'Acts & Epistles',
    homiletics: 'Homiletics',
    law: 'Law',
    history: 'History',
    poetic: 'Poetic & Wisdom',
    prophetic: 'Prophetic',
    loc: 'Life of Christ',
    locChronological: 'Life of Christ - Chronological',
    evangelism: 'Evangelism & Missions'
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
      const formatProfSummary = (obj, keys) => {
        if (!obj) return 'N/A';
        return keys.map(k => {
          const fullName = subjectNameMap[k] || k;
          const ex = obj[`${k}Exam`] ? '[Yes]' : '[No]';
          const notes = obj[`${k}Notes`] ? '[Yes]' : '[No]';
          const cls = obj[`${k}Classes`] ? '[Yes]' : '[No]';
          const perm = obj[`${k}Permissions`] || 0;
          return `${fullName}\n  Ex: ${ex} | Notes: ${notes} | Classes: ${cls} | Permissions: ${perm}`;
        }).join('\n\n');
      };

      const stephenText = formatProfSummary(row.stephen, stephenKeys);
      const rajshekarText = formatProfSummary(row.rajshekar, rajkeys);
      const sampathText = formatProfSummary(row.sampath, sampathKeys);

      return [
        row.id || index + 1,
        `${row.first_name || ''} ${row.last_name || ''}`,
        row.district || 'N/A',
        stephenText,
        rajshekarText,
        sampathText
      ];
    });

    const tableColumns = ['ID', 'Full Name', 'District', 'Prof Stephen', 'Prof Rajshekar', 'Prof Sampath'];

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
          Update Academic Evaluations for: <span className="selected-student">{formData.first_name ? `${formData.first_name} ${formData.last_name}` : 'Select a student below'}</span>
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
                setFormData({ id: null, first_name: '', last_name: '', email: '', course: '', batch: '', district: '', phone: '', photoLink: '', photoUrl: '', stephen: {}, rajshekar: {}, sampath: {}, accommodation: '', postGradStay: '', stayStartDateTime: '', stayEndDateTime: '' });
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
          <div className="collapsible-panel">
            <div className="panel-header" onClick={() => toggleSection('stephen')}>
              <div className="panel-header-text">
                <span className="panel-title">Lecturer: <strong>Prof Stephen Suresh Babu</strong></span>
              </div>
              <span className="toggle-icon">{collapsedSections.stephen ? '▼' : '▲'}</span>
            </div>
            {!collapsedSections.stephen && (
              <div className="panel-body">
                {renderSubjectCards('stephen', [
                  { key: 'synoptic', label: 'Synoptic Gospels' },
                  { key: 'actsEpistles', label: 'Acts & Epistles' },
                  { key: 'homiletics', label: 'Homiletics' }
                ])}
              </div>
            )}
          </div>

          <div className="collapsible-panel">
            <div className="panel-header" onClick={() => toggleSection('rajshekar')}>
              <div className="panel-header-text">
                <span className="panel-title">Lecturer: <strong>Prof Rajshekar Sir</strong></span>
              </div>
              <span className="toggle-icon">{collapsedSections.rajshekar ? '▼' : '▲'}</span>
            </div>
            {!collapsedSections.rajshekar && (
              <div className="panel-body">
                {renderSubjectCards('rajshekar', [
                  { key: 'law', label: 'Law' },
                  { key: 'history', label: 'History' },
                  { key: 'poetic', label: 'Poetic & Wisdom' },
                  { key: 'prophetic', label: 'Prophetic' }
                ])}
              </div>
            )}
          </div>

          <div className="collapsible-panel">
            <div className="panel-header" onClick={() => toggleSection('sampath')}>
              <div className="panel-header-text">
                <span className="panel-title">Lecturer: <strong>Prof Sampath Kumar</strong></span>
              </div>
              <span className="toggle-icon">{collapsedSections.sampath ? '▼' : '▲'}</span>
            </div>
            {!collapsedSections.sampath && (
              <div className="panel-body">
                {renderSubjectCards('sampath', [
                  { key: 'loc', label: 'Life of Christ' },
                  { key: 'locChronological', label: 'Life of Christ - Chronological Study' },
                  { key: 'evangelism', label: 'Evangelism & Missions' }
                ])}
              </div>
            )}
          </div>
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
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>District</th>
                <th>Prof Stephen</th>
                <th>Prof Rajshekar</th>
                <th>Prof Sampath</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSummaryRows.length > 0 ? (
                filteredSummaryRows.map((row) => (
                  <tr key={row.id}>
                    <td><code>{row.id}</code></td>
                    <td><strong>{row.first_name} {row.last_name}</strong></td>
                    <td>{row.district}</td>
                    <td>Summary Recorded</td>
                    <td>Summary Recorded</td>
                    <td>Summary Recorded</td>
                    <td>
                      <button type="button" onClick={() => handleEdit(row, 'academics')} className="edit-btn">
                        Edit Academics
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">No matching records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}