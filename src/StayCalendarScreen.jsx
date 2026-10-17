import React, { useState, useEffect } from 'react';

export default function StayCalendarScreen({ 
  formData, 
  setFormData, 
  handleChange, 
  handleSubmit, 
  rows, 
  handleEdit, 
  calendarFilterDate, 
  setCalendarFilterDate, 
  filteredCalendarRows 
}) {
  const [dateError, setDateError] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Synchronize dropdown selection when formData.id changes externally
  useEffect(() => {
    if (formData && formData.id) {
      setSelectedStudentId(String(formData.id));
    } else {
      setSelectedStudentId('');
    }
  }, [formData?.id]);

  // Handle family member checkboxes (Mother, Father, Guardian)
  const handleFamilyCheckboxChange = (memberKey) => {
    const currentFamilyStay = formData.familyStay || {};
    setFormData({
      ...formData,
      familyStay: {
        ...currentFamilyStay,
        [memberKey]: !currentFamilyStay[memberKey]
      }
    });
  };

  // Handle family member count inputs (Children, Brothers, Sisters) with min 0 constraint
  const handleFamilyCountChange = (countKey, value) => {
    const num = Number(value);
    const validValue = isNaN(num) ? 0 : Math.max(0, num);
    const currentFamilyStay = formData.familyStay || {};
    
    setFormData({
      ...formData,
      familyStay: {
        ...currentFamilyStay,
        [countKey]: validValue
      }
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.id) {
      alert('Please select a valid student from the dropdown directory first.');
      return;
    }

    if (formData.stayStartDateTime && formData.stayEndDateTime) {
      const start = new Date(formData.stayStartDateTime);
      const end = new Date(formData.stayEndDateTime);

      if (start >= end) {
        setDateError('ప్రారంభ తేదీ మరియు సమయం ముగింపు తేదీ కంటే తక్కువగా ఉండాలి (From Date & Time must be earlier than To Date & Time).');
        return;
      }
    }
    setDateError('');
    handleSubmit(e);
  };

  const familyData = formData.familyStay || {};

  return (
    <div className="screen-section">
      <div className="section-intro">
        <h2>Section 3: Post-Graduation Campus Stay & Time Window</h2>
        <p className="subtitle">Manage precise arrival/departure schedules, accompanying family members, and filter campus stay dates.</p>
      </div>

      <form onSubmit={handleFormSubmit} className="form-card" style={{ marginBottom: '30px' }}>
        <h3>
          Configure Post-Graduation Stay Window & Family Details
          {formData.id && <span style={{ fontSize: '0.85rem', color: '#2563eb', marginLeft: '10px', fontWeight: 'bold' }}>[Target ID: {formData.id}]</span>}
        </h3>
        
        {dateError && <div className="error-banner" style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#b91c1c', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px' }}>{dateError}</div>}

        <div className="input-group" style={{ marginBottom: '20px', position: 'relative' }}>
          <label>Select Student from Directory <span className="telugu-label">జాబితా నుండి విద్యార్థిని ఎంచుకోండి</span></label>
          <select 
            value={selectedStudentId} 
            onChange={(e) => {
              const val = e.target.value;
              setSelectedStudentId(val);

              if (!val) {
                setFormData({ id: null, name: '', district: '', phone: '', photoLink: '', photoUrl: '', stephen: {}, rajshekar: {}, sampath: {}, accommodation: '', postGradStay: '', stayStartDateTime: '', stayEndDateTime: '', familyStay: {} });
                return;
              }

              const found = rows.find(r => String(r.id) === val);
              if (found) {
                setFormData({
                  ...found,
                  stayStartDateTime: found.stayStartDateTime || '',
                  stayEndDateTime: found.stayEndDateTime || '',
                  postGradStay: found.postGradStay || '',
                  familyStay: found.familyStay || {}
                });
              }
            }}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', background: '#fff' }}
          >
            <option value="">-- Choose student from directory --</option>
            {rows.map(row => (
              <option key={row.id} value={row.id}>
                ID: {row.id} - {row.name} {row.district ? `(${row.district})` : ''}
              </option>
            ))}
          </select>
          <small style={{ color: '#64748b', marginTop: '4px' }}>
            💡 Target Student: <strong>{formData.id ? `ID #${formData.id} - ${formData.name}` : 'None selected'}</strong>
          </small>
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
                value={formData.stayStartDateTime || ''} 
                onChange={handleChange} 
              />
            </div>

            <div className="input-group">
              <label>To Date & Time <span className="telugu-label">ముగింపు తేదీ మరియు సమయం</span></label>
              <input 
                type="datetime-local" 
                name="stayEndDateTime" 
                value={formData.stayEndDateTime || ''} 
                onChange={handleChange} 
              />
            </div>

            {/* FAMILY MEMBERS DETAILS SECTION */}
            <div className="input-group" style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Accompanying Family Members Staying <span className="telugu-label">వసతిలో ఉండే కుటుంబ సభ్యులు</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', background: '#fff', padding: '15px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                
                {/* Parents & Guardian Checkboxes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Parents / Guardian / తల్లిదండ్రులు / సంరక్షకులు:</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input 
                      type="checkbox" 
                      checked={!!familyData.mother} 
                      onChange={() => handleFamilyCheckboxChange('mother')}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Mother / తల్లి
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input 
                      type="checkbox" 
                      checked={!!familyData.father} 
                      onChange={() => handleFamilyCheckboxChange('father')}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Father / తండ్రి
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input 
                      type="checkbox" 
                      checked={!!familyData.guardian} 
                      onChange={() => handleFamilyCheckboxChange('guardian')}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Guardian / సంరక్షకులు
                  </label>
                </div>

                {/* Children Count Input (>= 0) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>
                    Children / పిల్లల సంఖ్య:
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    value={familyData.childrenCount ?? 0}
                    onChange={(e) => handleFamilyCountChange('childrenCount', e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Brothers Count Input (>= 0) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>
                    Brothers / తమ్ముళ్ళు / అన్నలు:
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    value={familyData.brothersCount ?? 0}
                    onChange={(e) => handleFamilyCountChange('brothersCount', e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Sisters Count Input (>= 0) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>
                    Sisters / చెల్లెళ్లు / అక్కలు:
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    value={familyData.sistersCount ?? 0}
                    onChange={(e) => handleFamilyCountChange('sistersCount', e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

              </div>
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label>Stay Notes / Instructions <span className="telugu-label">వసతి గమనికలు</span></label>
              <input 
                type="text" 
                name="postGradStay" 
                placeholder="e.g., Staying with parents, guardian, and children until morning session" 
                value={formData.postGradStay || ''} 
                onChange={handleChange} 
              />
            </div>

          </div>
        </div>

        <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button type="submit" style={{ padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            {formData.id ? `Save Stay Schedule [ID: ${formData.id}]` : 'Save Stay Schedule'}
          </button>
          {formData.id && (
            <button 
              type="button" 
              onClick={() => {
                setFormData({ id: null, name: '', district: '', phone: '', photoLink: '', photoUrl: '', stephen: {}, rajshekar: {}, sampath: {}, accommodation: '', postGradStay: '', stayStartDateTime: '', stayEndDateTime: '', familyStay: {} });
                setSelectedStudentId('');
              }}
              style={{ padding: '12px 24px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Clear Selection
            </button>
          )}
        </div>
      </form>

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
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #94a3b8', width: '100%', boxSizing: 'border-box' }}
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
                <th>ID</th>
                <th>Student Name <span className="telugu-text">(పేరు)</span></th>
                <th>District <span className="telugu-text">(జిల్లా)</span></th>
                <th>Stay Window <span className="telugu-text">(సమయ వ్యవధి)</span></th>
                <th>Family Members <span className="telugu-text">(కుటుంబ సభ్యులు)</span></th>
                <th>Stay Notes <span className="telugu-text">(గమనికలు)</span></th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCalendarRows.length > 0 ? (
                filteredCalendarRows.map(row => {
                  const fam = row.familyStay || {};
                  const summaryParts = [];
                  if (fam.mother) summaryParts.push('Mother');
                  if (fam.father) summaryParts.push('Father');
                  if (fam.guardian) summaryParts.push('Guardian');
                  if (fam.childrenCount > 0) summaryParts.push(`Children: ${fam.childrenCount}`);
                  if (fam.brothersCount > 0) summaryParts.push(`Brothers: ${fam.brothersCount}`);
                  if (fam.sistersCount > 0) summaryParts.push(`Sisters: ${fam.sistersCount}`);

                  return (
                    <tr key={`cal-${row.id}`} style={{ background: formData.id === row.id ? '#eff6ff' : 'transparent' }}>
                      <td><code>{row.id}</code></td>
                      <td><strong>{row.name}</strong></td>
                      <td>{row.district || 'N/A'}</td>
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
                      <td>
                        {summaryParts.length > 0 ? (
                          <span style={{ color: '#047857', fontWeight: '500' }}>{summaryParts.join(', ')}</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>None</span>
                        )}
                      </td>
                      <td>{row.postGradStay || 'No notes provided'}</td>
                      <td>
                        <button 
                          type="button" 
                          onClick={() => {
                            handleEdit(row, 'stayCalendar');
                            setSelectedStudentId(String(row.id));
                          }} 
                          className="edit-btn"
                        >
                          {formData.id === row.id ? 'Configuring ID: ' + row.id : 'Configure Stay'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">No students scheduled for campus stay on this date.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}