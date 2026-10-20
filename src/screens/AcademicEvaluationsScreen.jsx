import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
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
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [professorsData, setProfessorsData] = useState([]);
  const [allEvaluations, setAllEvaluations] = useState({});
  const [loadingProfessors, setLoadingProfessors] = useState(true);
  const [error, setError] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch a single student's evaluation records and update local summary state
  const fetchStudentEvaluations = useCallback(async (studentId) => {
    try {
      const resEval = await fetch(`http://localhost:5000/api/evaluations/${studentId}`);
      if (resEval.ok) {
        const evalData = await resEval.json();
        setAllEvaluations(prev => ({
          ...prev,
          [studentId]: evalData
        }));
      }
    } catch (err) {
      console.error(`Error loading evaluations for student ${studentId}`, err);
    }
  }, []);

  // Fetch Professor & Subject configurations + all students' evaluations on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingProfessors(true);
        setError(null);
        
        const resProf = await fetch('http://localhost:5000/api/professor-subjects');
        if (!resProf.ok) throw new Error('Failed to fetch professor configurations');
        const profData = await resProf.json();
        setProfessorsData(profData);

        const initialCollapseState = {};
        profData.forEach((prof, index) => {
          initialCollapseState[prof.lecturerKey] = index !== 0;
        });
        setCollapsedSections(initialCollapseState);

        // Fetch evaluations for all rows to render summary grid
        for (const row of rows) {
          await fetchStudentEvaluations(row.id);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to fetch configurations from database.');
      } finally {
        setLoadingProfessors(false);
      }
    };

    fetchData();
  }, [rows, fetchStudentEvaluations]);

  useEffect(() => {
    if (formData && formData.id) {
      setSelectedStudentId(String(formData.id));
    } else {
      setSelectedStudentId('');
    }
  }, [formData]);

  const handleStudentChange = async (val) => {
    setSelectedStudentId(val);
    
    if (!val) {
      setFormData({ id: null, first_name: '', last_name: '', email: '', course: '', batch: '', district: '', phone: '', photoLink: '', photoUrl: '' });
      return;
    }

    const found = rows.find(r => String(r.id) === val);
    if (found) {
      try {
        const res = await fetch(`http://localhost:5000/api/evaluations/${val}`);
        const evaluationsMap = await res.json();
        
        setFormData({ 
          ...found, 
          ...evaluationsMap 
        });
      } catch (err) {
        console.error("Error loading evaluation records", err);
        setFormData({ ...found });
      }
    }
  };

  const toggleSection = (sectionKey) => {
    setCollapsedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const handleChange = (e, lecturerKey, fieldKey, type) => {
    let value;
    if (type === 'checkbox') value = e.target.checked;
    else if (type === 'file') value = e.target.files[0] ? e.target.files[0].name : '';
    else if (type === 'number') value = Math.max(0, Number(e.target.value) || 0);
    else value = e.target.value;

    setFormData(prev => ({
      ...prev,
      [lecturerKey]: {
        ...(prev[lecturerKey] || {}),
        [fieldKey]: value
      }
    }));
  };

  // Wrapped form submit: updates backend, refreshes local grid state, and resets dropdown
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id) {
      alert('Please select a student from the directory first.');
      return;
    }

    const currentId = formData.id;
    await handleSubmit(e);
    await fetchStudentEvaluations(currentId);

    // 👇 Reset dropdown and form for a fresh student selection
    setSelectedStudentId('');
    setFormData({
      id: null,
      first_name: '',
      last_name: '',
      email: '',
      course: '',
      batch: '',
      district: '',
      phone: '',
      photoLink: '',
      photoUrl: '',
    });
  };

  const filteredRows = rows.filter(row => 
    (row.first_name && row.first_name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (row.last_name && row.last_name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (row.district && row.district.toLowerCase().includes(searchTerm.toLowerCase())) ||
    String(row.id).includes(searchTerm)
  );

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('Academic Records Summary', 14, 15);

    const tableRows = filteredRows.map((row, index) => {
      const studentEvals = allEvaluations[row.id] || {};
      const rowData = [
        row.id || index + 1,
        `${row.first_name || ''} ${row.last_name || ''}`.trim(),
        row.district || 'N/A'
      ];

      professorsData.forEach(prof => {
        const profEval = studentEvals[prof.lecturerKey] || {};
        const summaryLines = prof.subjects.map(sub => {
          const ex = profEval[`${sub.key}Exam`] ? 'Yes' : 'No';
          const nt = profEval[`${sub.key}Notes`] ? 'Yes' : 'No';
          const cl = profEval[`${sub.key}Classes`] ? 'Yes' : 'No';
          const pr = profEval[`${sub.key}Permissions`] || 0;
          return `${sub.key}: Ex:[${ex}] N:[${nt}] Cl:[${cl}] P:${pr}`;
        });
        rowData.push(summaryLines.join('\n'));
      });

      return rowData;
    });

    const headers = ['ID', 'Name', 'District', ...professorsData.map(p => p.lecturerName)];

    autoTable(doc, {
      head: [headers],
      body: tableRows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' }
    });

    doc.save('academic-records-summary.pdf');
  };

  const studentFullName = `${formData.first_name || ''} ${formData.last_name || ''}`.trim();

  return (
    <div className="screen-section">
      <div className="section-intro">
        <h2>Section 2: Academic Evaluations</h2>
        <p className="subtitle">Fetch database configurations to manage student records dynamically.</p>
      </div>

      <form onSubmit={handleFormSubmit} className="form-card">
        <h3>
          Update Academic Evaluations for: <span className="selected-student">{studentFullName || 'Select a student below'}</span>
          {formData.id && <span style={{ fontSize: '0.85rem', color: '#2563eb', marginLeft: '10px' }}>[Target ID: {formData.id}]</span>}
        </h3>

        <StudentSelectDropdown 
          rows={rows} 
          selectedStudentId={selectedStudentId} 
          onStudentChange={handleStudentChange} 
        />

        <div className="professors-section-wrapper" style={{ marginTop: '20px' }}>
          {loadingProfessors ? (
            <p style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading live professor configurations from database...</p>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#ef4444', background: '#fee2e2', borderRadius: '6px' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{error}</p>
            </div>
          ) : (
            professorsData.map(prof => (
              <ProfessorSection 
                key={prof.lecturerKey}
                prof={prof}
                isCollapsed={collapsedSections[prof.lecturerKey]}
                onToggle={toggleSection}
                formData={formData}
                onChange={handleChange}
              />
            ))
          )}
        </div>

        <button type="submit" className="save-btn" style={{ marginTop: '20px' }}>
          {formData.id ? `Update Academic Records [ID: ${formData.id}]` : 'Save Academic Records'}
        </button>
      </form>

      {/* Academic Records Summary Grid */}
      <div style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0 }}>Academic Records Summary ({filteredRows.length})</h3>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              onClick={exportToPDF}
              style={{ padding: '10px 18px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              📥 Export Table to PDF
            </button>
            <div style={{ minWidth: '260px' }}>
              <input 
                type="text" 
                placeholder="🔍 Search student by name or district..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr style={{ background: '#2563eb', color: '#fff' }}>
                <th style={{ padding: '10px' }}>ID</th>
                <th style={{ padding: '10px' }}>Name</th>
                <th style={{ padding: '10px' }}>District</th>
                {professorsData.map(prof => (
                  <th key={prof.lecturerKey} style={{ padding: '10px' }}>{prof.lecturerName}</th>
                ))}
                <th style={{ padding: '10px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => {
                  const studentEvals = allEvaluations[row.id] || {};
                  return (
                    <tr key={row.id} style={{ background: formData.id === row.id ? '#eff6ff' : 'transparent', borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px' }}><code>{row.id}</code></td>
                      <td style={{ padding: '10px' }}><strong>{row.first_name} {row.last_name}</strong></td>
                      <td style={{ padding: '10px' }}>{row.district || 'N/A'}</td>
                      
                      {professorsData.map(prof => {
                        const profEval = studentEvals[prof.lecturerKey] || {};
                        return (
                          <td key={prof.lecturerKey} style={{ padding: '10px', fontSize: '0.85rem', lineHeight: '1.4' }}>
                            {prof.subjects.map(sub => {
                              const ex = profEval[`${sub.key}Exam`] ? 'Yes' : 'No';
                              const nt = profEval[`${sub.key}Notes`] ? 'Yes' : 'No';
                              const cl = profEval[`${sub.key}Classes`] ? 'Yes' : 'No';
                              const pr = profEval[`${sub.key}Permissions`] || 0;
                              return (
                                <div key={sub.key} style={{ marginBottom: '4px' }}>
                                  <strong>{sub.key}</strong>: Ex:[{ex}] N:[{nt}] Cl:[{cl}] P:{pr}
                                </div>
                              );
                            })}
                          </td>
                        );
                      })}

                      <td style={{ padding: '10px' }}>
                        <button 
                          type="button"
                          onClick={() => {
                            handleEdit(row, 'academics');
                            handleStudentChange(String(row.id));
                          }} 
                          style={{ padding: '6px 12px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          {formData.id === row.id ? 'Editing' : 'Evaluate'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3 + professorsData.length + 1} className="no-data" style={{ textAlign: 'center', padding: '20px' }}>No student evaluation records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}