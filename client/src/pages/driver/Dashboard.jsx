import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const DARK_STYLES = [
  {elementType:'geometry',stylers:[{color:'#1a1a1a'}]},
  {elementType:'labels.text.fill',stylers:[{color:'#8a8a8a'}]},
  {elementType:'labels.text.stroke',stylers:[{color:'#1a1a1a'}]},
  {featureType:'road',elementType:'geometry',stylers:[{color:'#2e2e2e'}]},
  {featureType:'poi',stylers:[{visibility:'off'}]},
  {featureType:'water',elementType:'geometry',stylers:[{color:'#0e1a2b'}]},
];

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const selfMarker = useRef(null);

  const [isOnline, setIsOnline]         = useState(false);
  const [toggling, setToggling]         = useState(false);
  const [incomingRide, setIncomingRide] = useState(null);
  const [activeRide, setActiveRide]     = useState(null);
  const [earnings, setEarnings]         = useState({ today: 0, total: 0 });

  // Redirect unverified driver
  useEffect(() => {
    if (user && !user.isVerified) navigate('/driver/verify');
  }, [user, navigate]);

  // Init map
  useEffect(() => {
    const doInit = () => {
      navigator.geolocation?.getCurrentPosition(pos => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        if (!mapRef.current || !window.google || mapObj.current) return;
        mapObj.current = new window.google.maps.Map(mapRef.current, {
          center:{lat,lng}, zoom:15, disableDefaultUI:true, styles:DARK_STYLES
        });
        selfMarker.current = new window.google.maps.Marker({
          position:{lat,lng}, map:mapObj.current,
          icon:{path:window.google.maps.SymbolPath.CIRCLE, scale:10, fillColor:'#e91e8c', fillOpacity:1, strokeColor:'#fff', strokeWeight:2}
        });
      });
    };
    if (window.googleMapsReady) doInit();
    else window.addEventListener('google-maps-ready', doInit, { once: true });
  }, []);

  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(() => {
      navigator.geolocation?.getCurrentPosition(pos => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        api.put('/driver/location', { lat, lng }).catch(() => {});
        if (activeRide) socket?.emit('location:update', { rideId: activeRide._id, lat, lng });
        if (mapObj.current && selfMarker.current) selfMarker.current.setPosition({lat,lng});
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isOnline, activeRide, socket]);

  useEffect(() => {
    if (!socket) return;
    socket.on('ride:new', data => {
      if (!isOnline) return;
      setIncomingRide(data);
      setTimeout(() => setIncomingRide(null), 30000);
    });
    return () => socket.off('ride:new');
  }, [socket, isOnline]);

  useEffect(() => {
    api.get('/driver/earnings').then(r => setEarnings({ today: r.data.today, total: r.data.total })).catch(() => {});
  }, []);

  const toggleOnline = async () => {
    setToggling(true);
    try { const r = await api.put('/driver/toggle-online'); setIsOnline(r.data.isOnline); }
    catch { alert('Failed'); }
    finally { setToggling(false); }
  };

  const acceptRide = async () => {
    try {
      const r = await api.put(`/rides/${incomingRide.rideId}/accept`);
      setActiveRide(r.data.ride);
      socket?.emit('ride:accept', { rideId: incomingRide.rideId, passengerId: r.data.ride.passengerId?._id, driverName: user.name });
      socket?.emit('ride:join', { rideId: incomingRide.rideId });
      setIncomingRide(null);
    } catch (err) { alert(err.response?.data?.message || 'Could not accept'); setIncomingRide(null); }
  };

  const startTrip = async () => {
    try {
      await api.put(`/rides/${activeRide._id}/start`);
      socket?.emit('ride:start', { rideId: activeRide._id });
      setActiveRide(p => ({ ...p, status:'started' }));
    } catch { alert('Failed'); }
  };

  const completeTrip = async () => {
    try {
      const r = await api.put(`/rides/${activeRide._id}/complete`);
      socket?.emit('ride:complete', { rideId: activeRide._id, fare: r.data.ride.actualFare });
      setEarnings(e => ({ today: e.today + r.data.ride.actualFare, total: e.total + r.data.ride.actualFare }));
      setActiveRide(null);
      alert('✅ Trip complete! Great driving 🌸');
    } catch { alert('Failed'); }
  };

  return (
    <div className="page" style={{ paddingBottom:70 }}>

      <div style={{ height:220, position:'relative' }}>
        <div ref={mapRef} style={{ width:'100%', height:'100%', background:'#1a1a1a' }} />
        <div style={{ position:'absolute', top:0, left:0, right:0, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'linear-gradient(to bottom,rgba(0,0,0,0.75),transparent)' }}>
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>Driver</div>
            <div style={{ fontSize:18, fontWeight:700 }}>{user?.name}</div>
          </div>
          <button onClick={logout} style={{ background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:20, color:'#fff', padding:'6px 14px', fontSize:13, cursor:'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ padding:'14px 16px' }}>
        <div className="card" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div>
            <div style={{ fontWeight:700, fontSize:16 }}>{isOnline ? '🟢 Online' : '🔴 Offline'}</div>
            <div style={{ fontSize:13, color:'var(--text-2)', marginTop:2 }}>
              {isOnline ? 'Accepting ride requests' : 'Tap to start accepting rides'}
            </div>
          </div>
          <button
            onClick={toggleOnline} disabled={toggling}
            className={`toggle-track ${isOnline ? 'on' : ''}`}
            style={{ position:'relative' }}
          >
            <div className="toggle-knob" />
          </button>
        </div>

        {incomingRide && (
          <div className="card pulse-ring" style={{ marginBottom:10, border:'2px solid var(--pink)' }}>
            <div style={{ textAlign:'center', marginBottom:12 }}>
              <div style={{ fontSize:36, marginBottom:4 }}>🔔</div>
              <div style={{ fontSize:20, fontWeight:700, color:'var(--pink)' }}>New Ride Request!</div>
              <div style={{ fontSize:13, color:'var(--text-2)', marginTop:4 }}>
                {incomingRide.vehicleType === 'auto' ? '🛺 Auto' : '🚗 Car'} ride nearby
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-danger" style={{ flex:1, width:'auto' }} onClick={() => setIncomingRide(null)}>Decline</button>
              <button className="btn btn-success" style={{ flex:1 }} onClick={acceptRide}>Accept ✓</button>
            </div>
          </div>
        )}

        {activeRide && (
          <div className="card" style={{ marginBottom:10, borderTop:'3px solid var(--green)' }}>
            <div style={{ fontWeight:700, marginBottom:10 }}>🚗 Active Ride</div>
            <div style={{ fontSize:14, color:'var(--text-2)', display:'flex', flexDirection:'column', gap:6, marginBottom:12 }}>
              <div>👩 Passenger: <strong style={{ color:'var(--text)' }}>{activeRide.passengerId?.name}</strong></div>
              <div>📍 Pickup: {activeRide.pickupLocation?.address}</div>
              <div>🏁 Drop: {activeRide.dropLocation?.address}</div>
              <div>💵 Fare: <strong style={{ color:'var(--green)', fontSize:16 }}>₹{activeRide.estimatedFare}</strong></div>
            </div>
            {activeRide.status === 'accepted' && (
              <button className="btn btn-primary" onClick={startTrip}>Start Trip →</button>
            )}
            {activeRide.status === 'started' && (
              <button className="btn btn-success" onClick={completeTrip}>Complete Trip ✅</button>
            )}
          </div>
        )}

        <div className="stat-grid" style={{ marginBottom:10 }}>
          <div className="stat-card green">
            <div className="stat-value">₹{earnings.today}</div>
            <div className="stat-label">Today</div>
          </div>
          <div className="stat-card pink">
            <div className="stat-value">₹{earnings.total}</div>
            <div className="stat-label">Total</div>
          </div>
        </div>

        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <span style={{ fontSize:40 }}>{user?.vehicleType === 'auto' ? '🛺' : '🚗'}</span>
            <div>
              <div style={{ fontWeight:700, textTransform:'capitalize', fontSize:16 }}>{user?.vehicleType}</div>
              <div style={{ fontSize:14, color:'var(--text-2)', marginTop:2, fontFamily:'monospace' }}>{user?.vehicleNumber}</div>
              <div style={{ fontSize:13, color:'var(--text-3)' }}>{user?.vehicleModel}</div>
            </div>
            <div style={{ marginLeft:'auto', textAlign:'right' }}>
              <div style={{ color:'var(--amber)', fontSize:16 }}>★ {user?.rating?.toFixed(1) || '5.0'}</div>
              <div style={{ fontSize:12, color:'var(--text-3)' }}>Rating</div>
            </div>
          </div>
        </div>

        {!isOnline && !activeRide && (
          <div className="alert alert-info" style={{ marginTop:10 }}>
            💡 Go online to receive ride requests from passengers nearby
          </div>
        )}
      </div>

      <nav className="bottom-nav">
        <Link to="/driver" className="active"><span className="nav-icon">🏠</span>Home</Link>
        <Link to="/driver/earnings"><span className="nav-icon">💰</span>Earnings</Link>
        <Link to="/driver/history"><span className="nav-icon">📋</span>History</Link>
      </nav>
    </div>
  );
}
