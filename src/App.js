import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
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
      videoSubmitted: 'Yes',
      accommodation: '10-12 Jan'
    }
  ];

  const [rows, setRows] = useState(() => {
    const saved = localStorage.getItem('cbc_students_prof_phones_data');
    return saved ? JSON.parse(saved) : initialData;
  });

  const [formData, setFormData] = useState({
    name: '', district: '', phone: '',
    photoLink: '', photoUrl: '',
    stephen: createDetailedSubsections(stephenKeys),
    rajshekar: createDetailedSubsections(rajkeys),
    sampath: createDetailedSubsections(sampathKeys),
    videoSubmitted: '', accommodation: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  useEffect(() => {
    localStorage.setItem('cbc_students_prof_phones_data', JSON.stringify(rows));
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
      videoSubmitted: '', accommodation: ''
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
      videoSubmitted: row.videoSubmitted || '', accommodation: row.accommodation || ''
    });
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
          videoSubmitted: '', accommodation: ''
        });
      }
    }
  };

  // EXCEL EXPORT (CSV format with clean UTF-8 BOM)
  const exportToExcel = () => {
    const headers = [
      'Name / పేరు', 'District / జిల్లా', 'Photo / ఫోటో', 'Phone / ఫోన్',
      'Prof Stephen Suresh Babu (+91 8074852725)', 
      'Prof Rajshekar Sir (+91-8885831588)', 
      'Prof Sampath Kumar (+91 9985236736)',
      'Video Sub. / వీడియో', 'Accommodation / వసతి'
    ];

    const formatDetailedCSV = (obj, keys) => {
      return keys.map(k => `[${k}:Ex${obj[`${k}Exam`]?'Y':'N'} N${obj[`${k}Notes`]?'Y':'N'} Cl${obj[`${k}Classes`]?'Y':'N'} P:${obj[`${k}Permissions`]||0}]`).join(' ');
    };

    const dataRows = rows.map(row => [
      row.name, row.district, row.photoLink || 'N/A', row.phone,
      formatDetailedCSV(row.stephen, stephenKeys),
      formatDetailedCSV(row.rajshekar, rajkeys),
      formatDetailedCSV(row.sampath, sampathKeys),
      row.videoSubmitted, row.accommodation
    ]);

    let csvContent = '\uFEFF' + [headers, ...dataRows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'CBC_BTC_Records.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF EXPORT
  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(11);
    doc.text('CBC-BTC Records (రికార్డులు)', 14, 10);

    const tableColumns = [
      'Name\nపేరు',
      'District\nజిల్లా',
      'Photo\nఫోటో',
      'Phone\nఫోన్',
      'Prof Stephen Suresh Babu\n+91 8074852725\n(Subjects)',
      'Prof Rajshekar Sir\n+91-8885831588\n(Subjects)',
      'Prof Sampath Kumar\n+91 9985236736\n(Subjects)',
      'Video\nవీడియో',
      'Accom.\nవసతి'
    ];
    
    const formatDetailedPDF = (obj, keys) => {
      return keys.map(k => `${k}: E${obj[`${k}Exam`]?'✓':'✗'} N${obj[`${k}Notes`]?'✓':'✗'} C${obj[`${k}Classes`]?'✓':'✗'} P${obj[`${k}Permissions`]||0}`).join('\n');
    };

    const tableRows = rows.map(row => [
      row.name,
      row.district,
      row.photoUrl ? '' : 'No Photo',
      row.phone,
      formatDetailedPDF(row.stephen, stephenKeys),
      formatDetailedPDF(row.rajshekar, rajkeys),
      formatDetailedPDF(row.sampath, sampathKeys),
      row.videoSubmitted,
      row.accommodation
    ]);

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 15,
      theme: 'grid',
      styles: { fontSize: 5, cellPadding: 2, minCellHeight: 25, halign: 'center' },
      headStyles: { fillColor: [40, 116, 166], textColor: 255, fontStyle: 'bold' },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          const rowIndex = data.row.index;
          const currentRecord = rows[rowIndex];
          
          if (currentRecord && currentRecord.photoUrl) {
            try {
              doc.addImage(
                currentRecord.photoUrl,
                'JPEG',
                data.cell.x + 2,
                data.cell.y + 1,
                10,
                10
              );
            } catch (error) {
              console.error('Error drawing image in PDF:', error);
            }
          }
        }
      }
    });

    doc.save('CBC_BTC_Records.pdf');
  };

  const renderSectionColumns = (profKey, lecturerName, phoneNum, teluguTitle, items, colsClass) => (
    <div className="checkbox-card nt-card full-width-card" key={profKey}>
      <div className="card-header-row">
        <span className="section-lecturer">Lecturer: <strong>{lecturerName}</strong> <span className="prof-phone">({phoneNum})</span></span>
        <span className="telugu-label">({teluguTitle})</span>
      </div>
      <div className="subjects-heading">Subjects:</div>
      <div className={`columns-container ${colsClass}`}>
        {items.map(cat => (
          <div className="column-subbox" key={`${profKey}-${cat.key}`}>
            <span className="sub-title">{cat.label}</span>
            <div className="column-controls">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={formData[profKey][`${cat.key}Exam`]} 
                  onChange={(e) => handleProfChange(profKey, `${cat.key}Exam`, 'checkbox', null, e.target.checked)} 
                />
                Exam Written <span className="telugu-text">({cat.telugu} పరీక్ష)</span>
              </label>

              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={formData[profKey][`${cat.key}Notes`]} 
                  onChange={(e) => handleProfChange(profKey, `${cat.key}Notes`, 'checkbox', null, e.target.checked)} 
                />
                Notes Completed <span className="telugu-text">({cat.telugu} నోట్స్)</span>
              </label>

              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={formData[profKey][`${cat.key}Classes`]} 
                  onChange={(e) => handleProfChange(profKey, `${cat.key}Classes`, 'checkbox', null, e.target.checked)} 
                />
                All Classes Attended <span className="telugu-text">(తరగతులు)</span>
              </label>

              <div className="sub-input-group">
                <label>Permissions:</label>
                <input 
                  type="text" 
                  placeholder="0" 
                  value={formData[profKey][`${cat.key}Permissions`]} 
                  onChange={(e) => handleProfChange(profKey, `${cat.key}Permissions`, 'text', e.target.value, null)} 
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="app-layout">
      {/* HEADER SECTION */}
      <header className="app-header">
        <div className="header-content">
          <h1>CBC-BTC Manager</h1>
          <p className="header-subtitle">
            Student Academic Records & Attendance Tracker <span className="telugu-text">(రికార్డు నిర్వహణ వ్యవస్థ)</span>
          </p>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="container">
        <div className="section-intro">
          <h2>Dashboard & Management Panel</h2>
          <p className="subtitle">Easily manage student details, lecturer subjects, exams, notes, and attendance permissions below.</p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className={`form-card ${isEditing ? 'editing-mode' : ''}`}>
          <h3>{isEditing ? 'Edit student detail (విద్యార్థి వివరాలను సవరించు)' : 'Add student detail'}</h3>
          
          <div className="form-grid">
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

            {/* Prof Stephen Suresh Babu Section */}
            {renderSectionColumns('stephen', 'Prof Stephen Suresh Babu, M.Th; M.Tech, Director of CBC', '+91 8074852725', 'సినాప్టిక్ గస్పెల్స్, ఆక్ట్స్ & ఎపిస్టల్స్, హోమిలెటిక్స్', [
              { key: 'synoptic', label: 'Synoptic Gospels', telugu: 'సినాప్టిక్' },
              { key: 'actsEpistles', label: 'Acts & Epistles', telugu: 'ఆక్ట్స్' },
              { key: 'homiletics', label: 'Homiletics', telugu: 'హోమిలెటిక్స్' }
            ], 'cols-3')}

            {/* Prof Rajshekar Sir Section */}
            {renderSectionColumns('rajshekar', 'Prof Rajshekar Sir', '+91-8885831588', 'లా, హిస్టరీ, పోయెటిక్ & విజ్డమ్, ప్రాఫెటిక్', [
              { key: 'law', label: 'Law', telugu: 'లా' },
              { key: 'history', label: 'History', telugu: 'హిస్టరీ' },
              { key: 'poetic', label: 'Poetic & Wisdom', telugu: 'పోయెటిక్' },
              { key: 'prophetic', label: 'Prophetic', telugu: 'ప్రాఫెటిక్' }
            ], 'cols-4')}

            {/* Prof Sampath Kumar Section */}
            {renderSectionColumns('sampath', 'Prof Sampath Kumar', '+91 9985236736', 'లైఫ్ ఆఫ్ క్రైస్ట్, క్రోనలాజికల్, ఎవంజిలిజం', [
              { key: 'loc', label: 'Life of Christ', telugu: 'లైఫ్ ఆఫ్ క్రైస్ట్' },
              { key: 'locChronological', label: 'Life of Christ - Chronological Study', telugu: 'క్రోనలాజికల్' },
              { key: 'evangelism', label: 'Evangelism & Missions', telugu: 'ఎవంజిలిజం' }
            ], 'cols-3')}

            <div className="input-group">
              <label>Video Submitted <span className="telugu-label">వీడియో సమర్పణ</span></label>
              <input type="text" name="videoSubmitted" placeholder="Yes/No" value={formData.videoSubmitted} onChange={handleChange} />
            </div>

            <div className="input-group">
              <label>Accomodation Dates <span className="telugu-label">వసతి తేదీలు</span></label>
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
                    videoSubmitted: '', accommodation: ''
                  });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Export Bar */}
        <div className="export-controls">
          <h3>Records Table (రికార్డుల పట్టిక)</h3>
          <div className="export-buttons">
            <button onClick={exportToExcel} className="btn-excel">Download Excel (CSV)</button>
            <button onClick={exportToPDF} className="btn-pdf">Download PDF (Landscape)</button>
          </div>
        </div>

        {/* Table Display */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name <br/><span className="telugu-text">పేరు</span></th>
                <th>District <br/><span className="telugu-text">జిల్లా</span></th>
                <th>Photo <br/><span className="telugu-text">ఫోటో</span></th>
                <th>Phone <br/><span className="telugu-text">ఫోన్</span></th>
                <th>Prof Stephen Suresh Babu<br/>+91 8074852725 <br/><span className="telugu-text">(Subjects)</span></th>
                <th>Prof Rajshekar Sir<br/>+91-8885831588 <br/><span className="telugu-text">(Subjects)</span></th>
                <th>Prof Sampath Kumar<br/>+91 9985236736 <br/><span className="telugu-text">(Subjects)</span></th>
                <th>Video Sub. <br/><span className="telugu-text">వీడియో</span></th>
                <th>Accomodation <br/><span className="telugu-text">వసతి</span></th>
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
                      <td>{row.videoSubmitted}</td>
                      <td>{row.accommodation}</td>
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
                  <td colSpan="10" className="no-data">No records available. Add one above!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* FOOTER SECTION */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>© 2026 CBC-BTC. All Rights Reserved.</p>
          <p className="footer-subtext">Designed for secure academic tracking and report generation.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;