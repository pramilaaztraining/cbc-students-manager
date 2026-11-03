import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ExaminationScoreScreen.css';

const ExaminationScoreScreen = () => {
  const [students, setStudents] = useState([]);
  const [allScoresMap, setAllScoresMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('sheet'); // 'sheet' or 'exam'

  const subjectsList = [
    { id: 'pentateuch', label: 'PENTATECH' },
    { id: 'synoptic_gospel', label: 'SYNOPTIC GOSPEL' },
    { id: 'historical_books', label: 'HISTORICAL BOOKS' },
    { id: 'life_of_christ', label: 'LIFFE OF CHRIST' },
    { id: 'acts_letters', label: 'ACTS & letters' },
    { id: 'poetic_books', label: 'POETIC BOOKS' },
    { id: 'general_epistles', label: 'GENERAL EPISTLES & REVELATION' },
    { id: 'evangelism_mission', label: 'EVANGELISM MINISTRY AND MISSIOON' },
    { id: 'homiletics', label: 'HOMILETICS' },
    { id: 'major_prophets', label: 'MAJOR PROPHETS' }
  ];

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [studentsRes, scoresRes] = await Promise.all([
        axios.get('http://localhost:5000/api/students'),
        axios.get('http://localhost:5000/api/exam-scores/all')
      ]);

      setStudents(studentsRes.data || []);

      const scoreMap = {};
      (scoresRes.data || []).forEach(item => {
        if (!scoreMap[item.student_id]) {
          scoreMap[item.student_id] = {};
        }
        scoreMap[item.student_id][item.subject_id] = item.score ?? item.examStatus ?? '';
      });
      setAllScoresMap(scoreMap);
    } catch (error) {
      console.error('Error fetching exam score sheet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (studentId, subjectId, value) => {
    setAllScoresMap(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subjectId]: value
      }
    }));
  };

  const handleSaveStudent = async (studentId) => {
    try {
      const studentScores = allScoresMap[studentId] || {};
      const evaluationsArray = Object.entries(studentScores).map(([subId, score]) => ({
        subject_id: subId,
        score: score
      }));

      await axios.put(`http://localhost:5000/api/exam-scores/${studentId}`, {
        evaluations: evaluationsArray
      });
      alert(`Scores saved successfully for Student #${studentId}!`);
    } catch (error) {
      console.error('Error saving scores:', error);
      alert('Failed to save scores.');
    }
  };

  const exportToPDF = () => {
    window.print();
  };

  const filteredStudents = students.filter(student => {
    const fullName = `${student.first_name || ''} ${student.last_name || ''}`.toLowerCase();
    const place = (student.district || student.place || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return fullName.includes(query) || place.includes(query) || String(student.id).includes(query);
  });

  return (
    <div className="exam-score-container">
      <div className="section-intro">
        <h2>Section 4: Examination Score</h2>
        <p className="subtitle">Manage student examination scores across all theological subjects or open the online examination portal.</p>
      </div>

      {/* Sub-Section View Toggle Tabs */}
      <div className="exam-view-toggle" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          type="button"
          onClick={() => setViewMode('sheet')} 
          className={`toggle-tab-btn ${viewMode === 'sheet' ? 'active' : ''}`}
          style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', background: viewMode === 'sheet' ? '#2563eb' : '#e2e8f0', color: viewMode === 'sheet' ? '#fff' : '#334155', border: 'none' }}
        >
          📊 Master Score Sheet
        </button>
      <button 
  type="button"
  onClick={() => window.open("https://docs.google.com/forms/d/e/1FAIpQLSfv2rek6itYy1TSIYviMZs_ma89J5Q6vuiNOEsC0wbLNx9N-w/viewform", "_blank")} 
  className="toggle-tab-btn"
  style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', background: '#e2e8f0', color: '#334155', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
>
  📝 Live Exam Portal 🔗
</button>
      </div>

      {viewMode === 'exam' ? (
        <div className="embedded-exam-container">
          <div className="exam-portal-header" style={{ marginBottom: '15px', display: 'flex', justifyContent: 'flex-end' }}>
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLSc17fXSA7iwxCigZOIG9BQG_CbXS9aaeD2CnmkXPM4aclCbRg/viewform" 
              target="_blank" 
              rel="noopener noreferrer"
              className="pdf-download-btn"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#10b981', color: '#fff', borderRadius: '6px', fontWeight: '600', fontSize: '0.85rem' }}
            >
              🔗 Open Exam Form in New Tab
            </a>
          </div>
          <iframe 
            src="https://docs.google.com/forms/d/e/1FAIpQLSc17fXSA7iwxCigZOIG9BQG_CbXS9aaeD2CnmkXPM4aclCbRg/viewform?embedded=true" 
            width="100%" 
            height="750px" 
            frameBorder="0" 
            title="Online Examination Form"
          >
            Loading exam...
          </iframe>
        </div>
      ) : (
        <div className="summary-section">
          <div className="summary-header-wrapper">
            <h3 className="summary-section-title">Examination Score Sheet</h3>
            
            <div className="summary-controls-group">
              <input 
                type="text" 
                placeholder="Search by name, district, ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="grid-search-input"
              />
              <span className="records-count-badge">Records: {filteredStudents.length}</span>
              <button type="button" onClick={exportToPDF} className="pdf-download-btn">
                📥 Download PDF
              </button>
            </div>
          </div>

          {loading ? (
            <p className="loading-text">Loading examination score sheet...</p>
          ) : (
            <div className="summary-table-container">
              <div className="table-wrapper">
                <table className="summary-table spreadsheet-layout">
                  <thead>
                    <tr>
                      <th className="yellow-header" style={{ width: '50px', textAlign: 'center' }}>Sno</th>
                      <th className="yellow-header" style={{ width: '180px' }}>Name / District</th>
                      {subjectsList.map(sub => (
                        <th key={sub.id} className="yellow-header subject-th">
                          {sub.label}
                        </th>
                      ))}
                      <th className="yellow-header" style={{ textAlign: 'center', width: '80px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student, index) => {
                        const studentScores = allScoresMap[student.id] || {};
                        const fullName = `${student.first_name || ''} ${student.last_name || ''}`.toUpperCase();
                        const placeName = student.district || student.place || 'NELLORE';

                        return (
                          <tr key={student.id}>
                            <td style={{ textAlign: 'center', fontWeight: '600' }}>{index + 1}</td>
                            <td style={{ fontWeight: '600' }}>
                              {fullName} ({placeName})
                            </td>
                            {subjectsList.map(sub => {
                              const val = studentScores[sub.id] ?? '';
                              const isAbsent = String(val).toUpperCase() === 'AB';

                              return (
                                <td key={sub.id} style={{ textAlign: 'center' }}>
                                  <input 
                                    type="text"
                                    value={val}
                                    onChange={(e) => handleScoreChange(student.id, sub.id, e.target.value)}
                                    className={`spreadsheet-input ${isAbsent ? 'absent-text' : ''}`}
                                  />
                                </td>
                              );
                            })}
                            <td style={{ textAlign: 'center' }}>
                              <button 
                                type="button" 
                                onClick={() => handleSaveStudent(student.id)} 
                                className="evaluate-action-btn"
                              >
                                Save
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={subjectsList.length + 3} className="no-data">
                          No student records found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="summary-footer-banner">
                <span className="footer-banner-label">
                  👥 Total Evaluated Students:
                </span>
                <span className="footer-banner-badge">
                  ✨ {filteredStudents.length} Students
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExaminationScoreScreen;