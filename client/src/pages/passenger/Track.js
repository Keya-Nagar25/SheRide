// src/pages/passenger/Track.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';

const DARK_STYLES = [
  {elementType:'geometry',stylers:[{color:'#1a1a1a'}]},
  {elementType:'labels.text.fill',stylers:[{color:'#8a8a8a'}]},
  {elementType:'labels.text.stroke',stylers:[{color:'#1a1a1a'}]},
  {featureType:'road',elementType:'geometry',stylers:[{color:'#2e2e2e'}]},
  {featureType:'road.highway',elementType:'geometry',stylers:[{color:'#3c3c3c'}]},
  {featureType:'water',elementType:'geometry',stylers:[{color:'#0e1a2b'}]},
  {featureType:'poi',stylers:[{visibility:'off'}]},
];

const STATUS_INFO = {
  pending:   { label:'Looking for a driver…', eta:'Finding nearby drivers', color:'var(--amber)' },
  accepted:  { label:'Driver is on the way!',  eta:'Pick-up in',            color:'var(--blue)'  },
  started:   { label:'Trip in progress',        eta:'Drop-off in',           color:'var(--green)' },
  completed: { label:'You have arrived!',       eta:'Trip complete',         color:'var(--green)' },
  cancelled: { label:'Ride cancelled',          eta:'',                      color:'var(--red)'   },
};

// Random 4-digit PIN for trip
const genPin = () => String(Math.floor(1000 + Math.random() * 9000)).split('');

