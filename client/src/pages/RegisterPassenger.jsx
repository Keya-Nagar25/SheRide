import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const STEPS = ['Phone', 'Verify', 'Details'];

export default function RegisterPassenger() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState(0);   
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', otp: '', selfDeclaredFemale: false });

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
    setError('');
    setStep(2);
  };

  const register = async () => {
    if (!form.name.trim()) { setError('Please enter your name'); return; }
    if (!form.selfDeclaredFemale) { setError('You must confirm you identify as female to register'); return; }
    setLoading(true); setError('');
    try {
      const r = await api.post('/auth/register/passenger', form);
      login(r.data.user, r.data.token);
      navigate('/passenger');
    } catch (e) { setError(e.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-logo">
        <div className="logo-icon">🌸</div>
        <h1>Join SheRide</h1>
        <p>Safe rides, only for women</p>
      </div>

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
                I confirm I identify as <strong style={{ color: 'var(--pink)' }}>female</strong>. I understand SheRide is
                a women-only platform. Providing false information will result in immediate account removal.
              </span>
            </label>
          </div>

          <button className="btn btn-white" onClick={register}
            disabled={loading || !form.selfDeclaredFemale || !form.name.trim()}>
            {loading ? 'Creating account…' : 'Create Account 🌸'}
          </button>
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-3)', fontSize: 14 }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--pink)' }}>Log in</Link>
      </p>
      <p style={{ textAlign: 'center', marginTop: 8, color: 'var(--text-3)', fontSize: 14 }}>
        Want to drive?{' '}
        <Link to="/register/driver" style={{ color: 'var(--pink)' }}>Register as driver →</Link>
      </p>
    </div>
  );
}
