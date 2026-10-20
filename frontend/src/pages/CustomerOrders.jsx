import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

export const CustomerOrders = ({ navigateToParams }) => {
  const { token } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/orders`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (response.ok) {
          setOrders(data);
        } else {
          setError(data.msg || 'Failed to retrieve order history');
        }
      } catch (err) {
        console.error(err);
        setError('Unable to load your orders at the moment. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'placed':
        return 'badge-pending';
      case 'confirmed':
      case 'preparing':
        return 'badge-preparing';
      case 'out_for_delivery':
        return 'badge-shipping';
      case 'delivered':
        return 'badge-success';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-pending';
    }
  };

  const getStatusText = (status) => {
    return status.replace(/_/g, ' ').toUpperCase();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        Retrieving order history...
      </div>
    );
  }

  return (
    <div className="flex-col gap-6 animate-fade-in">
      <div className="flex-col gap-2">
        <h1 className="title-medium">Your Order History</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Check status, tracking details, and items ordered
        </p>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#FED7D7',
          color: '#9B2C2C',
          padding: '0.75rem 1rem',
          borderRadius: '6px',
          fontSize: '0.85rem',
          borderLeft: '4px solid #E53E3E'
        }}>
          {error}
        </div>
      )}

      {orders.length > 0 ? (
        <div className="flex-col gap-4">
          {orders.map((order) => (
            <div key={order._id} className="card flex justify-between" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', padding: '1.5rem 2rem' }}>
              
              {/* Order Metadata */}
              <div className="flex-col gap-2" style={{ flex: '1 1 300px' }}>
                <div className="flex items-center gap-3">
                  <span className="title-small" style={{ fontSize: '1.05rem' }}>
                    {order.restaurant?.name || 'Restaurant'}
                  </span>
                  <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Order ID: {order._id}
                </span>

                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Placed on: {new Date(order.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </span>

                {/* Items snapshot list */}
                <div style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '0.75rem',
                  marginTop: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}>
                  {order.items.map((item, idx) => (
                    <span key={idx} style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
                      {item.quantity} x {item.name} <span style={{ color: 'var(--text-muted)' }}>({item.price} each)</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Order Cost & Action */}
              <div className="flex-col justify-between items-center" style={{ flex: '0 0 160px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Total Paid</span>
                  <span style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    ₹{order.totalAmount}
                  </span>
                </div>

                {order.status !== 'delivered' && order.status !== 'cancelled' ? (
                  <button
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', width: '100%', marginTop: '1rem' }}
                    onClick={() => navigateToParams('customer-track', { orderId: order._id })}
                  >
                    Track Order &rarr;
                  </button>
                ) : (
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', width: '100%' }}>
                    {order.status === 'delivered' && (
                      order.restaurantRating !== null || order.riderRating !== null ? (
                        <span style={{ fontSize: '0.75rem', color: '#2E7D32', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                          ✓ Rated
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#D69E2E', fontWeight: '600' }}>
                          ★ Rating Pending
                        </span>
                      )
                    )}
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', width: '100%' }}
                      onClick={() => navigateToParams('customer-track', { orderId: order._id })}
                    >
                      {order.status === 'delivered' && (order.restaurantRating === null && order.riderRating === null) ? 'Rate Order' : 'View Details'}
                    </button>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <div>
            <h3 className="title-small" style={{ marginBottom: '0.25rem' }}>No Orders Placed</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>You have not placed any orders yet.</p>
          </div>
        </div>
      )}
    </div>
  );
};
