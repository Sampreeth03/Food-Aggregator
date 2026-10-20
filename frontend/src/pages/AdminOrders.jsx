import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

export const AdminOrders = () => {
  const { token } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/orders`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setOrders(data);
        } else {
          setError(data.msg || 'Failed to fetch orders list');
        }
      } catch (err) {
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  const filteredOrders = orders.filter(o => 
    o._id.toString().toLowerCase().includes(search.toLowerCase()) ||
    (o.customer && o.customer.name.toLowerCase().includes(search.toLowerCase())) ||
    (o.restaurant && o.restaurant.name.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        Loading all platform orders...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#E53E3E' }}>
        <h3>Error loading orders list</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-col animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem 0' }}>
      
      {/* Title & Search row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="title-medium" style={{ margin: 0, fontWeight: '800', fontSize: '2.2rem' }}>Order Records</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            System-wide order log tracking restaurants, riders, customer checkouts, and financial statuses.
          </p>
        </div>

        <div style={{ position: 'relative', width: '300px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by ID, customer or restaurant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem', borderRadius: '10px' }}
          />
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1.1rem' }}>🔍</span>
        </div>
      </div>

      {/* Directory Table Card */}
      <div className="card" style={{ padding: '2rem', border: '1px solid var(--border-color)', borderRadius: '16px', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Order ID &amp; Time</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer Details</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Restaurant</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Items &amp; Quantities</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bill Amount</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rider Info</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment Status</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Order Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No orders matched search query</td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order._id} style={{ borderBottom: '1px solid #F7FAFC' }}>
                    
                    {/* Order ID & Time */}
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--text-main)' }}>
                        #{order._id.toString().slice(-8).toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                        {new Date(order.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    {/* Customer */}
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: '600', display: 'block' }}>{order.customer ? order.customer.name : 'Deleted Customer'}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customer ? order.customer.email : ''}</span>
                    </td>

                    {/* Restaurant */}
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem', fontWeight: '500' }}>
                      {order.restaurant ? order.restaurant.name : 'Deleted Kitchen'}
                    </td>

                    {/* Items */}
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-main)', maxWidth: '200px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {order.items.map((item, idx) => (
                          <span key={idx}>
                            {item.quantity}x {item.name} (₹{item.price})
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', fontWeight: '700' }}>
                      ₹{order.totalAmount.toFixed(2)}
                    </td>

                    {/* Rider Info */}
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem' }}>
                      {order.rider ? (
                        <div>
                          <span style={{ fontWeight: '600', color: '#2B6CB0', display: 'block' }}>{order.rider.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dispatch: {order.riderStatus}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>

                    {/* Payment Status */}
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span className={`badge ${
                        order.paymentStatus === 'completed' ? 'badge-success' :
                        order.paymentStatus === 'failed' ? 'badge-danger' :
                        'badge-warning'
                      }`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                        {order.paymentStatus}
                      </span>
                    </td>

                    {/* Order Status */}
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                      <span className={`badge ${
                        order.status === 'delivered' ? 'badge-success' :
                        order.status === 'cancelled' ? 'badge-danger' :
                        order.status === 'placed' ? 'badge-warning' :
                        'badge-info'
                      }`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
