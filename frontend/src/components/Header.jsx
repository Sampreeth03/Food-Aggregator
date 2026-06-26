import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

export const Header = ({ currentPage, navigateTo }) => {
  const { user, logout } = useContext(AuthContext);
  const { getCartCount } = useContext(CartContext);

  const handleLogout = () => {
    logout();
    navigateTo('landing');
  };

  return (
    <header className="navbar">
      <div className="nav-logo" onClick={() => navigateTo(user ? (user.role === 'customer' ? 'customer-home' : user.role === 'restaurant' ? 'restaurant-dashboard' : 'rider-orders') : 'landing')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-color)' }}>
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span>BiteSpeed</span>
      </div>

      <nav className="nav-links">
        {!user && (
          <>
            <span className={`nav-link ${currentPage === 'landing' ? 'active' : ''}`} onClick={() => navigateTo('landing')}>
              Home
            </span>
            <span className={`nav-link ${currentPage === 'login' ? 'active' : ''}`} onClick={() => navigateTo('login')}>
              Login
            </span>
            <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }} onClick={() => navigateTo('register')}>
              Sign Up
            </button>
          </>
        )}

        {user && user.role === 'customer' && (
          <>
            <span className={`nav-link ${currentPage === 'customer-home' ? 'active' : ''}`} onClick={() => navigateTo('customer-home')}>
              Restaurants
            </span>
            <span className={`nav-link ${currentPage === 'customer-orders' ? 'active' : ''}`} onClick={() => navigateTo('customer-orders')}>
              My Orders
            </span>
            <span className={`nav-link ${currentPage === 'customer-profile' ? 'active' : ''}`} onClick={() => navigateTo('customer-profile')}>
              My Profile
            </span>
            <span className={`nav-link ${currentPage === 'customer-cart' ? 'active' : ''}`} onClick={() => navigateTo('customer-cart')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Cart
              {getCartCount() > 0 && (
                <span style={{
                  backgroundColor: 'var(--primary-color)',
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  borderRadius: '999px',
                  padding: '0.15rem 0.4rem',
                  lineHeight: 1
                }}>
                  {getCartCount()}
                </span>
              )}
            </span>
          </>
        )}

        {user && user.role === 'restaurant' && (
          <>
            <span className={`nav-link ${currentPage === 'restaurant-dashboard' ? 'active' : ''}`} onClick={() => navigateTo('restaurant-dashboard')}>
              Restaurant Panel
            </span>
          </>
        )}

        {user && user.role === 'rider' && (
          <>
            <span className={`nav-link ${currentPage === 'rider-orders' ? 'active' : ''}`} onClick={() => navigateTo('rider-orders')}>
              Delivery Jobs
            </span>
            <span className={`nav-link ${currentPage === 'rider-dashboard' ? 'active' : ''}`} onClick={() => navigateTo('rider-dashboard')}>
              Earnings &amp; Analytics
            </span>
            <span className={`nav-link ${currentPage === 'rider-profile' ? 'active' : ''}`} onClick={() => navigateTo('rider-profile')}>
              Rider Profile
            </span>
          </>
        )}

        {user && (
          <div className="flex items-center gap-4" style={{ marginLeft: '1rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '500' }}>
              {user.name}
            </span>
            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};
