// src/pages/driver/Verify.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function DriverVerify() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState({ govId: null, license: null, rcBook: null, selfie: null });
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/verify/status')
      .then(r => { setStatus(r.data); setLoading(false); })
      .catch(err => {
        setMsg(err.response?.data?.message || 'Failed to load verification status');
        setLoading(false);
      });
  }, []);

  const setFile = field => e => setFiles(p => ({ ...p, [field]: e.target.files[0] }));

  const uploadDocs = async () => {
    const fd = new FormData();
    if (files.govId) fd.append('aadhaar', files.govId);
    if (files.license) fd.append('license', files.license);
    if (files.rcBook) fd.append('selfie', files.rcBook);
    if (!files.govId && !files.license && !files.rcBook) { setMsg('Please select at least one file'); return; }
    setUploading(true);
    try {
      await api.post('/verify/upload-docs', fd);
      const r = await api.get('/verify/status'); setStatus(r.data);
      setMsg('Documents uploaded successfully!');
    } catch (err) { setMsg(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const uploadSelfie = async () => {
    if (!files.selfie) { setMsg('Please select a selfie photo'); return; }
    const fd = new FormData(); fd.append('selfie', files.selfie);
    setUploading(true);
    try {
      await api.post('/verify/upload-selfie', fd);
      const r = await api.get('/verify/status'); setStatus(r.data);
      setMsg('Selfie uploaded! Your application is under review.');
    } catch (err) { setMsg(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  if (loading) return <div className="spinner" />;
  if (status?.isVerified) { navigate('/driver'); return null; }

  const docs = status?.docsUploaded || {};
  const vstatus = status?.verificationStatus;

  return (
    <div className="page" style={{ paddingBottom: 32 }}>
      <div className="header"><span className="header-title">Document Verification</span></div>
      <div style={{ padding: '16px' }}>

        {/* Status banner */}
        <div className={`alert alert-${vstatus === 'rejected' ? 'error' : vstatus === 'approved' ? 'success' : 'warning'}`}>
          <span style={{ fontSize: 20 }}>{vstatus === 'approved' ? '✅' : vstatus === 'rejected' ? '❌' : '⏳'}</span>
          <div>
            <strong>Status: {vstatus?.toUpperCase()}</strong>
            <div style={{ marginTop: 4, fontSize: 13 }}>{status?.message}</div>
            {status?.rejectionReason && <div style={{ marginTop: 4, fontSize: 13 }}>Reason: <strong>{status.rejectionReason}</strong></div>}
          </div>
        </div>

        {msg && <div className={`alert ${msg.includes('failed') || msg.includes('select') ? 'alert-error' : 'alert-success'}`}>{msg}</div>}

        {/* Checklist */}
        <div className="card" style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Required Documents</div>
          {[
            { key: 'govId', icon: '🪪', label: 'Government ID (Aadhar / PAN)' },
            { key: 'license', icon: '🚗', label: 'Driving License' },
            { key: 'rcBook', icon: '📄', label: 'RC Book / Vehicle Registration' },
            { key: 'selfie', icon: '🤳', label: 'Selfie (for identity match)' },
          ].map(({ key, icon, label }) => (
            <div className="check-item" key={key}>
              <span style={{ fontSize: 22 }}>{icon}</span>
              <span style={{ flex: 1, fontSize: 14 }}>{label}</span>
              {docs[key]
                ? <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: 13 }}>✓ Done</span>
                : <span style={{ color: 'var(--text-3)', fontSize: 12 }}>Missing</span>}
            </div>
          ))}
        </div>

        {/* Upload Documents */}
        <div className="card" style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Upload Documents</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>JPG · PNG · PDF — Max 5 MB each</div>

          {[
            { key: 'govId', label: `Government ID ${docs.govId ? '✓' : ''}` },
            { key: 'license', label: `Driving License ${docs.license ? '✓' : ''}` },
            { key: 'rcBook', label: `RC Book ${docs.rcBook ? '✓' : ''}` },
          ].map(({ key, label }) => (
            <div className="form-group" key={key}>
              <label>{label}</label>
              <input type="file" accept="image/*,application/pdf" onChange={setFile(key)}
                style={{ color: 'var(--text-2)', fontSize: 13 }} />
            </div>
          ))}

          <button className="btn btn-primary" onClick={uploadDocs} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload Documents'}
          </button>
        </div>

        {/* Upload Selfie */}
        <div className="card" style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Selfie {docs.selfie ? '✓' : ''}</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>
            Take a clear photo of your face. Our admin will match it with your ID for verification.
          </div>
          <div className="form-group">
            <input type="file" accept="image/*" capture="user" onChange={setFile('selfie')}
              style={{ color: 'var(--text-2)', fontSize: 13 }} />
          </div>
          <button className="btn btn-primary" onClick={uploadSelfie} disabled={uploading || !files.selfie}>
            {uploading ? 'Uploading…' : '🤳 Upload Selfie'}
          </button>
        </div>

        <div className="alert alert-info">
          ⏳ Admin review usually takes <strong>24–48 hours</strong>. You'll be notified when approved.
        </div>
      </div>
    </div>
  );
}
