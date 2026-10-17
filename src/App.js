import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './App.css';

function App() {
  const createDetailedSubsections = (keys) => {
    const obj = {};
    keys.forEach(k => {
      obj[`${k}Exam`] = false;
      obj[`${k}Notes`] = false;
      obj[`${k}Classes`] = false;
      obj[`${k}Permissions`] = '';
      obj[`${k}VideoFile`] = null;
      obj[`${k}VideoFileName`] = '';
    });
    return obj;
  };

  const stephenKeys = ['synoptic', 'actsEpistles', 'homiletics'];
  const rajkeys = ['law', 'history', 'poetic', 'prophetic'];
  const sampathKeys = ['loc', 'locChronological', 'evangelism'];

  const initialData = [
    {
      id: 1,
      name: 'A. Sadhana',
      district: 'Hyderabad',
      photoLink: 'A.Sadhana.jpg',
      photoUrl: '',
      phone: '9876543210',
      stephen: createDetailedSubsections(stephenKeys),
      rajshekar: createDetailedSubsections(rajkeys),
      sampath: createDetailedSubsections(sampathKeys),
      accommodation: '10-12 Jan',
      postGradStay: 'Staying after graduation for worship and campus assistance',
      stayStartDateTime: '2026-11-13T08:00',
      stayEndDateTime: '2026-11-15T20:00'
    }
  ];

  const [rows, setRows] = useState(() => {
    const saved = localStorage.getItem('cbc_students_complete_app_data');
    return saved ? JSON.parse(saved) : initialData;
  });

  const [formData, setFormData] = useState({
    name: '', district: '', phone: '',
    photoLink: '', photoUrl: '',
    stephen: createDetailedSubsections(stephenKeys),
    rajshekar: createDetailedSubsections(rajkeys),
    sampath: createDetailedSubsections(sampathKeys),
    accommodation: '',
    postGradStay: '',
    stayStartDateTime: '',
    stayEndDateTime: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  // Navigation State for 3 Distinct Screens: 'creation', 'academics', 'stayCalendar'
  const [activeScreen, setActiveScreen] = useState('creation');
  const [calendarFilterDate, setCalendarFilterDate] = useState('');

  useEffect(() => {
    const rowsToPersist = rows.map(row => ({
      ...row,
      stephen: Object.fromEntries(Object.entries(row.stephen).map(([k, v]) => k.includes('VideoFile') ? [k, null] : [k, v])),
      rajshekar: Object.fromEntries(Object.entries(row.rajshekar).map(([k, v]) => k.includes('VideoFile') ? [k, null] : [k, v])),
      sampath: Object.fromEntries(Object.entries(row.sampath).map(([k, v]) => k.includes('VideoFile') ? [k, null] : [k, v])),
    }));
    try {
      localStorage.setItem('cbc_students_complete_app_data', JSON.stringify(rowsToPersist));
    } catch (e) {
      console.error('Storage quota reached');
    }
  }, [rows]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleProfChange = (prof, subKey, type, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [prof]: {
        ...prev[prof],
        [subKey]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const handleVideoUpload = (prof, subKey, e) => {
    const file = e.target.files[0];
    if (file) {
      const videoUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        [prof]: {
          ...prev[prof],
          [`${subKey}VideoFile`]: videoUrl,
          [`${subKey}VideoFileName`]: file.name
        }
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photoLink: file.name,
          photoUrl: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    if (isEditing) {
      setRows(rows.map(row => (row.id === currentId ? { ...row, ...formData } : row)));
      setIsEditing(false);
      setCurrentId(null);
    } else {
      const newEntry = { id: Date.now(), ...formData };
      setRows([...rows, newEntry]);
    }

    setFormData({
      name: '', district: '', phone: '',
      photoLink: '', photoUrl: '',
      stephen: createDetailedSubsections(stephenKeys),
      rajshekar: createDetailedSubsections(rajkeys),
      sampath: createDetailedSubsections(sampathKeys),
      accommodation: '',
      postGradStay: '',
      stayStartDateTime: '',
      stayEndDateTime: ''
    });
  };

  const handleEdit = (row) => {
    setIsEditing(true);
    setCurrentId(row.id);
    setFormData({
      name: row.name, district: row.district || '', phone: row.phone || '',
      photoLink: row.photoLink || '', photoUrl: row.photoUrl || '',
      stephen: row.stephen || createDetailedSubsections(stephenKeys),
      rajshekar: row.rajshekar || createDetailedSubsections(rajkeys),
      sampath: row.sampath || createDetailedSubsections(sampathKeys),
      accommodation: row.accommodation || '',
      postGradStay: row.postGradStay || '',
      stayStartDateTime: row.stayStartDateTime || '',
      stayEndDateTime: row.stayEndDateTime || ''
    });
    setActiveScreen('creation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      setRows(rows.filter(row => row.id !== id));
      if (isEditing && currentId === id) {
        setIsEditing(false);
        setFormData({
          name: '', district: '', phone: '', photoLink: '', photoUrl: '',
          stephen: createDetailedSubsections(stephenKeys),
          rajshekar: createDetailedSubsections(rajkeys),
          sampath: createDetailedSubsections(sampathKeys),
          accommodation: '', postGradStay: '', stayStartDateTime: '', stayEndDateTime: ''
        });
      }
    }
  };

  // PDF EXPORT
  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('CBC-BTC Manager - Complete Records & Stay Schedule', 14, 12);

    const tableColumns = [
      'Name\nపేరు',
      'District\nజిల్లా',
      'Photo\nఫోటో',
      'Phone\nఫోన్',
      'Prof Stephen',
      'Prof Rajshekar',
      'Prof Sampath',
      'Post-Grad Stay Window\nవసతి సమయం'
    ];
    
    const formatDetailedPDF = (obj, keys) => {
      if (!obj) return 'N/A';
      return keys.map(k => {
        const ex = obj[`${k}Exam`] ? '[✓]' : '[✗]';
        const nt = obj[`${k}Notes`] ? '[✓]' : '[✗]';
        const cl = obj[`${k}Classes`] ? '[✓]' : '[✗]';
        const perm = obj[`${k}Permissions`] || 0;
        return `${k}: Ex:${ex} N:${nt} Cl:${cl} P:${perm}`;
      }).join('\n');
    };

    const tableRows = rows.map(row => [
      row.name,
      row.district || '',
      row.photoUrl ? '' : (row.photoLink || 'No Photo'),
      row.phone || '',
      formatDetailedPDF(row.stephen, stephenKeys),
      formatDetailedPDF(row.rajshekar, rajkeys),
      formatDetailedPDF(row.sampath, sampathKeys),
      `From: ${row.stayStartDateTime ? new Date(row.stayStartDateTime).toLocaleString() : 'N/A'}\nTo: ${row.stayEndDateTime ? new Date(row.stayEndDateTime).toLocaleString() : 'N/A'}\nNotes: ${row.postGradStay || 'None'}`
    ]);

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 18,
      theme: 'grid',
      styles: { fontSize: 5, cellPadding: 3, minCellHeight: 35, valign: 'middle', halign: 'left' },
      headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: 'bold', halign: 'center', fontSize: 5.5 },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          const rowIndex = data.row.index;
          const currentRecord = rows[rowIndex];
          if (currentRecord && currentRecord.photoUrl) {
            try {
              doc.addImage(currentRecord.photoUrl, 'JPEG', data.cell.x + 3, data.cell.y + 3, 12, 12);
            } catch (error) {
              console.error('Error drawing image in PDF:', error);
            }
          }
        }
      }
    });

    doc.save('CBC_BTC_Complete_Records.pdf');
  };

  const renderSectionColumns = (profKey, lecturerName, phoneNum, teluguTitle, items, colsClass, defaultOpen = false) => (
    <details className="accordion-card" key={profKey} open={defaultOpen}>
      <summary className="accordion-summary">
        <div className="accordion-title-area">
          <span className="section-lecturer">Lecturer: <strong>{lecturerName}</strong> <span className="prof-phone">({phoneNum})</span></span>
          <span className="telugu-label">({teluguTitle})</span>
        </div>
        <span className="accordion-icon">▼</span>
      </summary>
      
      <div className="accordion-content">
        <div className="subjects-heading">Subjects & Subsections:</div>
        <div className={`columns-container ${colsClass}`}>
          {items.map(cat => (
            <div className="column-subbox" key={`${profKey}-${cat.key}`}>
              <span className="sub-title">{cat.label}</span>
              <div className="column-controls">
                <label className="checkbox-label">
                  <input type="checkbox" checked={formData[profKey][`${cat.key}Exam`]} onChange={(e) => handleProfChange(profKey, `${cat.key}Exam`, 'checkbox', null, e.target.checked)} />
                  Exam Completed
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" checked={formData[profKey][`${cat.key}Notes`]} onChange={(e) => handleProfChange(profKey, `${cat.key}Notes`, 'checkbox', null, e.target.checked)} />
                  Notes Completed
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" checked={formData[profKey][`${cat.key}Classes`]} onChange={(e) => handleProfChange(profKey, `${cat.key}Classes`, 'checkbox', null, e.target.checked)} />
                  All Classes Attended
                </label>
                <div className="sub-input-group">
                  <label>Permissions:</label>
                  <input type="text" placeholder="0" value={formData[profKey][`${cat.key}Permissions`]} onChange={(e) => handleProfChange(profKey, `${cat.key}Permissions`, 'text', e.target.value, null)} />
                </div>
                <div className="sub-file-group">
                  <label>Upload Video:</label>
                  <input type="file" accept="video/*" onChange={(e) => handleVideoUpload(profKey, cat.key, e)} />
                  {formData[profKey][`${cat.key}VideoFileName`] && (
                    <span className="file-name-preview">📁 {formData[profKey][`${cat.key}VideoFileName`]}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </details>
  );

  const filteredCalendarRows = rows.filter(row => {
    if (!calendarFilterDate) return true;
    if (!row.stayStartDateTime || !row.stayEndDateTime) return false;
    const filterDateOnly = calendarFilterDate;
    const startDateOnly = row.stayStartDateTime.split('T')[0];
    const endDateOnly = row.stayEndDateTime.split('T')[0];
    return filterDateOnly >= startDateOnly && filterDateOnly <= endDateOnly;
  });

  return (
    <div className="app-layout">
      {/* HEADER SECTION */}
      <header className="app-header">
        <div className="header-content">
          <h1>CBC-BTC Manager</h1>
          <p className="header-subtitle">
            Student Academic Records & Campus Stay Management <span className="telugu-text">(విద్యార్థుల రికార్డుల నిర్వహణ)</span>
          </p>
          
          {/* 3-SECTION NAVIGATION TABS */}
          <nav className="app-nav-menu" style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '15px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setActiveScreen('creation')} 
              className={`nav-link ${activeScreen === 'creation' ? 'active-tab' : ''}`}
              style={{ background: activeScreen === 'creation' ? '#2563eb' : '#1e293b', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              1. Student Details Creation <span className="telugu-text">(సృష్టి)</span>
            </button>
            <button 
              onClick={() => setActiveScreen('academics')} 
              className={`nav-link ${activeScreen === 'academics' ? 'active-tab' : ''}`}
              style={{ background: activeScreen === 'academics' ? '#2563eb' : '#1e293b', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              2. Academic Evaluations <span className="telugu-text">(అకాడమిక్స్)</span>
            </button>
            <button 
              onClick={() => setActiveScreen('stayCalendar')} 
              className={`nav-link ${activeScreen === 'stayCalendar' ? 'active-tab' : ''}`}
              style={{ background: activeScreen === 'stayCalendar' ? '#2563eb' : '#1e293b', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              3. Post-Grad Stay & Calendar <span className="telugu-text">(వసతి & క్యాలెండర్)</span>
            </button>
            <button onClick={exportToPDF} className="nav-btn-pdf" style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              📥 Download PDF
            </button>
          </nav>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="container">

        {/* ========================================================= */}
        {/* SECTION 1: INITIAL STUDENT DETAIL CREATION & MANAGEMENT */}
        {/* ========================================================= */}
        {activeScreen === 'creation' && (
          <div className="screen-section">
            <div className="section-intro">
              <h2>Section 1: Initial Student Detail Creation</h2>
              <p className="subtitle">Add or edit core student demographics, phone numbers, and profile photos.</p>
            </div>

            <form onSubmit={handleSubmit} className={`form-card ${isEditing ? 'editing-mode' : ''}`}>
              <h3>{isEditing ? 'Edit Student Profile (విద్యార్థి వివరాలను సవరించు)' : 'Create New Student Profile (కొత్త విద్యార్థి వివరాలు)'}</h3>
              
              <div className="form-grid">
                <div className="form-row-basic" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                  <div className="input-group">
                    <label>Name <span className="telugu-label">పేరు</span></label>
                    <input type="text" name="name" placeholder="Enter name..." value={formData.name} onChange={handleChange} required />
                  </div>

                  <div className="input-group">
                    <label>District <span className="telugu-label">జిల్లా</span></label>
                    <input type="text" name="district" placeholder="Enter district..." value={formData.district} onChange={handleChange} />
                  </div>

                  <div className="input-group file-input-group">
                    <label>Upload Photo <span className="telugu-label">ఫోటో అప్‌లోడ్ చేయండి</span></label>
                    <input type="file" accept="image/*" onChange={handleFileChange} />
                  </div>

                  <div className="input-group">
                    <label>Phone Number <span className="telugu-label">ఫోన్ నంబర్</span></label>
                    <input type="text" name="phone" placeholder="Enter phone..." value={formData.phone} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {isEditing ? 'Update Student Details' : 'Save Student Details'}
                </button>
                {isEditing && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: '', district: '', phone: '', photoLink: '', photoUrl: '',
                        stephen: createDetailedSubsections(stephenKeys),
                        rajshekar: createDetailedSubsections(rajkeys),
                        sampath: createDetailedSubsections(sampathKeys),
                        accommodation: '', postGradStay: '', stayStartDateTime: '', stayEndDateTime: ''
                      });
                    }}
                    style={{ padding: '12px 24px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div style={{ marginTop: '40px' }}>
              <h3>Registered Students Directory ({rows.length})</h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Name <span className="telugu-text">(పేరు)</span></th>
                      <th>District <span className="telugu-text">(జిల్లా)</span></th>
                      <th>Photo <span className="telugu-text">(ఫోటో)</span></th>
                      <th>Phone <span className="telugu-text">(ఫోన్)</span></th>
                      <th>Actions <span className="telugu-text">(చర్యలు)</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td><strong>{row.name}</strong></td>
                        <td>{row.district}</td>
                        <td>
                          {row.photoUrl ? (
                            <img src={row.photoUrl} alt="Preview" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <span>{row.photoLink || 'No Photo'}</span>
                          )}
                        </td>
                        <td>{row.phone}</td>
                        <td>
                          <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleEdit(row)} style={{ padding: '6px 12px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                            <button onClick={() => handleDelete(row.id)} style={{ padding: '6px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 2: ACADEMIC DETAILS & EVALUATIONS */}
        {/* ========================================================= */}
        {activeScreen === 'academics' && (
          <div className="screen-section">
            <div className="section-intro">
              <h2>Section 2: Academic Evaluations</h2>
              <p className="subtitle">Evaluate student subjects, exams, attendance notes, and video submissions for all professors.</p>
            </div>

            <form onSubmit={handleSubmit} className="form-card">
              <h3>Update Academic Evaluations for Student</h3>
              
              <div className="input-group" style={{ marginBottom: '20px' }}>
                <label>Student Name <span className="telugu-label">విద్యార్థి పేరు</span></label>
                <input type="text" name="name" placeholder="Enter student name..." value={formData.name} onChange={handleChange} required />
              </div>

              <div className="professors-section-wrapper">
                <h4 className="prof-section-title">Lecturer & Subject Evaluations <span className="telugu-text">(ఉపాధ్యాయుల వివరాలు మరియు సబ్జెక్టులు)</span></h4>
                
                {renderSectionColumns('stephen', 'Prof Stephen Suresh Babu, M.Th; M.Tech, Director of CBC', '+91 8074852725', 'సినాప్టిక్ గస్పెల్స్, ఆక్ట్స్ & ఎపిస్టల్స్, హోమిలెటిక్స్', [
                  { key: 'synoptic', label: 'Synoptic Gospels', telugu: 'సినాప్టిక్' },
                  { key: 'actsEpistles', label: 'Acts & Epistles', telugu: 'ఆక్ట్స్' },
                  { key: 'homiletics', label: 'Homiletics', telugu: 'హోమిలెటిక్స్' }
                ], 'cols-3', true)}

                {renderSectionColumns('rajshekar', 'Prof Rajshekar Sir', '+91-8885831588', 'లా, హిస్టరీ, పోయెటిక్ & విజ్డమ్, ప్రాఫెటిక్', [
                  { key: 'law', label: 'Law', telugu: 'లా' },
                  { key: 'history', label: 'History', telugu: 'హిస్టరీ' },
                  { key: 'poetic', label: 'Poetic & Wisdom', telugu: 'పోయెటిక్' },
                  { key: 'prophetic', label: 'Prophetic', telugu: 'ప్రాఫెటిక్' }
                ], 'cols-4', false)}

                {renderSectionColumns('sampath', 'Prof Sampath Kumar', '+91 9985236736', 'లైఫ్ ఆఫ్ క్రైస్ట్, క్రోనలాజికల్, ఎవంజిలిజም', [
                  { key: 'loc', label: 'Life of Christ', telugu: 'లైఫ్ ఆఫ్ క్రైస్ట్' },
                  { key: 'locChronological', label: 'Life of Christ - Chronological Study', telugu: 'క్రోనలాజికల్' },
                  { key: 'evangelism', label: 'Evangelism & Missions', telugu: 'ఎవంజిలిజం' }
                ], 'cols-3', false)}
              </div>

              <div className="form-actions" style={{ marginTop: '20px' }}>
                <button type="submit" style={{ padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Save Academic Records
                </button>
              </div>
            </form>

            <div style={{ marginTop: '40px' }}>
              <h3>Academic Records Summary</h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Name <span className="telugu-text">(పేరు)</span></th>
                      <th>District <span className="telugu-text">(జిల్లా)</span></th>
                      <th>Prof Stephen</th>
                      <th>Prof Rajshekar</th>
                      <th>Prof Sampath</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const formatTableCell = (obj, keys) => {
                        if (!obj) return 'N/A';
                        return (
                          <div className="prof-cell" style={{ fontSize: '0.8rem' }}>
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: POST-GRADUATION CAMPUS STAY & TIME WINDOW (CALENDAR CONTROL) */}
        {/* ========================================================================= */}
        {activeScreen === 'stayCalendar' && (
          <div className="screen-section">
            <div className="section-intro">
              <h2>Section 3: Post-Graduation Campus Stay & Time Window</h2>
              <p className="subtitle">Manage precise arrival/departure schedules and filter campus stay dates.</p>
            </div>

            <form onSubmit={handleSubmit} className="form-card" style={{ marginBottom: '30px' }}>
              <h3>Configure Post-Graduation Stay Window for Student</h3>
              
              <div className="input-group" style={{ marginBottom: '20px' }}>
                <label>Student Name <span className="telugu-label">విద్యార్థి పేరు</span></label>
                <input type="text" name="name" placeholder="Enter student name..." value={formData.name} onChange={handleChange} required />
              </div>

              <div className="post-grad-stay-section" style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>
                  Post-Graduation Campus Stay & Time Window <span className="telugu-text">(గ్రాడ్యుయేషన్ వసతి & సమయ నియంత్రణ)</span>
                </h4>
                <div className="form-row-basic" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                  
                  <div className="input-group">
                    <label>From Date & Time <span className="telugu-label">ప్రారంభ తేదీ మరియు సమయం</span></label>
                    <input 
                      type="datetime-local" 
                      name="stayStartDateTime" 
                      value={formData.stayStartDateTime} 
                      onChange={handleChange} 
                    />
                  </div>

                  <div className="input-group">
                    <label>To Date & Time <span className="telugu-label">ముగింపు తేదీ మరియు సమయం</span></label>
                    <input 
                      type="datetime-local" 
                      name="stayEndDateTime" 
                      value={formData.stayEndDateTime} 
                      onChange={handleChange} 
                    />
                  </div>

                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Stay Notes / Instructions <span className="telugu-label">వసతి గమనికలు</span></label>
                    <input 
                      type="text" 
                      name="postGradStay" 
                      placeholder="e.g., Arriving night before, staying until morning worship session" 
                      value={formData.postGradStay} 
                      onChange={handleChange} 
                    />
                  </div>

                </div>
              </div>

              <div className="form-actions" style={{ marginTop: '20px' }}>
                <button type="submit" style={{ padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Save Stay Schedule
                </button>
              </div>
            </form>

            {/* Calendar Control Widget & Filter */}
            <div className="form-card calendar-widget-card" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <h3>📅 Campus Stay Calendar Control <span className="telugu-text">(గ్రాడ్యుయేషన్ వసతి క్యాలెండర్ తనిఖీ)</span></h3>
              <p className="subtitle">Select any date to instantly view who is staying on campus during that period.</p>
              
              <div className="calendar-filter-row" style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div className="input-group" style={{ flex: '1', minWidth: '220px' }}>
                  <label>Filter by Date <span className="telugu-label">తేదీ ద్వారా వసతిని తనిఖీ చేయండి</span></label>
                  <input 
                    type="date" 
                    value={calendarFilterDate} 
                    onChange={(e) => setCalendarFilterDate(e.target.value)} 
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #94a3b8' }}
                  />
                </div>
                {calendarFilterDate && (
                  <button 
                    type="button" 
                    onClick={() => setCalendarFilterDate('')}
                    style={{ alignSelf: 'flex-end', height: '38px', padding: '0 15px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              <div className="table-wrapper">
                <table className="calendar-table">
                  <thead>
                    <tr>
                      <th>Student Name <span className="telugu-text">(పేరు)</span></th>
                      <th>District <span className="telugu-text">(జిల్లా)</span></th>
                      <th>Phone <span className="telugu-text">(ఫోన్)</span></th>
                      <th>Stay Window <span className="telugu-text">(సమయ వ్యవధి)</span></th>
                      <th>Stay Notes <span className="telugu-text">(గమనికలు)</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCalendarRows.length > 0 ? (
                      filteredCalendarRows.map(row => (
                        <tr key={`cal-${row.id}`}>
                          <td><strong>{row.name}</strong></td>
                          <td>{row.district || 'N/A'}</td>
                          <td>{row.phone || 'N/A'}</td>
                          <td>
                            {row.stayStartDateTime && row.stayEndDateTime ? (
                              <div style={{ fontSize: '0.85rem' }}>
                                <div><strong>From:</strong> {new Date(row.stayStartDateTime).toLocaleString()}</div>
                                <div><strong>To:</strong> {new Date(row.stayEndDateTime).toLocaleString()}</div>
                              </div>
                            ) : (
                              <span style={{ color: '#d97706' }}>Window not set</span>
                            )}
                          </td>
                          <td>{row.postGradStay || 'No notes provided'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="no-data">No students scheduled for campus stay on this date.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* CHURCH FOOTER */}
      <footer className="church-footer" style={{ marginTop: '50px', background: '#0f172a', color: '#cbd5e1', padding: '40px 20px' }}>
        <div className="footer-container" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '30px', maxWidth: '1200px', margin: '0 auto' }}>
          <div className="footer-col footer-brand-col" style={{ flex: '1', minWidth: '280px' }}>
            <div className="footer-logo-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div className="footer-crest" style={{ color: '#38bdf8', fontSize: '1.5rem' }}>✝</div>
              <div className="footer-brand-title">
                <span className="brand-christ" style={{ fontWeight: 'bold', color: '#fff' }}>CHRIST</span> <span className="brand-church" style={{ color: '#38bdf8' }}>BIBLE CHURCH</span>
              </div>
            </div>
            <p className="footer-desc" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
              We are a Bible-believing, Christ-exalting, local church congregation situated in Gauribidanur, Karnataka. Seeking to make disciples of Jesus Christ who glorify God.
            </p>
            <p className="footer-copy" style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '10px' }}>© 2026 CHRIST BIBLE COLLEGE (CBC) BENGALURU.</p>
          </div>

          <div className="footer-col" style={{ flex: '1', minWidth: '220px' }}>
            <h4 className="footer-heading" style={{ color: '#fff', marginBottom: '15px' }}>GATHERING TIMES</h4>
            <div className="footer-gathering-info" style={{ fontSize: '0.9rem' }}>
              <p className="gathering-title" style={{ color: '#38bdf8', fontWeight: 'bold' }}>Sunday Worship Gathering:</p>
              <p className="gathering-time">10:00 AM</p>
              <p className="gathering-title mt-15" style={{ color: '#38bdf8', fontWeight: 'bold', marginTop: '10px' }}>Service Location Chapel:</p>
              <p className="gathering-address">
                #521, Alkapura Gate, Gauribidanur, Karnataka, India
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;