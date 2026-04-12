// src/pages/driver/History.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function DriverHistory() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/rides/history').then(r => { setRides(r.data.rides); setLoading(false); });
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div className="page" style={{ paddingBottom: 70 }}>
      <div className="header"><span className="header-title">Trip History</span></div>
      <div style={{ padding: '16px' }}>
        {rides.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No trips yet. Go online to start receiving rides!</p>
          </div>
        ) : rides.map(r => (
          <div className="history-row" key={r._id}>
            <span style={{ fontSize: 36 }}>{r.vehicleType === 'auto' ? '🛺' : '🚗'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>
                  {r.passengerId?.name || 'Passenger'}
                </span>
                <span className={`badge badge-${r.status}`}>{r.status}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                📍 {r.pickupLocation?.address}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}>
                <span style={{ color: 'var(--text-3)' }}>
                  {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
                <strong style={{ color: 'var(--green)' }}>₹{r.actualFare || r.estimatedFare}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
      <nav className="bottom-nav">
        <Link to="/driver"><span className="nav-icon">🏠</span>Home</Link>
        <Link to="/driver/earnings"><span className="nav-icon">💰</span>Earnings</Link>
        <Link to="/driver/history" className="active"><span className="nav-icon">📋</span>History</Link>
      </nav>
    </div>
  );
}
