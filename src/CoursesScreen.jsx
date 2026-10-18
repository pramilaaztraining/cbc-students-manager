import React from 'react';
import './CoursesScreen.css';

export default function CoursesScreen() {
  return (
    <div className="courses-screen-wrapper">
      <div className="courses-header">
        <h2>Christ Bible College - Courses Offered</h2>
        <p className="courses-subtitle">Admissions Open – Register Now! (అడ్మిషన్లు ప్రారంభం)</p>
      </div>

      <div className="courses-grid-card">
        {/* Course 1 */}
        <div className="course-item-box">
          <span className="course-number">1</span>
          <div className="course-details">
            <h3>B.Th - Bachelor of Theology (Online)</h3>
            <p className="institution-name">Christ Bible College</p>
            <p className="course-duration">⏱️ Duration: Three and Half Years</p>
          </div>
        </div>

        {/* Course 2 */}
        <div className="course-item-box highlight-box">
          <span className="course-number">2</span>
          <div className="course-details">
            <h3>Certificate In Evangelism and Church Planting Course</h3>
            <p className="course-duration">⏱️ 3 Months (90 Days) — Available in Campus / Online / Off-line / Correspondence</p>
            <p className="course-badge">✅ ఉచిత Admission, Tuition Fee & Bible Study Books</p>
          </div>
        </div>
      </div>

      {/* Contact & Registration Footer Box */}
      <div className="courses-contact-box">
        <h3>📞 Admissions & Registration Contact</h3>
        <p className="whatsapp-info">💬 WhatsApp: <strong>8074852725</strong></p>
        <p className="location-info">📍 Location: Hindupur, Anantapuram District, Andhra Pradesh</p>
        <p className="instagram-info">📸 Instagram: @BIBLE_SCHOOL_EBS</p>
      </div>
    </div>
  );
}