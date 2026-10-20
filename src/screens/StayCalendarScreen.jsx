import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  const [gridSearchTerm, setGridSearchTerm] = useState(''); // 🔍 Search state for the grid
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
    if (!stayDetails || typeof stayDetails !== 'object') return <span style={{ color: '#94a3b8' }}>None</span>;
    const parents = [];
    if (stayDetails.mother) parents.push('Mother');
    if (stayDetails.father) parents.push('Father');
    if (stayDetails.guardian) parents.push('Guardian');

    const parts = [];
    if (parents.length > 0) parts.push(`Parents: ${parents.join(', ')}`);
    if (Number(stayDetails.childrenCount) > 0) parts.push(`Children: ${stayDetails.childrenCount}`);
    if (Number(stayDetails.brothersCount) > 0) parts.push(`Brothers: ${stayDetails.brothersCount}`);
    if (Number(stayDetails.sistersCount) > 0) parts.push(`Sisters: ${stayDetails.sistersCount}`);

    return parts.length > 0 ? (
      <span style={{ color: '#334155', fontWeight: 500 }}>{parts.join(' | ')}</span>
    ) : (
      <span style={{ color: '#94a3b8' }}>None</span>
    );
  };

  const formatFamilySummaryForPDF = (stayDetails) => {
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

  // 🔍 Filter rows based on search input
  const searchedGridRows = (filteredCalendarRows || []).filter(row => {
    const query = gridSearchTerm.toLowerCase();
    const fullName = `${row.first_name || ''} ${row.last_name || ''}`.toLowerCase();
    const district = (row.district || '').toLowerCase();
    const notes = (row.stay_details?.stayNotes || '').toLowerCase();
    const idStr = String(row.id || '');

    return fullName.includes(query) || district.includes(query) || notes.includes(query) || idStr.includes(query);
  });

  // 📥 PDF Export Handler
  const exportSectionToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('CBC-BTC Manager - Campus Stay & Calendar Records', 14, 12);

    const tableColumns = ['ID', 'Student Name', 'District', 'Stay Window', 'Family Members', 'Stay Notes'];
    const tableRows = searchedGridRows.map(row => [
      row.id,
      `${row.first_name || ''} ${row.last_name || ''}`,
      row.district || 'N/A',
      row.stay_start_date_time && row.stay_end_date_time 
        ? `From: ${new Date(row.stay_start_date_time).toLocaleString()}\nTo: ${new Date(row.stay_end_date_time).toLocaleString()}` 
        : 'Window not set',
      formatFamilySummaryForPDF(row.stay_details),
      row.stay_details?.stayNotes || 'No notes'
    ]);

    autoTable(doc, { 
      head: [tableColumns], 
      body: tableRows, 
      startY: 18, 
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [37, 99, 235] }
    });
    doc.save('Campus_Stay_Records.pdf');
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

      {/* Summary Table with Search & PDF Export */}
      <div style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>📅 Campus Stay Calendar Control</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* 🔍 Search Input */}
            <input 
              type="text"
              placeholder="Search by name, district, ID..."
              value={gridSearchTerm}
              onChange={(e) => setGridSearchTerm(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                width: '220px',
                outline: 'none'
              }}
            />

            <span style={{ fontSize: '0.85rem', color: '#64748b', background: '#f1f5f9', padding: '6px 12px', borderRadius: '20px', fontWeight: 500 }}>
              Records: {searchedGridRows.length}
            </span>

            {/* 📥 Download PDF Button */}
            <button 
              type="button"
              onClick={exportSectionToPDF}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
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
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#1e293b' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '0.03em' }}>ID</th>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '0.03em' }}>Student Name</th>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '0.03em' }}>District</th>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '0.03em' }}>Stay Window</th>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '0.03em' }}>Family Members</th>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '0.03em' }}>Stay Notes</th>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '0.03em', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {searchedGridRows && searchedGridRows.length > 0 ? (
                  searchedGridRows.map((row, idx) => (
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
                      <td style={{ padding: '16px', color: '#64748b', fontWeight: 600 }}>
                        <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>#{row.id}</span>
                      </td>
                      <td style={{ padding: '16px', color: '#0f172a', fontWeight: 600, wordBreak: 'break-word', maxWidth: '200px' }}>
                        {row.first_name} {row.last_name}
                      </td>
                      <td style={{ padding: '16px', color: '#475569', textTransform: 'capitalize' }}>
                        {row.district || 'N/A'}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.85rem', color: '#334155', minWidth: '220px' }}>
                        {row.stay_start_date_time && row.stay_end_date_time ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ color: '#047857', fontWeight: 500 }}>🟢 From: {new Date(row.stay_start_date_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                            <span style={{ color: '#b91c1c', fontWeight: 500 }}>🔴 To: {new Date(row.stay_end_date_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                        ) : (
                          <span style={{ background: '#fffbeb', color: '#d97706', padding: '4px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, border: '1px solid #fde68a' }}>
                            ⏳ Window not set
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.85rem', color: '#475569', maxWidth: '250px' }}>
                        {formatFamilySummary(row.stay_details)}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.85rem', color: '#64748b', maxWidth: '180px', wordBreak: 'break-word' }}>
                        {row.stay_details?.stayNotes ? (
                          <span style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'inline-block' }}>
                            {row.stay_details.stayNotes}
                          </span>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>No notes</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <button 
                          type="button"
                          onClick={() => {
                            handleEdit(row, 'stayCalendar');
                            handleStudentSelect(String(row.id));
                          }} 
                          style={{ 
                            padding: '8px 14px', 
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: '6px', 
                            cursor: 'pointer', 
                            fontWeight: '600',
                            fontSize: '0.82rem',
                            boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          Configure Stay
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontStyle: 'italic' }}>
                      No matching stay records found.
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