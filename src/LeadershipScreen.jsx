import React from 'react';
import './LeadershipScreen.css';

export default function LeadershipScreen() {
  return (
    <div className="leadership-page-wrapper">
      
      {/* Introduction / Header Card */}
      <div className="leadership-intro-card">
        <span className="intro-tag">SHEPHERDING & CARE</span>
        <h1 className="intro-title">Our Leadership</h1>
        <p className="intro-desc">
          Serving the church through faithful teaching, shepherding, prayer, and pastoral care.
        </p>
      </div>

      {/* Leader 1: Prof. Stephen Suresh Babu */}
      <div className="leader-profile-card">
        <div className="leader-card-header">
          <div className="leader-avatar">SB</div>
          <div className="leader-title-area">
            <span className="leader-badge">FACULTY & DIRECTOR</span>
            <h2 className="leader-name">Prof. Stephen Suresh Babu, Director of CBC</h2>
            <p className="leader-short-bio">M.Th; M.Tech; M.Div</p>
            <p className="leader-short-bio">Contact Phone: +91 8074852725</p>
          </div>
        </div>

        <div className="leader-quote-box">
          <p>
            <em>"Prof. Stephen Suresh Babu serves in leadership and academic administration, dedicated to equipping students through sound theological instruction and discipleship."</em>
          </p>
        </div>

        <div className="leader-bio-content">
          <p>
            Dedicated to faithful teaching and mentoring, providing students with a deep foundation in scripture, sound theology, and practical ministry training.
          </p>
        </div>
      </div>

      {/* Leader 2: Prof. Rajshekar Sir */}
      <div className="leader-profile-card">
        <div className="leader-card-header">
          <div className="leader-avatar">RS</div>
          <div className="leader-title-area">
            <span className="leader-badge">FACULTY & INSTRUCTOR</span>
            <h2 className="leader-name">Prof. Raja Shekar</h2>
                        <p className="leader-short-bio">M.Th; M.Div</p>
            <p className="leader-short-bio">Contact Phone: +91 8885831588</p>
          </div>
        </div>

        <div className="leader-quote-box">
          <p>
            <em>"Prof. Raja Shekar brings extensive experience in biblical studies and instruction, guiding students through rigorous curriculum studies and spiritual formation."</em>
          </p>
        </div>

        <div className="leader-bio-content">
          <p>
            Passionate about theological education and student development, helping shape the next generation of Christian leaders and workers through dedicated classroom instruction.
          </p>
        </div>
      </div>

    </div>
  );
}