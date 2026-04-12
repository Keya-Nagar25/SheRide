// src/pages/RegisterDriver.js
// Flowchart: Login/Register → Authentication (should be female) → DRIVER → Home Page
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const STEPS = ['Phone', 'Verify', 'Details', 'Vehicle'];

export default function RegisterDriver() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [form, setForm] = useState({
    name: '', phone: '', email: '', otp: '', selfDeclaredFemale: false,
    vehicleType: '', vehicleNumber: '', vehicleModel: '',
  });

  const set = field => e => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(p => ({ ...p, [field]: v }));
  };

  const sendOtp = async () => {
    if (form.phone.length < 10) { setError('Enter a valid phone number'); return; }
    setLoading(true); setError('');
    try {
      const r = await api.post('/auth/send-otp', { phone: form.phone });
      if (r.data.otp) setDevOtp(r.data.otp);
      setStep(1);
    } catch (e) { setError(e.response?.data?.message || 'Failed to send OTP'); }
    finally { setLoading(false); }
  };

  const verifyOtp = () => {
    if (form.otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    setError(''); setStep(2);
  };

  const goToVehicle = () => {
    if (!form.name.trim()) { setError('Enter your name'); return; }
    if (!form.selfDeclaredFemale) { setError('You must confirm you identify as female'); return; }
    setError(''); setStep(3);
  };

  const register = async () => {
    if (!form.vehicleType) { setError('Please select Auto or Car'); return; }
    if (!form.vehicleNumber.trim()) { setError('Enter your vehicle number'); return; }
    console.log('📤 Sending registration:', form);
    setLoading(true); setError('');
    try {
      const r = await api.post('/auth/register/driver', form);
      console.log('✅ Registration successful:', r.data);
      login(r.data.driver, r.data.token);
      // Ternary: Navigate to upload docs only after successful registration with driver & token
      navigate(r.data.driver && r.data.token ? '/driver/verify' : '/login');
    } catch (e) {
      console.error('❌ Registration error:', e);
      setError(e.response?.data?.message || 'Registration failed');
    }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-logo">
        <div className="logo-icon">🚗</div>
        <h1>Drive with SheRide</h1>
        <p>Earn by driving women safely</p>
      </div>

      {/* Progress */}
      <div className="progress-steps">
        {STEPS.map((_, i) => (
          <div key={i} className={`progress-step ${i <= step ? 'done' : ''}`} />
        ))}
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, textAlign: 'center' }}>
        Step {step + 1} of {STEPS.length} — {STEPS[step]}
      </p>

      {error && <div className="alert alert-error">⚠ {error}</div>}
      {devOtp && <div className="alert alert-info">🔑 Dev OTP: <strong>{devOtp}</strong></div>}

      {/* STEP 0: Phone */}
      {step === 0 && (
        <div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" placeholder="+91 9876543210" value={form.phone} onChange={set('phone')} autoFocus />
          </div>
          <button className="btn btn-white" onClick={sendOtp} disabled={loading}>
            {loading ? 'Sending OTP…' : 'Send OTP →'}
          </button>
        </div>
      )}

      {/* STEP 1: OTP verification — "Authentication (should be female)" gate */}
      {step === 1 && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, color: 'var(--text-2)' }}>OTP sent to</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{form.phone}</div>
            <button type="button" onClick={() => setStep(0)}
              style={{ background: 'none', border: 'none', color: 'var(--pink)', cursor: 'pointer', marginTop: 4, fontSize: 13 }}>
              ← Change number
            </button>
          </div>
          <div className="form-group">
            <label>Enter OTP</label>
            <input className="otp-input" type="tel" placeholder="------" maxLength={6} value={form.otp} onChange={set('otp')} autoFocus />
          </div>
          <button className="btn btn-white" onClick={verifyOtp}>Verify →</button>
        </div>
      )}

      {/* STEP 2: Personal details + Female declaration */}
      {step === 2 && (
        <div>
          <div className="form-group">
            <label>Full Name *</label>
            <input type="text" placeholder="Your name" value={form.name} onChange={set('name')} autoFocus />
          </div>
          <div className="form-group">
            <label>Email (optional)</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
          </div>

          <div className="female-declaration">
            <label>
              <input type="checkbox" checked={form.selfDeclaredFemale} onChange={set('selfDeclaredFemale')} />
              <span>
                I confirm I identify as <strong style={{ color: 'var(--pink)' }}>female</strong>. I understand
                SheRide is a women-only platform for both drivers and passengers. I will submit valid documents for verification.
              </span>
            </label>
          </div>

          <button className="btn btn-white" onClick={goToVehicle}
            disabled={!form.name.trim() || !form.selfDeclaredFemale}>
            Next: Vehicle Details →
          </button>
        </div>
      )}

      {/* STEP 3: Vehicle info — "Rides pick-up (options — auto, diff ppl)" from flowchart */}
      {step === 3 && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 14 }}>
            Choose the vehicle you'll use for rides
          </p>

          {/* Vehicle type selector — auto or car */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { type: 'auto', icon: '🛺', name: 'Auto', sub: '₹8/km · 3 seats' },
              { type: 'car', icon: '🚗', name: 'Car', sub: '₹14/km · 4 seats' },
            ].map(v => (
              <button key={v.type}
                onClick={() => setForm(p => ({ ...p, vehicleType: v.type }))}
                style={{ background: form.vehicleType === v.type ? 'rgba(233,30,140,0.15)' : 'var(--bg-3)', border: `2px solid ${form.vehicleType === v.type ? 'var(--pink)' : 'var(--border)'}`, borderRadius: 12, padding: '16px 10px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                <div style={{ fontSize: 40, marginBottom: 6 }}>{v.icon}</div>
                <div style={{ fontWeight: 700, color: 'var(--text)' }}>{v.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{v.sub}</div>
              </button>
            ))}
          </div>

          <div className="form-group">
            <label>Vehicle Number *</label>
            <input type="text" placeholder="e.g. MH12QR8383"
              value={form.vehicleNumber} onChange={set('vehicleNumber')}
              style={{ textTransform: 'uppercase' }} />
          </div>
          <div className="form-group">
            <label>Vehicle Model</label>
            <input type="text" placeholder="e.g. Yellow Bajaj RE Compact"
              value={form.vehicleModel} onChange={set('vehicleModel')} />
          </div>

          <div className="alert alert-info" style={{ marginBottom: 16 }}>
            📋 After registering, you'll upload your Aadhar, Driving License, RC Book and Selfie for admin review (24–48 hrs).
          </div>

          <button className="btn btn-white" onClick={register}
            disabled={loading || !form.vehicleType || !form.vehicleNumber.trim()}>
            {loading ? 'Registering…' : 'Register & Upload Docs →'}
          </button>
          <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => setStep(2)}>← Back</button>
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-3)', fontSize: 14 }}>
        Already registered?{' '}
        <Link to="/login" style={{ color: 'var(--pink)' }}>Log in</Link>
      </p>
    </div>
  );
}
