import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { MapReal } from '../components/MapReal';
import { API_BASE_URL } from '../config/api';

const StarRating = ({ value, onChange, disabled }) => {
  return (
    <div style={{ display: 'flex', gap: '0.4rem' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => !disabled && onChange(star)}
          style={{
            fontSize: '1.75rem',
            cursor: disabled ? 'default' : 'pointer',
            color: star <= value ? '#FFB800' : '#E2E8F0',
            transition: 'transform 0.15s ease',
            display: 'inline-block'
          }}
          onMouseEnter={(e) => !disabled && (e.currentTarget.style.transform = 'scale(1.2)')}
          onMouseLeave={(e) => !disabled && (e.currentTarget.style.transform = 'scale(1)')}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export const CustomerTrack = ({ pageParams, navigateTo }) => {
  const { token } = useContext(AuthContext);
  const { orderId } = pageParams || {};

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveRiderCoords, setLiveRiderCoords] = useState(null);

  // Fetch order details & latest coordinates via HTTP Polling
  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setOrder(data);
        setError('');
        // Update live rider coordinates from latest polled data
        if (data.rider && data.riderStatus === 'accepted' && data.rider.location?.coordinates) {
          setLiveRiderCoords(data.rider.location.coordinates);
        } else if (!data.rider || data.riderStatus !== 'accepted') {
          setLiveRiderCoords(null);
        }
      } else {
        setError(data.msg || 'Failed to retrieve order tracking details');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load tracking details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) {
      setError('Missing Order ID parameter');
      setLoading(false);
      return;
    }

    fetchOrderDetails();

    // Set up HTTP polling every 15 seconds
    const interval = setInterval(() => {
      fetchOrderDetails();
    }, 15000);

    return () => clearInterval(interval);
  }, [orderId, token]);

  const getStatusStepIndex = (status) => {
    const steps = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
    return steps.indexOf(status);
  };

  const calculateRemainingMinutes = (etaTimeStr) => {
    if (!etaTimeStr) return null;
    const diffMs = new Date(etaTimeStr) - Date.now();
    const diffMins = Math.round(diffMs / (60 * 1000));
    return Math.max(0, diffMins);
  };

  const [resRating, setResRating] = useState(0);
  const [riderRatingState, setRiderRatingState] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [ratingSuccess, setRatingSuccess] = useState('');

  const handleSubmitRating = async () => {
    if (resRating === 0 && (!order.rider || riderRatingState === 0)) {
      setRatingError('Please select a rating for the restaurant and/or delivery partner.');
      return;
    }
    setSubmittingRating(true);
    setRatingError('');
    setRatingSuccess('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          restaurantRating: resRating > 0 ? resRating : null,
          riderRating: (order.rider && riderRatingState > 0) ? riderRatingState : null
        })
      });
      const data = await response.json();
      if (response.ok) {
        setRatingSuccess('Thank you! Your ratings have been submitted.');
        setOrder(prev => ({
          ...prev,
          restaurantRating: resRating > 0 ? resRating : prev.restaurantRating,
          riderRating: (order.rider && riderRatingState > 0) ? riderRatingState : prev.riderRating
        }));
      } else {
        setRatingError(data.msg || 'Failed to submit ratings.');
      }
    } catch (err) {
      console.error(err);
      setRatingError('Server connection error. Please try again.');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        Setting up tracking dashboard...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem', textAlign: 'center' }}>
        <h3 className="title-small" style={{ color: '#E53E3E', marginBottom: '1rem' }}>Tracking Error</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error || 'Order detail not found'}</p>
        <button className="btn btn-primary" onClick={() => navigateTo('customer-orders')}>
          Back to Orders
        </button>
      </div>
    );
  }

  const stepIndex = getStatusStepIndex(order.status);
  const remainingMins = calculateRemainingMinutes(order.estimatedDeliveryTime);

  return (
    <div className="flex-col gap-6 animate-fade-in">
      
      {/* Navigation & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={() => navigateTo('customer-orders')} style={{ padding: '0.5rem 1rem' }}>
          &larr; Back to Order History
        </button>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Order Ref: <span style={{ fontWeight: '500' }}>{order._id}</span>
        </span>
      </div>

      {/* Primary Status Card */}
      <div className="card flex-col gap-6" style={{ padding: '2.5rem' }}>
        
        {/* Banner with Status & OTP */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h2 className="title-medium" style={{ fontSize: '1.8rem', color: 'var(--primary-color)' }}>
              {order.status === 'placed' && 'Awaiting Confirmation...'}
              {order.status === 'confirmed' && 'Order Confirmed'}
              {order.status === 'preparing' && 'Kitchen is preparing your food'}
              {order.status === 'out_for_delivery' && 'Out for Delivery!'}
              {order.status === 'delivered' && 'Order Delivered! Enjoy!'}
              {order.status === 'cancelled' && 'Order Cancelled'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
              Ordered from {order.restaurant?.name}
            </p>
          </div>

          {/* Verification Code */}
          {order.status !== 'delivered' && order.status !== 'cancelled' && order.deliveryOtp && (
            <div style={{
              backgroundColor: '#FAFAFA',
              border: '1px solid var(--border-color)',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', fontWeight: '500' }}>
                Delivery Code
              </span>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '0.05em' }}>
                {order.deliveryOtp}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.15rem' }}>
                Provide code to rider
              </span>
            </div>
          )}
        </div>

        {/* Visual Progress Stepper */}
        {order.status !== 'cancelled' && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            marginTop: '1.5rem',
            marginBottom: '1.5rem',
            padding: '0 0.5rem'
          }}>
            {/* Stepper background line */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '0',
              right: '0',
              height: '3px',
              backgroundColor: '#E2E8F0',
              zIndex: '1',
              transform: 'translateY(-50%)'
            }} />
            
            {/* Stepper active line */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '0',
              width: `${(stepIndex / 4) * 100}%`,
              height: '3px',
              backgroundColor: 'var(--primary-color)',
              zIndex: '2',
              transform: 'translateY(-50%)',
              transition: 'width 0.4s ease'
            }} />

            {['Placed', 'Confirmed', 'Preparing', 'Shipping', 'Delivered'].map((step, idx) => {
              const isActive = idx <= stepIndex;
              const isCurrent = idx === stepIndex;
              return (
                <div key={step} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  zIndex: '3',
                  position: 'relative'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: isCurrent ? '#FFFFFF' : isActive ? 'var(--primary-color)' : '#E2E8F0',
                    border: isCurrent ? '4px solid var(--primary-color)' : 'none',
                    boxShadow: isCurrent ? '0 0 0 2px rgba(255, 87, 34, 0.2)' : 'none',
                    transition: 'all 0.4s ease'
                  }} />
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: isActive ? '600' : '400',
                    color: isActive ? 'var(--text-main)' : 'var(--text-muted)'
                  }}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Dynamic ETA summary */}
        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <div style={{
            backgroundColor: '#FAFAFA',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--text-muted)' }}>
              Estimated Delivery
            </span>
            <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary-color)' }}>
              {order.riderStatus === 'pending' || !order.rider
                ? 'Matching delivery partner...'
                : remainingMins !== null
                  ? remainingMins === 0
                    ? 'Arriving any moment now'
                    : `Arriving in ~${remainingMins} mins`
                  : 'Calculating ETA...'}
            </span>
          </div>
        )}

      </div>

      {/* Map Tracking Simulation */}
      {order.status !== 'cancelled' && (
        <div className="flex-col gap-3">
          <h3 className="title-small">Live Delivery Map</h3>
          <MapReal
            restaurantCoords={order.restaurant?.location?.coordinates}
            customerCoords={order.deliveryLocation?.coordinates || order.customer?.location?.coordinates}
            riderCoords={liveRiderCoords}
            status={order.status}
          />
        </div>
      )}

      {/* Rating Section (only if delivered) */}
      {order.status === 'delivered' && (
        <div className="card flex-col gap-4 animate-fade-in" style={{
          padding: '2rem',
          border: '1px solid #E6F4EA',
          backgroundColor: '#F3FAF5',
          borderRadius: '12px'
        }}>
          <h3 className="title-small" style={{ fontSize: '1.2rem', color: '#2E7D32', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #E0E0E0', paddingBottom: '0.5rem', margin: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            How was your delivery experience?
          </h3>

          {(order.restaurantRating !== null || order.riderRating !== null) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '500', margin: 0 }}>
                Thank you for rating your experience! Here are your submitted ratings:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                {order.restaurantRating !== null && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Restaurant Rating:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ color: '#FFB800', fontSize: '1.25rem', letterSpacing: '0.15em' }}>
                        {'★'.repeat(order.restaurantRating)}{'☆'.repeat(5 - order.restaurantRating)}
                      </span>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>({order.restaurantRating}/5)</span>
                    </div>
                  </div>
                )}
                {order.riderRating !== null && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Delivery Partner Rating:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ color: '#FFB800', fontSize: '1.25rem', letterSpacing: '0.15em' }}>
                        {'★'.repeat(order.riderRating)}{'☆'.repeat(5 - order.riderRating)}
                      </span>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>({order.riderRating}/5)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                Your feedback helps us maintain premium quality from our kitchens and delivery partners.
              </p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem' }}>
                {/* Rate Restaurant */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)' }}>
                    Rate {order.restaurant?.name || 'Restaurant'}
                  </span>
                  <StarRating value={resRating} onChange={setResRating} disabled={submittingRating} />
                </div>

                {/* Rate Rider */}
                {order.rider && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)' }}>
                      Rate Delivery Partner ({order.rider.name})
                    </span>
                    <StarRating value={riderRatingState} onChange={setRiderRatingState} disabled={submittingRating} />
                  </div>
                )}
              </div>

              {ratingError && (
                <div style={{ color: '#9B2C2C', backgroundColor: '#FED7D7', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                  {ratingError}
                </div>
              )}

              {ratingSuccess && (
                <div style={{ color: '#22543D', backgroundColor: '#C6F6D5', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                  {ratingSuccess}
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleSubmitRating}
                disabled={submittingRating || (resRating === 0 && (!order.rider || riderRatingState === 0))}
                style={{ alignSelf: 'flex-start', padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}
              >
                {submittingRating ? 'Submitting...' : 'Submit Ratings'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Rider & Order Details */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        
        {/* Courier details */}
        <div className="card flex-col gap-3" style={{ flex: '1 1 300px' }}>
          <h3 className="title-small" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Delivery Partner</h3>
          {order.rider && order.riderStatus === 'accepted' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#E6F4EA',
                color: 'var(--secondary-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600'
              }}>
                {order.rider.name ? order.rider.name.charAt(0) : 'R'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{order.rider.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reliability-verified Rider</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
              <div className="spinner-small" style={{
                width: '20px',
                height: '20px',
                border: '2px solid #E2E8F0',
                borderTop: '2px solid var(--primary-color)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              <span style={{ fontSize: '0.9rem' }}>Finding closest delivery partner...</span>
            </div>
          )}
        </div>

        {/* Order Details items summary */}
        <div className="card flex-col gap-3" style={{ flex: '1 1 400px' }}>
          <h3 className="title-small" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Order Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between" style={{ fontSize: '0.9rem' }}>
                <span>{item.quantity} x {item.name}</span>
                <span style={{ fontWeight: '500' }}>₹{item.price * item.quantity}</span>
              </div>
            ))}
            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />
            <div className="flex justify-between" style={{ fontWeight: '700', fontSize: '1rem' }}>
              <span>Total Paid</span>
              <span style={{ color: 'var(--primary-color)' }}>₹{order.totalAmount}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
