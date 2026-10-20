import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

export const AdminRestaurants = () => {
  const { token } = useContext(AuthContext);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/restaurants`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setRestaurants(data);
        } else {
          setError(data.msg || 'Failed to fetch restaurants list');
        }
      } catch (err) {
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [token]);

  const filteredRestaurants = restaurants.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.cuisine.some(c => c.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        Loading restaurant partners panel...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#E53E3E' }}>
        <h3>Error loading restaurants</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-col animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem 0' }}>
      
      {/* Title & Search row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="title-medium" style={{ margin: 0, fontWeight: '800', fontSize: '2.2rem' }}>Restaurant Partners</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            List of registered restaurants, contact info, total orders received, and platform commission generated.
          </p>
        </div>

        <div style={{ position: 'relative', width: '300px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by restaurant or cuisine..."
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
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Restaurant</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Owner Details</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cuisines & Hours</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rating</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Total Orders</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Total Revenue</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Commission (10%)</th>
              </tr>
            </thead>
            <tbody>
              {filteredRestaurants.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No restaurants found</td>
                </tr>
              ) : (
                filteredRestaurants.map(rest => (
                  <tr key={rest._id} style={{ borderBottom: '1px solid #F7FAFC' }}>
                    
                    {/* Name & Address */}
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem' }}>
                      <span style={{ fontWeight: '700', display: 'block', color: 'var(--text-main)' }}>{rest.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rest.address}</span>
                    </td>

                    {/* Owner details */}
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: '500', display: 'block' }}>{rest.ownerName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rest.ownerEmail}</span>
                    </td>

                    {/* Cuisines & Hours */}
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'block', fontWeight: '500' }}>
                        {rest.cuisine.join(', ')}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Hours: {rest.openingTime} - {rest.closingTime}
                      </span>
                    </td>

                    {/* Rating */}
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', fontWeight: '700', color: '#D69E2E' }}>
                      ⭐ {rest.rating ? rest.rating.toFixed(1) : '4.0'}
                    </td>

                    {/* Total Orders */}
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', fontWeight: '700', textAlign: 'center' }}>
                      {rest.orderCount}
                    </td>

                    {/* Total Revenue */}
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', fontWeight: '700', textAlign: 'right', color: 'var(--text-main)' }}>
                      ₹{rest.totalRevenue.toFixed(2)}
                    </td>

                    {/* Commission */}
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.95rem', fontWeight: '800', textAlign: 'right', color: 'var(--primary-color)' }}>
                      ₹{rest.commissionGenerated.toFixed(2)}
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
