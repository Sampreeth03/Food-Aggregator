import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AddressAutocomplete } from '../components/AddressAutocomplete';

export const Register = ({ navigateTo }) => {
  const { register } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  
  // Coordinates defaults (e.g., Bangalore, India)
  const [lng, setLng] = useState(77.5946);
  const [lat, setLat] = useState(12.9716);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preset location simulation for easy testing
  const handleLocationPreset = (preset) => {
    if (preset === 'center') {
      setLng(77.5946);
      setLat(12.9716);
    } else if (preset === 'north') {
      setLng(77.5946);
      setLat(12.9850);
    } else if (preset === 'east') {
      setLng(77.6100);
      setLat(12.9716);
    } else if (preset === 'far') {
      setLng(77.6900);
      setLat(12.9716);
    }
  };

  // Password Strength Evaluator (Entropy + Dictionary Method)
  const evaluatePassword = (pwd) => {
    if (!pwd) {
      return { score: 0, label: '', color: '#E2E8F0', message: '' };
    }

    // 1. Dictionary Check: Check against common weak passwords
    const commonPasswords = [
      '123456', '123456789', 'password', 'qwerty', 'admin', 
      'welcome', 'letmein', 'pass123', 'bitespeed'
    ];
    const lowerPwd = pwd.toLowerCase();
    
    if (commonPasswords.includes(lowerPwd)) {
      return { score: 0, label: 'Very Weak', color: '#E53E3E', message: 'This is a very common password.' };
    }

    // 2. Entropy Points System
    let score = 0;

    // Minimum Length Rule
    if (pwd.length >= 8) {
      score += 2;
    } else {
      return { score: 1, label: 'Weak', color: '#E53E3E', message: 'Password must be at least 8 characters.' };
    }

    // Bonus for longer passwords
    if (pwd.length >= 12) {
      score += 1;
    }

    // Character variety checks using simple regex tests
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasDigit = /\d/.test(pwd);
    const hasSpecial = /[@$!%*?&#]/.test(pwd);

    if (hasLower) score += 1;
    if (hasUpper) score += 1;
    if (hasDigit) score += 1;
    if (hasSpecial) score += 1;

    // Determine strength rating based on total score
    if (score <= 3) {
      return { score, label: 'Weak', color: '#E53E3E', message: 'Add uppercase letters, numbers, or symbols.' };
    } else if (score <= 5) {
      return { score, label: 'Medium', color: '#DD6B20', message: 'Good, but could be stronger.' };
    } else {
      return { score, label: 'Strong', color: '#388E3C', message: 'Great! Strong password choice.' };
    }
  };

  const strength = evaluatePassword(password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- FORM VALIDATIONS ---
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }

    // Simple email validation regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Password strength check (Must be at least Medium to register)
    if (strength.score <= 3) {
      setError('Please choose a stronger password before registering.');
      return;
    }

    // Coordinate validation
    if (isNaN(lng) || isNaN(lat)) {
      setError('Longitude and Latitude must be valid numeric values.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const user = await register(name, email, password, role, parseFloat(lng), parseFloat(lat));
      if (user.role === 'customer') {
        navigateTo('customer-home');
      } else if (user.role === 'restaurant') {
        navigateTo('restaurant-dashboard');
      } else if (user.role === 'rider') {
        navigateTo('rider-orders');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Try a different email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-between animate-fade-in" style={{ display: 'flex', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem' }}>
        <h2 className="title-medium" style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Create Account</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '2rem' }}>
          Join BiteSpeed as a customer, restaurant proprietor, or courier
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
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
            
            {/* Visual Password Strength Indicator */}
            {password && (
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Strength:</span>
                  <span style={{ fontWeight: '600', color: strength.color }}>{strength.label}</span>
                </div>
                {/* Colored Progress Bar */}
                <div style={{ width: '100%', height: '4px', backgroundColor: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    width: strength.score === 0 ? '10%' : strength.score <= 3 ? '35%' : strength.score <= 5 ? '70%' : '100%',
                    height: '100%',
                    backgroundColor: strength.color,
                    transition: 'all 0.3s ease'
                  }} />
                </div>
                {/* Helper recommendation message */}
                <span style={{ fontSize: '0.75rem', color: strength.score <= 3 ? '#E53E3E' : 'var(--text-muted)' }}>
                  {strength.message}
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Account Role</label>
            <select
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="customer">Customer (Order food)</option>
              <option value="restaurant">Restaurant Owner (Sell food)</option>
              <option value="rider">Rider / Delivery Agent (Deliver food)</option>
            </select>
          </div>

          {/* Location & Building Search Section */}
          <div className="form-group" style={{
            border: '1px solid var(--border-color)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-color)',
            marginTop: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>Location Building & Coordinates</span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Search your building or landmark to set your exact rooftop location coordinates.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <AddressAutocomplete
                placeholder="Search building (e.g. Park Ridge Apartments Guntur)..."
                onSelectAddress={({ latitude, longitude }) => {
                  if (latitude && longitude) {
                    setLat(latitude);
                    setLng(longitude);
                  }
                }}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px' }} onClick={() => handleLocationPreset('center')}>
                Bangalore Center
              </button>
              <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px' }} onClick={() => handleLocationPreset('north')}>
                North (1.5km)
              </button>
              <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px' }} onClick={() => handleLocationPreset('east')}>
                East (1.7km)
              </button>
              <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px' }} onClick={() => handleLocationPreset('far')}>
                Far (10km)
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Longitude</span>
                <input
                  type="number"
                  step="0.0001"
                  className="form-input"
                  style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value))}
                  disabled={isSubmitting}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latitude</span>
                <input
                  type="number"
                  step="0.0001"
                  className="form-input"
                  style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value))}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }} disabled={isSubmitting}>
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <span style={{ color: 'var(--primary-color)', fontWeight: '500', cursor: 'pointer' }} onClick={() => navigateTo('login')}>
            Sign In
          </span>
        </div>
      </div>
    </div>
  );
};
