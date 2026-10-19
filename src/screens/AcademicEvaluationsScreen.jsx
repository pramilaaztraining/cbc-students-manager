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
  
  // Keep the dropdown synchronized with active formData ID
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Comprehensive label mapping for actual subject names
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
    row.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (row.district && row.district.toLowerCase().includes(searchTerm.toLowerCase())) ||
    String(row.id).includes(searchTerm)
  );

  // PDF Export Function using actual subject names
  const exportToPDF = () => {
    const doc = new jsPDF('landscape'); // Landscape layout to comfortably fit all columns

    // PDF Title
    doc.setFontSize(16);
    doc.text('Academic Records Summary', 14, 15);

    // Map filtered rows to match the summary table columns with full names
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
        row.name || '',
        row.district || 'N/A',
        stephenText,
        rajshekarText,
        sampathText
      ];
    });

    const tableColumns = [
      'ID', 
      'Name (పేరు)', 
      'District (జిల్లా)', 
      'Prof Stephen', 
      'Prof Rajshekar', 
      'Prof Sampath'
    ];

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 25,
      theme: 'grid',
      styles: { 
        fontSize: 8, 
        cellPadding: 3,
        overflow: 'linebreak' 
      },
      headStyles: { 
        fillColor: [41, 128, 185] 
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 65 },
        4: { cellWidth: 65 },
        5: { cellWidth: 65 }
      }
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
          Update Academic Evaluations for: <span className="selected-student">{formData.name || 'Select a student below'}</span>
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
                setFormData({ id: null, name: '', district: '', phone: '', photoLink: '', photoUrl: '', stephen: {}, rajshekar: {}, sampath: {}, accommodation: '', postGradStay: '', stayStartDateTime: '', stayEndDateTime: '' });
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
                ID: {row.id} - {row.name} {row.district ? `(${row.district})` : ''}
              </option>
            ))}
          </select>
          <small style={{ color: '#64748b', marginTop: '4px' }}>
            💡 Active Record: <strong>{formData.id ? `ID #${formData.id} - ${formData.name}` : 'None selected'}</strong>
          </small>
        </div>

        <div className="input-group">
          <label>Student Name <span className="telugu-label">విద్యార్థి పేరు</span></label>
          <input 
            type="text" 
            name="name" 
            placeholder="Enter student name..." 
            value={formData.name || ''} 
            onChange={(e) => handleChange(e, null, null, null)} 
            required 
          />
        </div>

        <div className="professors-section-wrapper">
          <div className="collapsible-panel">
            <div className="panel-header" onClick={() => toggleSection('stephen')}>
              <div className="panel-header-text">
                <span className="panel-title">
                  Lecturer: <strong>Prof Stephen Suresh Babu</strong> <span className="phone-num">(+91 8074852725)</span>
                </span>
                <span className="panel-subtitle">(సినాప్టిక్ గస్పెల్స్, ఆక్ట్స్ & ఎపిస్టల్స్, హోమిలెటిక్స్)</span>
              </div>
              <span className="toggle-icon">{collapsedSections.stephen ? '▼' : '▲'}</span>
            </div>
            {!collapsedSections.stephen && (
              <div className="panel-body">
                <div className="subjects-heading">SUBJECTS & SUBSECTIONS:</div>
                {renderSubjectCards('stephen', [
                  { key: 'synoptic', label: 'Synoptic Gospels', telugu: 'సినాప్టిక్' },
                  { key: 'actsEpistles', label: 'Acts & Epistles', telugu: 'ఆక్ట్స్' },
                  { key: 'homiletics', label: 'Homiletics', telugu: 'హోమిలెటిక్స్' }
                ])}
              </div>
            )}
          </div>

          <div className="collapsible-panel">
            <div className="panel-header" onClick={() => toggleSection('rajshekar')}>
              <div className="panel-header-text">
                <span className="panel-title">
                  Lecturer: <strong>Prof Rajshekar Sir</strong> <span className="phone-num">(+91-8885831588)</span>
                </span>
                <span className="panel-subtitle">(లా, హిస్టరీ, పోయెటిక్ & విజ్డమ్, ప్రాఫెటిక్)</span>
              </div>
              <span className="toggle-icon">{collapsedSections.rajshekar ? '▼' : '▲'}</span>
            </div>
            {!collapsedSections.rajshekar && (
              <div className="panel-body">
                <div className="subjects-heading">SUBJECTS & SUBSECTIONS:</div>
                {renderSubjectCards('rajshekar', [
                  { key: 'law', label: 'Law', telugu: 'లా' },
                  { key: 'history', label: 'History', telugu: 'హిస్టరీ' },
                  { key: 'poetic', label: 'Poetic & Wisdom', telugu: 'పోయెటిక్' },
                  { key: 'prophetic', label: 'Prophetic', telugu: 'ప్రాఫెటిక్' }
                ])}
              </div>
            )}
          </div>

          <div className="collapsible-panel">
            <div className="panel-header" onClick={() => toggleSection('sampath')}>
              <div className="panel-header-text">
                <span className="panel-title">
                  Lecturer: <strong>Prof Sampath Kumar</strong> <span className="phone-num">(+91 9985236736)</span>
                </span>
                <span className="panel-subtitle">(లైఫ్ ఆఫ్ క్రైస్ట్, క్రోనలాజికల్, ఎవంజిలిజం)</span>
              </div>
              <span className="toggle-icon">{collapsedSections.sampath ? '▼' : '▲'}</span>
            </div>
            {!collapsedSections.sampath && (
              <div className="panel-body">
                <div className="subjects-heading">SUBJECTS & SUBSECTIONS:</div>
                {renderSubjectCards('sampath', [
                  { key: 'loc', label: 'Life of Christ', telugu: 'లైఫ్ ఆఫ్ క్రైస్ట్' },
                  { key: 'locChronological', label: 'Life of Christ - Chronological Study', telugu: 'క్రోనలాజికల్' },
                  { key: 'evangelism', label: 'Evangelism & Missions', telugu: 'ఎవంజిలిజం' }
                ])}
              </div>
            )}
          </div>
        </div>

        <div className="form-actions" style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" className="save-btn">
            {formData.id ? `Update Academic Records [ID: ${formData.id}]` : 'Save Academic Records'}
          </button>
          {formData.id && (
            <button 
              type="button" 
              onClick={() => {
                setFormData({ id: null, name: '', district: '', phone: '', photoLink: '', photoUrl: '', stephen: {}, rajshekar: {}, sampath: {}, accommodation: '', postGradStay: '', stayStartDateTime: '', stayEndDateTime: '' });
                setSelectedStudentId('');
              }}
              style={{ padding: '12px 24px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Clear Selection
            </button>
          )}
        </div>
      </form>

      <div className="summary-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
          <h3>Academic Records Summary (Click 'Edit Academics' to load record)</h3>
          <button 
            type="button" 
            onClick={exportToPDF}
            style={{ padding: '10px 18px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            📥 Export Table to PDF
          </button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name <span className="telugu-text">(పేరు)</span></th>
                <th>District <span className="telugu-text">(జిల్లా)</span></th>
                <th>Prof Stephen</th>
                <th>Prof Rajshekar</th>
                <th>Prof Sampath</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSummaryRows.length > 0 ? (
                filteredSummaryRows.map((row) => {
                  const formatTableCell = (obj, keys) => {
                    if (!obj) return 'N/A';
                    return (
                      <div className="prof-cell">
                        {keys.map(k => {
                          const fullName = subjectNameMap[k] || k;
                          return (
                            <div key={k} style={{ marginBottom: '4px' }}>
                              <strong>{fullName}:</strong> Ex:{obj[`${k}Exam`]?'✅':'❌'} N:{obj[`${k}Notes`]?'✅':'❌'} Cl:{obj[`${k}Classes`]?'✅':'❌'} P:{obj[`${k}Permissions`]||0} 
                            </div>
                          );
                        })}
                      </div>
                    );
                  };

                  return (
                    <tr key={row.id} style={{ background: formData.id === row.id ? '#eff6ff' : 'transparent' }}>
                      <td><code>{row.id}</code></td>
                      <td><strong>{row.name}</strong></td>
                      <td>{row.district}</td>
                      <td>{formatTableCell(row.stephen, stephenKeys)}</td>
                      <td>{formatTableCell(row.rajshekar, rajkeys)}</td>
                      <td>{formatTableCell(row.sampath, sampathKeys)}</td>
                      <td>
                        <button 
                          type="button" 
                          onClick={() => {
                            handleEdit(row, 'academics');
                            setSelectedStudentId(String(row.id));
                          }} 
                          className="edit-btn"
                        >
                          {formData.id === row.id ? 'Editing ID: ' + row.id : 'Edit Academics'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">No matching student records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}