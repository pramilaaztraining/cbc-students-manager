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
    (row.first_name && row.first_name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (row.last_name && row.last_name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (row.district && row.district.toLowerCase().includes(searchTerm.toLowerCase())) ||
    String(row.id).includes(searchTerm)
  );

  const handleRangeChange = (dates) => {
    const [start, end] = dates;
    
    if (start) {
      handleChange({ target: { name: 'stayStartDateTime', value: start.toISOString() } });
    }
    if (end) {
      handleChange({ target: { name: 'stayEndDateTime', value: end.toISOString() } });
    }

    if (start && end && end < start) {
      setDateError('To Date & Time cannot be earlier than From Date & Time.');
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
        setDateError('From Date & Time must be earlier than To Date & Time.');
        return;
      }
    }
    handleSubmit(e);
  };

  const formatDisplayDateTime = (isoString) => {
    if (!isoString) return 'Not Set';
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? 'Not Set' : date.toLocaleString([], { 
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true 
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

      <div className="form-card search-card">
        <h4>🔍 Filter Student Records</h4>
        <input 
          type="text" 
          placeholder="Type student name or ID..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="search-input"
        />
      </div>

      <form onSubmit={handleFormSubmit} className="form-card">
        <h3>Configure Stay Window for Student [ID: {formData.id || 'New'}]</h3>
        
        <div className="input-group">
          <label>Student Name</label>
          <input 
            type="text" 
            value={`${formData.first_name || ''} ${formData.last_name || ''}`.trim()} 
            disabled 
            style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
          />
        </div>

        <div className="stay-window-panel">
          <div className="panel-header-title">
            <span className="panel-title">🗓️ Campus Stay Date & Time Range</span>
          </div>

          {dateError && <div className="error-banner">{dateError}</div>}

          <div className="input-group" style={{ marginTop: '12px' }}>
            <label style={{ fontWeight: '600', color: '#1e293b', display: 'block', marginBottom: '6px' }}>
              Select From & To Date & Time Range
            </label>
            
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
            />
          </div>

          <div className="input-group full-width" style={{ marginTop: '16px' }}>
            <label>Accommodation Details / Remarks</label>
            <input 
              type="text" 
              name="accommodation" 
              placeholder="e.g., Room 102, Main Hostel" 
              value={formData.accommodation || ''} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: '20px' }}>
          <button type="submit" className="save-btn" disabled={Boolean(dateError)}>
            Save Stay Schedule
          </button>
        </div>
      </form>

      <div className="summary-section" style={{ marginTop: '40px' }}>
        <h3>Post-Graduation Stay Records Summary</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>District</th>
                <th>Start Date & Time</th>
                <th>End Date & Time</th>
                <th>Accommodation</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td><code>{row.id}</code></td>
                    <td><strong>{row.first_name} {row.last_name}</strong></td>
                    <td>{row.district || 'N/A'}</td>
                    <td>{formatDisplayDateTime(row.stay_start_date_time)}</td>
                    <td>{formatDisplayDateTime(row.stay_end_date_time)}</td>
                    <td>{row.accommodation || 'N/A'}</td>
                    <td>
                      <button onClick={() => handleEdit(row, 'stayCalendar')} className="edit-btn">
                        Edit Stay
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">No matching student records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}