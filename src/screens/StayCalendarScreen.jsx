import React, { useState } from 'react';
import StudentSelectDropdown from './StudentSelectDropdown';
import './StayCalendarScreen.css';

export default function StayCalendarScreen({ 
  rows, 
  handleEdit,
  calendarFilterDate,
  setCalendarFilterDate,
  filteredCalendarRows,
  refreshStudents 
}) {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [currentStudent, setCurrentStudent] = useState(null);
  const [stayData, setStayData] = useState({
    stayStartDateTime: '',
    stayEndDateTime: '',
    mother: false,
    father: false,
    guardian: false,
    childrenCount: 0,
    brothersCount: 0,
    sistersCount: 0,
    stayNotes: ''
  });

  const handleStudentSelect = async (val) => {
    setSelectedStudentId(val);
    
    if (!val) {
      setCurrentStudent(null);
      setStayData({ 
        stayStartDateTime: '', stayEndDateTime: '', 
        mother: false, father: false, guardian: false, 
        childrenCount: 0, brothersCount: 0, sistersCount: 0, stayNotes: '' 
      });
      return;
    }

    const found = rows.find(r => String(r.id) === val);
    if (found) {
      setCurrentStudent(found);
      const details = found.stay_details || {};
      setStayData({
        stayStartDateTime: found.stay_start_date_time ? new Date(found.stay_start_date_time).toISOString().slice(0, 16) : '',
        stayEndDateTime: found.stay_end_date_time ? new Date(found.stay_end_date_time).toISOString().slice(0, 16) : '',
        mother: details.mother ?? false,
        father: details.father ?? false,
        guardian: details.guardian ?? false,
        childrenCount: details.childrenCount ?? 0,
        brothersCount: details.brothersCount ?? 0,
        sistersCount: details.sistersCount ?? 0,
        stayNotes: details.stayNotes || ''
      });
    }
  };

  const handleStayChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setStayData(prev => {
      const updated = { 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      };

      if (name === 'stayStartDateTime' && !value) {
        updated.stayEndDateTime = ''; 
      }

      return updated;
    });
  };

  const isToDateInvalid = stayData.stayStartDateTime && 
                          stayData.stayEndDateTime && 
                          stayData.stayEndDateTime < stayData.stayStartDateTime;

  const isDatesValid = stayData.stayStartDateTime && 
                       stayData.stayEndDateTime && 
                       !isToDateInvalid;

  const handleStaySubmit = async (e) => {
    e.preventDefault();
    if (!currentStudent || !currentStudent.id) {
      alert('Please select a student first.');
      return;
    }

    if (!isDatesValid) {
      alert('Please correct the date range before updating.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/stays/${currentStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stayData)
      });

      if (!response.ok) throw new Error('Failed to save stay details');

      alert('Stay window and family members updated successfully!');
      
      // 🔄 Instantly re-fetches latest database records so grid updates immediately
      if (refreshStudents) {
        await refreshStudents();
      }

      setSelectedStudentId('');
      setCurrentStudent(null);
      setStayData({ 
        stayStartDateTime: '', stayEndDateTime: '', 
        mother: false, father: false, guardian: false, 
        childrenCount: 0, brothersCount: 0, sistersCount: 0, stayNotes: '' 
      });
    } catch (err) {
      console.error('Error saving stay records:', err);
      alert('Error saving stay record.');
    }
  };

  const studentFullName = currentStudent ? `${currentStudent.first_name || ''} ${currentStudent.last_name || ''}`.trim() : '';

  const formatFamilySummary = (stayDetails) => {
    if (!stayDetails || typeof stayDetails !== 'object') return 'None';
    const parents = [];
    if (stayDetails.mother) parents.push('Mother');
    if (stayDetails.father) parents.push('Father');
    if (stayDetails.guardian) parents.push('Guardian');

    const parts = [];
    if (parents.length > 0) parts.push(`Parents: ${parents.join(', ')}`);
    if (Number(stayDetails.childrenCount) > 0) parts.push(`Children: ${stayDetails.childrenCount}`);
    if (Number(stayDetails.brothersCount) > 0) parts.push(`Brothers: ${stayDetails.brothersCount}`);
    if (Number(stayDetails.sistersCount) > 0) parts.push(`Sisters: ${stayDetails.sistersCount}`);

    return parts.length > 0 ? parts.join(' | ') : 'None';
  };

  return (
    <div className="screen-section">
      <div className="section-intro">
        <h2>Section 3: Post-Grad Stay & Calendar</h2>
        <p className="subtitle">Manage campus stay windows, accompanying family members, and calendar tracking.</p>
      </div>

      <form onSubmit={handleStaySubmit} className="form-card">
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: '600', fontSize: '0.9rem', marginBottom: '5px', color: '#1e293b' }}>
            Select Student from Directory <span style={{ fontSize: '0.8rem', color: '#64748b' }}>జాబితా నుండి విద్యార్థిని ఎన్నుకోండి</span>
          </label>
          <StudentSelectDropdown 
            rows={rows} 
            selectedStudentId={selectedStudentId} 
            onStudentChange={handleStudentSelect} 
          />
        </div>

        <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '20px' }}>
          💡 Target Student: <strong style={{ color: currentStudent ? '#2563eb' : '#64748b' }}>
            {currentStudent ? `ID #${currentStudent.id} - ${studentFullName}` : 'None selected (Other sections locked)'}
          </strong>
        </div>

        {!currentStudent ? (
          <div style={{ padding: '30px', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center', color: '#64748b' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#334155' }}>🔒 Stay Configuration Locked</h4>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Please select a student above to configure stay window, family details, and unlock editing.</p>
          </div>
        ) : (
          <>
            <div className="stay-window-container" style={{ marginTop: '20px', padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>
                Post-Graduation Campus Stay & Time Window <span style={{ fontSize: '0.85rem', color: '#64748b' }}>(గ్రాడ్యుయేషన్ వసతి & సమయ నియంత్రణ)</span>
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', fontSize: '0.9rem', marginBottom: '6px', color: '#334155' }}>
                    From Date & Time <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input 
                    type="datetime-local" 
                    name="stayStartDateTime" 
                    value={stayData.stayStartDateTime || ''} 
                    onChange={handleStayChange} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} 
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: '500', fontSize: '0.9rem', marginBottom: '6px', color: '#334155' }}>
                    To Date & Time <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input 
                    type="datetime-local" 
                    name="stayEndDateTime" 
                    value={stayData.stayEndDateTime || ''} 
                    disabled={!stayData.stayStartDateTime}
                    min={stayData.stayStartDateTime || ''}
                    onChange={handleStayChange} 
                    style={{ 
                      width: '100%', 
                      padding: '10px', 
                      borderRadius: '6px', 
                      border: isToDateInvalid ? '2px solid #dc2626' : '1px solid #cbd5e1', 
                      boxSizing: 'border-box',
                      backgroundColor: !stayData.stayStartDateTime ? '#f1f5f9' : isToDateInvalid ? '#fef2f2' : '#fff',
                      cursor: !stayData.stayStartDateTime ? 'not-allowed' : 'pointer'
                    }} 
                  />

                  {isToDateInvalid && (
                    <div style={{ 
                      marginTop: '6px', 
                      padding: '8px 12px', 
                      background: '#fef2f2', 
                      border: '1px solid #fecaca', 
                      borderRadius: '6px', 
                      color: '#dc2626', 
                      fontSize: '0.82rem', 
                      fontWeight: '500' 
                    }}>
                      ⚠️ To Date & Time cannot be earlier than From Date & Time.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>
                Accompanying Family Members Staying <span style={{ fontSize: '0.85rem', color: '#64748b' }}>(వసతిలో ఉండే కుటుంబ సభ్యులు)</span>
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', alignItems: 'start' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '10px', color: '#334155' }}>Parents / Guardian:</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <input type="checkbox" name="mother" checked={stayData.mother} onChange={handleStayChange} /> Mother / తల్లి
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <input type="checkbox" name="father" checked={stayData.father} onChange={handleStayChange} /> Father / తండ్రి
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <input type="checkbox" name="guardian" checked={stayData.guardian} onChange={handleStayChange} /> Guardian / సంరక్షకులు
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>Children:</label>
                  <input type="number" name="childrenCount" min="0" value={stayData.childrenCount ?? 0} onChange={handleStayChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>Brothers:</label>
                  <input type="number" name="brothersCount" min="0" value={stayData.brothersCount ?? 0} onChange={handleStayChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>Sisters:</label>
                  <input type="number" name="sistersCount" min="0" value={stayData.sistersCount ?? 0} onChange={handleStayChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontWeight: '500', fontSize: '0.9rem', marginBottom: '6px', color: '#1e293b' }}>Stay Notes & Special Requirements</label>
              <textarea name="stayNotes" rows="3" value={stayData.stayNotes || ''} onChange={handleStayChange} placeholder="Enter any specific room preferences or notes..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}></textarea>
            </div>

            <button 
              type="submit" 
              disabled={!isDatesValid}
              className="save-btn" 
              style={{ 
                marginTop: '20px', 
                backgroundColor: !isDatesValid ? '#94a3b8' : '#2563eb', 
                cursor: !isDatesValid ? 'not-allowed' : 'pointer',
                opacity: !isDatesValid ? 0.7 : 1
              }}
            >
              Update Stay Window & Members [ID: {currentStudent.id}]
            </button>
          </>
        )}
      </form>

      {/* Summary Table */}
      <div style={{ marginTop: '40px' }}>
        <h3 style={{ margin: '0 0 15px 0' }}>📅 Campus Stay Calendar Control</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr style={{ background: '#2563eb', color: '#fff' }}>
                <th style={{ padding: '10px' }}>ID</th>
                <th style={{ padding: '10px' }}>Student Name</th>
                <th style={{ padding: '10px' }}>District</th>
                <th style={{ padding: '10px' }}>Stay Window</th>
                <th style={{ padding: '10px' }}>Family Members</th>
                <th style={{ padding: '10px' }}>Stay Notes</th>
                <th style={{ padding: '10px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCalendarRows && filteredCalendarRows.length > 0 ? (
                filteredCalendarRows.map(row => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px' }}><code>{row.id}</code></td>
                    <td style={{ padding: '10px' }}><strong>{row.first_name} {row.last_name}</strong></td>
                    <td style={{ padding: '10px' }}>{row.district || 'N/A'}</td>
                    <td style={{ padding: '10px', fontSize: '0.85rem' }}>
                      {row.stay_start_date_time && row.stay_end_date_time ? (
                        `${new Date(row.stay_start_date_time).toLocaleString()} to ${new Date(row.stay_end_date_time).toLocaleString()}`
                      ) : (
                        <span style={{ color: '#d97706', fontWeight: '500' }}>Window not set</span>
                      )}
                    </td>
                    <td style={{ padding: '10px', fontSize: '0.85rem' }}>
                      {formatFamilySummary(row.stay_details)}
                    </td>
                    <td style={{ padding: '10px', fontSize: '0.85rem', color: '#64748b' }}>
                      {row.stay_details?.stayNotes || 'No notes'}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <button 
                        type="button"
                        onClick={() => {
                          handleEdit(row, 'stayCalendar');
                          handleStudentSelect(String(row.id));
                        }} 
                        style={{ padding: '6px 12px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Configure Stay
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No stay records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}