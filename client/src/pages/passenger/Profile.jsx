// src/pages/passenger/Profile.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function Profile() {
  const { user, logout } = useAuth();
  const [contacts, setContacts] = useState([
    { name: '', phone: '' }, { name: '', phone: '' }, { name: '', phone: '' }
  ]);
  const [saved, setSaved] = useState(false);
  const [idFile, setIdFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  const saveContacts = async () => {
    const valid = contacts.filter(c => c.name && c.phone);
    try {
      await api.put('/sos/contacts', { contacts: valid });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch { alert('Failed to save'); }
  };

  const uploadId = async () => {
    if (!idFile) return;
    setUploading(true);
    const fd = new FormData(); fd.append('idProof', idFile);
    try { const r = await api.post('/verify/upload-id', fd); setUploadMsg(r.data.message); }
    catch { setUploadMsg('Upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <div className="page" style={{ paddingBottom: 70 }}>
      <div className="header"><span className="header-title">Account</span></div>
      <div style={{ padding: '16px' }}>

        {/* Profile hero */}
        <div className="card" style={{ textAlign: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>👩</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{user?.name}</div>
          <div style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>{user?.phone}</div>
          <div className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--amber)' }}>⭐ {user?.rating || '5.0'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Rating</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>✓</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Verified</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--pink)' }}>🌸</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Safe Rider</div>
            </div>
          </div>
        </div>

        {/* Optional ID upload */}
        <div className="card" style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>🛡️ Boost Trust Score</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>Upload Aadhar / Passport for a higher trust badge (optional)</div>
          {uploadMsg && <div className="alert alert-success">{uploadMsg}</div>}
          <input type="file" accept="image/*,application/pdf"
            onChange={e => setIdFile(e.target.files[0])}
            style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 10, display: 'block' }} />
          {idFile && (
            <button className="btn btn-primary" style={{ marginTop: 4 }} onClick={uploadId} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Upload ID'}
            </button>
          )}
        </div>

        {/* Emergency contacts */}
        <div className="card" style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>🚨 Emergency Contacts</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>Up to 3 contacts who receive SOS alerts</div>
          {contacts.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                placeholder="Name"
                value={c.name}
                style={{ flex: 1, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 14, outline: 'none' }}
                onChange={e => setContacts(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
              />
              <input
                placeholder="+91 phone"
                value={c.phone}
                style={{ flex: 1, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 14, outline: 'none' }}
                onChange={e => setContacts(prev => prev.map((x, j) => j === i ? { ...x, phone: e.target.value } : x))}
              />
            </div>
          ))}
          <button className="btn btn-primary" style={{ marginTop: 4 }} onClick={saveContacts}>
            {saved ? '✅ Saved!' : 'Save Contacts'}
          </button>
        </div>

        {/* Logout */}
        <button className="btn btn-danger w-full" style={{ marginTop: 6 }} onClick={logout}>
          Sign Out
        </button>
      </div>

      <nav className="bottom-nav">
        <Link to="/passenger"><span className="nav-icon">🏠</span>Home</Link>
        <Link to="/passenger/book"><span className="nav-icon">🚗</span>Book</Link>
        <Link to="/passenger/history"><span className="nav-icon">📋</span>Activity</Link>
        <Link to="/passenger/profile" className="active"><span className="nav-icon">👤</span>Account</Link>
      </nav>
    </div>
  );
}
