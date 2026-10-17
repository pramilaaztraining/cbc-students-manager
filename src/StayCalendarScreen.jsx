import React from 'react';

export default function StayCalendarScreen({ formData, handleChange, handleSubmit, calendarFilterDate, setCalendarFilterDate, filteredCalendarRows }) {
  return (
    <div className="screen-section">
      <div className="section-intro">
        <h2>Section 3: Post-Graduation Campus Stay & Time Window</h2>
        <p className="subtitle">Manage precise arrival/departure schedules and filter campus stay dates.</p>
      </div>

      <form onSubmit={handleSubmit} className="form-card" style={{ marginBottom: '30px' }}>
        <h3>Configure Post-Graduation Stay Window for Student</h3>
        
        <div className="input-group" style={{ marginBottom: '20px' }}>
          <label>Student Name <span className="telugu-label">విద్యార్థి పేరు</span></label>
          <input type="text" name="name" placeholder="Enter student name..." value={formData.name} onChange={handleChange} required />
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
                value={formData.stayStartDateTime} 
                onChange={handleChange} 
              />
            </div>

            <div className="input-group">
              <label>To Date & Time <span className="telugu-label">ముగింపు తేదీ మరియు సమయం</span></label>
              <input 
                type="datetime-local" 
                name="stayEndDateTime" 
                value={formData.stayEndDateTime} 
                onChange={handleChange} 
              />
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label>Stay Notes / Instructions <span className="telugu-label">వసతి గమనికలు</span></label>
              <input 
                type="text" 
                name="postGradStay" 
                placeholder="e.g., Arriving night before, staying until morning worship session" 
                value={formData.postGradStay} 
                onChange={handleChange} 
              />
            </div>

          </div>
        </div>

        <div className="form-actions" style={{ marginTop: '20px' }}>
          <button type="submit" style={{ padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Save Stay Schedule
          </button>
        </div>
      </form>

      {/* Calendar Control Widget & Filter */}
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
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #94a3b8' }}
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
                <th>Student Name <span className="telugu-text">(పేరు)</span></th>
                <th>District <span className="telugu-text">(జిల్లా)</span></th>
                <th>Phone <span className="telugu-text">(ఫోన్)</span></th>
                <th>Stay Window <span className="telugu-text">(సమయ వ్యవధి)</span></th>
                <th>Stay Notes <span className="telugu-text">(గమనికలు)</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredCalendarRows.length > 0 ? (
                filteredCalendarRows.map(row => (
                  <tr key={`cal-${row.id}`}>
                    <td><strong>{row.name}</strong></td>
                    <td>{row.district || 'N/A'}</td>
                    <td>{row.phone || 'N/A'}</td>
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
                    <td>{row.postGradStay || 'No notes provided'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-data">No students scheduled for campus stay on this date.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}