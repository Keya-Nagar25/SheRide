// src/pages/passenger/Book.js
// FIXED: 
//  - Step logic corrected (was starting at wrong step)
//  - Google Places Autocomplete for real address search
//  - Button works as soon as both locations are selected
//  - Google Maps waits for the ready event before initialising
//  - No more "enter lat,lng" — just type a real address

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';

const DARK_STYLES = [
  { elementType: 'geometry',            stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.fill',    stylers: [{ color: '#8a8a8a' }] },
  { elementType: 'labels.text.stroke',  stylers: [{ color: '#1a1a1a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2e2e2e' }] },
  { featureType: 'road.arterial',  elementType: 'geometry', stylers: [{ color: '#373737' }] },
  { featureType: 'road.highway',   elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'water',          elementType: 'geometry', stylers: [{ color: '#0e1a2b' }] },
  { featureType: 'poi',            stylers: [{ visibility: 'off' }] },
];

export default function Book() {
  const navigate  = useNavigate();
  const [params]  = useSearchParams();
  const { socket } = useSocket();

  // ---- Map refs ----
  const mapRef          = useRef(null);
  const mapObj          = useRef(null);
  const pickupMarker    = useRef(null);
  const dropMarker      = useRef(null);
  const routeRenderer   = useRef(null);
  const pickupInputRef  = useRef(null);   // for Places Autocomplete
  const dropInputRef    = useRef(null);   // for Places Autocomplete
  const pickupAutoRef   = useRef(null);
  const dropAutoRef     = useRef(null);

  // ---- State ----
  const [step,        setStep]        = useState('locations'); // 'locations' | 'vehicle'
  const [pickup,      setPickup]      = useState({ address: '', lat: null, lng: null });
  const [drop,        setDrop]        = useState({ address: '', lat: null, lng: null });
  const [vehicleType, setVehicleType] = useState(params.get('type') || '');
  const [estimates,   setEstimates]   = useState(null);
  const [distKm,      setDistKm]      = useState(0);
  const [durationMin, setDurationMin] = useState(0);
  const [payMethod,   setPayMethod]   = useState('cash');
  const [loading,     setLoading]     = useState(false);
  const [gettingLoc,  setGettingLoc]  = useState(false);
  const [mapsReady,   setMapsReady]   = useState(!!window.googleMapsReady);
  const [error,       setError]       = useState('');

  // ---- Wait for Google Maps to load ----
  useEffect(() => {
    if (window.googleMapsReady) { setMapsReady(true); return; }
    const handler = () => setMapsReady(true);
    window.addEventListener('google-maps-ready', handler);
    return () => window.removeEventListener('google-maps-ready', handler);
  }, []);

  // ---- Init map once Maps is ready ----
  const initMap = useCallback((lat, lng) => {
    if (!mapRef.current || !window.google || mapObj.current) return;
    mapObj.current = new window.google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 14,
      disableDefaultUI: true,
      styles: DARK_STYLES,
    });
  }, []);

  useEffect(() => {
    if (!mapsReady) return;
    navigator.geolocation?.getCurrentPosition(
      p => initMap(p.coords.latitude, p.coords.longitude),
      () => initMap(18.5204, 73.8567)   // fallback: Pune
    );
  }, [mapsReady, initMap]);

  // ---- Attach Places Autocomplete to both inputs ----
  useEffect(() => {
    if (!mapsReady || !window.google) return;

    const options = {
      componentRestrictions: { country: 'in' },   // restrict to India
      fields: ['formatted_address', 'geometry'],
    };

    // Pickup autocomplete
    if (pickupInputRef.current && !pickupAutoRef.current) {
      pickupAutoRef.current = new window.google.maps.places.Autocomplete(
        pickupInputRef.current, options
      );
      pickupAutoRef.current.addListener('place_changed', () => {
        const place = pickupAutoRef.current.getPlace();
        if (!place.geometry) return;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setPickup({ address: place.formatted_address, lat, lng });
        // Move map to pickup location
        if (mapObj.current) mapObj.current.setCenter({ lat, lng });
      });
    }

    // Drop autocomplete
    if (dropInputRef.current && !dropAutoRef.current) {
      dropAutoRef.current = new window.google.maps.places.Autocomplete(
        dropInputRef.current, options
      );
      dropAutoRef.current.addListener('place_changed', () => {
        const place = dropAutoRef.current.getPlace();
        if (!place.geometry) return;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setDrop({ address: place.formatted_address, lat, lng });
      });
    }
  }, [mapsReady, step]);  // re-attach when step changes (inputs re-render)

  // ---- Update map markers whenever pickup/drop lat/lng changes ----
  useEffect(() => {
    if (!mapObj.current || !window.google) return;

    // Pickup marker (green circle)
    if (pickup.lat && pickup.lng) {
      const pos = { lat: pickup.lat, lng: pickup.lng };
      if (pickupMarker.current) {
        pickupMarker.current.setPosition(pos);
      } else {
        pickupMarker.current = new window.google.maps.Marker({
          position: pos,
          map: mapObj.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10, fillColor: '#4caf50', fillOpacity: 1,
            strokeColor: '#fff', strokeWeight: 2,
          },
        });
      }
    }

    // Drop marker (red arrow)
    if (drop.lat && drop.lng) {
      const pos = { lat: drop.lat, lng: drop.lng };
      if (dropMarker.current) {
        dropMarker.current.setPosition(pos);
      } else {
        dropMarker.current = new window.google.maps.Marker({
          position: pos,
          map: mapObj.current,
          icon: {
            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 8, fillColor: '#f44336', fillOpacity: 1,
            strokeColor: '#fff', strokeWeight: 2,
          },
        });
      }
    }

    // Draw route between pickup and drop
    if (pickup.lat && pickup.lng && drop.lat && drop.lng) {
      const ds = new window.google.maps.DirectionsService();

      if (!routeRenderer.current) {
        routeRenderer.current = new window.google.maps.DirectionsRenderer({
          map: mapObj.current,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#ffffff', strokeWeight: 3, strokeOpacity: 0.85,
          },
        });
      }

      ds.route(
        {
          origin:      { lat: pickup.lat, lng: pickup.lng },
          destination: { lat: drop.lat,   lng: drop.lng   },
          travelMode:  window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK') {
            routeRenderer.current.setDirections(result);
            const leg = result.routes[0].legs[0];
            setDistKm((leg.distance.value / 1000).toFixed(1));
            setDurationMin(Math.ceil(leg.duration.value / 60));
            // Fit both markers on screen
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend({ lat: pickup.lat, lng: pickup.lng });
            bounds.extend({ lat: drop.lat,   lng: drop.lng   });
            mapObj.current.fitBounds(bounds, { top: 60, right: 40, bottom: 40, left: 40 });
          }
        }
      );
    }
  }, [pickup.lat, pickup.lng, drop.lat, drop.lng]);

  // ---- Get fare estimates whenever both locations are ready ----
  useEffect(() => {
    if (!pickup.lat || !drop.lat) return;
    api.post('/rides/estimate', {
      pickupLat: pickup.lat, pickupLng: pickup.lng,
      dropLat:   drop.lat,   dropLng:   drop.lng,
    })
      .then(res => {
        setEstimates(res.data.estimates);
        // Only override from API if Google Directions hasn't set these yet
        if (!distKm) setDistKm(res.data.distanceKm);
        if (!durationMin) setDurationMin(res.data.durationMin);
      })
      .catch(() => {});
  }, [pickup.lat, pickup.lng, drop.lat, drop.lng]);

  // ---- Use device location for pickup ----
  const useMyLocation = () => {
    setGettingLoc(true);
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        // Reverse geocode to get a readable address
        if (window.google) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            const address = status === 'OK' && results[0]
              ? results[0].formatted_address
              : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            setPickup({ address, lat, lng });
            if (pickupInputRef.current) pickupInputRef.current.value = address;
            setGettingLoc(false);
          });
        } else {
          setPickup({ address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng });
          setGettingLoc(false);
        }
      },
      () => { setError('Could not get your location. Please type it instead.'); setGettingLoc(false); }
    );
  };

  // ---- Book the ride ----
  const handleBook = async () => {
    if (!vehicleType) { setError('Please tap Auto or Car to select your ride'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/rides/book', {
        vehicleType,
        paymentMethod:  payMethod,
        pickupAddress:  pickup.address,
        pickupLat:      pickup.lat,
        pickupLng:      pickup.lng,
        dropAddress:    drop.address,
        dropLat:        drop.lat,
        dropLng:        drop.lng,
      });
      const rideId = res.data.ride._id;
      if (socket) {
        socket.emit('ride:request', {
          rideId,
          pickupLat: pickup.lat, pickupLng: pickup.lng,
          vehicleType,
        });
        socket.emit('ride:join', { rideId });
      }
      navigate(`/passenger/track/${rideId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---- Both locations have lat/lng coords = we can proceed ----
  const bothLocationsSet = !!(pickup.lat && pickup.lng && drop.lat && drop.lng);

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

      {/* ── MAP (top half) ── */}
      <div style={{ flex: 1, position: 'relative', minHeight: 240 }}>
        {/* Map div */}
        <div
          ref={mapRef}
          style={{ width: '100%', height: '100%', background: '#1a1a1a' }}
        />

        {/* Back button */}
        <button
          onClick={() => navigate('/passenger')}
          style={{
            position: 'absolute', top: 12, left: 12,
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(0,0,0,0.75)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', fontSize: 20, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >←</button>

        {/* ETA chip — only shown once route is drawn */}
        {distKm > 0 && (
          <div style={{
            position: 'absolute', bottom: 16, right: 16,
            background: 'rgba(0,0,0,0.85)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '8px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{durationMin}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase' }}>MIN</div>
          </div>
        )}

        {/* "Maps loading…" overlay */}
        {!mapsReady && (
          <div style={{
            position: 'absolute', inset: 0, background: '#1a1a1a',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <div className="spinner" style={{ margin: 0 }} />
            <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading map…</span>
          </div>
        )}
      </div>

      {/* ── BOTTOM SHEET ── */}
      <div className="bottom-sheet" style={{ maxHeight: '62vh', overflowY: 'auto' }}>
        <div className="sheet-handle" />

        {/* ════ STEP 1: Enter locations ════ */}
        {step === 'locations' && (
          <>
            <h2 className="sheet-title">Where to?</h2>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: 12 }}>⚠ {error}</div>
            )}

            {/* Location row — green dot → red dot with line between */}
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 12, marginBottom: 12 }}>

              {/* Dot + line indicator */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 14, paddingBottom: 14, gap: 0 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#4caf50', flexShrink: 0 }} />
                <div style={{ width: 2, flex: 1, background: 'var(--border-2)', minHeight: 20 }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f44336', flexShrink: 0 }} />
              </div>

              {/* Two address inputs */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>

                {/* Pickup input with Places Autocomplete */}
                <div style={{
                  background: 'var(--bg-3)', border: `1.5px solid ${pickup.lat ? '#4caf50' : 'var(--border)'}`,
                  borderRadius: 10, padding: '12px 14px',
                  transition: 'border-color 0.2s',
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    PICKUP
                  </div>
                  <input
                    ref={pickupInputRef}
                    type="text"
                    placeholder="Search pickup location…"
                    defaultValue={pickup.address}
                    style={{
                      width: '100%', background: 'none', border: 'none',
                      color: 'var(--text)', fontSize: 15, outline: 'none',
                    }}
                  />
                  {pickup.lat && (
                    <div style={{ fontSize: 11, color: '#4caf50', marginTop: 3 }}>✓ Location set</div>
                  )}
                </div>

                {/* Drop input with Places Autocomplete */}
                <div style={{
                  background: 'var(--bg-3)', border: `1.5px solid ${drop.lat ? '#f44336' : 'var(--border)'}`,
                  borderRadius: 10, padding: '12px 14px',
                  transition: 'border-color 0.2s',
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    DROP-OFF
                  </div>
                  <input
                    ref={dropInputRef}
                    type="text"
                    placeholder="Search drop location…"
                    defaultValue={drop.address}
                    style={{
                      width: '100%', background: 'none', border: 'none',
                      color: 'var(--text)', fontSize: 15, outline: 'none',
                    }}
                  />
                  {drop.lat && (
                    <div style={{ fontSize: 11, color: '#f44336', marginTop: 3 }}>✓ Location set</div>
                  )}
                </div>
              </div>
            </div>

            {/* Use my current location button */}
            <button
              style={{
                width: '100%', padding: '11px 16px',
                background: 'var(--bg-3)', border: '1px solid var(--border)',
                borderRadius: 10, color: 'var(--text-2)', fontSize: 14,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 14, fontWeight: 500,
              }}
              onClick={useMyLocation}
              disabled={gettingLoc}
            >
              <span style={{ fontSize: 20 }}>📍</span>
              {gettingLoc ? 'Getting your location…' : 'Use my current location for pickup'}
            </button>

            {/* Hint when locations not set yet */}
            {!bothLocationsSet && (
              <div style={{
                textAlign: 'center', fontSize: 13, color: 'var(--text-3)',
                padding: '10px 0', marginBottom: 8,
              }}>
                {!pickup.lat && !drop.lat
                  ? '⬆ Search and select both locations above'
                  : !pickup.lat
                  ? '⬆ Set your pickup location'
                  : '⬆ Set your drop-off location'}
              </div>
            )}

            {/* See ride options button — always visible, enabled only when both locations set */}
            <button
              className={`btn ${bothLocationsSet ? 'btn-white' : 'btn-ghost'}`}
              onClick={() => {
                if (!bothLocationsSet) {
                  setError(
                    !pickup.lat
                      ? 'Please search and select a pickup location first'
                      : 'Please search and select a drop-off location'
                  );
                  return;
                }
                setError('');
                setStep('vehicle');
              }}
              style={{ opacity: 1 }}  /* never visually disabled — shows error instead */
            >
              {bothLocationsSet ? 'See ride options →' : 'Enter both locations to continue'}
            </button>
          </>
        )}

        {/* ════ STEP 2: Choose vehicle ════ */}
        {step === 'vehicle' && (
          <>
            <h2 className="sheet-title">Choose a trip</h2>

            {/* Distance / duration summary */}
            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-2)', marginBottom: 14 }}>
              {distKm} km · ~{durationMin} min
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: 12 }}>⚠ {error}</div>
            )}

            {/* Vehicle rows — Auto and Car */}
            {[
              { type: 'auto', icon: '🛺', name: 'Auto',  sub: `${durationMin} min · 3 seats`,     badge: 'Faster' },
              { type: 'car',  icon: '🚗', name: 'Car',   sub: `${durationMin + 4} min · 4 seats · AC` },
            ].map(v => (
              <div
                key={v.type}
                className={`vehicle-row ${vehicleType === v.type ? 'selected' : ''}`}
                onClick={() => setVehicleType(v.type)}
              >
                <span className="v-icon">{v.icon}</span>
                <div className="v-info">
                  <div className="v-name">{v.name}</div>
                  <div className="v-sub">{v.sub}</div>
                  {v.badge && <span className="v-badge">⚡ {v.badge}</span>}
                </div>
                <div className="v-price">
                  {estimates ? `₹${estimates[v.type]}` : <span style={{ color: 'var(--text-3)' }}>…</span>}
                </div>
              </div>
            ))}

            {/* Payment method row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 0', borderTop: '1px solid var(--border)', marginTop: 12,
            }}>
              <span style={{ fontSize: 22 }}>
                {payMethod === 'cash' ? '💵' : '👛'}
              </span>
              <span style={{ flex: 1, fontWeight: 600, textTransform: 'capitalize' }}>
                {payMethod}
              </span>
              <button
                onClick={() => setPayMethod(p => p === 'cash' ? 'wallet' : 'cash')}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--pink)', fontSize: 13, cursor: 'pointer', fontWeight: 600,
                }}
              >
                Switch →
              </button>
            </div>

            {/* Book button */}
            <button
              className="btn btn-white"
              disabled={!vehicleType || loading}
              onClick={handleBook}
              style={{ marginBottom: 8 }}
            >
              {loading
                ? 'Booking your ride…'
                : vehicleType
                  ? `Choose ${vehicleType === 'auto' ? '🛺 Auto' : '🚗 Car'}`
                  : 'Select Auto or Car above'}
            </button>

            {/* Back to location step */}
            <button
              className="btn btn-ghost"
              onClick={() => setStep('locations')}
              style={{ marginTop: 4 }}
            >
              ← Change locations
            </button>
          </>
        )}
      </div>
    </div>
  );
}
