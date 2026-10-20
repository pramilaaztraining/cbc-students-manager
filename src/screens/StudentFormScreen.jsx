import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './StudentFormScreen.css';

// 🌟 Reusable Searchable Dropdown Component
function SearchableDropdown({ options, value, onChange, placeholder, name }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const dropdownRef = useRef(null);

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
    <div className="searchable-dropdown-container" ref={dropdownRef}>
      <div 
        className={`dropdown-select-trigger ${value ? 'selected' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value || placeholder}</span>
        <span className="dropdown-arrow">▼</span>
      </div>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-search-box">
            <input 
              type="text"
              placeholder="🔍 Type to filter list..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              autoFocus
              className="dropdown-search-input"
            />
          </div>

          <div className="dropdown-options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div 
                  key={opt}
                  onClick={() => {
                    onChange({ target: { name, value: opt } });
                    setIsOpen(false);
                    setFilterQuery('');
                  }}
                  className={`dropdown-option-item ${value === opt ? 'active' : ''}`}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div className="dropdown-no-options">
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
        <h3 className="form-card-title">
          {isEditing ? `Edit Student Profile [ID: ${formData.id}]` : 'Create New Student Profile'}
        </h3>
        
        <div className="form-grid-4col">
          
          <div className="form-group">
            <label className="form-label">
              First Name * <span className="label-telugu">మొదటి పేరు</span>
            </label>
            <input 
              type="text" 
              name="first_name" 
              value={formData.first_name} 
              onChange={handleChange} 
              placeholder="Enter first name..."
              className="form-input"
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Last Name <span className="label-telugu">ఇంటి పేరు / చివరి పేరు</span>
            </label>
            <input 
              type="text" 
              name="last_name" 
              value={formData.last_name} 
              onChange={handleChange} 
              placeholder="Enter last name..." 
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Email <span className="label-telugu">ఈమెయిల్</span>
            </label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              placeholder="Enter email..." 
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Course * <span className="label-telugu">కోర్సు</span>
            </label>
            <SearchableDropdown 
              options={courseOptions}
              value={formData.course}
              onChange={handleChange}
              placeholder="Click to select course..."
              name="course"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Batch * <span className="label-telugu">బ్యాచ్</span>
            </label>
            <SearchableDropdown 
              options={batchOptions}
              value={formData.batch}
              onChange={handleChange}
              placeholder="Click to select batch..."
              name="batch"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              District * <span className="label-telugu">జిల్లా</span>
            </label>
            <input 
              type="text" 
              name="district" 
              value={formData.district} 
              onChange={handleChange} 
              placeholder="Enter district..."
              className="form-input"
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Phone Number <span className="label-telugu">ఫోన్ నంబర్</span>
            </label>
            <input 
              type="text" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              placeholder="Enter phone..." 
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Upload Photo * <span className="label-telugu">ఫోటో</span>
            </label>
            <div>
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </div>
            {formData.photo_url && (
              <div className="photo-preview-container">
                <img src={formData.photo_url} alt="Preview" className="photo-preview-img" />
              </div>
            )}
          </div>

        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="save-btn" 
            style={{ backgroundColor: isEditing ? '#d97706' : '#2563eb' }}
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
              className="cancel-btn"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="directory-section">
        <div className="directory-header">
          <h3 className="directory-title">Registered Students Directory ({searchedRows.length})</h3>
          
          <div className="directory-controls">
            <input 
              type="text"
              placeholder="Search by name, batch, course, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="directory-search-input"
            />

            <span className="records-badge">
              Records: {searchedRows.length}
            </span>

            <button 
              type="button"
              onClick={exportStudentsToPDF}
              className="pdf-export-btn"
            >
              📥 Download PDF
            </button>
          </div>
        </div>

        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
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
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {searchedRows && searchedRows.length > 0 ? (
                  searchedRows.map((row, idx) => (
                    <tr 
                      key={row.id} 
                      className={idx % 2 === 0 ? 'row-even' : 'row-odd'}
                    >
                      <td>
                        <span className="row-id-badge">#{row.id}</span>
                      </td>
                      <td className="font-semibold text-dark">{row.first_name}</td>
                      <td>{row.last_name || 'N/A'}</td>
                      <td className="capitalize">{row.district || 'N/A'}</td>
                      <td>{row.email || 'N/A'}</td>
                      <td>{row.phone || 'N/A'}</td>
                      <td className="font-medium">{row.course || 'N/A'}</td>
                      <td>{row.batch || 'N/A'}</td>
                      <td>
                        {row.photo_url ? (
                          <img src={row.photo_url} alt="Student" className="table-student-photo" />
                        ) : (
                          <span className="no-photo-text">No Photo</span>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="action-buttons-group">
                          <button 
                            type="button"
                            onClick={() => handleEdit(row, 'creation')} 
                            className="edit-action-btn"
                          >
                            Edit
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDelete(row.id)} 
                            className="delete-action-btn"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="empty-table-row">
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