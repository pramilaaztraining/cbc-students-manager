import React from 'react';

export default function AcademicEvaluationsScreen({ formData, handleChange, handleSubmit, renderSectionColumns, rows, stephenKeys, rajkeys, sampathKeys }) {
  return (
    <div className="screen-section">
      <div className="section-intro">
        <h2>Section 2: Academic Evaluations</h2>
        <p className="subtitle">Evaluate student subjects, exams, attendance notes, and video submissions for all professors.</p>
      </div>

      <form onSubmit={handleSubmit} className="form-card">
        <h3>Update Academic Evaluations for Student</h3>
        
        <div className="input-group" style={{ marginBottom: '20px' }}>
          <label>Student Name <span className="telugu-label">విద్యార్థి పేరు</span></label>
          <input type="text" name="name" placeholder="Enter student name..." value={formData.name} onChange={handleChange} required />
        </div>

        <div className="professors-section-wrapper">
          <h4 className="prof-section-title">Lecturer & Subject Evaluations <span className="telugu-text">(ఉపాధ్యాయుల వివరాలు మరియు సబ్జెక్టులు)</span></h4>
          
          {renderSectionColumns('stephen', 'Prof Stephen Suresh Babu, M.Th; M.Tech, Director of CBC', '+91 8074852725', 'సినాప్టిక్ గస్పెల్స్, ఆక్ట్స్ & ఎపిస్టల్స్, హోమిలెటిక్స్', [
            { key: 'synoptic', label: 'Synoptic Gospels', telugu: 'సినాప్టిక్' },
            { key: 'actsEpistles', label: 'Acts & Epistles', telugu: 'ఆక్ట్స్' },
            { key: 'homiletics', label: 'Homiletics', telugu: 'హోమిలెటిక్స్' }
          ], 'cols-3', true)}

          {renderSectionColumns('rajshekar', 'Prof Rajshekar Sir', '+91-8885831588', 'లా, హిస్టరీ, పోయెటిక్ & విజ్డమ్, ప్రాఫెటిక్', [
            { key: 'law', label: 'Law', telugu: 'లా' },
            { key: 'history', label: 'History', telugu: 'హిస్టరీ' },
            { key: 'poetic', label: 'Poetic & Wisdom', telugu: 'పోయెటిక్' },
            { key: 'prophetic', label: 'Prophetic', telugu: 'ప్రాఫెటిక్' }
          ], 'cols-4', false)}

          {renderSectionColumns('sampath', 'Prof Sampath Kumar', '+91 9985236736', 'లైఫ్ ఆఫ్ క్రైస్ట్, క్రోనలాజికల్, ఎవంజిలిజం', [
            { key: 'loc', label: 'Life of Christ', telugu: 'లైఫ్ ఆఫ్ క్రైస్ట్' },
            { key: 'locChronological', label: 'Life of Christ - Chronological Study', telugu: 'క్రోనలాజికల్' },
            { key: 'evangelism', label: 'Evangelism & Missions', telugu: 'ఎవంజిలిజం' }
          ], 'cols-3', false)}
        </div>

        <div className="form-actions" style={{ marginTop: '20px' }}>
          <button type="submit" style={{ padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Save Academic Records
          </button>
        </div>
      </form>

      <div style={{ marginTop: '40px' }}>
        <h3>Academic Records Summary</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name <span className="telugu-text">(పేరు)</span></th>
                <th>District <span className="telugu-text">(జిల్లా)</span></th>
                <th>Prof Stephen</th>
                <th>Prof Rajshekar</th>
                <th>Prof Sampath</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const formatTableCell = (obj, keys) => {
                  if (!obj) return 'N/A';
                  return (
                    <div className="prof-cell" style={{ fontSize: '0.8rem' }}>
                      {keys.map(k => (
                        <div key={k}>
                          <strong>{k}:</strong> Ex:{obj[`${k}Exam`]?'✅':'❌'} N:{obj[`${k}Notes`]?'✅':'❌'} Cl:{obj[`${k}Classes`]?'✅':'❌'} P:{obj[`${k}Permissions`]||0} 
                        </div>
                      ))}
                    </div>
                  );
                };

                return (
                  <tr key={row.id}>
                    <td><strong>{row.name}</strong></td>
                    <td>{row.district}</td>
                    <td>{formatTableCell(row.stephen, stephenKeys)}</td>
                    <td>{formatTableCell(row.rajshekar, rajkeys)}</td>
                    <td>{formatTableCell(row.sampath, sampathKeys)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}