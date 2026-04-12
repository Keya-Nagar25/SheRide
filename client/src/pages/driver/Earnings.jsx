// src/pages/driver/Earnings.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function DriverEarnings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/driver/earnings').then(r => { setData(r.data); setLoading(false); });
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div className="page" style={{ paddingBottom: 70 }}>
      <div className="header"><span className="header-title">Earnings 💰</span></div>
      <div style={{ padding: '16px' }}>
        <div className="stat-grid" style={{ marginBottom: 16 }}>
          <div className="stat-card green">
            <div className="stat-value">₹{data.today}</div>
            <div className="stat-label">Today</div>
          </div>
          <div className="stat-card pink">
            <div className="stat-value">₹{data.total}</div>
            <div className="stat-label">All time</div>
          </div>
        </div>

        <div style={{ fontWeight: 700, marginBottom: 12 }}>Recent trips</div>
        {data.earnings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <p>No trips yet.<br />Go online to start earning!</p>
          </div>
        ) : data.earnings.map(e => (
          <div key={e._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{e.rideId?.pickupLocation?.address || 'Trip'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>+₹{e.amount}</span>
          </div>
        ))}
      </div>
      <nav className="bottom-nav">
        <Link to="/driver"><span className="nav-icon">🏠</span>Home</Link>
        <Link to="/driver/earnings" className="active"><span className="nav-icon">💰</span>Earnings</Link>
        <Link to="/driver/history"><span className="nav-icon">📋</span>History</Link>
      </nav>
    </div>
  );
}
