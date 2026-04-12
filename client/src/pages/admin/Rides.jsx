// src/pages/admin/Rides.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function AdminRides() {
  const [rides, setRides] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRides = (status) => {
    setLoading(true);
    api.get(`/admin/rides${status ? `?status=${status}` : ''}`)
      .then(r => { setRides(r.data.rides); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchRides(filter); }, [filter]);

  const FILTERS = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'started', label: 'Started' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="page" style={{ paddingBottom: 70 }}>
      <div className="header">
        <Link to="/admin" className="back-btn">←</Link>
        <span className="header-title">All Rides</span>
      </div>

      {/* Filter scrollable row */}
      <div style={{ overflowX: 'auto', display: 'flex', gap: 8, padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            style={{
              whiteSpace: 'nowrap', padding: '7px 14px', borderRadius: 20, border: '1px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: filter === f.value ? 'var(--pink)' : 'var(--bg-3)',
              borderColor: filter === f.value ? 'var(--pink)' : 'var(--border)',
              color: filter === f.value ? 'white' : 'var(--text-2)'
            }}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>
        {loading && <div className="spinner" />}

        {!loading && rides.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🚗</div>
            <p>No rides found for this filter.</p>
          </div>
        )}

        {rides.map(r => (
          <div key={r._id} className="card" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{r.vehicleType === 'auto' ? '🛺' : '🚗'}</span>
              <span className={`badge badge-${r.status}`}>{r.status}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
              <div>👩 Passenger: <strong style={{ color: 'var(--text)' }}>{r.passengerId?.name || 'N/A'}</strong></div>
              <div>🚗 Driver: <strong style={{ color: 'var(--text)' }}>{r.driverId?.name || 'Not assigned'}</strong></div>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                📍 {r.pickupLocation?.address}
              </div>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                🏁 {r.dropLocation?.address}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-3)' }}>
                {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
              <strong style={{ color: r.status === 'completed' ? 'var(--green)' : 'var(--text)' }}>
                ₹{r.actualFare || r.estimatedFare}
              </strong>
            </div>
          </div>
        ))}
      </div>

      <nav className="bottom-nav">
        <Link to="/admin"><span className="nav-icon">🏠</span>Dashboard</Link>
        <Link to="/admin/drivers"><span className="nav-icon">🪪</span>Drivers</Link>
        <Link to="/admin/users"><span className="nav-icon">👩</span>Users</Link>
        <Link to="/admin/rides" className="active"><span className="nav-icon">🚗</span>Rides</Link>
      </nav>
    </div>
  );
}
