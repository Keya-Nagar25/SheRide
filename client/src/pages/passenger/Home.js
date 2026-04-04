// src/pages/passenger/Home.js
import React, { useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2e2e2e' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1a2b' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

export default function PassengerHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const initMap = useCallback((lat, lng) => {
    if (!mapRef.current || !window.google) return;
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat, lng }, zoom: 15,
      disableDefaultUI: true, styles: DARK_MAP_STYLES,
    });
    new window.google.maps.Marker({
      position: { lat, lng }, map,
      icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: '#4fc3f7', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
    });
  }, []);

  useEffect(() => {
    const doInit = () => {
      navigator.geolocation?.getCurrentPosition(
        pos => initMap(pos.coords.latitude, pos.coords.longitude),
        ()   => initMap(18.5204, 73.8567)
      );
    };
    if (window.googleMapsReady) { doInit(); }
    else { window.addEventListener('google-maps-ready', doInit); }
    return () => window.removeEventListener('google-maps-ready', doInit);
  }, [initMap]);

  const handleSOS = async () => {
    if (!window.confirm('🚨 Send SOS to your emergency contacts?')) return;
    navigator.geolocation?.getCurrentPosition(async pos => {
      try {
        await api.post('/sos/trigger', { lat: pos.coords.latitude, lng: pos.coords.longitude });
        alert('🚨 SOS sent to your emergency contacts!');
      } catch (err) { alert(err.response?.data?.message || 'SOS failed. Call 112.'); }
    });
  };

  return (
    <div className="page" style={{ paddingBottom: 70 }}>
      {/* Map */}
      <div style={{ height: 270, position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%', background: '#1a1a1a' }} />
        {/* Overlay header */}
        <div style={{ position:'absolute', top:0, left:0, right:0, padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'linear-gradient(to bottom,rgba(0,0,0,0.75) 0%,transparent 100%)' }}>
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)' }}>Welcome back</div>
            <div style={{ fontSize:18, fontWeight:700 }}>{user?.name} 🌸</div>
          </div>
          <button onClick={logout} style={{ background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:20, color:'#fff', padding:'6px 14px', fontSize:13, cursor:'pointer', fontWeight:600 }}>
            Logout
          </button>
        </div>
      </div>

      {/* "Where to?" search bar */}
      <div style={{ padding:'14px 16px 0' }}>
        <button onClick={() => navigate('/passenger/book')} style={{ width:'100%', background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:50, padding:'14px 20px', display:'flex', alignItems:'center', gap:12, cursor:'pointer', textAlign:'left' }}>
          <span style={{ fontSize:18 }}>🔍</span>
          <span style={{ flex:1, color:'var(--text-3)', fontSize:16 }}>Where to?</span>
          <span style={{ background:'var(--bg-4)', borderRadius:8, padding:'4px 12px', fontSize:12, color:'var(--text-2)' }}>Later</span>
        </button>
      </div>

      {/* For you tile grid */}
      <div style={{ padding:'18px 16px 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <span style={{ fontSize:18, fontWeight:700 }}>For you</span>
          <span style={{ color:'var(--text-3)' }}>→</span>
        </div>
        <div className="tile-grid">
          {[
            { icon:'🛺', label:'Auto', badge:'25%', path:'/passenger/book?type=auto' },
            { icon:'🚗', label:'Car',  badge:'25%', path:'/passenger/book?type=car'  },
            { icon:'📋', label:'History', path:'/passenger/history' },
            { icon:'👤', label:'Account', path:'/passenger/profile' },
          ].map(t => (
            <button key={t.label} className="tile" onClick={() => navigate(t.path)}>
              {t.badge && <span className="tile-badge">{t.badge}</span>}
              <span className="tile-icon">{t.icon}</span>
              <span className="tile-label">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SOS */}
      <div style={{ padding:'14px 16px' }}>
        <div className="card" style={{ display:'flex', alignItems:'center', gap:16 }}>
          <button className="sos-btn" onClick={handleSOS}>SOS</button>
          <div>
            <div style={{ fontWeight:700, fontSize:15 }}>Emergency SOS</div>
            <div style={{ fontSize:13, color:'var(--text-2)', marginTop:2 }}>Sends your live location instantly</div>
          </div>
        </div>
      </div>

      <nav className="bottom-nav">
        <Link to="/passenger" className="active"><span className="nav-icon">🏠</span>Home</Link>
        <Link to="/passenger/book"><span className="nav-icon">🚗</span>Book</Link>
        <Link to="/passenger/history"><span className="nav-icon">📋</span>Activity</Link>
        <Link to="/passenger/profile"><span className="nav-icon">👤</span>Account</Link>
      </nav>
    </div>
  );
}
