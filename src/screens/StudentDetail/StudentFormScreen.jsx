import React, { useState, useRef } from 'react';
import './StudentFormScreen.css';

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
  const fileInputRef = useRef(null);

  const courseOptions = ['BTC', 'M.TH', 'D.TH'];
  const batchOptions = Array.from({ length: 100 }, (_, i) => `Batch ${i + 1}`);
  const availableInterests = ['Singing', 'Preaching', 'Testimony Sharing'];

  const getInterestsArray = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val.trim() !== '') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return val.split(',').map(item => item.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const currentInterests = getInterestsArray(formData.interest);

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    let updatedInterests = [...currentInterests];
    if (checked) {
      if (!updatedInterests.includes(value)) updatedInterests.push(value);
    } else {
      updatedInterests = updatedInterests.filter(i => i !== value);
    }
    setFormData(prev => ({ ...prev, interest: updatedInterests }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    await handleSubmit(e);
    
    // Clear photo field reference after successful save
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  return (
    <div className="screen-section">
      <div className="section-intro">
        <h2>Section 1: Initial Student Detail Creation</h2>
        <p className="subtitle">Add or edit student demographics, courses, batch details, interests, and profile photos.</p>
      </div>

      <form onSubmit={handleFormSubmit} className="form-card">
        <h3 className="form-card-title">
          {isEditing ? `Edit Student Profile [ID: ${formData.id}]` : 'Create New Student Profile'}
        </h3>
        
        <div className="form-grid-4col">
          <div className="form-group">
            <label className="form-label">First Name *</label>
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
            <label className="form-label">Last Name</label>
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
            <label className="form-label">Email</label>
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
            <label className="form-label">Course *</label>
            <select 
              name="course" 
              value={formData.course} 
              onChange={handleChange} 
              className="form-input" 
              required
            >
              <option value="">Select course...</option>
              {courseOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Batch *</label>
            <select 
              name="batch" 
              value={formData.batch} 
              onChange={handleChange} 
              className="form-input" 
              required
            >
              <option value="">Select batch...</option>
              {batchOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">District *</label>
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
            <label className="form-label">Phone Number</label>
            <input 
              type="text" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              placeholder="Enter phone..." 
              className="form-input"
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Areas of Interest</label>
            <div style={{ display: 'flex', gap: '15px', marginTop: '10px', flexWrap: 'wrap' }}>
              {availableInterests.map((interestOption) => (
                <label key={interestOption} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                  <input 
                    type="checkbox"
                    value={interestOption}
                    checked={currentInterests.includes(interestOption)}
                    onChange={handleCheckboxChange}
                  />
                  {interestOption}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Upload Photo *</label>
            <div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                ref={fileInputRef} 
              />
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
                  id: null, first_name: '', last_name: '', email: '', course: '', batch: '', district: '', phone: '', interest: [], photoLink: '', photoUrl: '', photo_url: ''
                });
                if (fileInputRef.current) fileInputRef.current.value = '';
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
          <h3 className="directory-title">Registered Students Directory</h3>
          <div className="directory-controls">
            <input 
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="directory-search-input"
            />
            <span className="records-badge">Records: {searchedRows.length}</span>
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
                  <th>Course</th>
                  <th>Batch</th>
                  <th>Photo</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {searchedRows.map((row) => (
                  <tr key={row.id}>
                    <td>#{row.id}</td>
                    <td>{row.first_name}</td>
                    <td>{row.last_name || 'N/A'}</td>
                    <td>{row.district}</td>
                    <td>{row.course}</td>
                    <td>{row.batch}</td>
                    <td>
                      {row.photo_url ? (
                        <img src={row.photo_url} alt="Student" className="table-student-photo" />
                      ) : 'No Photo'}
                    </td>
                    <td className="text-center">
                      <button onClick={() => handleEdit(row, 'creation')} className="edit-action-btn">Edit</button>
                      <button onClick={() => handleDelete(row.id)} className="delete-action-btn">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  ); 
}