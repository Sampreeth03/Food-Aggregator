import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { MapMock } from '../components/MapMock';

export const CustomerTrack = ({ pageParams, navigateTo }) => {
  const { token } = useContext(AuthContext);
  const { orderId } = pageParams || {};

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch order details
  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setOrder(data);
        setError('');
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

    // Set up polling to check order status every 4 seconds
    const interval = setInterval(() => {
      fetchOrderDetails();
    }, 4000);

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
          <MapMock
            restaurantCoords={order.restaurant?.location?.coordinates}
            customerCoords={order.customer?.location?.coordinates}
            riderCoords={order.rider && order.riderStatus === 'accepted' ? order.rider?.location?.coordinates : null}
            status={order.status}
          />
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
