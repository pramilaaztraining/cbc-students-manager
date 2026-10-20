import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './StudentFormScreen.css';

// 🌟 Reusable Searchable Dropdown Component (Restricted to valid options only)
function SearchableDropdown({ options, value, onChange, placeholder, name }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={dropdownRef}>
      {/* Main Selector Button / Read-only Display */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '9px 12px',
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          fontSize: '0.9rem',
          background: '#fff',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxSizing: 'border-box',
          color: value ? '#0f172a' : '#94a3b8'
        }}
      >
        <span>{value || placeholder}</span>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>▼</span>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: '#fff',
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 1000,
          maxHeight: '220px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Search Filter Box Inside Dropdown */}
          <div style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>
            <input 
              type="text"
              placeholder="🔍 Type to filter list..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Scrollable Options List */}
          <div style={{ overflowY: 'auto', maxHeight: '150px' }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div 
                  key={opt}
                  onClick={() => {
                    onChange({ target: { name, value: opt } });
                    setIsOpen(false);
                    setFilterQuery('');
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: value === opt ? '#f8fafc' : '#fff',
                    fontWeight: value === opt ? '600' : '400',
                    color: '#1e293b'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = value === opt ? '#f8fafc' : '#fff'}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div style={{ padding: '10px', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
                No options found
              </div>
            )}
          </div>
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
  handleEdit,
  handleDelete,
  setIsEditing
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const courseOptions = ['BTC', 'M.TH', 'D.TH'];
  const batchOptions = Array.from({ length: 100 }, (_, i) => `Batch ${i + 1}`);

  // 🛡️ Extra check on submit to guarantee course and batch are valid selected choices
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!courseOptions.includes(formData.course)) {
      alert('Please select a valid course from the list.');
      return;
    }
    if (!batchOptions.includes(formData.batch)) {
      alert('Please select a valid batch from the list (Batch 1 to 100).');
      return;
    }
    handleSubmit(e);
  };

  const searchedRows = (rows || []).filter(row => {
    const query = searchTerm.toLowerCase();
    const fullName = `${row.first_name || ''} ${row.last_name || ''}`.toLowerCase();
    const district = (row.district || '').toLowerCase();
    const course = (row.course || '').toLowerCase();
    const batch = (row.batch || '').toLowerCase();
    const idStr = String(row.id || '');

    return fullName.includes(query) || district.includes(query) || course.includes(query) || batch.includes(query) || idStr.includes(query);
  });

  const exportStudentsToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('CBC-BTC Manager - Registered Students Directory', 14, 12);

    const tableColumns = ['ID', 'First Name', 'Last Name', 'District', 'Email', 'Phone', 'Course', 'Batch'];
    const tableRows = searchedRows.map(row => [
      row.id,
      row.first_name || '',
      row.last_name || '',
      row.district || 'N/A',
      row.email || 'N/A',
      row.phone || 'N/A',
      row.course || 'N/A',
      row.batch || 'N/A'
    ]);

    autoTable(doc, { 
      head: [tableColumns], 
      body: tableRows, 
      startY: 18, 
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [37, 99, 235] }
    });
    doc.save('Registered_Students_Directory.pdf');
  };

  return (
    <div className="screen-section">
      <div className="section-intro">
        <h2>Section 1: Initial Student Detail Creation</h2>
        <p className="subtitle">Add or edit student demographics, courses, batch details, and profile photos.</p>
      </div>

      <form onSubmit={handleFormSubmit} className="form-card">
        <h3 style={{ marginBottom: '20px', color: '#1e293b', fontSize: '1.2rem' }}>
          {isEditing ? `Edit Student Profile [ID: ${formData.id}]` : 'Create New Student Profile'}
        </h3>
        
        {/* 🌟 4-Column Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
          
          {/* First Name */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '6px', color: '#1e293b' }}>
              First Name * <span style={{ fontWeight: 'normal', color: '#64748b', fontSize: '0.8rem' }}>మొదటి పేరు</span>
            </label>
            <input 
              type="text" 
              name="first_name" 
              value={formData.first_name} 
              onChange={handleChange} 
              placeholder="Enter first name..."
              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              required 
            />
          </div>

          {/* Last Name */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '6px', color: '#1e293b' }}>
              Last Name <span style={{ fontWeight: 'normal', color: '#64748b', fontSize: '0.8rem' }}>ఇంటి పేరు / చివరి పేరు</span>
            </label>
            <input 
              type="text" 
              name="last_name" 
              value={formData.last_name} 
              onChange={handleChange} 
              placeholder="Enter last name..." 
              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Email */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '6px', color: '#1e293b' }}>
              Email <span style={{ fontWeight: 'normal', color: '#64748b', fontSize: '0.8rem' }}>ఈమెయిల్</span>
            </label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              placeholder="Enter email..." 
              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Course (Strict Selection Only) */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '6px', color: '#1e293b' }}>
              Course * <span style={{ fontWeight: 'normal', color: '#64748b', fontSize: '0.8rem' }}>కోర్సు</span>
            </label>
            <SearchableDropdown 
              options={courseOptions}
              value={formData.course}
              onChange={handleChange}
              placeholder="Click to select course..."
              name="course"
            />
          </div>

          {/* Batch (Strict Selection Only 1-100) */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '6px', color: '#1e293b' }}>
              Batch * <span style={{ fontWeight: 'normal', color: '#64748b', fontSize: '0.8rem' }}>బ్యాచ్</span>
            </label>
            <SearchableDropdown 
              options={batchOptions}
              value={formData.batch}
              onChange={handleChange}
              placeholder="Click to select batch..."
              name="batch"
            />
          </div>

          {/* District */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '6px', color: '#1e293b' }}>
              District * <span style={{ fontWeight: 'normal', color: '#64748b', fontSize: '0.8rem' }}>జిల్లా</span>
            </label>
            <input 
              type="text" 
              name="district" 
              value={formData.district} 
              onChange={handleChange} 
              placeholder="Enter district..."
              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              required 
            />
          </div>

          {/* Phone Number */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '6px', color: '#1e293b' }}>
              Phone Number <span style={{ fontWeight: 'normal', color: '#64748b', fontSize: '0.8rem' }}>ఫోన్ నంబర్</span>
            </label>
            <input 
              type="text" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              placeholder="Enter phone..." 
              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Upload Photo */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '6px', color: '#1e293b' }}>
              Upload Photo * <span style={{ fontWeight: 'normal', color: '#64748b', fontSize: '0.8rem' }}>ఫోటో</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </div>
            {formData.photo_url && (
              <div style={{ marginTop: '8px' }}>
                <img src={formData.photo_url} alt="Preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%', border: '1px solid #cbd5e1' }} />
              </div>
            )}
          </div>

        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
          <button 
            type="submit" 
            className="save-btn" 
            style={{ 
              backgroundColor: isEditing ? '#d97706' : '#2563eb', 
              padding: '10px 20px', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              fontSize: '0.9rem'
            }}
          >
            {isEditing ? `Update Student Details [ID: ${formData.id}]` : 'Save Student Details'}
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
              style={{ padding: '10px 16px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {/* 🌟 Registered Students Directory Grid */}
      <div style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>Registered Students Directory ({searchedRows.length})</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <input 
              type="text"
              placeholder="Search by name, batch, course, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                width: '260px',
                outline: 'none'
              }}
            />

            <span style={{ fontSize: '0.85rem', color: '#64748b', background: '#f1f5f9', padding: '6px 12px', borderRadius: '20px', fontWeight: 500 }}>
              Records: {searchedRows.length}
            </span>

            <button 
              type="button"
              onClick={exportStudentsToPDF}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                background: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
              }}
            >
              📥 Download PDF
            </button>
          </div>
        </div>

        <div style={{ 
          background: '#ffffff', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', 
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#1e293b' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>ID</th>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>First Name</th>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>Last Name</th>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>District</th>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>Email</th>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>Phone</th>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>Course</th>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>Batch</th>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>Photo</th>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {searchedRows && searchedRows.length > 0 ? (
                  searchedRows.map((row, idx) => (
                    <tr 
                      key={row.id} 
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.2s ease',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#fafafa'}
                    >
                      <td style={{ padding: '16px', color: '#64748b', fontWeight: 600, verticalAlign: 'middle' }}>
                        <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>#{row.id}</span>
                      </td>
                      <td style={{ padding: '16px', color: '#0f172a', fontWeight: 600, verticalAlign: 'middle' }}>
                        {row.first_name}
                      </td>
                      <td style={{ padding: '16px', color: '#475569', verticalAlign: 'middle' }}>
                        {row.last_name || 'N/A'}
                      </td>
                      <td style={{ padding: '16px', color: '#475569', textTransform: 'capitalize', verticalAlign: 'middle' }}>
                        {row.district || 'N/A'}
                      </td>
                      <td style={{ padding: '16px', color: '#475569', verticalAlign: 'middle' }}>
                        {row.email || 'N/A'}
                      </td>
                      <td style={{ padding: '16px', color: '#475569', verticalAlign: 'middle' }}>
                        {row.phone || 'N/A'}
                      </td>
                      <td style={{ padding: '16px', color: '#475569', verticalAlign: 'middle', fontWeight: 500 }}>
                        {row.course || 'N/A'}
                      </td>
                      <td style={{ padding: '16px', color: '#475569', verticalAlign: 'middle' }}>
                        {row.batch || 'N/A'}
                      </td>
                      <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                        {row.photo_url ? (
                          <img src={row.photo_url} alt="Student" style={{ width: '35px', height: '35px', objectFit: 'cover', borderRadius: '50%', border: '1px solid #cbd5e1' }} />
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No Photo</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            type="button"
                            onClick={() => handleEdit(row, 'creation')} 
                            style={{ 
                              padding: '6px 12px', 
                              background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                              color: '#fff', 
                              border: 'none', 
                              borderRadius: '6px', 
                              cursor: 'pointer', 
                              fontWeight: '600',
                              fontSize: '0.8rem',
                              boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)'
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDelete(row.id)} 
                            style={{ 
                              padding: '6px 12px', 
                              background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
                              color: '#fff', 
                              border: 'none', 
                              borderRadius: '6px', 
                              cursor: 'pointer', 
                              fontWeight: '600',
                              fontSize: '0.8rem',
                              boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontStyle: 'italic' }}>
                      No registered students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}