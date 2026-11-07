import React, { useState } from 'react';

export default function LoginView({ onLoginSuccess }) {
  const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter OTP
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Request OTP code
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      
      setStep(2); // Move to OTP verification step
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP code & store user session
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Invalid OTP code');

      // Save user session & role in localStorage
      localStorage.setItem('cbc_user', JSON.stringify(data.user));
      
      // Notify parent component that login succeeded
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '30px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#1e3a8a' }}>🔒 CBC Manager Login</h2>
      <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>Secure Access via Email OTP</p>

      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}

      {step === 1 ? (
        <form onSubmit={handleSendOtp}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email Address</label>
            <input 
              type="email" 
              required 
              placeholder="e.g., admin@cbc.org" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '10px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {loading ? 'Sending Code...' : 'Send Verification OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Enter 6-Digit OTP</label>
            <input 
              type="text" 
              maxLength="6" 
              required 
              placeholder="123456" 
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={{ width: '100%', padding: '10px', letterSpacing: '4px', textAlign: 'center', fontSize: '18px', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
            <small style={{ color: '#6b7280', display: 'block', marginTop: '5px' }}>Check your terminal console or email for the code.</small>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {loading ? 'Verifying...' : 'Verify & Login'}
          </button>
          <button 
            type="button" 
            onClick={() => setStep(1)}
            style={{ width: '100%', marginTop: '10px', padding: '8px', background: 'transparent', color: '#4b5563', border: 'none', cursor: 'pointer', fontSize: '14px' }}
          >
            ← Back to Email Entry
          </button>
        </form>
      )}
    </div>
  );
}