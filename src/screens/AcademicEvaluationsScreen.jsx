import React, { useState, useEffect } from 'react';

export default function AcademicEvaluationsManager() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [professorsData, setProfessorsData] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [summaryRecords, setSummaryRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch student directory, professor configurations, and summary records on mount
  useEffect(() => {
    const loadManagerData = async () => {
      try {
        const studentsRes = await fetch('/api/students');
        const studentsList = await studentsRes.json();
        setStudents(studentsList || []);

        const profRes = await fetch('/api/professor-configurations');
        const profConfigs = await profRes.json();

        const groupedByLecturer = {};
        const initialEvalState = {};

        (profConfigs || []).forEach(item => {
          const { lecturer_name, subject_key } = item;
          if (!groupedByLecturer[lecturer_name]) {
            groupedByLecturer[lecturer_name] = [];
          }
          groupedByLecturer[lecturer_name].push(subject_key);

          initialEvalState[subject_key] = {
            lecturer_name,
            exam: false,
            notes: false,
            classes: false,
            permissions: "0",
            videoFile: null
          };
        });

        setProfessorsData(groupedByLecturer);
        setEvaluations(initialEvalState);

        fetchSummaryRecords();
        setLoading(false);
      } catch (error) {
        console.error('Error loading manager data:', error);
        setLoading(false);
      }
    };

    loadManagerData();
  }, []);

  const fetchSummaryRecords = async () => {
    try {
      const res = await fetch('/api/academic-summary');
      if (res.ok) {
        const data = await res.json();
        setSummaryRecords(data);
      }
    } catch (err) {
      console.error('Failed to load summary records:', err);
    }
  };

  // 2. Fetch saved evaluations whenever a student is chosen from the directory
  useEffect(() => {
    if (!selectedStudentId) return;

    const fetchStudentEvals = async () => {
      try {
        const response = await fetch(`/api/student-evaluations/${selectedStudentId}`);
        if (!response.ok) return;
        const savedRecords = await response.json();

        setEvaluations(prev => {
          const updated = { ...prev };
          
          Object.keys(updated).forEach(key => {
            updated[key] = {
              ...updated[key],
              exam: false,
              notes: false,
              classes: false,
              permissions: "0",
              videoFile: null
            };
          });

          (savedRecords || []).forEach(record => {
            if (updated[record.subject_key]) {
              updated[record.subject_key] = {
                ...updated[record.subject_key],
                exam: record.exam,
                notes: record.notes,
                classes: record.classes,
                permissions: record.permissions || "0",
                videoFile: record.video_file_name ? { name: record.video_file_name } : null
              };
            }
          });

          return updated;
        });
      } catch (err) {
        console.error('Error loading student evaluations:', err);
      }
    };

    fetchStudentEvals();
  }, [selectedStudentId]);

  const handleCheckboxChange = (subjectKey, field) => {
    setEvaluations(prev => ({
      ...prev,
      [subjectKey]: {
        ...prev[subjectKey],
        [field]: !prev[subjectKey][field]
      }
    }));
  };

  const handlePermissionsChange = (subjectKey, value) => {
    setEvaluations(prev => ({
      ...prev,
      [subjectKey]: {
        ...prev[subjectKey],
        permissions: value
      }
    }));
  };

  const handleSaveAcademicRecords = async () => {
    if (!selectedStudentId) {
      alert('Please select a student from the directory first.');
      return;
    }

    try {
      const payload = Object.keys(evaluations).map(subjectKey => ({
        student_id: Number(selectedStudentId),
        lecturer_name: evaluations[subjectKey].lecturer_name,
        subject_key: subjectKey,
        exam: evaluations[subjectKey].exam,
        notes: evaluations[subjectKey].notes,
        classes: evaluations[subjectKey].classes,
        permissions: evaluations[subjectKey].permissions,
        video_file_name: evaluations[subjectKey].videoFile ? evaluations[subjectKey].videoFile.name : null
      }));

      const response = await fetch('/api/student-evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save records to database.');

      alert('Academic records saved successfully!');
      fetchSummaryRecords();
    } catch (error) {
      console.error(error);
      alert('Error saving academic records.');
    }
  };

  // Filter students based on Quick Search Table input
  const filteredStudents = students.filter(student => 
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(student.id).includes(searchTerm)
  );

  if (loading) {
    return <div className="p-8 text-center text-gray-600 font-medium">Loading Academic Manager...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl font-sans">
      
      {/* SECTION HEADER */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1">Section 2: Academic Evaluations</h3>
        <p className="text-sm text-gray-600">Search for a student to edit/update their academic evaluations, exams, and notes.</p>
      </div>

      {/* QUICK SEARCH TABLE CONTAINER */}
      <div className="bg-white shadow rounded-lg p-6 mb-6 border border-gray-200">
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          🔍 Quick Search Table <span className="text-xs font-normal text-gray-500">(పట్టికను వెతకండి)</span>
        </label>
        <input 
          type="text" 
          placeholder="Type name or ID to filter table..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border rounded-md px-3 py-2 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* UPDATE ACADEMIC EVALUATIONS CONTAINER */}
      <div className="bg-white shadow rounded-lg p-6 mb-6 border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-4 text-base">
          Update Academic Evaluations for: <span className="text-blue-600 font-bold">{selectedStudentId ? `Student ID: ${selectedStudentId}` : 'Select a student below'}</span>
        </h4>

        <div className="mb-6">
          <label className="block text-xs text-gray-600 mb-1 font-medium">
            Select Student from Directory జాబితా నుండి విద్యార్థిని ఎన్నుకోండి
          </label>
          <select 
            value={selectedStudentId} 
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full border rounded-md px-3 py-2.5 bg-white text-sm shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Choose student from directory --</option>
            {filteredStudents.map(student => (
              <option key={student.id} value={student.id}>
                ID: {student.id} - {student.full_name}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Professor & Subject Cards (Loads when student is selected) */}
        {selectedStudentId && (
          <div className="space-y-6 mb-6">
            {Object.keys(professorsData).map(lecturerName => (
              <div key={lecturerName} className="border p-4 rounded-lg bg-gray-50">
                <h4 className="font-bold text-base mb-4 text-blue-900">Lecturer: {lecturerName}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {professorsData[lecturerName].map(subjectKey => {
                    const subState = evaluations[subjectKey] || {};
                    return (
                      <div key={subjectKey} className="bg-white p-4 rounded-md border shadow-sm flex flex-col justify-between">
                        <div>
                          <h5 className="font-semibold mb-2 capitalize text-gray-800 text-sm">{subjectKey}</h5>
                          <label className="block text-xs mb-1.5 text-gray-700 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={subState.exam || false} 
                              onChange={() => handleCheckboxChange(subjectKey, 'exam')}
                              className="mr-2 rounded border-gray-300"
                            /> Exam Completed
                          </label>
                          <label className="block text-xs mb-1.5 text-gray-700 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={subState.notes || false} 
                              onChange={() => handleCheckboxChange(subjectKey, 'notes')}
                              className="mr-2 rounded border-gray-300"
                            /> Notes Completed
                          </label>
                          <label className="block text-xs mb-3 text-gray-700 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={subState.classes || false} 
                              onChange={() => handleCheckboxChange(subjectKey, 'classes')}
                              className="mr-2 rounded border-gray-300"
                            /> All Classes Attended
                          </label>
                          <div className="text-xs text-gray-700 flex items-center">
                            <span>Permissions:</span>
                            <input 
                              type="text" 
                              value={subState.permissions ?? "0"} 
                              onChange={(e) => handlePermissionsChange(subjectKey, e.target.value)}
                              className="ml-2 border rounded px-2 py-1 w-14 text-center text-xs bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                </div>
              </div>
            ))}
          </div>
        )}

        <button 
          onClick={handleSaveAcademicRecords}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-5 py-2.5 rounded-md transition shadow-sm"
        >
          Save Academic Records
        </button>
      </div>

      {/* ACADEMIC RECORDS SUMMARY GRID TABLE CONTAINER */}
      <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Academic Records Summary</h3>
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm">
            📥 Export Table to PDF
          </button>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white text-xs font-semibold">
                <th className="py-3 px-4 border-r border-blue-500 w-16">ID</th>
                <th className="py-3 px-4 border-r border-blue-500 w-48">Name</th>
                <th className="py-3 px-4 border-r border-blue-500 w-36">District</th>
                <th className="py-3 px-4 border-r border-blue-500">Prof Stephen</th>
                <th className="py-3 px-4 border-r border-blue-500">Prof Rajshekar</th>
                <th className="py-3 px-4">Prof Sampath</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs">
              {summaryRecords.length > 0 ? (
                summaryRecords.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50/50">
                    <td className="py-4 px-4 align-top font-medium text-gray-900 border-r">{record.id}</td>
                    <td className="py-4 px-4 align-top font-medium text-gray-900 border-r">{record.full_name}</td>
                    <td className="py-4 px-4 align-top text-gray-600 border-r">{record.district}</td>
                    
                    {/* Prof Stephen Column */}
                    <td className="py-4 px-4 align-top text-gray-700 border-r space-y-3">
                      {record.evaluations?.filter(e => e.lecturer_name?.includes('Stephen')).map(ev => (
                        <div key={ev.subject_key} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                          <p className="font-semibold text-gray-900 capitalize">{ev.subject_key}</p>
                          <p className="text-gray-500 text-[11px]">
                            Ex: [{ev.exam ? 'Yes' : 'No'}] | Notes: [{ev.notes ? 'Yes' : 'No'}] | Classes: [{ev.classes ? 'Yes' : 'No'}]<br />
                            Permissions: {ev.permissions}
                          </p>
                        </div>
                      ))}
                    </td>

                    {/* Prof Rajshekar Column */}
                    <td className="py-4 px-4 align-top text-gray-700 border-r space-y-3">
                      {record.evaluations?.filter(e => e.lecturer_name?.includes('Rajshekar')).map(ev => (
                        <div key={ev.subject_key} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                          <p className="font-semibold text-gray-900 capitalize">{ev.subject_key}</p>
                          <p className="text-gray-500 text-[11px]">
                            Ex: [{ev.exam ? 'Yes' : 'No'}] | Notes: [{ev.notes ? 'Yes' : 'No'}] | Classes: [{ev.classes ? 'Yes' : 'No'}]<br />
                            Permissions: {ev.permissions}
                          </p>
                        </div>
                      ))}
                    </td>

                    {/* Prof Sampath Column */}
                    <td className="py-4 px-4 align-top text-gray-700 space-y-3">
                      {record.evaluations?.filter(e => e.lecturer_name?.includes('Sampath')).map(ev => (
                        <div key={ev.subject_key} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                          <p className="font-semibold text-gray-900 capitalize">{ev.subject_key}</p>
                          <p className="text-gray-500 text-[11px]">
                            Ex: [{ev.exam ? 'Yes' : 'No'}] | Notes: [{ev.notes ? 'Yes' : 'No'}] | Classes: [{ev.classes ? 'Yes' : 'No'}]<br />
                            Permissions: {ev.permissions}
                          </p>
                        </div>
                      ))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}