import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

export const RiderProfileView = () => {
  const { token, user, updateUser } = useContext(AuthContext);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleType, setVehicleType] = useState('bike');
  const [lng, setLng] = useState(77.5946);
  const [lat, setLat] = useState(12.9716);

  // Password reset states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Messages & statuses
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [onboardError, setOnboardError] = useState('');
  const [isSubmittingOnboard, setIsSubmittingOnboard] = useState(false);

  const fetchRiderProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/riders/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setProfile(data);
        setName(data.user?.name || user.name);
        setEmail(data.user?.email || '');
        setVehicleType(data.vehicleType || 'bike');
        
        if (data.user?.location?.coordinates && data.user.location.coordinates.length === 2) {
          setLng(data.user.location.coordinates[0]);
          setLat(data.user.location.coordinates[1]);
        }
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error(err);
      setProfileError('Failed to fetch profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiderProfile();
  }, [token]);

  const handleEditToggle = () => {
    if (isEditing && profile) {
      // Cancel edits: restore original values
      setName(profile.user?.name || user.name);
      setEmail(profile.user?.email || '');
      setVehicleType(profile.vehicleType || 'bike');
      if (profile.user?.location?.coordinates && profile.user.location.coordinates.length === 2) {
        setLng(profile.user.location.coordinates[0]);
        setLat(profile.user.location.coordinates[1]);
      }
    }
    setIsEditing(!isEditing);
    setProfileError('');
    setProfileSuccess('');
    setPasswordError('');
    setPasswordSuccess('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

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
    }
  };

  const evaluatePassword = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '#E2E8F0', message: '' };

    const commonPasswords = [
      '123456', '123456789', 'password', 'qwerty', 'admin', 
      'welcome', 'letmein', 'pass123', 'bitespeed'
    ];
    const lowerPwd = pwd.toLowerCase();
    
    if (commonPasswords.includes(lowerPwd)) {
      return { score: 0, label: 'Very Weak', color: '#E53E3E', message: 'Common weak password.' };
    }

    let score = 0;
    if (pwd.length >= 8) score += 2;
    else return { score: 1, label: 'Weak', color: '#E53E3E', message: 'Must be at least 8 characters.' };

    if (pwd.length >= 12) score += 1;

    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasDigit = /\d/.test(pwd);
    const hasSpecial = /[@$!%*?&#]/.test(pwd);

    if (hasLower) score += 1;
    if (hasUpper) score += 1;
    if (hasDigit) score += 1;
    if (hasSpecial) score += 1;

    if (score <= 3) {
      return { score, label: 'Weak', color: '#E53E3E', message: 'Add uppercase, numbers, or symbols.' };
    } else if (score <= 5) {
      return { score, label: 'Medium', color: '#DD6B20', message: 'Good, but could be stronger.' };
    } else {
      return { score, label: 'Strong', color: '#388E3C', message: 'Great! Strong password choice.' };
    }
  };

  const strength = evaluatePassword(newPassword);

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingOnboard(true);
    setOnboardError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/riders/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vehicleType })
      });

      const data = await response.json();
      if (response.ok) {
        setProfile(data.profile);
        setName(data.profile.user?.name || user.name);
        setEmail(data.profile.user?.email || '');
        setVehicleType(data.profile.vehicleType || 'bike');
        if (data.profile.user?.location?.coordinates && data.profile.user.location.coordinates.length === 2) {
          setLng(data.profile.user.location.coordinates[0]);
          setLat(data.profile.user.location.coordinates[1]);
        }
      } else {
        setOnboardError(data.msg || 'Registration failed.');
      }
    } catch (err) {
      console.error(err);
      setOnboardError('Connection error.');
    } finally {
      setIsSubmittingOnboard(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileError('Name is required.');
      return;
    }
    if (!email.trim()) {
      setProfileError('Email is required.');
      return;
    }

    setProfileError('');
    setProfileSuccess('');
    setIsSavingProfile(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/riders/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          vehicleType,
          lng: parseFloat(lng),
          lat: parseFloat(lat)
        })
      });

      const data = await response.json();
      if (response.ok) {
        setProfile(data.profile);
        setProfileSuccess('Profile details saved successfully!');
        setIsEditing(false);

        if (data.profile?.user) {
          updateUser({
            id: data.profile.user._id,
            name: data.profile.user.name,
            role: 'rider'
          });
        }
        setTimeout(() => setProfileSuccess(''), 3000);
      } else {
        setProfileError(data.msg || 'Failed to save profile.');
      }
    } catch (err) {
      console.error(err);
      setProfileError('Network error. Failed to save profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('All fields are required.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (strength.score <= 3) {
      setPasswordError('Please choose a stronger password.');
      return;
    }

    setPasswordError('');
    setPasswordSuccess('');
    setIsSavingPassword(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword
        })
      });

      const data = await response.json();
      if (response.ok) {
        setPasswordSuccess('Password reset successfully! Session key updated.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        
        if (data.token) {
          updateUser(data.user, data.token);
        }
        setTimeout(() => setPasswordSuccess(''), 3000);
      } else {
        setPasswordError(data.msg || 'Failed to reset password.');
      }
    } catch (err) {
      console.error(err);
      setPasswordError('Connection error.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        Retrieving profile details...
      </div>
    );
  }

  // Registration View (Onboarding)
  if (!profile) {
    return (
      <div className="flex-col gap-6 animate-fade-in" style={{ maxWidth: '480px', margin: '3rem auto' }}>
        <div className="card" style={{ padding: '2.5rem' }}>
          <h2 className="title-medium" style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Courier Registration</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '2rem' }}>
            Choose your vehicle type to register as an active delivery agent
          </p>

          {onboardError && (
            <div style={{
              backgroundColor: '#FED7D7',
              color: '#9B2C2C',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              borderLeft: '4px solid #E53E3E'
            }}>
              {onboardError}
            </div>
          )}

          <form onSubmit={handleOnboardSubmit}>
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Select Vehicle Type</label>
              <select
                className="form-select"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                disabled={isSubmittingOnboard}
              >
                <option value="bike">Motorcycle / Bike</option>
                <option value="scooter">Electric Scooter</option>
                <option value="cycle">Bicycle</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }} disabled={isSubmittingOnboard}>
              {isSubmittingOnboard ? 'Registering Profile...' : 'Complete Courier Setup'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto' }}>
      
      <div className="flex justify-between items-center">
        <h1 className="title-medium" style={{ margin: 0 }}>Courier Profile</h1>
        <button className="btn btn-secondary" onClick={handleEditToggle} style={{ padding: '0.5rem 1.25rem' }}>
          {isEditing ? 'Cancel Edit' : 'Edit Details'}
        </button>
      </div>

      {!isEditing ? (
        /* READ-ONLY VIEW */
        <div className="card flex-col gap-5" style={{ padding: '2.5rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-color)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: '700'
            }}>
              {profile.user?.name ? profile.user.name.charAt(0).toUpperCase() : 'R'}
            </div>
            <div>
              <h2 className="title-small" style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{profile.user?.name}</h2>
              <span className="badge badge-shipping" style={{ fontSize: '0.75rem' }}>
                Delivery Partner
              </span>
            </div>
          </div>

          <div className="flex-col gap-3">
            <div className="flex justify-between" style={{ fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Email address:</span>
              <span style={{ fontWeight: '500' }}>{profile.user?.email}</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Vehicle Type:</span>
              <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>{profile.vehicleType}</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Duty Rating:</span>
              <span style={{ fontWeight: '600', color: '#D69E2E' }}>★ {profile.rating.toFixed(1)}</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Base Coordinates:</span>
              <span style={{ fontWeight: '500', fontFamily: 'monospace' }}>
                [{lng}, {lat}]
              </span>
            </div>
            <div className="flex justify-between" style={{ fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Account Password:</span>
              <span style={{ fontWeight: '500' }}>••••••••</span>
            </div>
          </div>

        </div>
      ) : (
        /* EDIT PROFILE & PASSWORD RESET VIEWS */
        <div className="flex-col gap-6 animate-slide-up">
          
          {/* Profile Details Edit Card */}
          <div className="card flex-col gap-4" style={{ padding: '2.5rem' }}>
            <h3 className="title-small" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Update Courier Info
            </h3>

            {profileError && (
              <div style={{ backgroundColor: '#FED7D7', color: '#9B2C2C', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div style={{ backgroundColor: '#C6F6D5', color: '#22543D', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                {profileSuccess}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSavingProfile}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSavingProfile}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select
                  className="form-select"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  disabled={isSavingProfile}
                >
                  <option value="bike">Motorcycle / Bike</option>
                  <option value="scooter">Electric Scooter</option>
                  <option value="cycle">Bicycle</option>
                </select>
              </div>

              {/* Coordinates Simulator */}
              <div style={{ backgroundColor: '#FAFAFA', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }} className="flex-col gap-3">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                  Duty Location Coordinates (Simulator)
                </span>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      value={lng}
                      onChange={(e) => setLng(parseFloat(e.target.value))}
                      disabled={isSavingProfile}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      value={lat}
                      onChange={(e) => setLat(parseFloat(e.target.value))}
                      disabled={isSavingProfile}
                    />
                  </div>
                </div>

                <div className="flex gap-2" style={{ flexWrap: 'wrap', marginTop: '0.25rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleLocationPreset('center')}>
                    City Center
                  </button>
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleLocationPreset('north')}>
                    North sector
                  </button>
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleLocationPreset('east')}>
                    East sector
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem', width: '100%', marginTop: '0.5rem' }} disabled={isSavingProfile}>
                {isSavingProfile ? 'Saving Details...' : 'Save Profile Details'}
              </button>
            </form>

          </div>

          {/* Password Reset Form Card */}
          <div className="card flex-col gap-4" style={{ padding: '2.5rem' }}>
            <h3 className="title-small" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Reset Account Password
            </h3>

            {passwordError && (
              <div style={{ backgroundColor: '#FED7D7', color: '#9B2C2C', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div style={{ backgroundColor: '#C6F6D5', color: '#22543D', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isSavingPassword}
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSavingPassword}
                />
                
                {/* Strength Meter Indicator */}
                {newPassword && (
                  <div style={{ marginTop: '0.5rem' }} className="flex-col gap-1">
                    <div className="flex justify-between" style={{ fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Strength:</span>
                      <span style={{ color: strength.color, fontWeight: '700' }}>{strength.label}</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${(strength.score / 7) * 100}%`, 
                        backgroundColor: strength.color,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    {strength.message && (
                      <span style={{ fontSize: '0.7rem', color: strength.color }}>{strength.message}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  disabled={isSavingPassword}
                />
              </div>

              <button type="submit" className="btn btn-secondary" style={{ padding: '0.85rem', width: '100%', marginTop: '0.5rem' }} disabled={isSavingPassword}>
                {isSavingPassword ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
};
