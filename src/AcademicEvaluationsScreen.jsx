import React, { useState } from 'react';
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
  
  const [collapsedSections, setCollapsedSections] = useState({
    stephen: false,
    rajshekar: true,
    sampath: true
  });

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
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

  const filteredRows = rows.filter(row => 
    row.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (row.district && row.district.toLowerCase().includes(searchTerm.toLowerCase())) ||
    String(row.id).includes(searchTerm)
  );

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
        <h4>🔍 Quick Search Student by ID or Name <span className="telugu-text">(ID లేదా పేరుతో వెతకండి)</span></h4>
        <input 
          type="text" 
          placeholder="Type student name or ID..." 
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
              onClick={() => setFormData({ id: null, name: '', district: '', phone: '', photoLink: '', photoUrl: '', stephen: {}, rajshekar: {}, sampath: {}, accommodation: '', postGradStay: '', stayStartDateTime: '', stayEndDateTime: '' })}
              style={{ padding: '12px 24px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Clear Selection
            </button>
          )}
        </div>
      </form>

      <div className="summary-section">
        <h3>Academic Records Summary (Click 'Edit Academics' to load record)</h3>
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
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => {
                  const formatTableCell = (obj, keys) => {
                    if (!obj) return 'N/A';
                    return (
                      <div className="prof-cell">
                        {keys.map(k => (
                          <div key={k}>
                            <strong>{k}:</strong> Ex:{obj[`${k}Exam`]?'✅':'❌'} N:{obj[`${k}Notes`]?'✅':'❌'} Cl:{obj[`${k}Classes`]?'✅':'❌'} P:{obj[`${k}Permissions`]||0} 
                          </div>
                        ))}
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
                          onClick={() => handleEdit(row, 'academics')} 
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