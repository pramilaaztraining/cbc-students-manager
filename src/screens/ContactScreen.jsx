import React, { useState } from 'react';
import './ContactScreen.css';

export default function ContactScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="contact-page-wrapper">
      
      {/* Hero Header Banner */}
      <div className="contact-hero-banner">
        <div className="contact-hero-overlay">
          <h1 className="contact-hero-title">Contact</h1>
        </div>
      </div>

      {/* Main Content Container (Form + Map) */}
      <div className="contact-main-container">
        
        {/* Left Side: Contact Form */}
        <div className="contact-form-section">
          {submitted ? (
            <div className="success-message-card">
              <h3>Thank You!</h3>
              <p>Your message has been successfully sent. We will get back to you shortly.</p>
              <button onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', subject: '', message: '' }); }} className="submit-btn">
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form">
              
              <div className="input-group">
                <label>Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="input-group">
                <label>Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="input-group">
                <label>Subject</label>
                <input 
                  type="text" 
                  name="subject" 
                  value={formData.subject} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="input-group">
                <label>Message</label>
                <div className="rich-text-editor">
                  <div className="editor-toolbar">
                    <span className="toolbar-dropdown">Paragraph ▾</span>
                    <div className="toolbar-divider"></div>
                    <button type="button" className="tool-btn"><b>B</b></button>
                    <button type="button" className="tool-btn"><i>I</i></button>
                    <button type="button" className="tool-btn"><u>U</u></button>
                    <button type="button" className="tool-btn"><s>S</s></button>
                    <button type="button" className="tool-btn">❝</button>
                    <div className="toolbar-divider"></div>
                    <button type="button" className="tool-btn">📋</button>
                    <button type="button" className="tool-btn">≣</button>
                    <button type="button" className="tool-btn">≡</button>
                    <button type="button" className="tool-btn">☲</button>
                    <button type="button" className="tool-btn">🔗</button>
                    <button type="button" className="tool-btn">🖼️</button>
                    <div className="toolbar-divider"></div>
                    <button type="button" className="tool-btn">↩</button>
                    <button type="button" className="tool-btn">↪</button>
                  </div>
                  <textarea 
                    name="message" 
                    rows="8" 
                    value={formData.message} 
                    onChange={handleChange} 
                    required
                    className="editor-textarea"
                  ></textarea>
                </div>
              </div>

              <button type="submit" className="submit-btn">Submit</button>
            </form>
          )}
        </div>

      {/* Right Side: Embedded Google Map */}
<div className="contact-map-section">
  <div className="map-frame-wrapper">
    <iframe 
      title="Yesu Kristhana Prathana Mandhira Location Map"
      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3879.4042!2d77.5131854!3d13.5555496!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bb1c0ff21f1255b%3A0x45cd5e413f18a5b9!2sYesu%20Kristhana%20Prathana%20Mandhira!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin" 
      width="100%" 
      height="100%" 
      style={{ border: 0 }} 
      allowFullScreen="" 
      loading="lazy"
    ></iframe>
  </div>
</div>

      </div>
    </div>
  );
}