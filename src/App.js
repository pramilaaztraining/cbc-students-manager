import React, { useState } from 'react';
import Navbar from './Navbar';
import ContactScreen from './ContactScreen'; // Import your new contact component
import StayCalendarScreen from './StayCalendarScreen';
import AcademicEvaluationsScreen from './AcademicEvaluationsScreen';
import FloatingSocialBar from './FloatingSocialBar';
import Footer from './Footer';

import './Navbar.css';
import './ContactScreen.css';
import './Footer.css';
import './FloatingSocialBar.css';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home' or 'contact'
  const [isStayConfigured, setIsStayConfigured] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', familyStay: {} });
  const [rows, setRows] = useState([]);
  const [calendarFilterDate, setCalendarFilterDate] = useState('');

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
      {/* Navbar receives the screen switcher */}
      <Navbar setCurrentScreen={setCurrentScreen} />

      <div className="container">
        {currentScreen === 'contact' ? (
          /* Show Contact Page when 'contact' is selected */
          <ContactScreen />
        ) : (
          /* Show Main App Sections when on 'home' */
          <>
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
          </>
        )}
      </div>

      <FloatingSocialBar />
      <Footer />
    </div>
  );
}