import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const RiderDashboardView = () => {
  const { token, user } = useContext(AuthContext);

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  const fetchRiderProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/riders/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Error fetching rider profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchRiderOrders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/orders/rider', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching rider orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchRiderProfile();
    fetchRiderOrders();
  }, [token]);

  const handleToggleOnline = async () => {
    setStatusMessage('');
    try {
      const response = await fetch('http://localhost:5000/api/riders/profile/toggle-online', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setProfile(data.profile);
        setStatusMessage(data.profile.isOnline ? 'You are now online' : 'You are now offline');
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loadingProfile || loadingOrders) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        Retrieving dashboard analytics...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card" style={{ maxWidth: '500px', margin: '3rem auto', padding: '2.5rem', textAlign: 'center' }}>
        <h3 className="title-small" style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>No Profile Found</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Please complete your courier setup under the Profile tab before accessing the dashboard.
        </p>
      </div>
    );
  }

  const completedOrders = orders.filter(o => o.status === 'delivered');
  const totalEarnings = completedOrders.length * 40;
  
  // Advanced Analytics calculations
  const totalDistance = (completedOrders.length * 2.5).toFixed(1); // 2.5 km per delivery
  const totalHours = (completedOrders.length * 0.5).toFixed(1); // 30 mins per delivery
  const avgPayout = completedOrders.length > 0 ? 40 : 0;
  
  // Daily Earnings Goal (Target: ₹500)
  const dailyGoal = 500;
  const goalPercentage = Math.min(100, Math.round((totalEarnings / dailyGoal) * 100));

  // Top Picked Restaurants calculation
  const restaurantCounts = {};
  completedOrders.forEach(o => {
    const name = o.restaurant?.name || 'Unknown Partner';
    restaurantCounts[name] = (restaurantCounts[name] || 0) + 1;
  });
  const topRestaurants = Object.entries(restaurantCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
      
      {/* Welcome Banner / Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="title-medium" style={{ marginBottom: '0.25rem' }}>Welcome back, {user?.name}!</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Here is a summary of your performance and earnings.</p>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Duty vehicle: <strong style={{ color: 'var(--text-main)' }}>{profile.vehicleType.toUpperCase()}</strong>
        </span>
      </div>

      {/* Duty Status Control card */}
      <div className="card" style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 className="title-small" style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Duty Status</h3>
            <span style={{ 
              fontSize: '0.85rem', 
              color: profile.isOnline ? 'var(--secondary-success)' : 'var(--text-muted)', 
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: profile.isOnline ? 'var(--secondary-success)' : '#A0AEC0',
                display: 'inline-block'
              }} />
              {profile.isOnline ? 'Online - Receiving active orders' : 'Offline - Off-duty'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {statusMessage && (
              <span style={{ fontSize: '0.8rem', color: 'var(--secondary-success)', fontWeight: '500' }}>
                {statusMessage}
              </span>
            )}
            <button
              type="button"
              className={profile.isOnline ? 'btn btn-secondary' : 'btn btn-success'}
              style={{ padding: '0.6rem 1.5rem', fontSize: '0.875rem' }}
              onClick={handleToggleOnline}
            >
              {profile.isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        </div>
      </div>

      {/* Earnings Widgets Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        
        {/* Earnings Card */}
        <div className="card flex-col gap-1" style={{ padding: '1.5rem', borderLeft: '4px solid var(--secondary-success)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Earnings</span>
          <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--secondary-success)' }}>₹{totalEarnings}.00</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Commission-free earnings</span>
        </div>

        {/* Deliveries Card */}
        <div className="card flex-col gap-1" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary-color)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Deliveries Completed</span>
          <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)' }}>{completedOrders.length}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>All-time orders delivered</span>
        </div>

        {/* Distance Card */}
        <div className="card flex-col gap-1" style={{ padding: '1.5rem', borderLeft: '4px solid #3182CE' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Distance Traveled</span>
          <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)' }}>{totalDistance} km</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated active transit</span>
        </div>

        {/* Rating Card */}
        <div className="card flex-col gap-1" style={{ padding: '1.5rem', borderLeft: '4px solid #D69E2E' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Courier Rating</span>
          <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#D69E2E' }}>★ {profile.rating.toFixed(1)}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From customer reviews</span>
        </div>

      </div>

      {/* Progress & Operational stats split layout */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        
        {/* Daily Goal & Metrics (Left) */}
        <div className="card flex-col gap-6" style={{ flex: '1 1 400px', padding: '2rem' }}>
          <h3 className="title-small" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Daily Progress & Goals</h3>
          
          {/* Progress Goal */}
          <div className="flex-col gap-2">
            <div className="flex justify-between" style={{ fontSize: '0.85rem', fontWeight: '500' }}>
              <span>Daily Earnings Target (₹{dailyGoal})</span>
              <span style={{ color: 'var(--secondary-success)', fontWeight: '600' }}>{goalPercentage}%</span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${goalPercentage}%`, backgroundColor: 'var(--secondary-success)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Earned ₹{totalEarnings} of ₹{dailyGoal} target. {dailyGoal - totalEarnings > 0 ? `₹${dailyGoal - totalEarnings} remaining today.` : 'Daily goal achieved!'}
            </span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

          {/* Operational Metrics */}
          <div className="flex-col gap-3">
            <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Performance Breakdown</h4>
            <div className="flex justify-between" style={{ fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Estimated active hours:</span>
              <span style={{ fontWeight: '600' }}>{totalHours} hrs</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Average payout per order:</span>
              <span style={{ fontWeight: '600' }}>₹{avgPayout}.00</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Vehicle mileage index:</span>
              <span style={{ fontWeight: '600' }}>Efficient</span>
            </div>
          </div>
        </div>

        {/* Top Restaurants & Partner summaries (Right) */}
        <div className="card flex-col gap-4" style={{ flex: '1 1 300px', padding: '2rem' }}>
          <h3 className="title-small" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Top Picked Partners</h3>
          
          {topRestaurants.length > 0 ? (
            <div className="flex-col gap-4" style={{ marginTop: '0.5rem' }}>
              {topRestaurants.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center" style={{ fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--bg-color)', 
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '700'
                    }}>
                      {idx + 1}
                    </div>
                    <span style={{ fontWeight: '500' }}>{item.name}</span>
                  </div>
                  <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{item.count} deliveries</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>
              No restaurant data available. Completed orders will appear here.
            </div>
          )}
        </div>

      </div>

      {/* Delivery Earnings History Table */}
      <div className="card flex-col gap-4" style={{ padding: '2rem', backgroundColor: '#FFFFFF' }}>
        <h3 className="title-small" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Delivery Earnings History Ledger</h3>
        
        {loadingOrders ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Retrieving your delivery records...</div>
        ) : completedOrders.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: '600' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Order Ref</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Restaurant</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Payout</th>
                </tr>
              </thead>
              <tbody>
                {completedOrders.map((completedJob) => (
                  <tr key={completedJob._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      #{completedJob._id.substring(completedJob._id.length - 8)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>
                      {completedJob.restaurant?.name || 'Restaurant'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-main)' }}>
                      {completedJob.customer?.name || 'Customer'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                      {new Date(completedJob.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--secondary-success)' }}>
                      ₹40.00
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>
            You haven't completed any deliveries yet. Go online to start earning!
          </div>
        )}
      </div>

    </div>
  );
};
