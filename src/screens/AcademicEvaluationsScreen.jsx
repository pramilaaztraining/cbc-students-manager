import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import StudentSelectDropdown from './StudentSelectDropdown';
import ProfessorSection from './ProfessorSection';
import './AcademicEvaluationsScreen.css';

export default function AcademicEvaluationsScreen({ 
  formData, 
  setFormData, 
  handleSubmit, 
  rows, 
  handleEdit 
}) {
  const [professorSubjects, setProfessorSubjects] = useState([]);
  const [studentEvaluationsMap, setStudentEvaluationsMap] = useState({});
  const [gridSearchTerm, setGridSearchTerm] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/professor-subjects')
      .then(res => res.json())
      .then(data => setProfessorSubjects(data))
      .catch(err => console.error('Error fetching professor subjects:', err));
  }, []);

  useEffect(() => {
    if (rows && rows.length > 0) {
      rows.forEach(async (row) => {
        try {
          const res = await fetch(`http://localhost:5000/api/evaluations/${row.id}`);
          if (res.ok) {
            const data = await res.json();
            // Filter out any accidental stay_details if present
            delete data.stay_details;
            setStudentEvaluationsMap(prev => ({ ...prev, [row.id]: data }));
          }
        } catch (err) {
          console.error(`Error fetching evaluation for student ID ${row.id}:`, err);
        }
      });
    }
  }, [rows]);

  const handleStudentSelect = async (studentId) => {
    if (!studentId) {
      setFormData(prev => ({ ...prev, id: null }));
      return;
    }

    const selectedRow = rows.find(r => String(r.id) === studentId);
    if (selectedRow) {
      try {
        const res = await fetch(`http://localhost:5000/api/evaluations/${selectedRow.id}`);
        const evaluationData = res.ok ? await res.json() : {};
        delete evaluationData.stay_details;

        setFormData(prev => ({
          ...prev,
          ...selectedRow,
          ...evaluationData
        }));
      } catch (err) {
        console.error('Error fetching evaluations for student:', err);
      }
    }
  };

  const handleFieldChange = (e, lecturerKey, fieldName, type) => {
    setFormData(prev => {
      const lecturerObj = prev[lecturerKey] || {};
      let newValue;

      if (type === 'checkbox') {
        newValue = e.target.checked;
      } else if (type === 'file') {
        const file = e.target.files[0];
        newValue = file ? file.name : '';
      } else {
        newValue = e.target.value;
      }

      return {
        ...prev,
        [lecturerKey]: {
          ...lecturerObj,
          [fieldName]: newValue
        }
      };
    });
  };

  const selectedStudent = rows.find(r => r.id === formData.id);
  const studentFullName = selectedStudent ? `${selectedStudent.first_name || ''} ${selectedStudent.last_name || ''}`.trim() : '';

  const searchedGridRows = (rows || []).filter(row => {
    const query = gridSearchTerm.toLowerCase();
    const fullName = `${row.first_name || ''} ${row.last_name || ''}`.toLowerCase();
    const district = (row.district || '').toLowerCase();
    const idStr = String(row.id || '');

    return fullName.includes(query) || district.includes(query) || idStr.includes(query);
  });

  // ✨ Helper returning formatted JSX with Green for Yes and Red for No
  const renderProfSummaryJSX = (studentId, lecturerKey, subjectKey) => {
    const studentEvals = studentEvaluationsMap[studentId] || {};
    const lecturerObj = studentEvals[lecturerKey] || {};

    const ex = lecturerObj[`${subjectKey}Exam`] ? 'Yes' : 'No';
    const n = lecturerObj[`${subjectKey}Notes`] ? 'Yes' : 'No';
    const cl = lecturerObj[`${subjectKey}Classes`] ? 'Yes' : 'No';
    const p = lecturerObj[`${subjectKey}Permissions`] || '0';

    const renderValBadge = (val) => (
      <span style={{ 
        color: val === 'Yes' ? '#16a34a' : '#dc2626', 
        fontWeight: 'bold' 
      }}>
        [{val}]
      </span>
    );

    return (
      <div key={subjectKey} style={{ marginBottom: '4px' }}>
        <strong>{subjectKey}:</strong> Ex:{renderValBadge(ex)} N:{renderValBadge(n)} Cl:{renderValBadge(cl)} P:{p}
      </div>
    );
  };

  const renderProfSummaryTextPlain = (studentId, lecturerKey, subjectKey) => {
    const studentEvals = studentEvaluationsMap[studentId] || {};
    const lecturerObj = studentEvals[lecturerKey] || {};

    const ex = lecturerObj[`${subjectKey}Exam`] ? 'Yes' : 'No';
    const n = lecturerObj[`${subjectKey}Notes`] ? 'Yes' : 'No';
    const cl = lecturerObj[`${subjectKey}Classes`] ? 'Yes' : 'No';
    const p = lecturerObj[`${subjectKey}Permissions`] || '0';

    return `${subjectKey}: Ex:[${ex}] N:[${n}] Cl:[${cl}] P:${p}`;
  };

  const getProfSubjectsList = (lecturerKey) => {
    const prof = professorSubjects.find(p => p.lecturerKey === lecturerKey);
    return prof ? prof.subjects : [];
  };

  const exportSectionToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('CBC-BTC Manager - Academic Records Summary', 14, 12);

    const tableColumns = ['ID', 'Student Name', 'District', 'Prof Stephen Evals', 'Prof Rajshekar Evals', 'Prof Sampath Evals'];
    const tableRows = searchedGridRows.map(row => [
      row.id,
      `${row.first_name || ''} ${row.last_name || ''}`,
      row.district || 'N/A',
      getProfSubjectsList('stephen').map(sub => renderProfSummaryTextPlain(row.id, 'stephen', sub.key)).join('\n'),
      getProfSubjectsList('rajshekar').map(sub => renderProfSummaryTextPlain(row.id, 'rajshekar', sub.key)).join('\n'),
      getProfSubjectsList('sampath').map(sub => renderProfSummaryTextPlain(row.id, 'sampath', sub.key)).join('\n')
    ]);

    autoTable(doc, { 
      head: [tableColumns], 
      body: tableRows, 
      startY: 18, 
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235] }
    });
    doc.save('Academic_Records_Summary.pdf');
  };

  const [collapsedPanels, setCollapsedPanels] = useState({});
  const togglePanel = (lecturerKey) => {
    setCollapsedPanels(prev => ({ ...prev, [lecturerKey]: !prev[lecturerKey] }));
  };

  return (
    <div className="screen-section">
      <div className="section-intro">
        <h2>Section 2: Academic Evaluations</h2>
        <p className="subtitle">Manage student exams, notes, classes, and coursework evaluations across all modules.</p>
      </div>

      <form onSubmit={handleSubmit} className="form-card">
        <div style={{ marginBottom: '15px' }}>
        
          <StudentSelectDropdown 
            rows={rows} 
            selectedStudentId={formData.id ? String(formData.id) : ''} 
            onStudentChange={handleStudentSelect} 
          />
        </div>

        <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '20px' }}>
          💡 Target Student: <strong style={{ color: formData.id ? '#2563eb' : '#64748b' }}>
            {formData.id ? `ID #${formData.id} - ${studentFullName}` : 'None selected (Evaluation sections locked)'}
          </strong>
        </div>

        {!formData.id ? (
          <div style={{ padding: '30px', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center', color: '#64748b' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#334155' }}>🔒 Academic Evaluations Locked</h4>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Please select a student above to view or grade their academic progress.</p>
          </div>
        ) : (
          <>
            {professorSubjects.map(prof => (
              <ProfessorSection 
                key={prof.lecturerKey} 
                prof={prof} 
                isCollapsed={!!collapsedPanels[prof.lecturerKey]}
                onToggle={togglePanel}
                formData={formData} 
                onChange={handleFieldChange} 
              />
            ))}

            <button 
              type="submit" 
              className="save-btn" 
              style={{ marginTop: '25px', backgroundColor: '#2563eb', padding: '12px 20px', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Save Academic Evaluations [ID: {formData.id}]
            </button>
          </>
        )}
      </form>

      {/* Summary Table */}
      <div style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>Academic Records Summary </h3>
          
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
              📥 Export Table to PDF
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
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#1e293b' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>ID</th>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>Name</th>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>District</th>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>Prof Stephen Suresh Babu</th>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>Prof Rajshekar Sir</th>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>Prof Sampath Kumar</th>
                  <th style={{ padding: '14px 16px', fontWeight: 'bold', textAlign: 'center' }}>Action</th>
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
                      <td style={{ padding: '16px', color: '#64748b', fontWeight: 600, verticalAlign: 'top' }}>
                        <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>#{row.id}</span>
                      </td>
                      <td style={{ padding: '16px', color: '#0f172a', fontWeight: 600, wordBreak: 'break-word', maxWidth: '160px', verticalAlign: 'top' }}>
                        {row.first_name} {row.last_name}
                      </td>
                      <td style={{ padding: '16px', color: '#475569', textTransform: 'capitalize', verticalAlign: 'top' }}>
                        {row.district || 'N/A'}
                      </td>
                      
                      {/* Prof Stephen Evals */}
                      <td style={{ padding: '16px', color: '#334155', verticalAlign: 'top', lineHeight: '1.5' }}>
                        {getProfSubjectsList('stephen').map(sub => renderProfSummaryJSX(row.id, 'stephen', sub.key))}
                      </td>

                      {/* Prof Rajshekar Evals */}
                      <td style={{ padding: '16px', color: '#334155', verticalAlign: 'top', lineHeight: '1.5' }}>
                        {getProfSubjectsList('rajshekar').map(sub => renderProfSummaryJSX(row.id, 'rajshekar', sub.key))}
                      </td>

                      {/* Prof Sampath Evals */}
                      <td style={{ padding: '16px', color: '#334155', verticalAlign: 'top', lineHeight: '1.5' }}>
                        {getProfSubjectsList('sampath').map(sub => renderProfSummaryJSX(row.id, 'sampath', sub.key))}
                      </td>

                      <td style={{ padding: '16px', textAlign: 'center', verticalAlign: 'top' }}>
                        <button 
                          type="button"
                          onClick={() => handleEdit(row, 'academics')} 
                          style={{ 
                            padding: '8px 16px', 
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
                          Evaluate
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontStyle: 'italic' }}>
                      No matching academic records found.
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