import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

export const AdminCustomers = () => {
  const { token } = useContext(AuthContext);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/customers`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setCustomers(data);
        } else {
          setError(data.msg || 'Failed to fetch customers list');
        }
      } catch (err) {
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [token]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        Loading customers directory...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#E53E3E' }}>
        <h3>Error loading customer list</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-col animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem 0' }}>
      
      {/* Title & Search row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="title-medium" style={{ margin: 0, fontWeight: '800', fontSize: '2.2rem' }}>Customer Directory</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Registered customers, contact details, culinary preferences, and total spending.
          </p>
        </div>

        <div style={{ position: 'relative', width: '300px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by name or email..."
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
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer Name</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contact Info</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Address</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Favorite Cuisines</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Total Orders</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No customers matched your search query</td>
                </tr>
              ) : (
                filteredCustomers.map(cust => (
                  <tr key={cust._id} style={{ borderBottom: '1px solid #F7FAFC' }}>
                    
                    {/* Name & Joined date */}
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem' }}>
                      <span style={{ fontWeight: '700', display: 'block', color: 'var(--text-main)' }}>{cust.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Registered: {new Date(cust.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </td>

                    {/* Email & Phone */}
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: '500', display: 'block' }}>{cust.email}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phone: {cust.phone}</span>
                    </td>

                    {/* Address & Saved addresses count */}
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden' }}>{cust.address}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: '600' }}>
                        {cust.savedAddressesCount} saved address cards
                      </span>
                    </td>

                    {/* Favorite Cuisines */}
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {cust.favoriteCuisines.length === 0 ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None specified</span>
                        ) : (
                          cust.favoriteCuisines.map((c, idx) => (
                            <span 
                              key={idx} 
                              style={{ 
                                backgroundColor: '#FFEBE6', 
                                color: 'var(--primary-color)', 
                                fontSize: '0.7rem', 
                                fontWeight: '700', 
                                padding: '0.15rem 0.4rem', 
                                borderRadius: '4px',
                                textTransform: 'capitalize'
                              }}
                            >
                              {c}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    {/* Order Count */}
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', fontWeight: '700', textAlign: 'center', color: 'var(--text-main)' }}>
                      {cust.orderCount}
                    </td>

                    {/* Total Spend */}
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.95rem', fontWeight: '800', textAlign: 'right', color: 'var(--primary-color)' }}>
                      ₹{cust.totalSpent.toFixed(2)}
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
