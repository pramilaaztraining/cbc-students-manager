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
    window.scrollTo({ top: 400, behavior: 'smooth' });
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
    doc.text('CBC-BTC Manager - Records & Post-Graduation Campus Stay Table', 14, 12);

    const tableColumns = [
      'Name\nపేరు',
      'District\nజిల్లా',
      'Photo\nఫోటో',
      'Phone\nఫోన్',
      'Prof Stephen',
      'Prof Rajshekar',
      'Prof Sampath',
      'Post-Grad Stay Window\nగ్రాడ్యుయేషన్ వసతి సమయం'
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

    doc.save('CBC_BTC_Campus_Stay_Records.pdf');
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

  // Filter rows for calendar view based on date match
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
            Student Academic Records & Post-Graduation Stay Calendar <span className="telugu-text">(గ్రాడ్యుయేషన్ తర్వాత వసతి క్యాలెండర్)</span>
          </p>
          <nav className="app-nav-menu">
            <a href="#form-section" className="nav-link">➕ Add Student</a>
            <a href="#calendar-section" className="nav-link">📅 Stay Calendar</a>
            <a href="#table-section" className="nav-link">📊 Records Table</a>
            <button onClick={exportToPDF} className="nav-btn-pdf">📥 Download PDF</button>
          </nav>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="container">
        
        {/* POST-GRADUATION STAY CALENDAR WIDGET */}
        <div id="calendar-section" className="form-card calendar-widget-card" style={{ marginBottom: '30px' }}>
          <h3>📅 Post-Graduation Campus Stay Calendar & Time Control <span className="telugu-text">(గ్రాడ్యుయేషన్ తర్వాత క్యాంపస్ వసతి షెడ్యూల్)</span></h3>
          <p className="subtitle">Select a specific date below to check who is staying on campus during that time window.</p>
          
          <div className="calendar-filter-row" style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flex: '1', minWidth: '220px' }}>
              <label>Filter by Date <span className="telugu-label">తేదీ ద్వారా తనిఖీ చేయండి</span></label>
              <input 
                type="date" 
                value={calendarFilterDate} 
                onChange={(e) => setCalendarFilterDate(e.target.value)} 
              />
            </div>
            {calendarFilterDate && (
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={() => setCalendarFilterDate('')}
                style={{ alignSelf: 'flex-end', height: '42px' }}
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
                  <th>Stay Window (From - To) <span className="telugu-text">(సమయ వ్యవధి)</span></th>
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

        {/* Form Card */}
        <form id="form-section" onSubmit={handleSubmit} className={`form-card ${isEditing ? 'editing-mode' : ''}`}>
          <h3>{isEditing ? 'Edit student detail & stay schedule' : 'Add student detail & stay schedule'}</h3>
          
          <div className="form-grid">
            <div className="form-row-basic">
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

            {/* POST-GRADUATION STAY DATE & TIME CONTROLS */}
            <div className="post-grad-stay-section" style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '15px' }}>
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

            <div className="professors-section-wrapper" style={{ marginTop: '20px' }}>
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

              {renderSectionColumns('sampath', 'Prof Sampath Kumar', '+91 9985236736', 'లైఫ్ ఆఫ్ క్రైస్ట్, క్రోనలాజికల్, ఎవంజిలిజం', [
                { key: 'loc', label: 'Life of Christ', telugu: 'లైఫ్ ఆఫ్ క్రైస్ట్' },
                { key: 'locChronological', label: 'Life of Christ - Chronological Study', telugu: 'క్రోనలాజికల్' },
                { key: 'evangelism', label: 'Evangelism & Missions', telugu: 'ఎవంజిలిజం' }
              ], 'cols-3', false)}
            </div>

            <div className="input-group accommodation-group" style={{ marginTop: '15px' }}>
              <label>General Accomodation Dates <span className="telugu-label">సాధారణ వసతి తేదీలు</span></label>
              <input type="text" name="accommodation" placeholder="Enter dates..." value={formData.accommodation} onChange={handleChange} />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className={isEditing ? "btn-update" : "btn-add"}>
              {isEditing ? 'Update student detail' : 'Add student detail'}
            </button>
            {isEditing && (
              <button 
                type="button" 
                className="btn-cancel" 
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
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div id="table-section" className="export-controls" style={{ marginTop: '40px' }}>
          <h3>Records Table & Campus Stay Summary (రికార్డుల పట్టిక)</h3>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name <br/><span className="telugu-text">పేరు</span></th>
                <th>District <br/><span className="telugu-text">జిల్లా</span></th>
                <th>Photo <br/><span className="telugu-text">ఫోటో</span></th>
                <th>Phone <br/><span className="telugu-text">ఫోన్</span></th>
                <th>Prof Stephen Suresh Babu</th>
                <th>Prof Rajshekar Sir</th>
                <th>Prof Sampath Kumar</th>
                <th>Post-Grad Stay Window <br/><span className="telugu-text">వసతి సమయం</span></th>
                <th>Actions <br/><span className="telugu-text">చర్యలు</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row) => {
                  const formatTableCell = (obj, keys) => {
                    if (!obj) return 'N/A';
                    return (
                      <div className="prof-cell">
                        {keys.map(k => (
                          <div key={k}>
                            <strong>{k}:</strong> Ex:{obj[`${k}Exam`]?'✅':'❌'} N:{obj[`${k}Notes`]?'✅':'❌'} Cl:{obj[`${k}Classes`]?'✅':'❌'} P:{obj[`${k}Permissions`]||0} 
                            {obj[`${k}VideoFile`] ? (
                              <a href={obj[`${k}VideoFile`]} target="_blank" rel="noopener noreferrer"> 🎥 Play</a>
                            ) : obj[`${k}VideoFileName`] ? (
                              <span> 📁 {obj[`${k}VideoFileName`]}</span>
                            ) : (
                              <span> ❌ No Vid</span>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  };

                  return (
                    <tr key={row.id}>
                      <td><strong>{row.name}</strong></td>
                      <td>{row.district}</td>
                      <td>
                        {row.photoUrl ? (
                          <div className="photo-cell">
                            <img src={row.photoUrl} alt="Preview" className="thumbnail" />
                          </div>
                        ) : (
                          <span>{row.photoLink || 'No Photo'}</span>
                        )}
                      </td>
                      <td>{row.phone}</td>
                      <td>{formatTableCell(row.stephen, stephenKeys)}</td>
                      <td>{formatTableCell(row.rajshekar, rajkeys)}</td>
                      <td>{formatTableCell(row.sampath, sampathKeys)}</td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          {row.stayStartDateTime && row.stayEndDateTime ? (
                            <>
                              <div><strong>From:</strong> {new Date(row.stayStartDateTime).toLocaleString()}</div>
                              <div><strong>To:</strong> {new Date(row.stayEndDateTime).toLocaleString()}</div>
                            </>
                          ) : (
                            <span style={{ color: '#64748b' }}>Time not specified</span>
                          )}
                          <div style={{ color: '#475569', marginTop: '4px' }}>{row.postGradStay}</div>
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button onClick={() => handleEdit(row)} className="btn-edit">Edit</button>
                          <button onClick={() => handleDelete(row.id)} className="btn-delete">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="no-data">No records available. Add one above!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* CHURCH FOOTER */}
      <footer className="church-footer">
        <div className="footer-container">
          <div className="footer-col footer-brand-col">
            <div className="footer-logo-row">
              <div className="footer-crest">✝</div>
              <div className="footer-brand-title">
                <span className="brand-christ">CHRIST</span>
                <span className="brand-church">BIBLE CHURCH</span>
              </div>
            </div>
            <p className="footer-desc">
              We are a Bible-believing, Christ-exalting, local church congregation situated in Gauribidanur, Karnataka. Seeking to make disciples of Jesus Christ who glorify God.
            </p>
            <p className="footer-copy">© 2026 CHRIST BIBLE COLLEGE (CBC) BENGALURU.</p>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">QUICK LINKS</h4>
            <ul className="footer-links">
              <li><a href="#form-section">Sunday Service</a></li>
              <li><a href="#form-section">About Our Church</a></li>
              <li><a href="#form-section">What We Believe</a></li>
              <li><a href="#form-section">Our Leadership</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">GATHERING TIMES</h4>
            <div className="footer-gathering-info">
              <p className="gathering-title">Sunday Worship Gathering:</p>
              <p className="gathering-time">10:00 AM</p>
              <p className="gathering-title mt-15">Service Location Chapel:</p>
              <p className="gathering-address">
                #521, Alkapura Gate, Gauribidanur, Karnataka, India
              </p>
            </div>
          </div>
        </div>

        <div className="footer-connect-banner">
          <div className="footer-connect-content">
            <div className="connect-badge">CONNECT WITH US</div>
            <p className="connect-text">
              Follow Christ Bible College (CBC) Bangaluru on social media for Sunday sermon clips, spiritual reflections, and congregation announcements.
            </p>
          </div>
          <div className="footer-social-buttons">
            <a href="https://whatsapp.com/channel/0029Vb7pNhd7j6g24RqJ2M1c" target="_blank" rel="noreferrer" className="social-btn wa-btn-enhanced">
              <span>Join WhatsApp Channel</span>
            </a>
            <a href="https://www.facebook.com/battle.for.truth.2025/" target="_blank" rel="noreferrer" className="social-btn fb-btn">Facebook</a>
            <a href="https://www.instagram.com/battlefortruth3?igsh=NThsbDd0eHNzcXI1" target="_blank" rel="noreferrer" className="social-btn ig-btn">Instagram</a>
            <a href="https://www.youtube.com/@Battle_For_Truth" target="_blank" rel="noreferrer" className="social-btn yt-btn">YouTube</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;