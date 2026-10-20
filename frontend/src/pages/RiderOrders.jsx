import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

// Linear interpolation along a path
const getPointAtRatio = (coords, ratio) => {
  if (!coords || coords.length === 0) return null;
  if (coords.length === 1) return coords[0];
  if (ratio <= 0) return coords[0];
  if (ratio >= 1) return coords[coords.length - 1];

  const segments = [];
  let totalLength = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const dist = Math.sqrt(dx * dx + dy * dy);
    segments.push(dist);
    totalLength += dist;
  }

  if (totalLength === 0) return coords[0];

  const targetDist = totalLength * ratio;
  let accumulatedDist = 0;

  for (let i = 0; i < segments.length; i++) {
    const segLength = segments[i];
    if (accumulatedDist + segLength >= targetDist) {
      const segRatio = (targetDist - accumulatedDist) / segLength;
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const lng = p1[0] + (p2[0] - p1[0]) * segRatio;
      const lat = p1[1] + (p2[1] - p1[1]) * segRatio;
      return [lng, lat];
    }
    accumulatedDist += segLength;
  }

  return coords[coords.length - 1];
};

const RiderLocationSimulator = ({ orderId, restaurantCoords, customerCoords }) => {
  const { token } = useContext(AuthContext);
  const [status, setStatus] = useState('idle'); // 'idle' | 'fetching' | 'simulating' | 'completed' | 'gps_active' | 'error'
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [currentCoords, setCurrentCoords] = useState(null);
  
  const timerRef = useRef(null);
  const watchIdRef = useRef(null);

  // Helper to send coordinates to backend HTTP endpoint
  const sendLocationUpdate = async (coords) => {
    try {
      await fetch(`${API_BASE_URL}/api/orders/${orderId}/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ coords })
      });
    } catch (err) {
      console.error('Failed to push rider location via HTTP polling:', err);
    }
  };

  // Check for existing simulation state in localStorage
  useEffect(() => {
    const storedStart = localStorage.getItem(`BiteSpeed_sim_start_${orderId}`);
    const storedDuration = localStorage.getItem(`BiteSpeed_sim_duration_${orderId}`);
    const storedPath = localStorage.getItem(`BiteSpeed_sim_path_${orderId}`);

    if (storedStart && storedDuration && storedPath) {
      try {
        const startTime = parseInt(storedStart, 10);
        const durationSeconds = parseFloat(storedDuration);
        const pathCoords = JSON.parse(storedPath);

        const elapsed = Math.floor(((Date.now() - startTime) / 1000) * 5);

        if (elapsed < durationSeconds) {
          // Resume simulation from where we left off
          setStatus('simulating');
          const initialRatio = Math.min(1, elapsed / durationSeconds);
          const initialPt = getPointAtRatio(pathCoords, initialRatio);
          setCurrentCoords(initialPt);
          setProgress(Math.round(initialRatio * 100));

          const remainingSecondsReal = Math.round((durationSeconds - elapsed) / 5);
          const formatTime = (sec) => {
            const mins = Math.floor(sec / 60);
            return mins > 0 ? `~${mins} mins` : `${Math.round(sec)} secs`;
          };

          setMessage(`Resumed simulation. Remaining: ${formatTime(remainingSecondsReal)}.`);

          timerRef.current = setInterval(async () => {
            const currentElapsed = ((Date.now() - startTime) / 1000) * 5;

            if (currentElapsed >= durationSeconds) {
              clearInterval(timerRef.current);
              const finalPt = pathCoords[pathCoords.length - 1];
              await sendLocationUpdate(finalPt);
              setCurrentCoords(finalPt);
              setProgress(100);
              setStatus('completed');
              setMessage('Simulation completed! Rider arrived at customer delivery location.');
              
              // Clear stored state
              localStorage.removeItem(`BiteSpeed_sim_start_${orderId}`);
              localStorage.removeItem(`BiteSpeed_sim_duration_${orderId}`);
              localStorage.removeItem(`BiteSpeed_sim_path_${orderId}`);
              return;
            }

            const ratio = Math.min(1, currentElapsed / durationSeconds);
            const pt = getPointAtRatio(pathCoords, ratio);
            if (pt) {
              await sendLocationUpdate(pt);
              setCurrentCoords(pt);
              setProgress(Math.round(ratio * 100));
            }
          }, 15000);
        } else {
          // Simulation is already completed
          setStatus('completed');
          setProgress(100);
          setCurrentCoords(pathCoords[pathCoords.length - 1]);
          setMessage('Simulation completed! Rider has arrived.');
        }
      } catch (err) {
        console.error("Error parsing stored simulation state:", err);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [orderId, token]);

  const startSimulation = async () => {
    if (!restaurantCoords || !customerCoords) {
      setStatus('error');
      setMessage('Error: Missing restaurant or customer coordinates.');
      return;
    }

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setStatus('fetching');
    setMessage('Requesting OSRM street path...');

    const url = `http://router.project-osrm.org/route/v1/driving/${restaurantCoords[0]},${restaurantCoords[1]};${customerCoords[0]},${customerCoords[1]}?overview=full&geometries=geojson`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!data || !data.routes || data.routes.length === 0) {
        throw new Error('No OSRM routes found');
      }

      const routeData = data.routes[0];
      const durationSeconds = routeData.duration; // Total expected travel time in seconds
      const pathCoords = routeData.geometry.coordinates; // Array of [lng, lat]

      // Persist state in localStorage
      const startTime = Date.now();
      localStorage.setItem(`BiteSpeed_sim_start_${orderId}`, startTime.toString());
      localStorage.setItem(`BiteSpeed_sim_duration_${orderId}`, durationSeconds.toString());
      localStorage.setItem(`BiteSpeed_sim_path_${orderId}`, JSON.stringify(pathCoords));

      setStatus('simulating');
      setProgress(0);
      setCurrentCoords(pathCoords[0]);

      // Notify backend to run server-side simulation state as well
      await fetch(`${API_BASE_URL}/api/orders/${orderId}/start-simulation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          durationSeconds,
          pathCoords,
          speedMultiplier: 5
        })
      });
      
      const formatTime = (sec) => {
        const mins = Math.floor(sec / 60);
        return mins > 0 ? `~${mins} mins` : `${Math.round(sec)} secs`;
      };
      
      const simulationDisplayTime = Math.round(durationSeconds / 5);
      setMessage(`Simulation active (5x speed). Expected trip: ${formatTime(simulationDisplayTime)}. Polling updates every 15s.`);

      timerRef.current = setInterval(async () => {
        const elapsed = ((Date.now() - startTime) / 1000) * 5;
        
        if (elapsed >= durationSeconds) {
          clearInterval(timerRef.current);
          const finalPt = pathCoords[pathCoords.length - 1];
          await sendLocationUpdate(finalPt);
          setCurrentCoords(finalPt);
          setProgress(100);
          setStatus('completed');
          setMessage('Simulation completed! Rider arrived at customer delivery location.');
          
          // Clear stored state
          localStorage.removeItem(`BiteSpeed_sim_start_${orderId}`);
          localStorage.removeItem(`BiteSpeed_sim_duration_${orderId}`);
          localStorage.removeItem(`BiteSpeed_sim_path_${orderId}`);
          return;
        }

        const ratio = Math.min(1, elapsed / durationSeconds);
        const pt = getPointAtRatio(pathCoords, ratio);
        if (pt) {
          await sendLocationUpdate(pt);
          setCurrentCoords(pt);
          setProgress(Math.round(ratio * 100));
        }
      }, 15000);

    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Failed to load OSRM path. Please try again.');
    }
  };

  const startGpsTracking = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    if (!navigator.geolocation) {
      setStatus('error');
      setMessage('Geolocation is not supported by your browser.');
      return;
    }

    setStatus('gps_active');
    setMessage('Real-time GPS Tracking active. Updates sent every 15s...');

    let lastSent = 0;
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        const { longitude, latitude } = position.coords;
        const coords = [longitude, latitude];
        setCurrentCoords(coords);

        if (now - lastSent >= 15000) {
          lastSent = now;
          await sendLocationUpdate(coords);
          setMessage(`GPS Update Sent: [${longitude.toFixed(5)}, ${latitude.toFixed(5)}]`);
        }
      },
      (error) => {
        console.error(error);
        setStatus('error');
        setMessage(`GPS Error: ${error.message}`);
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  return (
    <div style={{
      marginTop: '0.5rem',
      marginBottom: '1rem',
      padding: '1.25rem',
      backgroundColor: '#F7FAFC',
      border: '1px solid #E2E8F0',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    }}>
      <h4 style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
        ⚡ GPS Simulator Control Panel
      </h4>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
        Select a mode to broadcast your coordinates to the customer map in real-time.
      </p>

      {currentCoords && (
        <div style={{
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          backgroundColor: '#EDF2F7',
          padding: '0.4rem 0.6rem',
          borderRadius: '4px',
          color: 'var(--text-main)'
        }}>
          Current Coords: [{currentCoords[0].toFixed(5)}, {currentCoords[1].toFixed(5)}]
        </div>
      )}

      {status === 'simulating' && (
        <div className="flex-col gap-1">
          <div className="flex justify-between" style={{ fontSize: '0.7rem', fontWeight: '600' }}>
            <span>Simulation Progress</span>
            <span>{progress}%</span>
          </div>
          <div style={{ height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, backgroundColor: 'var(--secondary-success)', borderRadius: '3px', transition: 'width 0.2s linear' }} />
          </div>
        </div>
      )}

      {message && (
        <span style={{ 
          fontSize: '0.75rem', 
          color: status === 'error' ? '#E53E3E' : status === 'completed' || status === 'gps_active' ? 'var(--secondary-success-hover)' : 'var(--text-main)', 
          fontWeight: '500' 
        }}>
          {message}
        </span>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
        <button 
          type="button" 
          className="btn btn-primary" 
          onClick={startSimulation}
          disabled={status === 'fetching'}
          style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px' }}
        >
          {status === 'simulating' ? '🔄 Restart Simulation' : '▶️ Start GPS Simulation'}
        </button>
        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={startGpsTracking}
          style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px', backgroundColor: '#EDF2F7', border: 'none', color: '#4A5568' }}
        >
          🛰️ Send Device GPS
        </button>
      </div>
    </div>
  );
};

const CountdownTimer = ({ assignedAt, onTimeout }) => {
  const [timeLeft, setTimeLeft] = useState(180);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const assignedTime = new Date(assignedAt).getTime();
      const endTime = assignedTime + 3 * 60 * 1000; // 3 minutes
      const diff = Math.ceil((endTime - Date.now()) / 1000);
      return Math.max(0, diff);
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        onTimeout();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [assignedAt, onTimeout]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div style={{ textAlign: 'right' }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '500' }}>
        Accept within
      </span>
      <span style={{ fontSize: '1.25rem', fontWeight: '700', color: timeLeft < 30 ? '#E53E3E' : 'var(--primary-color)' }}>
        {formattedTime}
      </span>
    </div>
  );
};

export const RiderOrdersView = ({ navigateTo }) => {
  const { token } = useContext(AuthContext);

  const [activeJobs, setActiveJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchRiderOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/rider`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        // Find only orders that are NOT delivered and NOT cancelled
        const active = data.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
        setActiveJobs(active);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiderOrders();

    const interval = setInterval(() => {
      fetchRiderOrders();
    }, 4000);

    return () => clearInterval(interval);
  }, [token]);

  const handlePickup = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/rider-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'out_for_delivery' })
      });

      if (response.ok) {
        fetchRiderOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccept = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/accept-dispatch`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchRiderOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/reject-dispatch`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchRiderOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeliver = async (e, orderId) => {
    e.preventDefault();
    if (!otpInput) {
      setOtpError('Please enter the 4-digit verification code.');
      return;
    }

    setOtpError('');
    setIsVerifying(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/rider-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'delivered', deliveryOtp: parseInt(otpInput) })
      });

      const data = await response.json();

      if (response.ok) {
        setOtpInput('');
        // Clean up simulation storage
        localStorage.removeItem(`BiteSpeed_sim_start_${orderId}`);
        localStorage.removeItem(`BiteSpeed_sim_duration_${orderId}`);
        localStorage.removeItem(`BiteSpeed_sim_path_${orderId}`);
        fetchRiderOrders();
        // Redirect rider to profile page so they can see their online status restored
        navigateTo('rider-profile');
      } else {
        setOtpError(data.msg || 'Incorrect verification code. Please request correct OTP from customer.');
      }
    } catch (err) {
      console.error(err);
      setOtpError('Connection error.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        Retrieving active dispatch jobs...
      </div>
    );
  }

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <h1 className="title-medium">Your Active Delivery Jobs</h1>

      {activeJobs.length > 0 ? (
        <div className="flex-col gap-6">
          {activeJobs.map((job) => {
            const isPending = job.riderStatus === 'pending';

            if (isPending) {
              return (
                <div key={job._id} className="card flex-col gap-6" style={{ padding: '2rem', border: '2px solid var(--primary-color)', boxShadow: '0 4px 20px rgba(255, 87, 34, 0.15)' }}>
                  
                  {/* Header */}
                  <div className="flex justify-between items-start" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <div>
                      <span className="badge badge-shipping" style={{ fontSize: '0.75rem', backgroundColor: '#FFF3CD', color: '#856404' }}>
                        Incoming Request
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                        Job ID: {job._id}
                      </span>
                    </div>
                    <CountdownTimer assignedAt={job.riderAssignedAt} onTimeout={fetchRiderOrders} />
                  </div>

                  {/* Path */}
                  <div className="flex-col gap-4">
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }} />
                        <div style={{ width: '2px', flex: 1, backgroundColor: 'var(--border-color)', minHeight: '30px' }} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', fontWeight: '600' }}>
                          Pick up food from
                        </span>
                        <span style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          {job.restaurant?.name}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>
                          {job.restaurant?.address}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--text-main)' }} />
                      <div>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', fontWeight: '600' }}>
                          Deliver to customer
                        </span>
                        <span style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          {job.customer?.name}
                        </span>
                        {job.deliveryAddress && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>
                            Address: {job.deliveryAddress}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items Summary */}
                  <div style={{
                    backgroundColor: 'var(--bg-color)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                      Items to pick up
                    </span>
                    {job.items.map((item, index) => (
                      <div key={index} style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{item.quantity} x {item.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-4" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                    <button className="btn btn-primary" style={{ flex: 1, padding: '0.85rem' }} onClick={() => handleAccept(job._id)}>
                      Accept Request
                    </button>
                    <button className="btn btn-secondary" style={{ flex: 1, padding: '0.85rem', backgroundColor: '#E2E8F0', border: 'none', color: '#4A5568' }} onClick={() => handleReject(job._id)}>
                      Reject
                    </button>
                  </div>

                </div>
              );
            }

            return (
              <div key={job._id} className="card flex-col gap-6" style={{ padding: '2rem' }}>
                
                {/* Job Header */}
                <div className="flex justify-between items-start" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <div>
                    <span className="badge badge-shipping" style={{ fontSize: '0.75rem' }}>
                      Active Job
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                      Job ID: {job._id}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Delivery payout</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--secondary-success)' }}>
                      ₹40.00
                    </span>
                  </div>
                </div>

                {/* Path: Restaurant to Customer */}
                <div className="flex-col gap-4">
                  {/* Pick up location */}
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }} />
                      <div style={{ width: '2px', flex: 1, backgroundColor: 'var(--border-color)', minHeight: '30px' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', fontWeight: '600' }}>
                        Pick up food from
                      </span>
                      <span style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {job.restaurant?.name}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>
                        {job.restaurant?.address}
                      </span>
                    </div>
                  </div>

                  {/* Drop off location */}
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--text-main)' }} />
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', fontWeight: '600' }}>
                        Deliver to customer
                      </span>
                      <span style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {job.customer?.name}
                      </span>
                      {job.deliveryAddress && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '500', display: 'block', marginTop: '0.15rem' }}>
                          Address: {job.deliveryAddress}
                        </span>
                      )}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.15rem' }}>
                        Coordinates: [{job.deliveryLocation?.coordinates?.join(', ') || job.customer?.location?.coordinates?.join(', ')}]
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items Summary */}
                <div style={{
                  backgroundColor: 'var(--bg-color)',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                    Items to pick up
                  </span>
                  {job.items.map((item, index) => (
                    <div key={index} style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{item.quantity} x {item.name}</span>
                    </div>
                  ))}
                </div>

                {/* Action area based on status */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                  
                  {job.status === 'preparing' || job.status === 'confirmed' || job.status === 'placed' ? (
                    <div className="flex-col gap-3">
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', display: 'block' }}>
                        {job.status === 'preparing' ? 'Food is currently cooking in kitchen. Once prepared, pick it up.' : 'Food is being confirmed. Proceed to restaurant.'}
                      </span>
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.75rem' }}
                        onClick={() => handlePickup(job._id)}
                      >
                        Picked Up &amp; Start Shipping
                      </button>
                    </div>
                  ) : null}

                  {job.status === 'out_for_delivery' ? (
                    <div className="flex-col gap-2">
                      <RiderLocationSimulator
                        orderId={job._id}
                        restaurantCoords={job.restaurant?.location?.coordinates}
                        customerCoords={job.deliveryLocation?.coordinates || job.customer?.location?.coordinates}
                      />

                      <form onSubmit={(e) => handleDeliver(e, job._id)} className="flex-col gap-4">
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', textAlign: 'center' }}>
                          You are shipping this order. Ask the customer for their 4-digit verification code to complete delivery.
                        </span>

                        {otpError && (
                          <div style={{
                            backgroundColor: '#FED7D7',
                            color: '#9B2C2C',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            fontSize: '0.8rem'
                          }}>
                            {otpError}
                          </div>
                        )}

                        <div className="form-group">
                          <label className="form-label" style={{ textAlign: 'center' }}>Enter Customer Delivery Code</label>
                          <input
                            type="text"
                            maxLength="4"
                            className="form-input"
                            style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.1em', width: '150px', margin: '0 auto' }}
                            placeholder="••••"
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                            disabled={isVerifying}
                          />
                        </div>

                        <button
                          type="submit"
                          className="btn btn-success"
                          style={{ width: '100%', padding: '0.85rem' }}
                          disabled={isVerifying}
                        >
                          {isVerifying ? 'Verifying Code...' : 'Verify Code & Complete Order'}
                        </button>
                      </form>
                    </div>
                  ) : null}

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          <div>
            <h3 className="title-small" style={{ marginBottom: '0.25rem' }}>No Active Deliveries</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Ensure your duty status is set to "Online" in your profile to receive jobs.
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigateTo('rider-profile')}>
            Go to Profile
          </button>
        </div>
      )}
    </div>
  );
};
