import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

export const AdminDashboard = ({ navigateTo }) => {
  const { token } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setStats(data);
        } else {
          setError(data.msg || 'Failed to fetch admin stats');
        }
      } catch (err) {
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        Loading Admin Panel statistics...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#E53E3E' }}>
        <h3>Error loading dashboard</h3>
        <p>{error}</p>
      </div>
    );
  }

  const { counts, revenue, monthlyComparison, recentOrders, topRestaurants, topCustomers, topRiders, cuisineDistribution, statusCounts, monthlyTrend } = stats;

  // Percentage calculations for comparison
  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const pct = ((current - previous) / previous) * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  };

  // Dynamic revenue monthly trend coordinates from backend
  const months = monthlyTrend && monthlyTrend.length > 0 
    ? monthlyTrend.map(t => t.label) 
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const revenueTrendPoints = monthlyTrend && monthlyTrend.length > 0 
    ? monthlyTrend.map(t => t.revenue) 
    : [0, 0, 0, 0, 0, 0];
  const maxRevenue = Math.max(...revenueTrendPoints) || 100;
  
  // Convert points to SVG coordinates (width=400, height=150)
  const svgWidth = 500;
  const svgHeight = 160;
  const chartPadding = 25;
  const graphPoints = revenueTrendPoints.map((val, idx) => {
    const x = chartPadding + (idx * (svgWidth - chartPadding * 2) / (revenueTrendPoints.length - 1));
    const y = svgHeight - chartPadding - (val * (svgHeight - chartPadding * 2) / maxRevenue);
    return { x, y };
  });

  const linePath = graphPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${graphPoints[graphPoints.length - 1].x} ${svgHeight - chartPadding} L ${graphPoints[0].x} ${svgHeight - chartPadding} Z`;

  // Donut chart segments for status counts
  const totalStatus = Object.values(statusCounts).reduce((sum, v) => sum + v, 0) || 1;
  const statusColors = {
    placed: '#4299E1',
    confirmed: '#805AD5',
    preparing: '#DD6B20',
    out_for_delivery: '#319795',
    delivered: '#38A169',
    cancelled: '#E53E3E'
  };

  let accumAngle = 0;
  const donutSegments = Object.keys(statusCounts).map(key => {
    const count = statusCounts[key];
    const percentage = (count / totalStatus) * 100;
    const angle = (count / totalStatus) * 360;
    const segment = {
      label: key.replace(/_/g, ' '),
      color: statusColors[key],
      count,
      percentage: percentage.toFixed(0),
      startAngle: accumAngle,
      endAngle: accumAngle + angle
    };
    accumAngle += angle;
    return segment;
  });

  return (
    <div className="flex-col animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', padding: '1rem 0' }}>
      
      {/* Page Title */}
      <div>
        <h2 className="title-medium" style={{ margin: 0, fontWeight: '800', fontSize: '2.2rem' }}>Admin Dashboard</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
          Overview of platform operations, finances, and system resources.
        </p>
      </div>

      {/* Grid of Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.5rem' }}>
        
        {/* Total Admin Revenue */}
        <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary-color)', letterSpacing: '0.05em' }}>Admin Commission (15%)</span>
          <span style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>₹{revenue.adminCommission.toFixed(2)}</span>
          <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From total sales of ₹{revenue.totalOrdersAmount.toFixed(0)}</span>
          </div>
        </div>

        {/* Total Customers */}
        <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: 'pointer' }} onClick={() => navigateTo('admin-customers')}>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Total Customers</span>
          <span style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{counts.customers}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: '600' }}>View Customer Directory &rarr;</span>
        </div>

        {/* Total Restaurants */}
        <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: 'pointer' }} onClick={() => navigateTo('admin-restaurants')}>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Partner Restaurants</span>
          <span style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{counts.restaurants}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: '600' }}>View Restaurants Panel &rarr;</span>
        </div>

        {/* Active Riders */}
        <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: 'pointer' }} onClick={() => navigateTo('admin-riders')}>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Delivery Riders</span>
          <span style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{counts.riders}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: '600' }}>View Riders Directory &rarr;</span>
        </div>

      </div>

      {/* Analytics Section: Charts & Growth */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
        
        {/* SVG Line Chart: Revenue Trend */}
        <div className="card" style={{ padding: '2rem', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.01)', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>Admin Revenue Growth Trend</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Commission earnings trends over the past 7 months</span>
          </div>

          <div style={{ position: 'relative', width: '100%' }}>
            <svg width="100%" height="180" viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ overflow: 'visible' }}>
              {/* Grid Lines */}
              <line x1={chartPadding} y1={svgHeight - chartPadding} x2={svgWidth - chartPadding} y2={svgHeight - chartPadding} stroke="#E2E8F0" strokeWidth="1" />
              <line x1={chartPadding} y1={chartPadding} x2={svgWidth - chartPadding} y2={chartPadding} stroke="#EDF2F7" strokeWidth="1" strokeDasharray="4 4" />

              {/* Area Gradient under curve */}
              <path d={areaPath} fill="rgba(255, 87, 34, 0.08)" />

              {/* Smooth line curve */}
              <path d={linePath} fill="none" stroke="var(--primary-color)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Coordinates dots */}
              {graphPoints.map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r="5" fill="#FFFFFF" stroke="var(--primary-color)" strokeWidth="3" />
                  {/* Tooltip value */}
                  <text x={p.x} y={p.y - 12} textAnchor="middle" style={{ fontSize: '0.7rem', fontWeight: '700', fill: 'var(--text-main)' }}>
                    ₹{revenueTrendPoints[idx].toFixed(0)}
                  </text>
                  {/* Label Month */}
                  <text x={p.x} y={svgHeight - 5} textAnchor="middle" style={{ fontSize: '0.75rem', fill: 'var(--text-muted)', fontWeight: '500' }}>
                    {months[idx]}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Growth Comparison Stats from Previous Month */}
        <div className="card" style={{ padding: '2rem', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.01)', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>Month-over-Month (MoM) Growth</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Comparison of key metrics against the previous month</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Orders Growth */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid #F0F0F0' }}>
              <div>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', display: 'block' }}>Monthly Orders Placed</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  This Month: {monthlyComparison.orders.current} | Last Month: {monthlyComparison.orders.previous}
                </span>
              </div>
              <span style={{
                backgroundColor: monthlyComparison.orders.current >= monthlyComparison.orders.previous ? '#E6F4EA' : '#FDE8E8',
                color: monthlyComparison.orders.current >= monthlyComparison.orders.previous ? '#137333' : '#C5221F',
                fontSize: '0.85rem',
                fontWeight: '700',
                padding: '0.3rem 0.6rem',
                borderRadius: '6px'
              }}>
                {calculateChange(monthlyComparison.orders.current, monthlyComparison.orders.previous)}
              </span>
            </div>

            {/* Revenue Growth */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid #F0F0F0' }}>
              <div>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', display: 'block' }}>Admin Commission Earned</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  This Month: ₹{monthlyComparison.revenue.current.toFixed(0)} | Last Month: ₹{monthlyComparison.revenue.previous.toFixed(0)}
                </span>
              </div>
              <span style={{
                backgroundColor: monthlyComparison.revenue.current >= monthlyComparison.revenue.previous ? '#E6F4EA' : '#FDE8E8',
                color: monthlyComparison.revenue.current >= monthlyComparison.revenue.previous ? '#137333' : '#C5221F',
                fontSize: '0.85rem',
                fontWeight: '700',
                padding: '0.3rem 0.6rem',
                borderRadius: '6px'
              }}>
                {calculateChange(monthlyComparison.revenue.current, monthlyComparison.revenue.previous)}
              </span>
            </div>

            {/* Registration Growth */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', display: 'block' }}>New User Registrations</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  This Month: {monthlyComparison.registrations.current} | Last Month: {monthlyComparison.registrations.previous}
                </span>
              </div>
              <span style={{
                backgroundColor: monthlyComparison.registrations.current >= monthlyComparison.registrations.previous ? '#E6F4EA' : '#FDE8E8',
                color: monthlyComparison.registrations.current >= monthlyComparison.registrations.previous ? '#137333' : '#C5221F',
                fontSize: '0.85rem',
                fontWeight: '700',
                padding: '0.3rem 0.6rem',
                borderRadius: '6px'
              }}>
                {calculateChange(monthlyComparison.registrations.current, monthlyComparison.registrations.previous)}
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* Tables Row: Cuisines, Top Restaurants, Recent Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Top Cuisine Preferences */}
        <div className="card" style={{ padding: '2rem', border: '1px solid var(--border-color)', borderRadius: '16px', backgroundColor: '#FFFFFF' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.15rem', fontWeight: '800' }}>Cuisine Distribution</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {cuisineDistribution.length === 0 ? (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No cuisine orders recorded yet.</span>
            ) : (
              cuisineDistribution.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600' }}>
                    <span>{item.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{item.count} orders</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#EDF2F7', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${(item.count / (cuisineDistribution[0].count || 1)) * 100}%`,
                      height: '100%',
                      backgroundColor: 'var(--primary-color)',
                      borderRadius: '4px',
                      opacity: 1 - idx * 0.12
                    }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Performing Restaurants */}
        <div className="card" style={{ padding: '2rem', border: '1px solid var(--border-color)', borderRadius: '16px', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>Top Kitchens by Order Volume</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: '600', cursor: 'pointer' }} onClick={() => navigateTo('admin-restaurants')}>
              View All &rarr;
            </span>
          </div>
          
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Restaurant Name</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cuisines</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Total Orders</th>
              </tr>
            </thead>
            <tbody>
              {topRestaurants.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ padding: '1rem', textAnchor: 'middle', color: 'var(--text-muted)' }}>No orders placed yet</td>
                </tr>
              ) : (
                topRestaurants.map(rest => (
                  <tr key={rest._id} style={{ borderBottom: '1px solid #F7FAFC' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>{rest.name}</td>
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rest.cuisine.join(', ')}</td>
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', fontWeight: '700', textAlign: 'right', color: 'var(--primary-color)' }}>{rest.orderCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Top Customers & Top Riders tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Top Performing Riders */}
        <div className="card" style={{ padding: '2rem', border: '1px solid var(--border-color)', borderRadius: '16px', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>Top Performing Riders</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: '600', cursor: 'pointer' }} onClick={() => navigateTo('admin-riders')}>
              View All &rarr;
            </span>
          </div>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rider Name</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Completed Deliveries</th>
              </tr>
            </thead>
            <tbody>
              {topRiders.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No completed deliveries yet</td>
                </tr>
              ) : (
                topRiders.map(rider => (
                  <tr key={rider._id} style={{ borderBottom: '1px solid #F7FAFC' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>{rider.name}</td>
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rider.email}</td>
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', fontWeight: '700', textAlign: 'right', color: '#319795' }}>{rider.deliveryCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Top Valued Customers */}
        <div className="card" style={{ padding: '2rem', border: '1px solid var(--border-color)', borderRadius: '16px', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>Top Valued Customers</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: '600', cursor: 'pointer' }} onClick={() => navigateTo('admin-customers')}>
              View All &rarr;
            </span>
          </div>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer Name</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Orders</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Total Spending</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No orders placed yet</td>
                </tr>
              ) : (
                topCustomers.map(cust => (
                  <tr key={cust._id} style={{ borderBottom: '1px solid #F7FAFC' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>{cust.name}</td>
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cust.orderCount} orders</td>
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', fontWeight: '700', textAlign: 'right', color: 'var(--primary-color)' }}>₹{cust.totalSpent.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Recent Orders List */}
      <div className="card" style={{ padding: '2rem', border: '1px solid var(--border-color)', borderRadius: '16px', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>System Wide Recent Orders</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Monitor latest checkout activity and statuses</span>
          </div>
          <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={() => navigateTo('admin-orders')}>
            View All Orders &rarr;
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Order ID</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Restaurant</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bill Amount</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rider Status</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Order Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No orders placed on platform yet</td>
                </tr>
              ) : (
                recentOrders.map(order => (
                  <tr key={order._id} style={{ borderBottom: '1px solid #F7FAFC' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      #{order._id.toString().slice(-6).toUpperCase()}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: '600', display: 'block' }}>{order.customer ? order.customer.name : 'Deleted Customer'}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customer ? order.customer.email : ''}</span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem', fontWeight: '500' }}>
                      {order.restaurant ? order.restaurant.name : 'Deleted Kitchen'}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem', fontWeight: '700' }}>
                      ₹{order.totalAmount.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem' }}>
                      {order.rider ? (
                        <span style={{ color: '#2B6CB0', fontWeight: '600' }}>{order.rider.name}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not Assigned</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
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
