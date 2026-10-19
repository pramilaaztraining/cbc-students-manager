import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './PostGraduationStayScreen.css';

export default function PostGraduationStayScreen({ 
  formData, 
  handleChange, 
  handleSubmit, 
  rows, 
  handleEdit 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateError, setDateError] = useState('');

  const filteredRows = rows.filter(row => 
    row.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (row.district && row.district.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle single range picker updates for start & end
  const handleRangeChange = (dates) => {
    const [start, end] = dates;
    
    // Create synthetic events to match your existing handleChange handler
    if (start) {
      handleChange({ target: { name: 'stayStartDateTime', value: start.toISOString() } });
    }
    if (end) {
      handleChange({ target: { name: 'stayEndDateTime', value: end.toISOString() } });
    }

    if (start && end) {
      if (end < start) {
        setDateError('ముగింపు తేదీ మరియు సమయం ప్రారంభ తేదీ కంటే తక్కువగా ఉండకూడదు (To Date & Time cannot be earlier than From Date & Time).');
      } else {
        setDateError('');
      }
    } else {
      setDateError('');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    if (formData.stayStartDateTime && formData.stayEndDateTime) {
      const start = new Date(formData.stayStartDateTime);
      const end = new Date(formData.stayEndDateTime);

      if (start >= end) {
        setDateError('ప్రారంభ తేదీ మరియు సమయం ముగింపు తేదీ కంటే తక్కువగా ఉండాలి (From Date & Time must be earlier than To Date & Time).');
        return;
      }
    }

    handleSubmit(e);
  };

  const formatDisplayDateTime = (isoString) => {
    if (!isoString) return 'Not Set';
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? 'Not Set' : date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const startDateValue = formData.stayStartDateTime ? new Date(formData.stayStartDateTime) : null;
  const endDateValue = formData.stayEndDateTime ? new Date(formData.stayEndDateTime) : null;

  return (
    <div className="screen-section">
      <div className="section-intro">
        <h2>Section 3: Post-Graduation Campus Stay & Time Window</h2>
        <p className="subtitle">Manage precise arrival/departure schedules and filter campus stay dates.</p>
      </div>

      {/* SEARCH BAR TO FILTER RECORDS */}
      <div className="form-card search-card">
        <h4>🔍 Filter Student Records <span className="telugu-text">(విద్యార్థుల జాబితాను ఫిల్టర్ చేయండి)</span></h4>
        <input 
          type="text" 
          placeholder="Type student name or district..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="search-input"
        />
      </div>

      <form onSubmit={handleFormSubmit} className="form-card">
        <h3>Configure Post-Graduation Stay Window for Student</h3>
        
        {/* STUDENT NAME INPUT */}
        <div className="input-group">
          <label>Student Name <span className="telugu-label">విద్యార్థి పేరు</span></label>
          <input 
            type="text" 
            name="name" 
            placeholder="Enter student name..." 
            value={formData.name || ''} 
            onChange={handleChange} 
            required 
          />
        </div>

        {/* SINGLE CALENDAR CONTROL FOR START & END WITH AM/PM */}
        <div className="stay-window-panel">
          <div className="panel-header-title">
            <span className="panel-title">🗓️ Campus Stay Date & Time Range</span>
            <span className="panel-subtitle">(గ్రాడ్యుయేషన్ వసతి ఏకీకృత క్యాలెండర్ - AM / PM)</span>
          </div>

          {dateError && <div className="error-banner">{dateError}</div>}

          <div className="input-group" style={{ marginTop: '12px' }}>
            <label style={{ fontWeight: '600', color: '#1e293b', display: 'block', marginBottom: '6px' }}>
              Select From & To Date & Time Range <span className="telugu-label">(ప్రారంభ & ముగింపు సమయం)</span>
            </label>
            
            {/* SINGLE UNIFIED DATEPICKER INPUT */}
            <DatePicker
              selectsRange={true}
              startDate={startDateValue}
              endDate={endDateValue}
              onChange={handleRangeChange}
              showTimeSelect
              timeFormat="h:mm aa"
              timeIntervals={15}
              dateFormat="MM/dd/yyyy h:mm aa"
              placeholderText="Click to select stay range window..."
              className="single-range-input"
              required
              wrapperClassName="w-full"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          {/* LIVE SUMMARY BADGE */}
          <div className="range-preview-badge" style={{
            marginTop: '12px',
            padding: '10px 14px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#1e40af',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span><strong>Active Window:</strong> {formatDisplayDateTime(formData.stayStartDateTime)} ➔ {formatDisplayDateTime(formData.stayEndDateTime)}</span>
            <span style={{ fontSize: '11px', background: '#dbeafe', padding: '2px 6px', borderRadius: '4px' }}>12-Hour AM/PM</span>
          </div>

          <div className="input-group full-width" style={{ marginTop: '16px' }}>
            <label>Stay Notes / Instructions <span className="telugu-label">వసతి గమనికలు</span></label>
            <input 
              type="text" 
              name="stayRemarks" 
              placeholder="e.g., Arriving night before, staying until morning worship session" 
              value={formData.stayRemarks || ''} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="save-btn" disabled={Boolean(dateError)}>
            Save Stay Schedule
          </button>
        </div>
      </form>

      {/* SUMMARY TABLE SECTION */}
      <div className="summary-section">
        <h3>Post-Graduation Stay Records Summary</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name <span className="telugu-text">(పేరు)</span></th>
                <th>District <span className="telugu-text">(జిల్లా)</span></th>
                <th>Date Range Start</th>
                <th>Date Range End</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => (
                  <tr key={row.id || row.name}>
                    <td><strong>{row.name}</strong></td>
                    <td>{row.district || 'N/A'}</td>
                    <td>{formatDisplayDateTime(row.stayStartDateTime)}</td>
                    <td>{formatDisplayDateTime(row.stayEndDateTime)}</td>
                    <td>{row.stayRemarks || 'No notes provided'}</td>
                    <td>
                      <button onClick={() => handleEdit(row)} className="edit-btn">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">No matching student records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}