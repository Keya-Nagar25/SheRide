// src/pages/admin/Users.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState('');

  useEffect(() => {
    api.get('/admin/users').then(r => { setUsers(r.data.users); setLoading(false); });
  }, []);

  const toggleSuspend = async (id, isActive) => {
    setActing(id);
    try {
      await api.put(`/admin/users/${id}/suspend`, { type: 'user' });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !u.isActive } : u));
    } catch { alert('Failed'); }
    finally { setActing(''); }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="page" style={{ paddingBottom: 70 }}>
      <div className="header">
        <Link to="/admin" className="back-btn">←</Link>
        <span className="header-title">Passengers ({users.length})</span>
      </div>

      <div style={{ padding:'16px' }}>
        {users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👩</div>
            <p>No passengers registered yet.</p>
          </div>
        ) : users.map(u => (
          <div key={u._id} className="card" style={{ marginBottom:8, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:'50%', background:'var(--bg-3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, border:'1px solid var(--border-2)', flexShrink:0 }}>👩</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700 }}>{u.name}</div>
              <div style={{ fontSize:13, color:'var(--text-2)' }}>{u.phone}</div>
              <div style={{ fontSize:12, color:'var(--text-3)', marginTop:2 }}>
                ⭐ {u.rating?.toFixed(1) || '5.0'} · Joined {new Date(u.createdAt).toLocaleDateString('en-IN', { month:'short', year:'numeric' })}
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
              <span className={`badge badge-${u.isActive ? 'approved' : 'rejected'}`}>
                {u.isActive ? 'Active' : 'Suspended'}
              </span>
              <button
                className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-ghost'}`}
                style={{ width:'auto', padding:'5px 10px', fontSize:12 }}
                onClick={() => toggleSuspend(u._id, u.isActive)}
                disabled={acting === u._id}>
                {acting === u._id ? '…' : u.isActive ? 'Suspend' : 'Restore'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <nav className="bottom-nav">
        <Link to="/admin"><span className="nav-icon">🏠</span>Dashboard</Link>
        <Link to="/admin/drivers"><span className="nav-icon">🪪</span>Drivers</Link>
        <Link to="/admin/users" className="active"><span className="nav-icon">👩</span>Users</Link>
        <Link to="/admin/rides"><span className="nav-icon">🚗</span>Rides</Link>
      </nav>
    </div>
  );
}
