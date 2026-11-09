import React, { useState } from 'react';
import { apiFetch } from './utils/api';

export default function LoginView({ onLoginSuccess }) {
  const [collegeCode, setCollegeCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collegeCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      // Save user session in localStorage
      localStorage.setItem('cbc_user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Failed to authenticate. Check your college code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '30px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#1e3a8a' }}>🔒 CBC Manager Login</h2>
      <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>Enter your Unique College Access Code</p>

      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>College Code</label>
          <input 
            type="text" 
            required 
            placeholder="e.g., CBC-ADMIN-2026" 
            value={collegeCode}
            onChange={(e) => setCollegeCode(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontSize: '16px', letterSpacing: '1px' }}
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '12px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
        >
          {loading ? 'Authenticating...' : 'Login to CBC Manager'}
        </button>
      </form>
    </div>
  );
}