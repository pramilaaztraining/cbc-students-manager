import React, { useState } from 'react';
import Navbar from './Navbar';               // 1. Import your Navbar component
import FloatingSocialBar from './FloatingSocialBar'; // (Optional floating social bar)
import Footer from './Footer';                 // Import your Footer component
import StayCalendarScreen from './StayCalendarScreen';
import AcademicEvaluationsScreen from './AcademicEvaluationsScreen';
import './Navbar.css';
import './Footer.css';
import './FloatingSocialBar.css';

export default function App() {
  const [isStayConfigured, setIsStayConfigured] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', familyStay: {} });
  const [rows, setRows] = useState([]);
  const [calendarFilterDate, setCalendarFilterDate] = useState('');

  // Sample handlers (replace with your actual app logic)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Form saved successfully!');
  };

  const handleEdit = (row, section) => {
    setFormData(row);
  };

  const filteredCalendarRows = rows.filter(r => !calendarFilterDate || r.stayStartDateTime?.includes(calendarFilterDate));

  return (
    <div className="app-layout">
      {/* 2. Display the floating Navbar right here at the top */}
      <Navbar />

      {/* Main Container / Content */}
      <div className="container">
        
        {/* Section 3 (Stay & Calendar - The Gatekeeper) */}
        <StayCalendarScreen 
          formData={formData}
          setFormData={setFormData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          rows={rows}
          handleEdit={handleEdit}
          calendarFilterDate={calendarFilterDate}
          setCalendarFilterDate={setCalendarFilterDate}
          filteredCalendarRows={filteredCalendarRows}
          setIsStayConfigured={setIsStayConfigured}
        />

        {/* Section 2 (Academic Evaluations - Locked until Section 3 is configured) */}
        <AcademicEvaluationsScreen 
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          rows={rows}
          handleEdit={handleEdit}
          stephenKeys={[{ key: 'synoptic' }, { key: 'actsEpistles' }, { key: 'homiletics' }]}
          rajkeys={[{ key: 'law' }, { key: 'history' }, { key: 'poetic' }, { key: 'prophetic' }]}
          sampathKeys={[{ key: 'loc' }, { key: 'locChronological' }, { key: 'evangelism' }]}
          isStayConfigured={isStayConfigured}
        />

      </div>

      {/* Floating social sidebar that stays sticky throughout page scroll */}
      <FloatingSocialBar />

      {/* Footer */}
      <Footer />
    </div>
  );
}