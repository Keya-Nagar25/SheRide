// src/pages/driver/UploadDocs.js
// Document upload page — Step after "Register & Upload Docs"
// Asks for: Aadhaar Card, Driver's License, and Photo/Selfie

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 16px 60px',
    fontFamily: "'Segoe UI', sans-serif",
  },
  header: {
    textAlign: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 800,
    color: '#e91e8c',
    margin: '0 0 6px',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    margin: 0,
  },
  progressBar: {
    display: 'flex',
    gap: 6,
    marginBottom: 28,
    width: '100%',
    maxWidth: 420,
  },
  progressStep: (active) => ({
    flex: 1,
    height: 4,
    borderRadius: 2,
    background: active ? '#e91e8c' : '#2a2a2a',
    transition: 'background 0.3s',
  }),
  card: {
    width: '100%',
    maxWidth: 420,
    background: '#141414',
    borderRadius: 16,
    padding: '20px 20px',
    marginBottom: 14,
    border: '1px solid #222',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: 'rgba(233,30,140,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#f0f0f0',
    margin: 0,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
    margin: '2px 0 0',
  },
  uploadZone: (hasFile, isDragging) => ({
    border: `2px dashed ${hasFile ? '#e91e8c' : isDragging ? '#e91e8c' : '#2e2e2e'}`,
    borderRadius: 12,
    padding: '20px 16px',
    textAlign: 'center',
    cursor: 'pointer',
    background: hasFile ? 'rgba(233,30,140,0.06)' : isDragging ? 'rgba(233,30,140,0.04)' : '#0f0f0f',
    transition: 'all 0.2s',
    position: 'relative',
    overflow: 'hidden',
  }),
  uploadIcon: {
    fontSize: 28,
    marginBottom: 8,
    display: 'block',
  },
  uploadText: {
    fontSize: 13,
    color: '#888',
    margin: '0 0 4px',
  },
  uploadHint: {
    fontSize: 11,
    color: '#555',
    margin: 0,
  },
  preview: {
    width: '100%',
    maxHeight: 140,
    objectFit: 'cover',
    borderRadius: 8,
    marginTop: 10,
    border: '1px solid #2a2a2a',
  },
  fileLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    padding: '8px 12px',
    background: 'rgba(233,30,140,0.1)',
    borderRadius: 8,
    fontSize: 12,
    color: '#e91e8c',
    fontWeight: 600,
  },
  removeBtn: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    fontSize: 16,
    padding: 0,
    lineHeight: 1,
  },
  hiddenInput: {
    display: 'none',
  },
  infoBox: {
    width: '100%',
    maxWidth: 420,
    background: 'rgba(233,30,140,0.07)',
    border: '1px solid rgba(233,30,140,0.2)',
    borderRadius: 12,
    padding: '14px 16px',
    marginBottom: 20,
    fontSize: 13,
    color: '#aaa',
    lineHeight: 1.6,
  },
  checkList: {
    margin: '8px 0 0',
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  checkItem: {
    fontSize: 12,
    color: '#777',
    display: 'flex',
    gap: 6,
    alignItems: 'flex-start',
  },
  submitBtn: (disabled) => ({
    width: '100%',
    maxWidth: 420,
    padding: '16px',
    background: disabled ? '#1e1e1e' : '#fff',
    color: disabled ? '#444' : '#000',
    border: 'none',
    borderRadius: 14,
    fontSize: 16,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    marginBottom: 10,
  }),
  skipBtn: {
    width: '100%',
    maxWidth: 420,
    padding: '14px',
    background: 'none',
    color: '#555',
    border: '1px solid #222',
    borderRadius: 14,
    fontSize: 14,
    cursor: 'pointer',
  },
  alert: (type) => ({
    width: '100%',
    maxWidth: 420,
    padding: '12px 16px',
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 13,
    background: type === 'error' ? 'rgba(220,50,50,0.1)' : 'rgba(233,30,140,0.08)',
    border: `1px solid ${type === 'error' ? 'rgba(220,50,50,0.3)' : 'rgba(233,30,140,0.25)'}`,
    color: type === 'error' ? '#ff6b6b' : '#e91e8c',
  }),
  successPage: {
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 24px',
    textAlign: 'center',
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: '#f0f0f0',
    marginBottom: 10,
  },
  successSub: {
    fontSize: 14,
    color: '#666',
    lineHeight: 1.6,
    maxWidth: 300,
    marginBottom: 32,
  },
  badge: {
    padding: '8px 20px',
    background: 'rgba(233,30,140,0.1)',
    border: '1px solid rgba(233,30,140,0.25)',
    borderRadius: 20,
    fontSize: 13,
    color: '#e91e8c',
    fontWeight: 600,
    marginBottom: 32,
  },
  homeBtn: {
    padding: '14px 40px',
    background: '#e91e8c',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
};

// ── Single upload card ────────────────────────────────────────────────────────
function UploadCard({ icon, title, subtitle, hint, accept, file, onFile }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleFile = (f) => {
    if (f && f.size > 5 * 1024 * 1024) {
      alert('File too large. Max 5 MB.');
      return;
    }
    onFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const preview = file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null;

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.cardIcon}>{icon}</div>
        <div>
          <p style={styles.cardTitle}>{title}</p>
          <p style={styles.cardSubtitle}>{subtitle}</p>
        </div>
      </div>

      <div
        style={styles.uploadZone(!!file, dragging)}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {!file ? (
          <>
            <span style={styles.uploadIcon}>📁</span>
            <p style={styles.uploadText}>Tap to upload or drag & drop</p>
            <p style={styles.uploadHint}>{hint} · Max 5 MB</p>
          </>
        ) : (
          <>
            {preview && <img src={preview} alt="preview" style={styles.preview} />}
            <div style={styles.fileLabel}>
              <span>✅</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                {file.name}
              </span>
              <button
                style={styles.removeBtn}
                onClick={(e) => { e.stopPropagation(); onFile(null); }}
              >✕</button>
            </div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={styles.hiddenInput}
        onChange={(e) => handleFile(e.target.files[0] || null)}
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function UploadDocs() {
  const navigate = useNavigate();
  const [files, setFiles] = useState({ aadhaar: null, license: null, selfie: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const setFile = (key) => (f) => setFiles((p) => ({ ...p, [key]: f }));

  const allUploaded = files.aadhaar && files.license && files.selfie;

  const handleSubmit = async () => {
    if (!allUploaded) return;
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      // Match server field names: govId, license, rcBook
      fd.append('govId', files.aadhaar);
      fd.append('license', files.license);
      fd.append('rcBook', files.selfie);

      // Debug: ensure token is present when making the request
      try { console.log('[upload] token=', localStorage.getItem('sheride_token')); } catch (err) { /* ignore */ }

      await api.post('/verify/upload-docs', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setDone(true);
    } catch (e) {
      // Log full response for debugging 403 errors
      console.error('[upload] error:', e?.response ?? e);
      setError(e.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Ternary operator: Show success screen if all docs uploaded, otherwise show upload form ──────
  return done ? (
    <div style={styles.successPage}>
      <div style={styles.successIcon}>🎉</div>
      <h1 style={styles.successTitle}>Documents Submitted!</h1>
      <p style={styles.successSub}>
        Our team will review your Aadhaar, License and Selfie within 24–48 hours.
        You'll get notified once you're approved.
      </p>
      <div style={styles.badge}>⏳ Pending Admin Review</div>
      <button style={styles.homeBtn} onClick={() => navigate('/driver')}>
        Go to Dashboard →
      </button>
    </div>
  ) : (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>🚗</div>
        <h1 style={styles.title}>Upload Your Documents</h1>
        <p style={styles.subtitle}>Step 4 of 4 — Verification</p>
      </div>

      {/* Progress — all 4 bars filled since we're on the last step */}
      <div style={styles.progressBar}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={styles.progressStep(true)} />
        ))}
      </div>

      {error && <div style={styles.alert('error')}>⚠ {error}</div>}

      {/* Info box */}
      <div style={styles.infoBox}>
        📋 <strong style={{ color: '#ccc' }}>Why we need these</strong>
        <ul style={styles.checkList}>
          <li style={styles.checkItem}><span>🪪</span><span>Aadhaar confirms your identity and address</span></li>
          <li style={styles.checkItem}><span>🚘</span><span>License verifies you're legally allowed to drive</span></li>
          <li style={styles.checkItem}><span>🤳</span><span>Selfie ensures you match your documents</span></li>
        </ul>
      </div>

      {/* Upload cards */}
      <UploadCard
        icon="🪪"
        title="Aadhaar Card"
        subtitle="Front & back clearly visible"
        hint="JPG, PNG or PDF"
        accept="image/*,application/pdf"
        file={files.aadhaar}
        onFile={setFile('aadhaar')}
      />
      <UploadCard
        icon="🚘"
        title="Driver's License"
        subtitle="Both sides, not expired"
        hint="JPG, PNG or PDF"
        accept="image/*,application/pdf"
        file={files.license}
        onFile={setFile('license')}
      />
      <UploadCard
        icon="🤳"
        title="Selfie"
        subtitle="Clear photo of your face, good lighting"
        hint="JPG or PNG"
        accept="image/*"
        file={files.selfie}
        onFile={setFile('selfie')}
      />

      {/* Submit */}
      <button
        style={styles.submitBtn(!allUploaded || loading)}
        disabled={!allUploaded || loading}
        onClick={handleSubmit}
      >
        {loading ? 'Uploading…' : allUploaded ? 'Submit for Review →' : `Upload all 3 documents to continue`}
      </button>

      <button style={styles.skipBtn} onClick={() => navigate('/driver')}>
        Skip for now — I'll upload later
      </button>
    </div>
  );
}