import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

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
      const response = await fetch('http://localhost:5000/api/orders/rider', {
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
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/rider-status`, {
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
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/accept-dispatch`, {
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
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/reject-dispatch`, {
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
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/rider-status`, {
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
