import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState('');   
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);

  const fetchDrivers = (status) => {
    setLoading(true);
    api.get(`/admin/drivers?status=${status}`)
      .then(r => { setDrivers(r.data.drivers); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchDrivers(filter); }, [filter]);

  const approve = async (id) => {
    setActing(id);
    try {
      await api.post(`/admin/verify/${id}/approve`);
      setDrivers(prev => prev.filter(d => d._id !== id));
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setActing(''); }
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) { alert('Please enter a rejection reason'); return; }
    setActing(rejectTarget);
    try {
      await api.post(`/admin/verify/${rejectTarget}/reject`, { reason: rejectReason });
      setDrivers(prev => prev.filter(d => d._id !== rejectTarget));
      setRejectTarget(null); setRejectReason('');
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setActing(''); }
  };

  const suspend = async (id, isActive) => {
    try {
      await api.put(`/admin/users/${id}/suspend`, { type: 'driver' });
      setDrivers(prev => prev.map(d => d._id === id ? { ...d, isActive: !d.isActive } : d));
    } catch { alert('Failed'); }
  };

  const FILTERS = ['pending', 'approved', 'rejected'];

  return (
    <div className="page" style={{ paddingBottom: 70 }}>
      <div className="header">
        <Link to="/admin" className="back-btn">←</Link>
        <span className="header-title">Driver Verification</span>
      </div>

      <div style={{ display: 'flex', gap: 0, padding: '0 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ flex: 1, padding: '12px 0', background: 'none', border: 'none', color: filter === f ? 'var(--text)' : 'var(--text-3)', fontWeight: filter === f ? 700 : 400, fontSize: 14, cursor: 'pointer', borderBottom: filter === f ? '2px solid var(--pink)' : '2px solid transparent', textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
      </div>
      {rejectTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-2)', borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxWidth: 430, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Rejection Reason</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>This will be shown to the driver so they can re-apply.</div>
            <textarea
              style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, color: 'var(--text)', fontSize: 14, minHeight: 80, outline: 'none', resize: 'vertical' }}
              placeholder="e.g. Photo quality too low, please re-upload a clearer selfie"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button className="btn btn-ghost" style={{ flex: 1, width: 'auto' }} onClick={() => { setRejectTarget(null); setRejectReason(''); }}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={confirmReject} disabled={!!acting}>
                {acting ? 'Rejecting…' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '16px' }}>
        {loading && <div className="spinner" />}

        {!loading && drivers.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">{filter === 'pending' ? '✅' : '📋'}</div>
            <p>No {filter} drivers{filter === 'pending' ? '!\nAll caught up 🌸' : '.'}</p>
          </div>
        )}

        {drivers.map(d => (
          <div key={d._id} className="card" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, border: '2px solid var(--border-2)' }}>👩</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{d.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{d.phone}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  {d.vehicleType === 'auto' ? '🛺' : '🚗'} {d.vehicleType?.toUpperCase()} · {d.vehicleNumber}
                </div>
              </div>
              <span className={`badge badge-${d.verificationStatus}`}>{d.verificationStatus}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>Documents uploaded:</div>
            <div className="doc-thumb">
              {d.govIdUrl && <a href={d.govIdUrl} target="_blank" rel="noreferrer">🪪 Gov ID</a>}
              {d.licenseUrl && <a href={d.licenseUrl} target="_blank" rel="noreferrer">🚗 License</a>}
              {d.rcBookUrl && <a href={d.rcBookUrl} target="_blank" rel="noreferrer">📄 RC Book</a>}
              {d.selfieUrl && <a href={d.selfieUrl} target="_blank" rel="noreferrer">🤳 Selfie</a>}
              {!d.govIdUrl && !d.licenseUrl && !d.rcBookUrl && !d.selfieUrl && (
                <span style={{ fontSize: 12, color: 'var(--red)' }}>⚠ No documents uploaded yet</span>
              )}
            </div>

            <div className="divider" />

            {/* Registered on */}
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>
              Registered: {new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>

            {/* Actions */}
            {d.verificationStatus === 'pending' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-danger btn-sm" style={{ flex: 1, width: 'auto' }}
                  onClick={() => setRejectTarget(d._id)} disabled={acting === d._id}>
                  ✗ Reject
                </button>
                <button className="btn btn-success btn-sm" style={{ flex: 1 }}
                  onClick={() => approve(d._id)} disabled={acting === d._id}>
                  {acting === d._id ? 'Approving…' : '✓ Approve'}
                </button>
              </div>
            )}

            {d.verificationStatus === 'approved' && (
              <button
                onClick={() => suspend(d._id, d.isActive)}
                className={`btn btn-sm w-full ${d.isActive ? 'btn-danger' : 'btn-ghost'}`}>
                {d.isActive ? '⛔ Suspend Account' : '✅ Reactivate Account'}
              </button>
            )}

            {d.verificationStatus === 'rejected' && d.rejectionReason && (
              <div className="alert alert-error" style={{ margin: 0 }}>
                Rejected: {d.rejectionReason}
              </div>
            )}
          </div>
        ))}
      </div>

      <nav className="bottom-nav">
        <Link to="/admin"><span className="nav-icon">🏠</span>Dashboard</Link>
        <Link to="/admin/drivers" className="active"><span className="nav-icon">🪪</span>Drivers</Link>
        <Link to="/admin/users"><span className="nav-icon">👩</span>Users</Link>
        <Link to="/admin/rides"><span className="nav-icon">🚗</span>Rides</Link>
      </nav>
    </div>
  );
}
