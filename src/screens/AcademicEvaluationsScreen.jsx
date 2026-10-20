import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import StudentSelectDropdown from './StudentSelectDropdown';
import './AcademicEvaluationsScreen.css';

export default function AcademicEvaluationsScreen({ 
  formData, 
  setFormData, 
  handleSubmit, 
  rows, 
  handleEdit 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [professorsData, setProfessorsData] = useState([]);
  const [loadingProfessors, setLoadingProfessors] = useState(true);
  const [error, setError] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({});

  useEffect(() => {
    const fetchDatabaseConfigs = async () => {
      try {
        setLoadingProfessors(true);
        const res = await fetch('http://localhost:5000/api/professor-subjects');
        if (!res.ok) throw new Error('Failed to fetch professor configurations from database.');
        
        const data = await res.json();
        setProfessorsData(data);

        const initialCollapseState = {};
        data.forEach((prof, index) => {
          initialCollapseState[prof.lecturerKey] = index !== 0;
        });
        setCollapsedSections(initialCollapseState);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingProfessors(false);
      }
    };

    fetchDatabaseConfigs();
  }, []);

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
      // Fetch specific student evaluation records from DB
      try {
        const res = await fetch(`http://localhost:5000/api/evaluations/${val}`);
        const evaluations = await res.json();
        setFormData({ ...found, evaluations });
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

  const filteredSummaryRows = rows.filter(row => 
    (row.first_name && row.first_name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (row.last_name && row.last_name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    String(row.id).includes(searchTerm)
  );

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('Academic Records Summary', 14, 15);

    const tableRows = filteredSummaryRows.map((row, index) => [
      row.id || index + 1,
      `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'N/A',
      row.district || 'N/A',
      ...professorsData.map(prof => 'Recorded')
    ]);

    autoTable(doc, {
      head: [['ID', 'Full Name', 'District', ...professorsData.map(p => p.lecturerName)]],
      body: tableRows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 }
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

      <form onSubmit={handleSubmit} className="form-card">
        <h3>
          Update Academic Evaluations for: <span className="selected-student">{studentFullName || 'Select a student below'}</span>
          {formData.id && <span style={{ fontSize: '0.85rem', color: '#2563eb', marginLeft: '10px' }}>[Target ID: {formData.id}]</span>}
        </h3>

        {/* Separated Student Component */}
        <StudentSelectDropdown 
          rows={rows} 
          selectedStudentId={selectedStudentId} 
          onStudentChange={handleStudentChange} 
        />

        <div className="professors-section-wrapper" style={{ marginTop: '20px' }}>
          {loadingProfessors ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>Loading professors and subjects from database...</p>
          ) : error ? (
            <p style={{ textAlign: 'center', color: '#ef4444' }}>Error: {error}</p>
          ) : (
            professorsData.map(prof => (
              <div key={prof.lecturerKey} className="collapsible-panel">
                <div className="panel-header" onClick={() => toggleSection(prof.lecturerKey)}>
                  <span className="panel-title">Lecturer: <strong>{prof.lecturerName}</strong></span>
                  <span className="toggle-icon">{collapsedSections[prof.lecturerKey] ? '▼' : '▲'}</span>
                </div>
                {!collapsedSections[prof.lecturerKey] && (
                  <div className="panel-body">
                    <div className="subjects-grid">
                      {prof.subjects.map((sub) => {
                        const lecturerData = formData[prof.lecturerKey] || {};
                        return (
                          <div key={sub.key} className="subject-card">
                            <h4 className="subject-title">{sub.label} {sub.telugu && <span>({sub.telugu})</span>}</h4>
                            <div className="checkbox-group">
                              <label>
                                <input type="checkbox" checked={!!lecturerData[`${sub.key}Exam`]} onChange={(e) => handleChange(e, prof.lecturerKey, `${sub.key}Exam`, 'checkbox')} /> Exam Completed
                              </label>
                              <label>
                                <input type="checkbox" checked={!!lecturerData[`${sub.key}Notes`]} onChange={(e) => handleChange(e, prof.lecturerKey, `${sub.key}Notes`, 'checkbox')} /> Notes Completed
                              </label>
                              <label>
                                <input type="checkbox" checked={!!lecturerData[`${sub.key}Classes`]} onChange={(e) => handleChange(e, prof.lecturerKey, `${sub.key}Classes`, 'checkbox')} /> All Classes Attended
                              </label>
                            </div>
                            <div className="permissions-row">
                              <span>Permissions:</span>
                              <input type="number" min="0" value={lecturerData[`${sub.key}Permissions`] || 0} onChange={(e) => handleChange(e, prof.lecturerKey, `${sub.key}Permissions`, 'number')} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <button type="submit" className="save-btn" style={{ marginTop: '20px' }}>
          {formData.id ? `Update Academic Records [ID: ${formData.id}]` : 'Save Academic Records'}
        </button>
      </form>
    </div>
  );
}