import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const Login = ({ navigateTo }) => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const user = await login(email, password);
      if (user.role === 'customer') {
        navigateTo('customer-home');
      } else if (user.role === 'restaurant') {
        navigateTo('restaurant-dashboard');
      } else if (user.role === 'rider') {
        navigateTo('rider-orders');
      } else if (user.role === 'admin') {
        navigateTo('admin-dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-between animate-fade-in" style={{ display: 'flex', justifyContent: 'center', padding: '3rem 1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        <h2 className="title-medium" style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Welcome Back</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '2rem' }}>
          Sign in to order food or manage your profile
        </p>

        {error && (
          <div style={{
            backgroundColor: '#FED7D7',
            color: '#9B2C2C',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            borderLeft: '4px solid #E53E3E'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }} disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <span style={{ color: 'var(--primary-color)', fontWeight: '500', cursor: 'pointer' }} onClick={() => navigateTo('register')}>
            Sign Up
          </span>
        </div>
      </div>
    </div>
  );
};
