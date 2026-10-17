import React, { useState } from 'react';
import './AcademicEvaluationsScreen.css';

export default function AcademicEvaluationsScreen({ 
  formData, 
  handleChange, 
  handleSubmit, 
  rows, 
  handleEdit, 
  stephenKeys, 
  rajkeys, 
  sampathKeys 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // State to manage collapsible panels (false = open, true = collapsed)
  const [collapsedSections, setCollapsedSections] = useState({
    stephen: false,
    rajshekar: true,
    sampath: true
  });

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const filteredRows = rows.filter(row => 
    row.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (row.district && row.district.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Helper function to render subject cards identically to your screenshot layout
  const renderSubjectCards = (lecturerKey, subjectsList) => {
    return (
      <div className="subjects-grid">
        {subjectsList.map((sub) => {
          // Construct form keys based on your state naming convention (e.g., formData.stephen.synopticExam)
          const examField = `${sub.key}Exam`;
          const notesField = `${sub.key}Notes`;
          const classesField = `${sub.key}Classes`;
          const permissionsField = `${sub.key}Permissions`;
          const videoField = `${sub.key}Video`;

          const lecturerData = formData[lecturerKey] || {};

          return (
            <div key={sub.key} className="subject-card">
              <div className="subject-title-wrapper">
                <h4 className="subject-title">{sub.label}</h4>
                {sub.telugu && <span className="subject-telugu">({sub.telugu})</span>}
              </div>

              {/* Checkboxes */}
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

              {/* Permissions Input */}
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

              {/* Upload Video Field */}
              <div className="upload-section">
                <span className="upload-label">Upload Video:</span>
                <div className="file-input-wrapper">
                  <input 
                    type="file" 
                    id={`file-${lecturerKey}-${sub.key}`}
                    onChange={(e) => handleChange(e, lecturerKey, videoField, 'file')} 
                    style={{ display: 'none' }}
                  />
                  <label htmlFor={`file-${lecturerKey}-${sub.key}`} className="choose-file-btn">Choose File</label>
                  <span className="file-name-display">
                    {lecturerData[videoField]?.name || 'No file chosen'}
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

      {/* SEARCH BAR */}
      <div className="form-card search-card">
        <h4>🔍 Quick Search Student to Edit Academics <span className="telugu-text">(విద్యార్థిని వెతకండి)</span></h4>
        <input 
          type="text" 
          placeholder="Type student name to filter list below..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="search-input"
        />
      </div>

      <form onSubmit={handleSubmit} className="form-card">
        <h3>Update Academic Evaluations for: <span className="selected-student">{formData.name || 'Select a student below'}</span></h3>
        
        <div className="input-group">
          <label>Student Name <span className="telugu-label">విద్యార్థి పేరు</span></label>
          <input type="text" name="name" placeholder="Enter student name..." value={formData.name} onChange={handleChange} required />
        </div>

        <div className="professors-section-wrapper">
          
          {/* PROF STEPHEN SECTION */}
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

          {/* PROF RAJSHEKAR SECTION */}
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

          {/* PROF SAMPATH SECTION */}
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

        <div className="form-actions">
          <button type="submit" className="save-btn">
            Save Academic Records
          </button>
        </div>
      </form>

      {/* SUMMARY TABLE SECTION */}
      <div className="summary-section">
        <h3>Academic Records Summary (Click 'Edit Academics' to load record)</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
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
                    <tr key={row.id}>
                      <td><strong>{row.name}</strong></td>
                      <td>{row.district}</td>
                      <td>{formatTableCell(row.stephen, stephenKeys)}</td>
                      <td>{formatTableCell(row.rajshekar, rajkeys)}</td>
                      <td>{formatTableCell(row.sampath, sampathKeys)}</td>
                      <td>
                        <button onClick={() => handleEdit(row)} className="edit-btn">
                          Edit Academics
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">No matching student records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}