export default function Track() {
  const { rideId } = useParams();
  const navigate   = useNavigate();
  const { socket } = useSocket();

  const mapRef   = useRef(null);
  const mapObj   = useRef(null);
  const drvMarker = useRef(null);

  const [ride, setRide]         = useState(null);
  const [drvLoc, setDrvLoc]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [pin]                   = useState(genPin());
  const [rating, setRating]     = useState(0);
  const [comment, setComment]   = useState('');
  const [rated, setRated]       = useState(false);

  const initMap = useCallback((lat, lng) => {
    if (!mapRef.current || !window.google || mapObj.current) return;
    mapObj.current = new window.google.maps.Map(mapRef.current, {
      center:{lat,lng}, zoom:15, disableDefaultUI:true, styles:DARK_STYLES,
    });
  }, []);

  const fetchRide = useCallback(async () => {
    try {
      const res = await api.get(`/rides/${rideId}`);
      setRide(res.data.ride);
      const r = res.data.ride;
      if (r.pickupLocation?.lat && !mapObj.current) {
        const lat = r.pickupLocation.lat, lng = r.pickupLocation.lng;
        if (window.googleMapsReady) initMap(lat, lng);
        else window.addEventListener('google-maps-ready', () => initMap(lat, lng), { once: true });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [rideId, initMap]);

  useEffect(() => {
    fetchRide();
    if (socket) {
      socket.emit('ride:join', { rideId });
      socket.on('ride:accepted',  () => fetchRide());
      socket.on('ride:started',   () => fetchRide());
      socket.on('ride:completed', () => fetchRide());
      socket.on('ride:cancelled', () => fetchRide());
      socket.on('driver:location', ({ lat, lng }) => {
        setDrvLoc({ lat, lng });
        if (mapObj.current && window.google) {
          const pos = { lat, lng };
          if (drvMarker.current) drvMarker.current.setPosition(pos);
          else drvMarker.current = new window.google.maps.Marker({
            position: pos, map: mapObj.current,
            icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale:8, fillColor:'#e91e8c', fillOpacity:1, strokeColor:'#fff', strokeWeight:2 },
          });
        }
      });
    }
    const poll = setInterval(fetchRide, 12000);
    return () => { clearInterval(poll); if (socket) { socket.off('ride:accepted'); socket.off('ride:started'); socket.off('ride:completed'); socket.off('ride:cancelled'); socket.off('driver:location'); } };
  }, [socket, rideId, fetchRide]);

  const cancelRide = async () => {
    if (!window.confirm('Cancel this ride?')) return;
    try {
      await api.put(`/rides/${rideId}/cancel`);
      socket?.emit('ride:cancel', { rideId });
      fetchRide();
    } catch (err) { alert(err.response?.data?.message || 'Cannot cancel'); }
  };

  const submitRating = async () => {
    if (!rating) { alert('Please select a star rating'); return; }
    try {
      await api.post(`/ratings/${rideId}`, { stars: rating, comment });
      setRated(true);
    } catch (err) { alert(err.response?.data?.message || 'Rating failed'); }
  };

  if (loading) return <div className="spinner" />;
  if (!ride)   return <div style={{ padding:24, color:'var(--text-2)' }}>Ride not found</div>;

  const info   = STATUS_INFO[ride.status] || STATUS_INFO.pending;
  const driver = ride.driverId;
  const isDone = ['completed','cancelled'].includes(ride.status);

  return (
    <div className="page" style={{ display:'flex', flexDirection:'column', height:'100vh' }}>
      {/* Map */}
      <div style={{ flex:1, position:'relative', minHeight:220 }}>
        <div ref={mapRef} style={{ width:'100%', height:'100%', background:'#1a1a1a' }} />
        {/* Safety button (top right like Uber) */}
        <div style={{ position:'absolute', top:12, right:12, background:'rgba(0,0,0,0.75)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:20, padding:'6px 14px', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
          🛡️ Safety
        </div>
        {/* Down arrow to collapse */}
        <button onClick={() => navigate('/passenger')} style={{ position:'absolute', top:12, left:12, width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,0.7)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>↓</button>
      </div>

      {/* Bottom sheet */}
      <div className="bottom-sheet" style={{ maxHeight:'65vh', overflowY:'auto' }}>
        <div className="sheet-handle" />

        {/* ETA status */}
        <div style={{ textAlign:'center', marginBottom:14 }}>
          <div style={{ fontSize:22, fontWeight:700, color: info.color }}>{info.label}</div>
          {!isDone && <div style={{ fontSize:13, color:'var(--text-2)', marginTop:4 }}>{info.eta}</div>}
        </div>

        {/* PIN (shown when driver accepted) */}
        {['accepted','started'].includes(ride.status) && (
          <div className="pin-bar">
            <span className="pin-label">Share PIN</span>
            <div className="pin-digits">
              {pin.map((d, i) => <div key={i} className="pin-digit">{d}</div>)}
            </div>
          </div>
        )}

        {/* Trip details card */}
        <div className="card" style={{ marginBottom:10 }}>
          <div style={{ fontWeight:700, marginBottom:4 }}>
            {ride.status === 'accepted' ? 'Meet at the pickup point' : 'Trip details'}
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4, fontSize:13 }}>
            <span style={{ fontSize:18 }}>💵</span>
            <span style={{ background:'rgba(76,175,80,0.2)', color:'var(--green)', padding:'2px 8px', borderRadius:4, fontSize:12, fontWeight:600 }}>Cash</span>
          </div>
          <div className="divider" />
          <div style={{ fontSize:13, color:'var(--text-2)', display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ display:'flex', gap:10 }}>
              <span style={{ color:'var(--green)', fontWeight:700, minWidth:16 }}>A</span>
              <span>{ride.pickupLocation?.address}</span>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <span style={{ color:'var(--red)', fontWeight:700, minWidth:16 }}>B</span>
              <span>{ride.dropLocation?.address}</span>
            </div>
          </div>
          <div className="divider" />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
            <span style={{ color:'var(--text-2)' }}>{ride.vehicleType === 'auto' ? '🛺 Auto' : '🚗 Car'} · {ride.distanceKm?.toFixed(1)} km</span>
            <strong style={{ fontSize:16 }}>₹{ride.actualFare || ride.estimatedFare}</strong>
          </div>
        </div>

        {/* Driver card (shown after accepted) */}
        {driver && (
          <div className="card" style={{ marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--bg-3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, border:'2px solid var(--border-2)' }}>👩</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:20, fontWeight:700, letterSpacing:'0.02em' }}>{driver.vehicleNumber}</div>
                <div style={{ fontSize:13, color:'var(--text-2)' }}>{driver.vehicleModel}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                  <span style={{ color:'var(--amber)' }}>★</span>
                  <span style={{ fontSize:13 }}>{driver.rating?.toFixed(1) || '5.0'}</span>
                  <span style={{ color:'var(--text-3)', fontSize:13 }}>· {driver.name}</span>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:14 }}>
              <a href={`tel:${driver.phone}`} style={{ flex:1, padding:'10px', background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:13, fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                📞 Call
              </a>
              <button style={{ flex:1, padding:10, background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                💬 Message
              </button>
              <button style={{ width:44, height:44, background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', cursor:'pointer', fontSize:18 }}>⋯</button>
            </div>
          </div>
        )}

        {/* Cancel */}
        {['pending','accepted'].includes(ride.status) && (
          <button className="btn btn-danger w-full" style={{ marginBottom:8 }} onClick={cancelRide}>
            Cancel Ride
          </button>
        )}

        {/* Rating */}
        {ride.status === 'completed' && !rated && (
          <div className="card">
            <div style={{ fontWeight:700, marginBottom:12 }}>Rate your driver</div>
            <div style={{ display:'flex', justifyContent:'center', gap:10, marginBottom:12 }}>
              {[1,2,3,4,5].map(s => (
                <span key={s} onClick={() => setRating(s)}
                  style={{ fontSize:40, cursor:'pointer', color: s <= rating ? '#ff9800' : 'var(--border-2)', transition:'transform 0.1s', transform: s <= rating ? 'scale(1.1)' : 'scale(1)' }}>★</span>
              ))}
            </div>
            <div className="form-group">
              <input placeholder="Add a comment (optional)" value={comment} onChange={e => setComment(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={submitRating}>Submit Rating 🌸</button>
          </div>
        )}
        {rated && <div className="alert alert-success">⭐ Thanks for rating! Your feedback helps keep SheRide safe.</div>}

        {isDone && (
          <button className="btn btn-ghost w-full mt-8" onClick={() => navigate('/passenger')}>
            ← Back to Home
          </button>
        )}
      </div>
    </div>
  );
}
