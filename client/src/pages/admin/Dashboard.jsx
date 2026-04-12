// src/pages/admin/Dashboard.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/reports').then(r => { setStats(r.data); setLoading(false); });
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div className="page" style={{ paddingBottom: 70 }}>
      <div className="header">
        <span className="header-title">🌸 Admin Panel</span>
        <button onClick={logout} style={{ background:'none', border:'none', color:'var(--text-2)', cursor:'pointer', fontSize:14 }}>Logout</button>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Stats grid */}
        <p style={{ fontSize:12, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Overview</p>
        <div className="stat-grid">
          <div className="stat-card pink">
            <div className="stat-value">{stats.users.total}</div>
            <div className="stat-label">Passengers</div>
          </div>
          <div className="stat-card blue">
            <div className="stat-value">{stats.drivers.approved}</div>
            <div className="stat-label">Active Drivers</div>
          </div>
          <div className="stat-card amber">
            <div className="stat-value">{stats.drivers.pending}</div>
            <div className="stat-label">Pending Review</div>
          </div>
          <div className="stat-card green">
            <div className="stat-value">{stats.rides.completed}</div>
            <div className="stat-label">Trips Done</div>
          </div>
        </div>

        {/* Revenue */}
        <div className="card" style={{ marginBottom:10, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:12, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.07em' }}>Total Revenue</div>
            <div style={{ fontSize:28, fontWeight:800, color:'var(--green)', marginTop:2 }}>₹{stats.totalRevenue}</div>
          </div>
          <span style={{ fontSize:40 }}>💰</span>
        </div>

        {/* Quick actions */}
        <p style={{ fontSize:12, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Actions</p>
        {[
          { to:'/admin/drivers', icon:'🪪', label:'Driver Approvals', sub:`${stats.drivers.pending} pending`, urgent: stats.drivers.pending > 0 },
          { to:'/admin/users',   icon:'👩', label:'Manage Users',    sub:`${stats.users.total} passengers` },
          { to:'/admin/rides',   icon:'🚗', label:'All Rides',       sub:`${stats.rides.total} total` },
        ].map(item => (
          <Link key={item.to} to={item.to} style={{ textDecoration:'none' }}>
            <div className="card" style={{ display:'flex', alignItems:'center', gap:14, marginBottom:8, border: item.urgent ? '1px solid var(--amber)' : '1px solid var(--border)' }}>
              <span style={{ fontSize:30 }}>{item.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700 }}>{item.label}</div>
                <div style={{ fontSize:13, color: item.urgent ? 'var(--amber)' : 'var(--text-3)', marginTop:2 }}>{item.sub}</div>
              </div>
              <span style={{ color:'var(--text-3)', fontSize:18 }}>›</span>
            </div>
          </Link>
        ))}
      </div>

      <nav className="bottom-nav">
        <Link to="/admin" className="active"><span className="nav-icon">🏠</span>Dashboard</Link>
        <Link to="/admin/drivers"><span className="nav-icon">🪪</span>Drivers</Link>
        <Link to="/admin/users"><span className="nav-icon">👩</span>Users</Link>
        <Link to="/admin/rides"><span className="nav-icon">🚗</span>Rides</Link>
      </nav>
    </div>
  );
}
