import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Helper component to handle centering updates
function ChangeMapView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export const MapReal = ({ restaurantCoords, customerCoords, riderCoords, status }) => {
  const [roadRoute, setRoadRoute] = useState([]);
  
  // MongoDB/GeoJSON coordinates are [longitude, latitude]
  // Leaflet coordinates must be [latitude, longitude]
  const toLatLon = (coords) => {
    if (!coords || coords.length !== 2) return null;
    return [coords[1], coords[0]];
  };

  const restaurantLatLng = toLatLon(restaurantCoords);
  const customerLatLng = toLatLon(customerCoords);
  const riderLatLng = toLatLon(riderCoords);

  // Smooth position tracking interpolation
  const [currentPosition, setCurrentPosition] = useState(null);
  const currentPosRef = useRef(null);

  useEffect(() => {
    if (!riderLatLng) {
      setCurrentPosition(null);
      currentPosRef.current = null;
      return;
    }
    
    if (!currentPosRef.current) {
      currentPosRef.current = riderLatLng;
      setCurrentPosition(riderLatLng);
      return;
    }

    const startPos = currentPosRef.current;
    const endPos = riderLatLng;

    // Skip if positions are identical
    if (Math.abs(startPos[0] - endPos[0]) < 0.000001 && Math.abs(startPos[1] - endPos[1]) < 0.000001) {
      return;
    }

    const duration = 3000; // Smooth 3-second glide when new coordinates arrive
    const startTime = performance.now();

    let animId;
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const lat = startPos[0] + (endPos[0] - startPos[0]) * progress;
      const lng = startPos[1] + (endPos[1] - startPos[1]) * progress;
      const newPos = [lat, lng];

      currentPosRef.current = newPos;
      setCurrentPosition(newPos);

      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      }
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [riderCoords ? `${riderCoords[0]},${riderCoords[1]}` : null]);

  // Fetch the street routing geometry from OSRM between Restaurant and Customer
  useEffect(() => {
    if (!restaurantCoords || !customerCoords) return;

    const fetchRoute = async () => {
      const url = `http://router.project-osrm.org/route/v1/driving/${restaurantCoords[0]},${restaurantCoords[1]};${customerCoords[0]},${customerCoords[1]}?overview=full&geometries=geojson`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.routes && data.routes.length > 0) {
          const pathGeoJSON = data.routes[0].geometry.coordinates; // Array of [lng, lat]
          const pathLatLons = pathGeoJSON.map(pt => [pt[1], pt[0]]);
          setRoadRoute(pathLatLons);
        } else {
          // Fallback to straight line if OSRM doesn't return routes
          setRoadRoute([restaurantLatLng, customerLatLng]);
        }
      } catch (err) {
        console.error("Failed to fetch route from OSRM:", err);
        setRoadRoute([restaurantLatLng, customerLatLng]);
      }
    };

    fetchRoute();
  }, [restaurantCoords, customerCoords]);

  // Set up custom L.divIcon markers to avoid bundler asset-loading issues
  const bikeIcon = L.divIcon({
    html: `
      <div class="pulsing-marker" style="
        background-color: var(--secondary-success);
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        border: 2.5px solid white;
        font-size: 20px;
      ">🚲</div>
    `,
    className: 'custom-bike-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });

  const restaurantIcon = L.divIcon({
    html: `
      <div style="
        background-color: var(--primary-color);
        color: white;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        border: 2px solid white;
        font-size: 18px;
      ">🍳</div>
    `,
    className: 'custom-restaurant-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  const customerIcon = L.divIcon({
    html: `
      <div style="
        background-color: #2D3748;
        color: white;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        border: 2px solid white;
        font-size: 18px;
      ">🏠</div>
    `,
    className: 'custom-customer-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  // Center on customer's delivery location coordinates
  const mapCenter = customerLatLng || [28.6139, 77.2090]; // Fallback to New Delhi default if undefined

  return (
    <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative', height: '360px', backgroundColor: '#F8FAFC' }}>
      
      {/* Dynamic Keyframe Injection for the pulsing bike marker */}
      <style>{`
        @keyframes markerPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.5); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
        }
        .pulsing-marker {
          animation: markerPulse 1.8s infinite ease-in-out;
        }
      `}</style>

      <MapContainer 
        center={mapCenter} 
        zoom={14} 
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', display: 'block', zIndex: 1 }}
      >
        <ChangeMapView center={mapCenter} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Restaurant Pin */}
        {restaurantLatLng && (
          <Marker position={restaurantLatLng} icon={restaurantIcon}>
            <Popup>
              <strong>Restaurant Partner</strong><br />
              Food preparation hub
            </Popup>
          </Marker>
        )}

        {/* Customer / Delivery Address Pin */}
        {customerLatLng && (
          <Marker position={customerLatLng} icon={customerIcon}>
            <Popup>
              <strong>Your Delivery Location</strong><br />
              Destination address
            </Popup>
          </Marker>
        )}

        {/* Rider / Driver Bike Pin */}
        {currentPosition && (
          <Marker position={currentPosition} icon={bikeIcon}>
            <Popup>
              <strong>Delivery Partner (Active)</strong><br />
              Rider is currently shipping your order
            </Popup>
          </Marker>
        )}

        {/* ROUTING POLYLINES */}
        {/* 1. Dashed line: Rider routing to Restaurant (if not picked up yet) */}
        {currentPosition && restaurantLatLng && (status === 'preparing' || status === 'confirmed' || status === 'placed') && (
          <Polyline 
            positions={[currentPosition, restaurantLatLng]} 
            color="#A0AEC0" 
            dashArray="8, 8" 
            weight={3.5} 
          />
        )}

        {/* 2. Solid street line: Restaurant routing to Customer */}
        {roadRoute.length > 0 && (
          <Polyline 
            positions={roadRoute} 
            color={status === 'out_for_delivery' ? 'var(--primary-color)' : '#718096'} 
            weight={status === 'out_for_delivery' ? 5 : 3} 
            opacity={status === 'out_for_delivery' ? 0.9 : 0.4}
          />
        )}
      </MapContainer>

      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        backgroundColor: '#FFFFFF',
        padding: '0.4rem 0.8rem',
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: '600',
        boxShadow: 'var(--shadow-md)',
        color: 'var(--text-main)',
        border: '1px solid var(--border-color)',
        zIndex: 1000
      }}>
        📍 OpenStreetMap Route Integration
      </div>
    </div>
  );
};
