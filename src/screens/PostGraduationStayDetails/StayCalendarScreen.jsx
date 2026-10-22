import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import StudentSelectDropdown from '../CommonScreenComponents/StudentSelectDropdown';
import { apiFetch } from '../../utils/api';
import './StayCalendarScreen.css';

export default function StayCalendarScreen({ rows, handleEdit }) {
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [allStaysMap, setAllStaysMap] = useState({});
  const [gridSearchTerm, setGridSearchTerm] = useState('');

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

  const handleEvaluateClick = (row) => {
    handleStudentSelect(row.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const calculateRowTotal = (stay) => {
    let parentCount = 0;
    if (stay.family_parents) {
      parentCount = stay.family_parents.split(',').filter(s => s.trim().length > 0).length;
    }
    const children = Number(stay.children_count) || 0;
    const brothers = Number(stay.brothers_count) || 0;
    const sisters = Number(stay.sisters_count) || 0;
    return parentCount + children + brothers + sisters;
  };

  const grandTotalMembers = searchedGridRows.reduce((sum, row) => {
    const stay = allStaysMap[row.id] || {};
    return sum + calculateRowTotal(stay);
  }, 0);

  const exportSectionToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('CBC-BTC Manager - Student Stays Summary', 14, 12);

    const tableColumns = ['ID', 'Student Name', 'Start Time', 'End Time', 'Family / Parents', 'Children', 'Brothers', 'Sisters', 'Total Members', 'Notes'];
    
    const tableRows = searchedGridRows.map(row => {
      const stay = allStaysMap[row.id] || {};
      const rowTotal = calculateRowTotal(stay);
      return [
        row.id,
        `${row.first_name || ''} ${row.last_name || ''}`,
        stay.stay_start_date_time ? new Date(stay.stay_start_date_time).toLocaleString() : 'N/A',
        stay.stay_end_date_time ? new Date(stay.stay_end_date_time).toLocaleString() : 'N/A',
        stay.family_parents || 'N/A',
        stay.children_count ?? 0,
        stay.brothers_count ?? 0,
        stay.sisters_count ?? 0,
        rowTotal,
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
    <div className="screen-section">
      
      <div className="section-intro">
        <h2>Section 3: Post-Grad Stay & Calendar</h2>
        <p className="subtitle">Manage campus stay windows, accompanying family members, and calendar tracking.</p>
      </div>

      <form onSubmit={handleSubmit} className="form-card">
        
        <div className="dropdown-container">
          <StudentSelectDropdown 
            rows={rows} 
            selectedStudentId={selectedStudentId || ''} 
            onStudentChange={handleStudentSelect} 
          />
        </div>

        <div className="target-student-indicator">
          {selectedStudentId && selectedStudentObj ? (
            <span className="target-student-active">
              💡 Target Student: <strong>ID #{selectedStudentObj.id} - {selectedStudentObj.first_name} {selectedStudentObj.last_name}</strong>
            </span>
          ) : (
            <span className="target-student-none">
              💡 Target Student: <strong>None selected (Other sections locked)</strong>
            </span>
          )}
        </div>

        {!selectedStudentId ? (
          <div className="lock-screen-card">
            <h4 className="lock-screen-title">🔓 Stay Configuration Locked</h4>
            <p className="lock-screen-desc">Please select a student above to configure stay window, family details, and unlock editing.</p>
          </div>
        ) : (
          <div className="unlocked-form-content">
            
            <div className="form-sub-card">
              <h3 className="form-sub-title">
                Post-Graduation Campus Stay & Time Window <span className="telugu-subtext">(గ్రాడ్యుయేషన్ వసతి & సమయ నియంత్రణ)</span>
              </h3>

              <div className="grid-2-cols">
                <div>
                  <label className="field-label">From Date & Time <span className="required-star">*</span></label>
                  <input 
                    type="datetime-local"
                    value={stayData.stay_start_date_time}
                    onChange={(e) => handleInputChange('stay_start_date_time', e.target.value)}
                    className="text-input"
                    required
                  />
                </div>

                <div>
                  <label className="field-label">To Date & Time <span className="required-star">*</span></label>
                  <input 
                    type="datetime-local"
                    value={stayData.stay_end_date_time}
                    onChange={(e) => handleInputChange('stay_end_date_time', e.target.value)}
                    className="text-input"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-sub-card">
              <h3 className="form-sub-title">
                Accompanying Family Members Staying <span className="telugu-subtext">(వసతిలో ఉండే కుటుంబ సభ్యులు)</span>
              </h3>

              <div className="grid-4-cols">
                <div>
                  <label className="field-label">Parents / Guardian:</label>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox"
                        checked={stayData.family_parents.includes('Mother / తల్లి')}
                        onChange={(e) => handleParentCheckboxChange('Mother / తల్లి', e.target.checked)}
                      /> Mother / తల్లి
                    </label>

                    <label className="checkbox-label">
                      <input 
                        type="checkbox"
                        checked={stayData.family_parents.includes('Father / తండ్రి')}
                        onChange={(e) => handleParentCheckboxChange('Father / తండ్రి', e.target.checked)}
                      /> Father / తండ్రి
                    </label>

                    <label className="checkbox-label">
                      <input 
                        type="checkbox"
                        checked={stayData.family_parents.includes('Guardian / సంరక్షకులు')}
                        onChange={(e) => handleParentCheckboxChange('Guardian / సంరక్షకులు', e.target.checked)}
                      /> Guardian / సంరక్షకులు
                    </label>
                  </div>
                </div>

                <div>
                  <label className="field-label">Children:</label>
                  <input 
                    type="number"
                    min="0"
                    value={stayData.children_count}
                    onChange={(e) => handleInputChange('children_count', Number(e.target.value))}
                    className="text-input"
                  />
                </div>

                <div>
                  <label className="field-label">Brothers:</label>
                  <input 
                    type="number"
                    min="0"
                    value={stayData.brothers_count}
                    onChange={(e) => handleInputChange('brothers_count', Number(e.target.value))}
                    className="text-input"
                  />
                </div>

                <div>
                  <label className="field-label">Sisters:</label>
                  <input 
                    type="number"
                    min="0"
                    value={stayData.sisters_count}
                    onChange={(e) => handleInputChange('sisters_count', Number(e.target.value))}
                    className="text-input"
                  />
                </div>
              </div>
            </div>

            <div className="form-sub-card">
              <label className="field-label">Stay Notes & Special Requirements</label>
              <textarea 
                rows="3"
                value={stayData.stay_notes}
                onChange={(e) => handleInputChange('stay_notes', e.target.value)}
                placeholder="Enter any specific room preferences or notes..."
                className="textarea-input"
              />
            </div>

            <div>
              <button type="submit" className="save-btn">
                Save Stay Details [ID: {selectedStudentId}]
              </button>
            </div>

          </div>
        )}

      </form>

      {/* Summary Table Grid */}
      <div className="summary-container">
        <div className="summary-header-row">
          <h3 className="summary-title">Student Stays Summary</h3>
          
          <div className="summary-controls">
            <input 
              type="text"
              placeholder="Search by name, district, ID..."
              value={gridSearchTerm}
              onChange={(e) => setGridSearchTerm(e.target.value)}
              className="grid-search-input"
            />

            <span className="records-badge">Records: {searchedGridRows.length}</span>

            <button type="button" onClick={exportSectionToPDF} className="pdf-btn">
              📥 Download PDF
            </button>
          </div>
        </div>

        <div className="table-container-card">
          <div className="table-scroll-wrapper">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student Name</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Family / Parents</th>
                  <th>Children</th>
                  <th>Siblings (B/S)</th>
                  <th>Total Members</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {searchedGridRows.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="no-data-cell">
                      No student records found matching your search.
                    </td>
                  </tr>
                ) : (
                  searchedGridRows.map(row => {
                    const stay = allStaysMap[row.id] || {};
                    const rowTotal = calculateRowTotal(stay);
                    return (
                      <tr key={row.id}>
                        <td>#{row.id}</td>
                        <td className="student-name-cell">{row.first_name} {row.last_name}</td>
                        <td>{stay.stay_start_date_time ? new Date(stay.stay_start_date_time).toLocaleString() : 'N/A'}</td>
                        <td>{stay.stay_end_date_time ? new Date(stay.stay_end_date_time).toLocaleString() : 'N/A'}</td>
                        <td>{stay.family_parents || 'N/A'}</td>
                        <td>{stay.children_count ?? 0}</td>
                        <td>B: {stay.brothers_count ?? 0} / S: {stay.sisters_count ?? 0}</td>
                        <td><span className="total-badge">{rowTotal}</span></td>
                        <td className="notes-cell" title={stay.stay_notes}>
                          {stay.stay_notes || 'N/A'}
                        </td>
                        <td className="action-cell">
                          <button type="button" onClick={() => handleEvaluateClick(row)} className="evaluate-btn">
                            Evaluate
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {searchedGridRows.length > 0 && (
                <tfoot>
                  <tr className="table-footer-row">
                    <td colSpan="7">👥 Grand Total Accompanying Members:</td>
                    <td colSpan="3" className="table-footer-total">
                      <span className="grand-total-pill">
                        ✨ {grandTotalMembers} Members
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}