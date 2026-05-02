import React, { useEffect, useRef, useCallback } from 'react';

const MapView = ({
  pickupLat, pickupLng,
  dropLat, dropLng,
  driverLat, driverLng,
  height = '300px',
  onMapClick,         
  showRoute = false,
}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const routeRef = useRef(null);
  const driverMarkerRef = useRef(null);

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (routeRef.current) { routeRef.current.setMap(null); routeRef.current = null; }
  };

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    const center = pickupLat && pickupLng
      ? { lat: parseFloat(pickupLat), lng: parseFloat(pickupLng) }
      : { lat: 18.5204, lng: 73.8567 }; 

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: false,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2e2e2e' }] },
        { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1a2b' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
    });

    if (onMapClick) {
      mapInstance.current.addListener('click', (e) => {
        onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      });
    }
  }, [pickupLat, pickupLng, onMapClick]);

  const drawMarkersAndRoute = useCallback(() => {
    if (!mapInstance.current || !window.google) return;
    clearMarkers();

    const bounds = new window.google.maps.LatLngBounds();
    if (pickupLat && pickupLng) {
      const pos = { lat: parseFloat(pickupLat), lng: parseFloat(pickupLng) };
      const m = new window.google.maps.Marker({
        position: pos,
        map: mapInstance.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4caf50',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: 'Pickup',
      });
      markersRef.current.push(m);
      bounds.extend(pos);
    }
    if (dropLat && dropLng) {
      const pos = { lat: parseFloat(dropLat), lng: parseFloat(dropLng) };
      const m = new window.google.maps.Marker({
        position: pos,
        map: mapInstance.current,
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 7,
          fillColor: '#f44336',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: 'Drop',
      });
      markersRef.current.push(m);
      bounds.extend(pos);
    }
    if (driverLat && driverLng) {
      const pos = { lat: parseFloat(driverLat), lng: parseFloat(driverLng) };
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setPosition(pos);
      } else {
        driverMarkerRef.current = new window.google.maps.Marker({
          position: pos,
          map: mapInstance.current,
          icon: {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 8,
            fillColor: '#e91e8c',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          title: 'Driver',
        });
      }
      bounds.extend(pos);
    }
    if (showRoute && pickupLat && pickupLng && dropLat && dropLng) {
      const ds = new window.google.maps.DirectionsService();
      const dr = new window.google.maps.DirectionsRenderer({
        map: mapInstance.current,
        suppressMarkers: true,
        polylineOptions: { strokeColor: '#ffffff', strokeWeight: 3, strokeOpacity: 0.8 },
      });
      routeRef.current = dr;

      ds.route(
        {
          origin: { lat: parseFloat(pickupLat), lng: parseFloat(pickupLng) },
          destination: { lat: parseFloat(dropLat), lng: parseFloat(dropLng) },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK') dr.setDirections(result);
        }
      );
    }
    if (!bounds.isEmpty() && markersRef.current.length > 1) {
      mapInstance.current.fitBounds(bounds, { top: 60, right: 40, bottom: 40, left: 40 });
    }
  }, [pickupLat, pickupLng, dropLat, dropLng, driverLat, driverLng, showRoute]);
  useEffect(() => {
    if (window.google) {
      initMap();
    } else {
      const interval = setInterval(() => {
        if (window.google) { clearInterval(interval); initMap(); }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [initMap]);
  useEffect(() => {
    if (mapInstance.current) drawMarkersAndRoute();
  }, [drawMarkersAndRoute]);
  if (!window.google) {
    return (
      <div className="map-placeholder" style={{ height }}>
        <span className="map-ph-icon">🗺️</span>
        <span>Loading map...</span>
      </div>
    );
  }

  return <div ref={mapRef} style={{ width: '100%', height }} />;
};

export default MapView;
