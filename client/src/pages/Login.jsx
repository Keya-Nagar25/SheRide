// src/pages/Login.js  — Dark themed, matches Uber style
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const sendOtp = async (e) => {
    e.preventDefault(); setError('');
    if (phone.length < 10) { setError('Enter a valid phone number'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { phone });
      if (res.data.otp) setDevOtp(res.data.otp);
      setStep(2);
    } catch (err) { setError(err.response?.data?.message || 'Failed to send OTP'); }
    finally { setLoading(false); }
  };

  const verifyOtp = async (e) => {
    e.preventDefault(); setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { phone, otp });
      login(res.data.user, res.data.token);
      const role = res.data.user.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'driver') navigate('/driver');
      else navigate('/passenger');
    } catch (err) { setError(err.response?.data?.message || 'Invalid OTP'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-logo">
        <div className="logo-icon">🌸</div>
        <h1>SheRide</h1>
        <p>Safe rides, only for women</p>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}
      {devOtp && <div className="alert alert-info">🔑 Dev OTP: <strong>{devOtp}</strong></div>}

      {step === 1 ? (
        <form onSubmit={sendOtp}>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" placeholder="+91 9876543210" value={phone}
              onChange={e => setPhone(e.target.value)} required autoFocus />
          </div>
          <button className="btn btn-white" type="submit" disabled={loading}>
            {loading ? 'Sending…' : 'Continue →'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 16, marginBottom: 4 }}>Enter the code sent to</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{phone}</div>
            <button type="button" onClick={() => setStep(1)}
              style={{ background: 'none', border: 'none', color: 'var(--pink)', cursor: 'pointer', marginTop: 4, fontSize: 14 }}>
              Change number
            </button>
          </div>
          <div className="form-group">
            <input className="otp-input" type="tel" placeholder="------" maxLength={6}
              value={otp} onChange={e => setOtp(e.target.value)} required autoFocus />
          </div>
          <button className="btn btn-white" type="submit" disabled={loading}>
            {loading ? 'Verifying…' : 'Verify & Login'}
          </button>
        </form>
      )}

      <div style={{ marginTop: 36, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-3)', marginBottom: 14, fontSize: 14 }}>New to SheRide?</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/register/passenger" className="btn btn-ghost btn-sm" style={{ flex: 1 }}>👩 Join as Passenger</Link>
          <Link to="/register/driver" className="btn btn-ghost btn-sm" style={{ flex: 1 }}>🚗 Become a Driver</Link>
        </div>
      </div>
    </div>
  );
}
