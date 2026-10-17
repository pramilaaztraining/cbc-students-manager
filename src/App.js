import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './App.css';

import Header from './Header';
import Footer from './Footer';
import StudentFormScreen from './StudentFormScreen';
import AcademicEvaluationsScreen from './AcademicEvaluationsScreen';
import StayCalendarScreen from './StayCalendarScreen';

function App() {
  const createDetailedSubsections = (keys) => {
    const obj = {};
    keys.forEach(k => {
      obj[`${k}Exam`] = false;
      obj[`${k}Notes`] = false;
      obj[`${k}Classes`] = false;
      obj[`${k}Permissions`] = '';
      obj[`${k}VideoFileName`] = '';
    });
    return obj;
  };

  const stephenKeys = ['synoptic', 'actsEpistles', 'homiletics'];
  const rajkeys = ['law', 'history', 'poetic', 'prophetic'];
  const sampathKeys = ['loc', 'locChronological', 'evangelism'];

  const initialData = [
    {
      id: 1,
      name: 'A. Sadhana',
      district: 'Hyderabad',
      photoLink: 'A.Sadhana.jpg',
      photoUrl: '',
      phone: '9876543210',
      stephen: createDetailedSubsections(stephenKeys),
      rajshekar: createDetailedSubsections(rajkeys),
      sampath: createDetailedSubsections(sampathKeys),
      accommodation: '10-12 Jan',
      postGradStay: 'Staying after graduation for worship and campus assistance',
      stayStartDateTime: '2026-11-13T08:00',
      stayEndDateTime: '2026-11-15T20:00'
    }
  ];

  const [rows, setRows] = useState(() => {
    const saved = localStorage.getItem('cbc_students_complete_app_data');
    return saved ? JSON.parse(saved) : initialData;
  });

  const [formData, setFormData] = useState({
    id: null,
    name: '', district: '', phone: '',
    photoLink: '', photoUrl: '',
    stephen: createDetailedSubsections(stephenKeys),
    rajshekar: createDetailedSubsections(rajkeys),
    sampath: createDetailedSubsections(sampathKeys),
    accommodation: '',
    postGradStay: '',
    stayStartDateTime: '',
    stayEndDateTime: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [activeScreen, setActiveScreen] = useState('creation');
  const [calendarFilterDate, setCalendarFilterDate] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('cbc_students_complete_app_data', JSON.stringify(rows));
    } catch (e) {
      console.error('Storage quota reached');
    }
  }, [rows]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photoLink: file.name,
          photoUrl: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    if (formData.id && Number(formData.id) > 0) {
      // Update existing record by ID
      setRows(rows.map(row => (row.id === Number(formData.id) ? { ...formData } : row)));
      setIsEditing(false);
    } else {
      // Generate next sequential positive ID starting from 1 (strictly excluding 0 or negative values)
      const validIds = rows.map(r => Number(r.id)).filter(id => !isNaN(id) && id > 0);
      const nextId = validIds.length > 0 ? Math.max(...validIds) + 1 : 1;
      
      const newEntry = { ...formData, id: nextId };
      setRows([...rows, newEntry]);
    }

    setFormData({
      id: null,
      name: '', district: '', phone: '',
      photoLink: '', photoUrl: '',
      stephen: createDetailedSubsections(stephenKeys),
      rajshekar: createDetailedSubsections(rajkeys),
      sampath: createDetailedSubsections(sampathKeys),
      accommodation: '',
      postGradStay: '',
      stayStartDateTime: '',
      stayEndDateTime: ''
    });
  };

  const handleEdit = (row, targetScreen = 'creation') => {
    setIsEditing(true);
    setFormData({ ...row });
    setActiveScreen(targetScreen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete student ID: ${id}?`)) {
      setRows(rows.filter(row => row.id !== id));
      if (formData.id === id) {
        setIsEditing(false);
        setFormData({
          id: null,
          name: '', district: '', phone: '', photoLink: '', photoUrl: '',
          stephen: createDetailedSubsections(stephenKeys),
          rajshekar: createDetailedSubsections(rajkeys),
          sampath: createDetailedSubsections(sampathKeys),
          accommodation: '', postGradStay: '', stayStartDateTime: '', stayEndDateTime: ''
        });
      }
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('CBC-BTC Manager - Complete Records & Stay Schedule', 14, 12);

    const tableColumns = ['ID', 'Name', 'District', 'Phone', 'Post-Grad Stay Window'];
    const tableRows = rows.map(row => [
      row.id,
      row.name,
      row.district || '',
      row.phone || '',
      `From: ${row.stayStartDateTime ? new Date(row.stayStartDateTime).toLocaleString() : 'N/A'}\nTo: ${row.stayEndDateTime ? new Date(row.stayEndDateTime).toLocaleString() : 'N/A'}`
    ]);

    autoTable(doc, { head: [tableColumns], body: tableRows, startY: 18, theme: 'grid' });
    doc.save('CBC_BTC_Complete_Records.pdf');
  };

  const filteredCalendarRows = rows.filter(row => {
    if (!calendarFilterDate) return true;
    if (!row.stayStartDateTime || !row.stayEndDateTime) return false;
    const filterDateOnly = calendarFilterDate;
    const startDateOnly = row.stayStartDateTime.split('T')[0];
    const endDateOnly = row.stayEndDateTime.split('T')[0];
    return filterDateOnly >= startDateOnly && filterDateOnly <= endDateOnly;
  });

  return (
    <div className="app-layout">
      <Header 
        activeScreen={activeScreen} 
        setActiveScreen={setActiveScreen} 
        exportToPDF={exportToPDF} 
      />

      <main className="container">
        {activeScreen === 'creation' && (
          <StudentFormScreen 
            formData={formData} 
            setFormData={setFormData} 
            isEditing={isEditing} 
            handleSubmit={handleSubmit} 
            handleFileChange={handleFileChange} 
            handleChange={handleChange} 
            rows={rows} 
            handleEdit={(row) => handleEdit(row, 'creation')} 
            handleDelete={handleDelete} 
            setIsEditing={setIsEditing} 
            createDetailedSubsections={createDetailedSubsections} 
            stephenKeys={stephenKeys} 
            rajkeys={rajkeys} 
            sampathKeys={sampathKeys} 
          />
        )}

        {activeScreen === 'academics' && (
          <AcademicEvaluationsScreen 
            formData={formData} 
            setFormData={setFormData}
            handleSubmit={handleSubmit} 
            rows={rows} 
            handleEdit={(row) => handleEdit(row, 'academics')}
            stephenKeys={stephenKeys} 
            rajkeys={rajkeys} 
            sampathKeys={sampathKeys} 
          />
        )}

        {activeScreen === 'stayCalendar' && (
          <StayCalendarScreen 
            formData={formData} 
            setFormData={setFormData}
            handleChange={handleChange} 
            handleSubmit={handleSubmit} 
            rows={rows}
            handleEdit={(row) => handleEdit(row, 'stayCalendar')}
            calendarFilterDate={calendarFilterDate} 
            setCalendarFilterDate={setCalendarFilterDate} 
            filteredCalendarRows={filteredCalendarRows} 
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;