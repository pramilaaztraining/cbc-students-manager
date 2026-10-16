import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './App.css';

function App() {
  const initialData = [
    {
      id: 1,
      name: 'A. Sadhana',
      district: 'Hyderabad',
      phone: '9876543210',
      videoSubmitted: 'Yes',
      accommodation: '10-12 Jan',
      permissions: '0',
      classes: 'Yes',
      exams: 'Yes',
      notes: 'Yes',
      photoLink: 'A.Sadhana.jpg',
      photoUrl: ''
    }
  ];

  const [rows, setRows] = useState(() => {
    const saved = localStorage.getItem('cbc_students_full_data');
    return saved ? JSON.parse(saved) : initialData;
  });

  const [formData, setFormData] = useState({
    name: '',
    district: '',
    phone: '',
    videoSubmitted: '',
    accommodation: '',
    permissions: '',
    classes: '',
    exams: '',
    notes: '',
    photoLink: '',
    photoUrl: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  useEffect(() => {
    localStorage.setItem('cbc_students_full_data', JSON.stringify(rows));
  }, [rows]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          photoLink: file.name,
          photoUrl: reader.result
        });
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
      const newEntry = {
        id: Date.now(),
        ...formData
      };
      setRows([...rows, newEntry]);
    }

    setFormData({
      name: '',
      district: '',
      phone: '',
      videoSubmitted: '',
      accommodation: '',
      permissions: '',
      classes: '',
      exams: '',
      notes: '',
      photoLink: '',
      photoUrl: ''
    });
  };

  const handleEdit = (row) => {
    setIsEditing(true);
    setCurrentId(row.id);
    setFormData({
      name: row.name,
      district: row.district || '',
      phone: row.phone || '',
      videoSubmitted: row.videoSubmitted || '',
      accommodation: row.accommodation || '',
      permissions: row.permissions || '',
      classes: row.classes || '',
      exams: row.exams || '',
      notes: row.notes || '',
      photoLink: row.photoLink || '',
      photoUrl: row.photoUrl || ''
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      setRows(rows.filter(row => row.id !== id));
      if (isEditing && currentId === id) {
        setIsEditing(false);
        setFormData({
          name: '',
          district: '',
          phone: '',
          videoSubmitted: '',
          accommodation: '',
          permissions: '',
          classes: '',
          exams: '',
          notes: '',
          photoLink: '',
          photoUrl: ''
        });
      }
    }
  };

  // EXCEL EXPORT
  const exportToExcel = () => {
    const excelData = rows.map(row => ({
      'Name / పేరు': row.name,
      'District / జిల్లా': row.district,
      'Phone Number / ఫోన్ నంబర్': row.phone,
      'Video Submitted / వీడియో సమర్పించారా': row.videoSubmitted,
      'Accomodation In CBC - Dates / వసతి తేదీలు': row.accommodation,
      'No of permissions taken / అనుమతులు': row.permissions,
      'Did you attend all classes / అన్ని తరగతులు': row.classes,
      'Did you write all exams / అన్ని పరీక్షలు': row.exams,
      'Did you submit all notes / అన్ని నోట్స్': row.notes,
      'Photo / ఫోటో': row.photoLink || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CBC Students Records');
    XLSX.writeFile(workbook, 'CBC_Students_Records.xlsx');
  };

  // PDF EXPORT
 const exportToPDF = () => {
    const doc = new jsPDF('landscape');

    // Paste your Base64 encoded font string here:
    // const teluguFontBase64 = "YOUR_BASE64_STRING_HERE";
    // doc.addFileToVFS('TeluguFont.ttf', teluguFontBase64);
    // doc.addFont('TeluguFont.ttf', 'TeluguFont', 'normal');
    // doc.setFont('TeluguFont');

    doc.setFontSize(14);
    doc.text('6th & 7th Sisters CBC-BTC Records', 14, 14);

    const tableColumns = [
      'Name', 'District', 'Phone', 'Video Sub.', 
      'Accomodation', 'Permissions', 'Classes', 'Exams', 'Notes', 'Photo'
    ];
    
    const tableRows = rows.map(row => [
      row.name,
      row.district,
      row.phone,
      row.videoSubmitted,
      row.accommodation,
      row.permissions,
      row.classes,
      row.exams,
      row.notes,
      row.photoUrl ? '' : 'No Photo'
    ]);

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 4, minCellHeight: 14, halign: 'center' },
      headStyles: { fillColor: [40, 116, 166], textColor: 255, fontStyle: 'bold' },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 9) {
          const rowIndex = data.row.index;
          const currentRecord = rows[rowIndex];
          
          if (currentRecord && currentRecord.photoUrl) {
            try {
              doc.addImage(
                currentRecord.photoUrl,
                'JPEG',
                data.cell.x + 2,
                data.cell.y + 1,
                12,
                12
              );
            } catch (error) {
              console.error('Error drawing image in PDF:', error);
            }
          }
        }
      }
    });

    doc.save('CBC_Students_Records.pdf');
  };

  return (
    <div className="container">
      <h2>6th & 7th Sisters CBC-BTC Manager</h2>
      <p className="subtitle">Manage student data with bilingual form fields, photo attachments, and report exports.</p>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className={`form-card ${isEditing ? 'editing-mode' : ''}`}>
        <h3>{isEditing ? 'Edit Record (రికార్డును సవరించు)' : 'Add New Record (కొత్త రికార్డును జోడించు)'}</h3>
        
        <div className="form-grid">
          <div className="input-group">
            <label>Name <span className="telugu-label">పేరు</span></label>
            <input type="text" name="name" placeholder="Enter name..." value={formData.name} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>District <span className="telugu-label">జిల్లా</span></label>
            <input type="text" name="district" placeholder="Enter district..." value={formData.district} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label>Phone Number <span className="telugu-label">ఫోన్ నంబర్</span></label>
            <input type="text" name="phone" placeholder="Enter phone..." value={formData.phone} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label>Video Submitted <span className="telugu-label">వీడియో సమర్పణ</span></label>
            <input type="text" name="videoSubmitted" placeholder="Yes/No" value={formData.videoSubmitted} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label>Accomodation Dates <span className="telugu-label">వసతి తేదీలు</span></label>
            <input type="text" name="accommodation" placeholder="Enter dates..." value={formData.accommodation} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label>Permissions Taken <span className="telugu-label">అనుమతుల సంఖ్య</span></label>
            <input type="text" name="permissions" placeholder="Count..." value={formData.permissions} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label>Attend All Classes <span className="telugu-label">అన్ని తరగతులు</span></label>
            <input type="text" name="classes" placeholder="Yes/No" value={formData.classes} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label>Write All Exams <span className="telugu-label">అన్ని పరీక్షలు</span></label>
            <input type="text" name="exams" placeholder="Yes/No" value={formData.exams} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label>Submit All Notes <span className="telugu-label">అన్ని నోట్స్</span></label>
            <input type="text" name="notes" placeholder="Yes/No" value={formData.notes} onChange={handleChange} />
          </div>

          <div className="input-group file-input-group">
            <label>Upload Photo <span className="telugu-label">ఫోటో అప్‌లోడ్ చేయండి</span></label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className={isEditing ? "btn-update" : "btn-add"}>
            {isEditing ? 'Update Record' : 'Add Record'}
          </button>
          {isEditing && (
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  name: '', district: '', phone: '', videoSubmitted: '',
                  accommodation: '', permissions: '', classes: '', exams: '',
                  notes: '', photoLink: '', photoUrl: ''
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
          <button onClick={exportToExcel} className="btn-excel">Download Excel</button>
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
              <th>Phone <br/><span className="telugu-text">ఫోన్</span></th>
              <th>Video Sub. <br/><span className="telugu-text">వీడియో</span></th>
              <th>Accomodation Dates <br/><span className="telugu-text">వసతి తేదీలు</span></th>
              <th>Permissions <br/><span className="telugu-text">అనుమతులు</span></th>
              <th>All Classes <br/><span className="telugu-text">తరగతులు</span></th>
              <th>All Exams <br/><span className="telugu-text">పరీక్షలు</span></th>
              <th>All Notes <br/><span className="telugu-text">నోట్స్</span></th>
              <th>Photo <br/><span className="telugu-text">ఫోటో</span></th>
              <th>Actions <br/><span className="telugu-text">చర్యలు</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.name}</strong></td>
                  <td>{row.district}</td>
                  <td>{row.phone}</td>
                  <td>{row.videoSubmitted}</td>
                  <td>{row.accommodation}</td>
                  <td>{row.permissions}</td>
                  <td>{row.classes}</td>
                  <td>{row.exams}</td>
                  <td>{row.notes}</td>
                  <td>
                    {row.photoUrl ? (
                      <div className="photo-cell">
                        <img src={row.photoUrl} alt="Preview" className="thumbnail" />
                      </div>
                    ) : (
                      <span>{row.photoLink || 'No Photo'}</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleEdit(row)} className="btn-edit">Edit</button>
                      <button onClick={() => handleDelete(row.id)} className="btn-delete">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="no-data">No records available. Add one above!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;