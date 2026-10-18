import React from 'react';
import './LeadershipScreen.css';

export default function LeadershipScreen() {
  return (
    <div className="leadership-page-wrapper">
      <div className="leadership-intro-card">
        <span className="intro-tag">SHEPHERDING & CARE</span>
        <h1 className="intro-title">Our Leadership</h1>
        <p className="intro-desc">
          Serving the church through faithful teaching, shepherding, prayer, and pastoral care.
        </p>
      </div>

      <div className="leader-profile-card">
        <div className="leader-card-header">
          <div className="leader-avatar">DG</div>
          <div className="leader-title-area">
            <span className="leader-badge">PASTOR-TEACHER</span>
            <h2 className="leader-name">Daril Gona</h2>
            <p className="leader-short-bio">
              Ordained by Christ Community Church, Daril was sent to plant a new church in Electronic City, Bangalore.
            </p>
          </div>
        </div>

        <div className="leader-quote-box">
          <p>
            <em>Daril Gona is happily married to Sharon Gona, and they are blessed with 2 children – Liora and Jeffrey.</em>
          </p>
        </div>

        <div className="leader-bio-content">
          <p>
            Born and raised in a Christian family in Andhra Pradesh, Daril came to know the Lord in his early twenties. After a brief career in the IT industry, his passion to share the gospel led him to join Youth for Christ in Hyderabad, marking the start of his ministry journey.
          </p>
          <p>
            To deepen his understanding, Daril pursued formal theological training at a Pastoral Training Seminary, Goa. After graduating, he served in a church in Mumbai for two years. During the COVID-19 pandemic, he joined Christ Community Church in Pune, where he faithfully served for four years.
          </p>
        </div>
      </div>
    </div>
  );
}