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

  useEffect(() => {
    fetch('http://localhost:5000/api/students')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch from backend server');
        return res.json();
      })
      .then(data => setRows(data))
      .catch(err => {
        console.error('Error fetching students from PostgreSQL backend:', err);
      });
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

  // Strict submit handler sending ONLY student columns
  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
      // UPDATE student record (PUT)
      try {
        const response = await fetch(`http://localhost:5000/api/students/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanStudentPayload)
        });
        if (!response.ok) throw new Error('Failed to update student');
        
        const updatedStudent = await response.json();
        setRows(rows.map(row => (row.id === Number(formData.id) ? { ...updatedStudent, photoUrl: updatedStudent.photo_url } : row)));
        setIsEditing(false);
        alert('Student record updated successfully!');
      } catch (err) {
        console.error('Error updating student in database:', err);
        alert('Error updating student. Check if your Node server is running.');
      }
    } else {
      // CREATE new student record (POST)
      try {
        const response = await fetch('http://localhost:5000/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanStudentPayload)
        });
        if (!response.ok) throw new Error('Failed to create student');

        const newEntry = await response.json();
        setRows([...rows, { ...newEntry, photoUrl: newEntry.photo_url }]);
        alert('Student created successfully!');
      } catch (err) {
        console.error('Error creating student in database:', err);
        alert('Error saving student. Check if your Node server is running.');
      }
    }

    // Reset form state cleanly
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

  const handleEdit = (row, targetScreen = 'creation') => {
    setIsEditing(true);
    setFormData({ 
      id: row.id || null,
      first_name: row.first_name || '',
      last_name: row.last_name || '',
      email: row.email || '',
      course: row.course || '',
      batch: row.batch || '',
      district: row.district || '',
      phone: row.phone || '',
      photo_url: row.photo_url || row.photoUrl || '',
      photoUrl: row.photo_url || row.photoUrl || '',
      stephen: row.stephen || createDetailedSubsections(stephenKeys),
      rajshekar: row.rajshekar || createDetailedSubsections(rajkeys),
      sampath: row.sampath || createDetailedSubsections(sampathKeys)
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

        setRows(rows.filter(row => row.id !== id));
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

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('CBC-BTC Manager - Complete Records & Stay Schedule', 14, 12);

    const tableColumns = ['ID', 'Full Name', 'Email', 'Course / Batch', 'Phone', 'Post-Grad Stay Window'];
    const tableRows = rows.map(row => [
      row.id,
      `${row.first_name || ''} ${row.last_name || ''}`,
      row.email || 'N/A',
      `${row.course || 'N/A'} (Batch ${row.batch || 'N/A'})`,
      row.phone || 'N/A',
      `From: ${row.stay_start_date_time ? new Date(row.stay_start_date_time).toLocaleString() : 'N/A'}\nTo: ${row.stay_end_date_time ? new Date(row.stay_end_date_time).toLocaleString() : 'N/A'}`
    ]);

    autoTable(doc, { head: [tableColumns], body: tableRows, startY: 18, theme: 'grid' });
    doc.save('CBC_BTC_Complete_Records.pdf');
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
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;