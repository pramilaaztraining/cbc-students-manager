import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import Navbar from './components/Navbar';
import ContactScreen from './screens/ContactScreen';
import LeadershipScreen from './screens/LeadershipScreen';
import StayCalendarScreen from './screens/StayCalendarScreen';
import AcademicEvaluationsScreen from './screens/AcademicEvaluationsScreen';
import FloatingSocialBar from './components/FloatingSocialBar';
import FlashAnnouncement from './components/FlashAnnouncement';
import CoursesScreen from './screens/CoursesScreen';
import HomeScreen from './screens/HomeScreen';

import Header from './components/Header';
import Footer from './components/Footer';
import StudentFormScreen from './screens/StudentFormScreen';

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

  const [rows, setRows] = useState([]);

  const [formData, setFormData] = useState({
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
    stephen: createDetailedSubsections(stephenKeys),
    rajshekar: createDetailedSubsections(rajkeys),
    sampath: createDetailedSubsections(sampathKeys),
    accommodation: '',
    postGradStay: '',
    stayStartDateTime: '',
    stayEndDateTime: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [activeScreen, setActiveScreen] = useState('home');
  const [calendarFilterDate, setCalendarFilterDate] = useState('');

  const fetchStudents = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/students');
      if (!res.ok) throw new Error('Failed to fetch from backend server');
      const data = await res.json();
      setRows([...data]);
    } catch (err) {
      console.error('Error fetching students from PostgreSQL backend:', err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (activeScreen === 'academics') {
      if (!formData.id) {
        alert('Please select a student from the directory first.');
        return;
      }
      try {
        const response = await fetch(`http://localhost:5000/api/evaluations/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!response.ok) throw new Error('Failed to save academic evaluations');
        
        alert('Academic evaluations saved successfully to database!');
        setActiveScreen('academics');
        return;
      } catch (err) {
        console.error('Error saving evaluations:', err);
        alert('Error saving academic evaluations.');
        return;
      }
    }

    if (!formData.first_name || !formData.batch || !formData.course || !formData.district || (!formData.photoUrl && !formData.photo_url)) {
      alert('Please fill in all mandatory fields: First Name, Course, Batch, District, and Upload Photo.');
      return;
    }

    const activePhoto = formData.photoUrl || formData.photo_url || formData.photoLink;

    const cleanStudentPayload = {
      first_name: formData.first_name || '',
      last_name: formData.last_name || '',
      district: formData.district || '',
      phone: formData.phone || '',
      email: formData.email || '',
      course: formData.course || '',
      batch: formData.batch || '',
      photo_url: activePhoto
    };

    if (formData.id && Number(formData.id) > 0) {
      try {
        const response = await fetch(`http://localhost:5000/api/students/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanStudentPayload)
        });
        if (!response.ok) throw new Error('Failed to update student');
        
        await fetchStudents();
        setIsEditing(false);
        alert('Student record updated successfully!');
      } catch (err) {
        console.error('Error updating student in database:', err);
        alert('Error updating student.');
      }
    } else {
      try {
        const response = await fetch('http://localhost:5000/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanStudentPayload)
        });
        if (!response.ok) throw new Error('Failed to create student');

        await fetchStudents();
        alert('Student created successfully!');
      } catch (err) {
        console.error('Error creating student in database:', err);
        alert('Error saving student.');
      }
    }

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
      stephen: createDetailedSubsections(stephenKeys),
      rajshekar: createDetailedSubsections(rajkeys),
      sampath: createDetailedSubsections(sampathKeys),
      accommodation: '',
      postGradStay: '',
      stayStartDateTime: '',
      stayEndDateTime: ''
    });
  };

  const handleEdit = async (row, targetScreen = 'creation') => {
    setIsEditing(true);
    let evaluationData = {};
    
    if (targetScreen === 'academics') {
      try {
        const res = await fetch(`http://localhost:5000/api/evaluations/${row.id}`);
        if (res.ok) {
          evaluationData = await res.json();
        }
      } catch (err) {
        console.error('Error fetching evaluations on edit:', err);
      }
    }

    setFormData({ 
      ...row,
      ...evaluationData,
      stephen: evaluationData.stephen || row.stephen || createDetailedSubsections(stephenKeys),
      rajshekar: evaluationData.rajshekar || row.rajshekar || createDetailedSubsections(rajkeys),
      sampath: evaluationData.sampath || row.sampath || createDetailedSubsections(sampathKeys)
    });
    
    setActiveScreen(targetScreen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete student ID: ${id}?`)) {
      try {
        const response = await fetch(`http://localhost:5000/api/students/${id}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete student');

        await fetchStudents();
        if (formData.id === id) {
          setIsEditing(false);
          setFormData({
            id: null,
            first_name: '', last_name: '', email: '', course: '', batch: '', district: '', phone: '', photoLink: '', photoUrl: '',
            stephen: createDetailedSubsections(stephenKeys),
            rajshekar: createDetailedSubsections(rajkeys),
            sampath: createDetailedSubsections(sampathKeys),
            accommodation: '', postGradStay: '', stayStartDateTime: '', stayEndDateTime: ''
          });
        }
      } catch (err) {
        console.error('Error deleting student from database:', err);
        alert('Error deleting student.');
      }
    }
  };

  const formatFamilySummaryForPDF = (stayDetails) => {
    if (!stayDetails || typeof stayDetails !== 'object') return 'None';
    const parents = [];
    if (stayDetails.mother) parents.push('Mother');
    if (stayDetails.father) parents.push('Father');
    if (stayDetails.guardian) parents.push('Guardian');

    const parts = [];
    if (parents.length > 0) parts.push(`Parents: ${parents.join(', ')}`);
    if (Number(stayDetails.childrenCount) > 0) parts.push(`Children: ${stayDetails.childrenCount}`);
    if (Number(stayDetails.brothersCount) > 0) parts.push(`Brothers: ${stayDetails.brothersCount}`);
    if (Number(stayDetails.sistersCount) > 0) parts.push(`Sisters: ${stayDetails.sistersCount}`);

    return parts.length > 0 ? parts.join(' | ') : 'None';
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('CBC-BTC Manager - Campus Stay & Schedule Records', 14, 12);

    const tableColumns = ['ID', 'Student Name', 'District', 'Stay Window', 'Family Members', 'Stay Notes'];
    const tableRows = rows.map(row => [
      row.id,
      `${row.first_name || ''} ${row.last_name || ''}`,
      row.district || 'N/A',
      row.stay_start_date_time && row.stay_end_date_time 
        ? `From: ${new Date(row.stay_start_date_time).toLocaleString()}\nTo: ${new Date(row.stay_end_date_time).toLocaleString()}` 
        : 'Window not set',
      formatFamilySummaryForPDF(row.stay_details),
      row.stay_details?.stayNotes || 'No notes'
    ]);

    autoTable(doc, { 
      head: [tableColumns], 
      body: tableRows, 
      startY: 18, 
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [37, 99, 235] }
    });
    doc.save('CBC_BTC_Campus_Stay_Records.pdf');
  };

  const filteredCalendarRows = rows.filter(row => {
    if (!calendarFilterDate) return true;
    if (!row.stay_start_date_time || !row.stay_end_date_time) return false;
    const filterDateOnly = calendarFilterDate;
    const startDateOnly = row.stay_start_date_time.split('T')[0];
    const endDateOnly = row.stay_end_date_time.split('T')[0];
    return filterDateOnly >= startDateOnly && filterDateOnly <= endDateOnly;
  });

  const isManagerScreen = !['home', 'courses', 'contact', 'leadership'].includes(activeScreen);

  return (
    <div className="app-layout">
      <FloatingSocialBar />
      
      <div className="sticky-top-all-container">
        <Navbar activeScreen={activeScreen} setCurrentScreen={setActiveScreen} />
        <FlashAnnouncement />
        {isManagerScreen && (
          <Header 
            activeScreen={activeScreen} 
            setActiveScreen={setActiveScreen} 
            exportToPDF={exportToPDF} 
          />
        )}
      </div>

      <main className="container">
        {activeScreen === 'home' ? (
          <HomeScreen setActiveScreen={setActiveScreen} />
        ) : activeScreen === 'courses' ? (
          <CoursesScreen />
        ) : activeScreen === 'contact' ? (
          <ContactScreen />
        ) : activeScreen === 'leadership' ? (
          <LeadershipScreen />
        ) : (
          <>
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
              />
            )}

            {activeScreen === 'academics' && (
              <AcademicEvaluationsScreen 
                formData={formData} 
                setFormData={setFormData}
                handleSubmit={handleSubmit} 
                rows={rows} 
                handleEdit={(row) => handleEdit(row, 'academics')}
              />
            )}

            {activeScreen === 'stayCalendar' && (
              <StayCalendarScreen 
                rows={rows} 
                refreshStudents={fetchStudents}
                handleEdit={handleEdit}
                calendarFilterDate={calendarFilterDate} 
                setCalendarFilterDate={setCalendarFilterDate} 
                filteredCalendarRows={filteredCalendarRows} 
              />
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;