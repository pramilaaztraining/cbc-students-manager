import React, { useState } from 'react';
import './Login.css'; // Adjust path if your CSS file is named differently

export default function Login({ onLoginSuccess }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // Step 1: Enter Phone, Step 2: Enter OTP
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Request OTP (Server checks whitelist)
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request OTP');
      }

      setMessage('Verification code generated. Check your backend terminal log.');
      setStep(2); // Move to OTP input screen
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and log in
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      // Success: Pass authenticated user data back to parent app
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <span className="lock-icon">🔒</span>
          <h2>CBC Manager Portal</h2>
          <p>Secure whitelisted authentication for faculty & students</p>
        </div>

        {error && <div className="alert error-alert">⚠️ {error}</div>}
        {message && <div className="alert success-alert">ℹ️ {message}</div>}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="login-form">
            <div className="form-group">
              <label htmlFor="phone">AUTHORIZED PHONE NUMBER</label>
              <input
                id="phone"
                type="text"
                placeholder="e.g., +919676657444"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Checking Whitelist...' : 'Send Verification OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="login-form">
            <div className="form-group">
              <label htmlFor="otp">ENTER 6-DIGIT OTP</label>
              <input
                id="otp"
                type="text"
                maxLength="6"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              <small className="help-text">Check your Node.js server console window for the code.</small>
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
            <button 
              type="button" 
              className="back-btn" 
              onClick={() => { setStep(1); setOtp(''); setError(''); setMessage(''); }}
            >
              ← Use a different number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}