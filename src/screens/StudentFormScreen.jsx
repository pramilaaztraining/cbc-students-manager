import React, { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function SearchableDropdown({ options, value, onSelect, placeholder, name, required, fieldLabel }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);
  const hiddenInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    String(opt).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        readOnly
        placeholder={placeholder}
        value={value ? String(value) : ''}
        onClick={() => { setIsOpen(!isOpen); setSearchTerm(''); }}
        style={{ 
          width: '100%', padding: '10px 30px 10px 10px', borderRadius: '6px', 
          border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box', 
          backgroundColor: '#fff', cursor: 'pointer', caretColor: 'transparent' 
        }}
      />
      <span 
        onClick={() => { setIsOpen(!isOpen); setSearchTerm(''); }}
        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#64748b', fontSize: '0.8rem', pointerEvents: 'none' }}
      >
        ▼
      </span>
      <input 
        type="text" 
        ref={hiddenInputRef}
        value={value || ''} 
        required={required} 
        onInvalid={(e) => e.target.setCustomValidity(`Please select a valid ${fieldLabel}.`)}
        onInput={(e) => e.target.setCustomValidity('')}
        onChange={() => {}} 
        tabIndex={-1} 
        aria-hidden="true" 
        style={{ opacity: 0, position: 'absolute', pointerEvents: 'none', height: 0, width: 0 }} 
      />
      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
          backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '0 0 6px 6px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
          <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>
            <input
              type="text"
              autoFocus
              placeholder="🔍 Type to filter list..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
            />
          </div>
          <ul style={{ maxHeight: '150px', overflowY: 'auto', margin: 0, padding: 0, listStyle: 'none' }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => (
                <li
                  key={idx}
                  onClick={() => {
                    onSelect(name, opt);
                    setIsOpen(false);
                    setSearchTerm('');
                    if (hiddenInputRef.current) hiddenInputRef.current.setCustomValidity('');
                  }}
                  style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
                >
                  {opt}
                </li>
              ))
            ) : (
              <li style={{ padding: '10px', color: '#94a3b8', fontSize: '0.9rem' }}>No matches found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function StudentFormScreen({ 
  formData, 
  setFormData, 
  isEditing, 
  handleSubmit, 
  handleFileChange, 
  handleChange, 
  rows, 
  handleEdit: parentHandleEdit, 
  handleDelete, 
  setIsEditing 
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRows = rows.filter(row => 
    (row.first_name && row.first_name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (row.last_name && row.last_name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (row.email && row.email.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (row.course && row.course.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (row.batch && String(row.batch).includes(searchTerm)) ||
    (row.district && row.district.toLowerCase().includes(searchTerm.toLowerCase())) ||
    String(row.id).includes(searchTerm)
  );

  const courseOptions = ['BTC', 'B.TH', 'M.TH'];
  const batchOptions = Array.from({ length: 100 }, (_, i) => `Batch ${i + 1}`);

  const handleDropdownSelect = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditClick = (row) => {
    const cleanStudentOnly = {
      id: row.id || null,
      first_name: row.first_name || '',
      last_name: row.last_name || '',
      district: row.district || '',
      phone: row.phone || '',
      email: row.email || '',
      course: row.course || '',
      batch: row.batch || '',
      photo_url: row.photo_url || row.photoUrl || ''
    };
    if (typeof parentHandleEdit === 'function') {
      parentHandleEdit(cleanStudentOnly);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('Registered Students Directory', 14, 15);

    const tableRows = filteredRows.map((row, index) => [
      row.id || index + 1,
      row.first_name || 'N/A',
      row.last_name || 'N/A',
      row.district || 'N/A',
      row.email || 'N/A',
      row.phone || 'N/A',
      row.course || 'N/A',
      row.batch || 'N/A',
      '' 
    ]);

    const tableColumns = ['ID', 'First Name', 'Last Name', 'District', 'Email', 'Phone', 'Course', 'Batch', 'Photo'];

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 5, valign: 'middle' },
      headStyles: { fillColor: [41, 128, 185] },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 8) {
          const rowIndex = data.row.index;
          const student = filteredRows[rowIndex];
          const imgUrl = student?.photoUrl || student?.photo_url;
          if (imgUrl) {
            try {
              const dim = 10;
              const x = data.cell.x + (data.cell.width - dim) / 2;
              const y = data.cell.y + (data.cell.height - dim) / 2;
              doc.addImage(imgUrl, 'JPEG', x, y, dim, dim);
            } catch (err) {
              doc.setFontSize(7);
              doc.text('No Image', data.cell.x + 2, data.cell.y + data.cell.height / 2);
            }
          }
        }
      }
    });

    doc.save('registered-students-directory.pdf');
  };

  return (
    <div className="screen-section">
      <div className="section-intro">
        <h2>Section 1: Initial Student Detail Creation</h2>
        <p className="subtitle">Add or edit student demographics, courses, batch details, and profile photos.</p>
      </div>

      <form onSubmit={handleSubmit} className={`form-card ${isEditing ? 'editing-mode' : ''}`}>
        <h3>{isEditing ? `Edit Student Profile [ID: ${formData.id}]` : 'Create New Student Profile'}</h3>
        
        <div className="form-grid">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
            
            <div className="input-group">
              <label>First Name * <span className="telugu-label">మొదటి పేరు</span></label>
              <input type="text" name="first_name" placeholder="Enter first name..." value={formData.first_name || ''} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>Last Name <span className="telugu-label">ఇంటి పేరు / చివరి పేరు</span></label>
              <input type="text" name="last_name" placeholder="Enter last name..." value={formData.last_name || ''} onChange={handleChange} />
            </div>

            <div className="input-group">
              <label>Email <span className="telugu-label">ఈమెయిల్</span></label>
              <input type="email" name="email" placeholder="Enter email..." value={formData.email || ''} onChange={handleChange} />
            </div>

            <div className="input-group">
              <label>Course * <span className="telugu-label">కోర్స్</span></label>
              <SearchableDropdown options={courseOptions} value={formData.course} onSelect={handleDropdownSelect} placeholder="Click to select course..." name="course" required={true} fieldLabel="Course" />
            </div>

            <div className="input-group">
              <label>Batch * <span className="telugu-label">బ్యాచ్</span></label>
              <SearchableDropdown options={batchOptions} value={formData.batch} onSelect={handleDropdownSelect} placeholder="Click to select batch..." name="batch" required={true} fieldLabel="Batch" />
            </div>

            <div className="input-group">
              <label>District * <span className="telugu-label">జిల్లా</span></label>
              <input type="text" name="district" placeholder="Enter district..." value={formData.district || ''} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>Phone Number <span className="telugu-label">ఫోన్ నంబర్</span></label>
              <input type="text" name="phone" placeholder="Enter phone..." value={formData.phone || ''} onChange={handleChange} />
            </div>

            <div className="input-group file-input-group">
              <label>Upload Photo * <span className="telugu-label">ఫోటో</span></label>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {(formData.photoUrl || formData.photo_url || formData.photoLink) && (
                <span style={{ fontSize: '0.8rem', color: '#16a34a', marginTop: '4px', display: 'block' }}>✔ Photo uploaded</span>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button type="submit" style={{ padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            {isEditing ? `Update Student [ID: ${formData.id}]` : 'Save Student Details'}
          </button>
          {isEditing && (
            <button 
              type="button" 
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  id: null, first_name: '', last_name: '', email: '', course: '', batch: '', district: '', phone: '', photoLink: '', photoUrl: ''
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0 }}>Registered Students Directory ({filteredRows.length})</h3>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              onClick={exportToPDF}
              style={{ padding: '10px 18px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              📥 Export Table to PDF
            </button>
            <div style={{ minWidth: '260px' }}>
              <input 
                type="text" 
                placeholder="🔍 Search by name, batch, course..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>District</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Course</th>
                <th>Batch</th>
                <th>Photo</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td><code>{row.id}</code></td>
                    <td><strong>{row.first_name || 'N/A'}</strong></td>
                    <td>{row.last_name || 'N/A'}</td>
                    <td>{row.district || 'N/A'}</td>
                    <td>{row.email || 'N/A'}</td>
                    <td>{row.phone || 'N/A'}</td>
                    <td>{row.course || 'N/A'}</td>
                    <td>{row.batch || 'N/A'}</td>
                    <td>
                      {row.photoUrl || row.photo_url ? (
                        <img src={row.photoUrl || row.photo_url} alt="Preview" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <span>No Photo</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEditClick(row)} style={{ padding: '6px 12px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => handleDelete(row.id)} style={{ padding: '6px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="no-data" style={{ textAlign: 'center', padding: '20px' }}>No students matched your search criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}