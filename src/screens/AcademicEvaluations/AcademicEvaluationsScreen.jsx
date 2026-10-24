import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import StudentSelectDropdown from '../CommonScreenComponents/StudentSelectDropdown';
import MorningDevotionSection from './MorningDevotionSection';
import './AcademicEvaluationsScreen.css';
import { apiFetch } from '../../utils/api';

export default function AcademicEvaluationsScreen({ rows, handleEdit }) {
  const [professorsList, setProfessorsList] = useState([]);
  const [professorSubjects, setProfessorSubjects] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  
  const [studentEvaluations, setStudentEvaluations] = useState({});
  const [morningDevotion, setMorningDevotion] = useState({
    preaching: false,
    hosting: false,
    singing: false,
    attendance_score: 0
  });

  const [allStudentsEvalsMap, setAllStudentsEvalsMap] = useState({});
  const [allStudentsDevotionsMap, setAllStudentsDevotionsMap] = useState({});
  const [gridSearchTerm, setGridSearchTerm] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch('/api/professors').then(res => res.json()),
      apiFetch('/api/professor-subjects').then(res => res.json())
    ])
      .then(([profData, subData]) => {
        setProfessorsList(profData || []);
        setProfessorSubjects(subData || []);
      })
      .catch(err => console.error('Error fetching configuration:', err));
  }, []);

  useEffect(() => {
    if (rows && rows.length > 0) {
      rows.forEach(async (row) => {
        try {
          // Fetch Evaluations
          const res = await apiFetch(`/api/evaluations/${row.id}`);
          if (res.ok) {
            const data = await res.json();
            const evalsMap = {};
            if (Array.isArray(data)) {
              data.forEach(item => { evalsMap[item.subject_id] = item; });
            }
            setAllStudentsEvalsMap(prev => ({ ...prev, [row.id]: evalsMap }));
          }

          // Fetch Morning Devotions
          const devRes = await apiFetch(`/api/student-devotions/${row.id}`);
          if (devRes.ok) {
            const devData = await devRes.json();
            if (devData) {
              setAllStudentsDevotionsMap(prev => ({ ...prev, [row.id]: devData }));
            }
          }
        } catch (err) {
          console.error(`Error fetching summary records for student ID ${row.id}:`, err);
        }
      });
    }
  }, [rows]);

  const getSubjectsForProf = (profId) => {
    return professorSubjects.filter(sub => String(sub.professor_id) === String(profId));
  };

  const renderProfSummaryJSX = (studentId, profId) => {
    const studentEvals = allStudentsEvalsMap[studentId] || {};
    const subjects = getSubjectsForProf(profId);

    if (subjects.length === 0) return <span style={{ color: '#94a3b8' }}>No subjects</span>;

    return subjects.map(sub => {
      const ev = studentEvals[sub.subject_id] || {};
      const ex = ev.exam ? 'Yes' : 'No';
      const n = ev.notes ? 'Yes' : 'No';
      const cl = ev.classes ? 'Yes' : 'No';
      const p = ev.permissions || '0';
      const vid = ev.video_file_name ? ev.video_file_name : 'None';

      return (
        <div key={sub.subject_id} style={{ marginBottom: '6px', fontSize: '0.78rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
          <strong>{sub.subject_label}</strong><br/>
          Ex:<span style={{ color: ex === 'Yes' ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>[{ex}]</span> N:<span style={{ color: n === 'Yes' ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>[{n}]</span> Cl:<span style={{ color: cl === 'Yes' ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>[{cl}]</span> P:{p}<br/>
          <span style={{ color: ev.video_file_name ? '#16a34a' : '#94a3b8' }} title={vid}>Vid: {vid}</span>
        </div>
      );
    });
  };

  const handleStudentSelect = async (studentId) => {
    if (!studentId) {
      setSelectedStudentId(null);
      setStudentEvaluations({});
      setMorningDevotion({ preaching: false, hosting: false, singing: false, attendance_score: 0 });
      return;
    }
    setSelectedStudentId(studentId);

    const initialMap = {};
    professorSubjects.forEach(sub => {
      initialMap[sub.subject_id] = {
        subject_id: sub.subject_id,
        professor_id: sub.professor_id,
        exam: false,
        notes: false,
        classes: false,
        permissions: '0',
        video_file_name: ''
      };
    });

    try {
      // Load Subject Evaluations
      const res = await apiFetch(`/api/evaluations/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          data.forEach(item => {
            initialMap[item.subject_id] = {
              ...initialMap[item.subject_id],
              ...item
            };
          });
        }
      }

      // Load Morning Devotion Records
      const devRes = await apiFetch(`/api/student-devotions/${studentId}`);
      if (devRes.ok) {
        const devData = await devRes.json();
        if (devData) {
          setMorningDevotion({
            preaching: !!devData.preaching,
            hosting: !!devData.hosting,
            singing: !!devData.singing,
            attendance_score: devData.attendance_score || 0
          });
        }
      }
    } catch (err) {
      console.error('Error fetching student evaluation details:', err);
    }

    setStudentEvaluations(initialMap);
  };

  const handleFieldChange = (subjectId, fieldName, value) => {
    if (fieldName === 'permissions') {
      let numVal = Number(value);
      if (!isNaN(numVal)) {
        if (numVal < 0) value = '0';
        if (numVal > 20) value = '20';
      }
    }

    setStudentEvaluations(prev => ({
      ...prev,
      [subjectId]: {
        ...(prev[subjectId] || {}),
        [fieldName]: value
      }
    }));
  };

  const handleDevotionChange = (field, value) => {
    if (field === 'attendance_score') {
      let numVal = Number(value);
      if (!isNaN(numVal)) {
        if (numVal < 0) value = 0;
        if (numVal > 20) value = 20;
      }
    }
    setMorningDevotion(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (subjectId, e) => {
    const file = e.target.files[0];
    if (file) {
      handleFieldChange(subjectId, 'video_file_name', file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    const evaluationsArray = Object.values(studentEvaluations);

    try {
      // 1. Save Subject Evaluations
      const res = await apiFetch(`/api/evaluations/${selectedStudentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluations: evaluationsArray })
      });

      // 2. Save Morning Devotion Details
      const devRes = await apiFetch(`/api/student-devotions/${selectedStudentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(morningDevotion)
      });

      if (res.ok && devRes.ok) {
        alert('Academic evaluations & Morning Devotion saved successfully!');
        
        // Refresh local cache for student
        const refreshedRes = await apiFetch(`/api/evaluations/${selectedStudentId}`);
        if (refreshedRes.ok) {
          const freshData = await refreshedRes.json();
          const evalsMap = {};
          if (Array.isArray(freshData)) {
            freshData.forEach(item => { evalsMap[item.subject_id] = item; });
          }
          setAllStudentsEvalsMap(prev => ({ ...prev, [selectedStudentId]: evalsMap }));
        }

        const refreshedDevRes = await apiFetch(`/api/student-devotions/${selectedStudentId}`);
        if (refreshedDevRes.ok) {
          const freshDevData = await refreshedDevRes.json();
          setAllStudentsDevotionsMap(prev => ({ ...prev, [selectedStudentId]: freshDevData }));
        }
      } else {
        alert('Failed to save academic details.');
      }
    } catch (err) {
      console.error('Error saving evaluations:', err);
    }
  };

  const searchedGridRows = (rows || []).filter(row => {
    const query = gridSearchTerm.toLowerCase();
    const fullName = `${row.first_name || ''} ${row.last_name || ''}`.toLowerCase();
    const district = (row.district || '').toLowerCase();
    return fullName.includes(query) || district.includes(query) || String(row.id).includes(query);
  });

  const exportSectionToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('CBC-BTC Manager - Academic Records & Devotion Summary', 14, 12);

    const tableColumns = ['ID', 'Student Name', 'District', 'Morning Devotion', ...professorsList.map(p => p.lecturer_name)];
    
    const tableRows = searchedGridRows.map(row => {
      const dev = allStudentsDevotionsMap[row.id] || {};
      const devString = `Preach: ${dev.preaching ? 'Yes' : 'No'}\nHost: ${dev.hosting ? 'Yes' : 'No'}\nSing: ${dev.singing ? 'Yes' : 'No'}\nAttend: ${dev.attendance_score ?? 0}/20`;

      return [
        row.id,
        `${row.first_name || ''} ${row.last_name || ''}`,
        row.district || 'N/A',
        devString,
        ...professorsList.map(prof => {
          const studentEvals = allStudentsEvalsMap[row.id] || {};
          const subjects = getSubjectsForProf(prof.professor_id);

          if (subjects.length === 0) return 'No subjects';

          return subjects.map(sub => {
            const ev = studentEvals[sub.subject_id] || {};
            const ex = ev.exam ? 'Yes' : 'No';
            const n = ev.notes ? 'Yes' : 'No';
            const cl = ev.classes ? 'Yes' : 'No';
            const p = ev.permissions || '0';
            const vid = ev.video_file_name || 'None';

            return `${sub.subject_label}: Ex:[${ex}] N:[${n}] Cl:[${cl}] P:${p} Vid:${vid}`;
          }).join('\n\n');
        })
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
    
    doc.save('Academic_Records_Summary.pdf');
  };

  return (
    <div className="screen-section">
      <div className="section-intro">
        <h2>Section 2: Academic Evaluations</h2>
        <p className="subtitle">Manage student subject evaluations, permissions limit (0-20), video uploads, and morning devotions.</p>
      </div>

      <form onSubmit={handleSubmit} className="form-card">
        <div style={{ marginBottom: '15px' }}>
          <StudentSelectDropdown 
            rows={rows} 
            selectedStudentId={selectedStudentId || ''} 
            onStudentChange={handleStudentSelect} 
          />
        </div>

        {!selectedStudentId ? (
          <div style={{ padding: '30px', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center' }}>
            <h4>🔒 Academic Evaluations Locked</h4>
            <p>Please select a student above to evaluate.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* 🌅 Morning Devotion Practical Sub-Section Component */}
            <MorningDevotionSection 
              devotion={morningDevotion} 
              onChange={handleDevotionChange} 
            />

            {/* Lecturer Subject Cards */}
            {professorsList.map(prof => {
              const profSubs = professorSubjects.filter(sub => String(sub.professor_id) === String(prof.professor_id));
              if (profSubs.length === 0) return null;

              return (
                <div key={prof.professor_id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>
                    Lecturer: {prof.lecturer_name}
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                    {profSubs.map(sub => {
                      const ev = studentEvaluations[sub.subject_id] || {
                        exam: false,
                        notes: false,
                        classes: false,
                        permissions: '0',
                        video_file_name: ''
                      };

                      return (
                        <div key={sub.subject_id} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                          
                          <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.95rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                            {sub.subject_label}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                              <input 
                                type="checkbox"
                                checked={!!ev.exam}
                                onChange={(e) => handleFieldChange(sub.subject_id, 'exam', e.target.checked)}
                              /> Exam
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                              <input 
                                type="checkbox"
                                checked={!!ev.notes}
                                onChange={(e) => handleFieldChange(sub.subject_id, 'notes', e.target.checked)}
                              /> Notes
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                              <input 
                                type="checkbox"
                                checked={!!ev.classes}
                                onChange={(e) => handleFieldChange(sub.subject_id, 'classes', e.target.checked)}
                              /> Classes
                            </label>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                              <span>Perm (0-20):</span>
                              <input 
                                type="number"
                                min="0"
                                max="20"
                                value={ev.permissions}
                                onChange={(e) => handleFieldChange(sub.subject_id, 'permissions', e.target.value)}
                                style={{ width: '45px', textAlign: 'center', padding: '3px', border: '1px solid #cbd5e1', borderRadius: '4px', fontWeight: 'bold' }}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '6px', borderTop: '1px dashed #e2e8f0' }}>
                            <label style={{ 
                              background: '#2563eb', 
                              color: '#fff', 
                              padding: '5px 10px', 
                              borderRadius: '4px', 
                              fontSize: '0.78rem', 
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}>
                              📁 Upload Video
                              <input 
                                type="file" 
                                accept="video/*"
                                style={{ display: 'none' }} 
                                onChange={(e) => handleFileUpload(sub.subject_id, e)}
                              />
                            </label>

                            {ev.video_file_name ? (
                              <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600', background: '#dcfce7', padding: '3px 6px', borderRadius: '4px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ev.video_file_name}>
                                ✓ {ev.video_file_name}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                No video selected
                              </span>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <button type="submit" style={{ marginTop: '10px', backgroundColor: '#2563eb', padding: '12px 20px', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              Save Academic Evaluations & Devotions [ID: {selectedStudentId}]
            </button>
          </div>
        )}
      </form>

      {/* Summary Table Grid & Search */}
      <div style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>Academic & Devotion Summary</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <input 
              type="text"
              placeholder="Search by name, district, ID..."
              value={gridSearchTerm}
              onChange={(e) => setGridSearchTerm(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: '240px', outline: 'none' }}
            />

            <span style={{ fontSize: '0.85rem', color: '#64748b', background: '#f1f5f9', padding: '6px 12px', borderRadius: '20px', fontWeight: 500 }}>
              Records: {searchedGridRows.length}
            </span>

            <button type="button" onClick={exportSectionToPDF} style={{ padding: '7px 14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}>
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
                  <th style={{ padding: '14px' }}>Morning Devotion</th>
                  {professorsList.map(prof => (
                    <th key={prof.professor_id} style={{ padding: '14px' }}>{prof.lecturer_name}</th>
                  ))}
                  <th style={{ padding: '14px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {searchedGridRows.length === 0 ? (
                  <tr>
                    <td colSpan={professorsList.length + 4} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                      No student records found matching your search.
                    </td>
                  </tr>
                ) : (
                  searchedGridRows.map(row => {
                    const dev = allStudentsDevotionsMap[row.id] || {};
                    return (
                      <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px', verticalAlign: 'top' }}>#{row.id}</td>
                        <td style={{ padding: '16px', verticalAlign: 'top', fontWeight: '600' }}>{row.first_name} {row.last_name}</td>
                        <td style={{ padding: '16px', verticalAlign: 'top', fontSize: '0.78rem' }}>
                          <div>Preach: <strong>{dev.preaching ? 'Yes' : 'No'}</strong></div>
                          <div>Host: <strong>{dev.hosting ? 'Yes' : 'No'}</strong></div>
                          <div>Sing: <strong>{dev.singing ? 'Yes' : 'No'}</strong></div>
                          <div>Score: <strong style={{ color: '#2563eb' }}>{dev.attendance_score ?? 0}/20</strong></div>
                        </td>
                        {professorsList.map(prof => (
                          <td key={prof.professor_id} style={{ padding: '16px', verticalAlign: 'top' }}>
                            {renderProfSummaryJSX(row.id, prof.professor_id)}
                          </td>
                        ))}
                        <td style={{ padding: '16px', verticalAlign: 'top', textAlign: 'center' }}>
                          <button type="button" onClick={() => handleEdit(row, 'academics')} style={{ padding: '6px 12px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                            Evaluate
                          </button>
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
