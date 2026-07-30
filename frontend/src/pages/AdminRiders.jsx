import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const AdminRiders = () => {
  const { token } = useContext(AuthContext);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchRiders = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/riders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setRiders(data);
        } else {
          setError(data.msg || 'Failed to fetch riders list');
        }
      } catch (err) {
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    fetchRiders();
  }, [token]);

  const filteredRiders = riders.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        Loading riders roster...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#E53E3E' }}>
        <h3>Error loading riders</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-col animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem 0' }}>
      
      {/* Title & Search row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="title-medium" style={{ margin: 0, fontWeight: '800', fontSize: '2.2rem' }}>Courier Fleet</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Roster of delivery agents, online availability status, vehicle type, and completed jobs.
          </p>
        </div>

        <div style={{ position: 'relative', width: '300px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by rider name or email..."
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
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rider Name</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contact Email</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Vehicle Mode</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Completed Deliveries</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Rider Rating</th>
              </tr>
            </thead>
            <tbody>
              {filteredRiders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No couriers matched search parameters</td>
                </tr>
              ) : (
                filteredRiders.map(rider => (
                  <tr key={rider._id} style={{ borderBottom: '1px solid #F7FAFC' }}>
                    
                    {/* Name & Join Date */}
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem' }}>
                      <span style={{ fontWeight: '700', display: 'block', color: 'var(--text-main)' }}>{rider.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Registered: {new Date(rider.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </td>

                    {/* Email */}
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem', fontWeight: '500' }}>
                      {rider.email}
                    </td>

                    {/* Vehicle type */}
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem', textTransform: 'capitalize', fontWeight: '600' }}>
                      🚲 {rider.vehicleType}
                    </td>

                    {/* Availability */}
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span className={`badge ${rider.isOnline ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                        {rider.isOnline ? 'Online / Online' : 'Offline'}
                      </span>
                    </td>

                    {/* Completed Deliveries */}
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', fontWeight: '700', textAlign: 'center' }}>
                      {rider.deliveryCount}
                    </td>

                    {/* Rating */}
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.95rem', fontWeight: '800', textAlign: 'right', color: '#D69E2E' }}>
                      ⭐ {rider.rating ? rider.rating.toFixed(1) : '5.0'}
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
