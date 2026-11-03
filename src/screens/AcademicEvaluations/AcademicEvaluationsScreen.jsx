import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import StudentSelectDropdown from '../CommonScreenComponents/StudentSelectDropdown';
import MorningDevotionSection from './MorningDevotionSection';
import ProfessorSubjectCard from './ProfessorSubjectCard'; // 👈 Using Professor and Subject card component
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

  // Track collapsed state for professor cards (default all open)
  const [collapsedProfessors, setCollapsedProfessors] = useState({});

  const toggleProfessorCollapse = (profId) => {
    setCollapsedProfessors(prev => ({
      ...prev,
      [profId]: !prev[profId]
    }));
  };

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
          const res = await apiFetch(`/api/evaluations/${row.id}`);
          if (res.ok) {
            const data = await res.json();
            const evalsMap = {};
            if (Array.isArray(data)) {
              data.forEach(item => { evalsMap[item.subject_id] = item; });
            }
            setAllStudentsEvalsMap(prev => ({ ...prev, [row.id]: evalsMap }));
          }

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

    if (subjects.length === 0) return <span className="no-data">No subjects</span>;

    return subjects.map(sub => {
      const ev = studentEvals[sub.subject_id] || {};
      const ex = ev.exam ? 'Yes' : 'No';
      const n = ev.notes ? 'Yes' : 'No';
      const cl = ev.classes ? 'Yes' : 'No';
      const p = ev.permissions || '0';
      const vid = ev.video_file_name ? ev.video_file_name : 'None';

      return (
        <div key={sub.subject_id} className="sub-summary-item">
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    const evaluationsArray = Object.values(studentEvaluations);

    try {
      const res = await apiFetch(`/api/evaluations/${selectedStudentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluations: evaluationsArray })
      });

      const devRes = await apiFetch(`/api/student-devotions/${selectedStudentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(morningDevotion)
      });

      if (res.ok && devRes.ok) {
        alert('Academic evaluations & Morning Devotion saved successfully!');
        
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
        <div className="input-group">
          <StudentSelectDropdown 
            rows={rows} 
            selectedStudentId={selectedStudentId || ''} 
            onStudentChange={handleStudentSelect} 
          />
        </div>

        {!selectedStudentId ? (
          <div className="locked-card">
            <h4>🔒 Academic Evaluations Locked</h4>
            <p>Please select a student above to evaluate.</p>
          </div>
        ) : (
          <div className="eval-form-content">
            
            {/* 🌅 Morning Devotion Practical Sub-Section Component */}
            <MorningDevotionSection 
              devotion={morningDevotion} 
              onChange={handleDevotionChange} 
            />

            {/* 👨‍🏫 Reusable Professor & Subject Cards */}
            {professorsList.map(prof => {
              const profSubjects = getSubjectsForProf(prof.professor_id);
              if (profSubjects.length === 0) return null;

              return (
                <ProfessorSubjectCard 
                  key={prof.professor_id}
                  prof={prof}
                  subjects={profSubjects}
                  evaluationsMap={studentEvaluations}
                  onChange={handleFieldChange}
                  isCollapsed={!!collapsedProfessors[prof.professor_id]}
                  onToggle={toggleProfessorCollapse}
                />
              );
            })}

            <button type="submit" className="submit-eval-btn">
              Save Academic Evaluations & Devotions [ID: {selectedStudentId}]
            </button>
          </div>
        )}
      </form>

      {/* Summary Table Grid & Search */}
      <div className="summary-section">
        <div className="summary-header-wrapper">
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>Academic & Devotion Summary</h3>
          
          <div className="summary-controls-group">
            <input 
              type="text"
              placeholder="Search by name, district, ID..."
              value={gridSearchTerm}
              onChange={(e) => setGridSearchTerm(e.target.value)}
              className="grid-search-input"
            />

            <span className="records-count-badge">
              Records: {searchedGridRows.length}
            </span>

            <button type="button" onClick={exportSectionToPDF} className="pdf-download-btn">
              📥 Download PDF
            </button>
          </div>
        </div>

        <div className="summary-table-container">
          <div className="table-wrapper">
            <table className="summary-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student Name</th>
                  <th>Morning Devotion</th>
                  {professorsList.map(prof => (
                    <th key={prof.professor_id}>{prof.lecturer_name}</th>
                  ))}
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {searchedGridRows.length === 0 ? (
                  <tr>
                    <td colSpan={professorsList.length + 4} className="no-data">
                      No student records found matching your search.
                    </td>
                  </tr>
                ) : (
                  searchedGridRows.map(row => {
                    const dev = allStudentsDevotionsMap[row.id] || {};
                    return (
                      <tr key={row.id}>
                        <td>#{row.id}</td>
                        <td style={{ fontWeight: '600' }}>{row.first_name} {row.last_name}</td>
                        <td className="devotion-summary-cell">
                          <div>Preach: <strong>{dev.preaching ? 'Yes' : 'No'}</strong></div>
                          <div>Host: <strong>{dev.hosting ? 'Yes' : 'No'}</strong></div>
                          <div>Sing: <strong>{dev.singing ? 'Yes' : 'No'}</strong></div>
                          <div>Score: <strong style={{ color: '#2563eb' }}>{dev.attendance_score ?? 0}/20</strong></div>
                        </td>
                        {professorsList.map(prof => (
                          <td key={prof.professor_id}>
                            {renderProfSummaryJSX(row.id, prof.professor_id)}
                          </td>
                        ))}
                        <td style={{ textAlign: 'center' }}>
                          <button type="button" onClick={() => handleEdit(row, 'academics')} className="evaluate-action-btn">
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