import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import StudentSelectDropdown from '../CommonScreenComponents/StudentSelectDropdown';
import { apiFetch } from '../../utils/api';

export default function StayCalendarScreen({ rows, handleEdit }) {
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [allStaysMap, setAllStaysMap] = useState({});
  const [gridSearchTerm, setGridSearchTerm] = useState('');

  // Form state without accommodation and post_grad_stay
  const [stayData, setStayData] = useState({
    stay_start_date_time: '',
    stay_end_date_time: '',
    family_parents: [],
    children_count: 0,
    brothers_count: 0,
    sisters_count: 0,
    stay_notes: ''
  });

  useEffect(() => {
    if (rows && rows.length > 0) {
      rows.forEach(async (row) => {
        try {
          const res = await apiFetch(`/api/student-stays/${row.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data) {
              setAllStaysMap(prev => ({ ...prev, [row.id]: data }));
            }
          }
        } catch (err) {
          console.error(`Error fetching stays for student ID ${row.id}:`, err);
        }
      });
    }
  }, [rows]);

  const handleStudentSelect = async (studentId) => {
    if (!studentId) {
      setSelectedStudentId(null);
      setStayData({
        stay_start_date_time: '',
        stay_end_date_time: '',
        family_parents: [],
        children_count: 0,
        brothers_count: 0,
        sisters_count: 0,
        stay_notes: ''
      });
      return;
    }
    
    setSelectedStudentId(studentId);

    try {
      const res = await apiFetch(`/api/student-stays/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          let parentsArr = [];
          if (data.family_parents) {
            parentsArr = data.family_parents.split(',').map(s => s.trim());
          }

          setStayData({
            stay_start_date_time: data.stay_start_date_time ? data.stay_start_date_time.slice(0, 16) : '',
            stay_end_date_time: data.stay_end_date_time ? data.stay_end_date_time.slice(0, 16) : '',
            family_parents: parentsArr,
            children_count: data.children_count || 0,
            brothers_count: data.brothers_count || 0,
            sisters_count: data.sisters_count || 0,
            stay_notes: data.stay_notes || ''
          });
        } else {
          setStayData({
            stay_start_date_time: '',
            stay_end_date_time: '',
            family_parents: [],
            children_count: 0,
            brothers_count: 0,
            sisters_count: 0,
            stay_notes: ''
          });
        }
      }
    } catch (err) {
      console.error('Error fetching student stay details:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setStayData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleParentCheckboxChange = (parentValue, checked) => {
    setStayData(prev => {
      let currentParents = [...prev.family_parents];
      if (checked) {
        if (!currentParents.includes(parentValue)) currentParents.push(parentValue);
      } else {
        currentParents = currentParents.filter(p => p !== parentValue);
      }
      return { ...prev, family_parents: currentParents };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    const payload = {
      ...stayData,
      family_parents: stayData.family_parents.join(', ')
    };

    try {
      const res = await apiFetch(`/api/student-stays/${selectedStudentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Stay details saved successfully!');
        const refreshedRes = await apiFetch(`/api/student-stays/${selectedStudentId}`);
        if (refreshedRes.ok) {
          const freshData = await refreshedRes.json();
          setAllStaysMap(prev => ({ ...prev, [selectedStudentId]: freshData }));
        }
      } else {
        alert('Failed to save stay details.');
      }
    } catch (err) {
      console.error('Error saving student stays:', err);
    }
  };

  const selectedStudentObj = (rows || []).find(r => String(r.id) === String(selectedStudentId));

  const searchedGridRows = (rows || []).filter(row => {
    const query = gridSearchTerm.toLowerCase();
    const fullName = `${row.first_name || ''} ${row.last_name || ''}`.toLowerCase();
    const district = (row.district || '').toLowerCase();
    return fullName.includes(query) || district.includes(query) || String(row.id).includes(query);
  });

  const exportSectionToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('CBC-BTC Manager - Student Stays Summary', 14, 12);

    const tableColumns = ['ID', 'Student Name', 'Start Time', 'End Time', 'Family / Parents', 'Children', 'Brothers', 'Sisters', 'Notes'];
    
    const tableRows = searchedGridRows.map(row => {
      const stay = allStaysMap[row.id] || {};
      return [
        row.id,
        `${row.first_name || ''} ${row.last_name || ''}`,
        stay.stay_start_date_time ? new Date(stay.stay_start_date_time).toLocaleString() : 'N/A',
        stay.stay_end_date_time ? new Date(stay.stay_end_date_time).toLocaleString() : 'N/A',
        stay.family_parents || 'N/A',
        stay.children_count ?? 0,
        stay.brothers_count ?? 0,
        stay.sisters_count ?? 0,
        stay.stay_notes || 'N/A'
      ];
    });

    autoTable(doc, { 
      head: [tableColumns], 
      body: tableRows, 
      startY: 18, 
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 4 },
      headStyles: { fillColor: [37, 99, 235] }
    });
    
    doc.save('Student_Stays_Summary.pdf');
  };

  return (
    <div className="screen-section" style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', fontWeight: '600', color: '#1e293b', fontSize: '0.95rem', marginBottom: '6px' }}>
          Select Student from Directory జాబితా నుండి విద్యార్థిని ఎంచుకోండి
        </label>
        <StudentSelectDropdown 
          rows={rows} 
          selectedStudentId={selectedStudentId || ''} 
          onStudentChange={handleStudentSelect} 
        />
      </div>

      {selectedStudentId && selectedStudentObj && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', color: '#2563eb', fontWeight: '500', fontSize: '0.9rem' }}>
          <span>💡 Target Student:</span> 
          <strong>ID #{selectedStudentObj.id} - {selectedStudentObj.first_name} {selectedStudentObj.last_name}</strong>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Stay & Time Window Card */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>
            Campus Stay & Time Window <span style={{ color: '#64748b', fontWeight: 'normal' }}>(వసతి & సమయ నియంత్రణ)</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '6px', color: '#1e293b' }}>
                From Date & Time <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input 
                type="datetime-local"
                value={stayData.stay_start_date_time}
                onChange={(e) => handleInputChange('stay_start_date_time', e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '6px', color: '#1e293b' }}>
                To Date & Time <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input 
                type="datetime-local"
                value={stayData.stay_end_date_time}
                onChange={(e) => handleInputChange('stay_end_date_time', e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                required
              />
            </div>
          </div>
        </div>

        {/* Accompanying Family Members Staying Card */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>
            Accompanying Family Members Staying <span style={{ color: '#64748b', fontWeight: 'normal' }}>(వసతిలో ఉండే కుటుంబ సభ్యులు)</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', alignItems: 'start' }}>
            
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '10px', color: '#1e293b' }}>
                Parents / Guardian:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={stayData.family_parents.includes('Mother / తల్లి')}
                    onChange={(e) => handleParentCheckboxChange('Mother / తల్లి', e.target.checked)}
                  /> Mother / తల్లి
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={stayData.family_parents.includes('Father / తండ్రి')}
                    onChange={(e) => handleParentCheckboxChange('Father / తండ్రి', e.target.checked)}
                  /> Father / తండ్రి
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={stayData.family_parents.includes('Guardian / సంరక్షకులు')}
                    onChange={(e) => handleParentCheckboxChange('Guardian / సంరక్షకులు', e.target.checked)}
                  /> Guardian / సంరక్షకులు
                </label>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '10px', color: '#1e293b' }}>
                Children:
              </label>
              <input 
                type="number"
                min="0"
                value={stayData.children_count}
                onChange={(e) => handleInputChange('children_count', Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '10px', color: '#1e293b' }}>
                Brothers:
              </label>
              <input 
                type="number"
                min="0"
                value={stayData.brothers_count}
                onChange={(e) => handleInputChange('brothers_count', Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '10px', color: '#1e293b' }}>
                Sisters:
              </label>
              <input 
                type="number"
                min="0"
                value={stayData.sisters_count}
                onChange={(e) => handleInputChange('sisters_count', Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>

          </div>
        </div>

        {/* Stay Notes */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <label style={{ display: 'block', fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px', color: '#1e293b' }}>
            Stay Notes & Special Requirements
          </label>
          <textarea 
            rows="3"
            value={stayData.stay_notes}
            onChange={(e) => handleInputChange('stay_notes', e.target.value)}
            placeholder="Enter any specific room preferences or notes..."
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
          />
        </div>

        <div>
          <button 
            type="submit" 
            disabled={!selectedStudentId}
            style={{ 
              backgroundColor: selectedStudentId ? '#2563eb' : '#94a3b8', 
              padding: '12px 24px', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '6px', 
              fontWeight: 'bold', 
              cursor: selectedStudentId ? 'pointer' : 'not-allowed',
              fontSize: '0.95rem'
            }}
          >
            {selectedStudentId ? `Save Stay Details [ID: ${selectedStudentId}]` : 'Select a Student to Enable Saving'}
          </button>
        </div>

      </form>

      {/* Summary Table Grid */}
      <div style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>Student Stays Summary</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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
                width: '240px',
                outline: 'none'
              }}
            />

            <span style={{ fontSize: '0.85rem', color: '#64748b', background: '#f1f5f9', padding: '6px 12px', borderRadius: '20px', fontWeight: 500 }}>
              Records: {searchedGridRows.length}
            </span>

            <button 
              type="button"
              onClick={exportSectionToPDF}
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

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '14px' }}>ID</th>
                  <th style={{ padding: '14px' }}>Student Name</th>
                  <th style={{ padding: '14px' }}>Start Time</th>
                  <th style={{ padding: '14px' }}>End Time</th>
                  <th style={{ padding: '14px' }}>Family / Parents</th>
                  <th style={{ padding: '14px' }}>Children</th>
                  <th style={{ padding: '14px' }}>Siblings (B/S)</th>
                  <th style={{ padding: '14px' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {searchedGridRows.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                      No student records found matching your search.
                    </td>
                  </tr>
                ) : (
                  searchedGridRows.map(row => {
                    const stay = allStaysMap[row.id] || {};
                    return (
                      <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px', verticalAlign: 'top' }}>#{row.id}</td>
                        <td style={{ padding: '16px', verticalAlign: 'top', fontWeight: '600' }}>{row.first_name} {row.last_name}</td>
                        <td style={{ padding: '16px', verticalAlign: 'top' }}>{stay.stay_start_date_time ? new Date(stay.stay_start_date_time).toLocaleString() : 'N/A'}</td>
                        <td style={{ padding: '16px', verticalAlign: 'top' }}>{stay.stay_end_date_time ? new Date(stay.stay_end_date_time).toLocaleString() : 'N/A'}</td>
                        <td style={{ padding: '16px', verticalAlign: 'top' }}>{stay.family_parents || 'N/A'}</td>
                        <td style={{ padding: '16px', verticalAlign: 'top' }}>{stay.children_count ?? 0}</td>
                        <td style={{ padding: '16px', verticalAlign: 'top' }}>B: {stay.brothers_count ?? 0} / S: {stay.sisters_count ?? 0}</td>
                        <td style={{ padding: '16px', verticalAlign: 'top', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={stay.stay_notes}>
                          {stay.stay_notes || 'N/A'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}