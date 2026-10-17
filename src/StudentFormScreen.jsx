import React, { useState } from 'react';

export default function StudentFormScreen({ formData, setFormData, isEditing, handleSubmit, handleFileChange, handleChange, rows, handleEdit, handleDelete, setIsEditing, createDetailedSubsections, stephenKeys, rajkeys, sampathKeys }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRows = rows.filter(row => 
    row.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (row.district && row.district.toLowerCase().includes(searchTerm.toLowerCase())) ||
    String(row.id).includes(searchTerm)
  );

  return (
    <div className="screen-section">
      <div className="section-intro">
        <h2>Section 1: Initial Student Detail Creation</h2>
        <p className="subtitle">Add or edit core student demographics, phone numbers, and profile photos.</p>
      </div>

      <form onSubmit={handleSubmit} className={`form-card ${isEditing ? 'editing-mode' : ''}`}>
        <h3>
          {isEditing 
            ? `Edit Student Profile [ID: ${formData.id}] (విద్యార్థి వివరాలను సవరించు)` 
            : 'Create New Student Profile (కొత్త విద్యార్థి వివరాలు)'}
        </h3>
        
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
            {isEditing ? `Update Student [ID: ${formData.id}]` : 'Save Student Details'}
          </button>
          {isEditing && (
            <button 
              type="button" 
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  id: null,
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0 }}>Registered Students Directory ({filteredRows.length})</h3>
          <div style={{ minWidth: '260px', flex: '0.4' }}>
            <input 
              type="text" 
              placeholder="🔍 Search by ID, name or district..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name <span className="telugu-text">(పేరు)</span></th>
                <th>District <span className="telugu-text">(జిల్లా)</span></th>
                <th>Photo <span className="telugu-text">(ఫోటో)</span></th>
                <th>Phone <span className="telugu-text">(ఫోన్)</span></th>
                <th>Actions <span className="telugu-text">(చర్యలు)</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td><code>{row.id}</code></td>
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
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">No students matched your search criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}