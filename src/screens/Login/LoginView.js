import React, { useState } from 'react';
import './Login.css';

export default function LoginView({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (isRegistering) {
        setMessage('Registration successful! You can now sign in.');
        setIsRegistering(false);
        setPassword('');
      } else {
        localStorage.setItem('cbc_user', JSON.stringify(data.user));
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
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
          <p>{isRegistering ? 'Create your portal account' : 'Sign in with email & password'}</p>
        </div>

        {error && <div className="alert error-alert">⚠️ {error}</div>}
        {message && <div className="alert success-alert">ℹ️ {message}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">EMAIL ADDRESS</label>
            <input
              id="email"
              type="email"
              placeholder="e.g., student@cbc.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">PASSWORD</label>
            <input
              id="password"
              type="password"
              placeholder="Enter secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Please wait...' : (isRegistering ? 'Register Account' : 'Sign In')}
          </button>

          <button 
            type="button" 
            className="back-btn" 
            onClick={() => { 
              setIsRegistering(!isRegistering); 
              setError(''); 
              setMessage(''); 
            }}
          >
            {isRegistering ? '← Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </form>
      </div>
    </div>
  );
}