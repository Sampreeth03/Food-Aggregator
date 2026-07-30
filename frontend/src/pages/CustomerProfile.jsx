import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AddressAutocomplete } from '../components/AddressAutocomplete';

export const CustomerProfileView = () => {
  const { token, user, updateUser } = useContext(AuthContext);

  // Profile data states
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [cuisines, setCuisines] = useState('');
  const [lng, setLng] = useState(77.5946);
  const [lat, setLat] = useState(12.9716);

  // New saved address state variables
  const [newSavedAddr, setNewSavedAddr] = useState('');
  const [newSavedLat, setNewSavedLat] = useState(null);
  const [newSavedLng, setNewSavedLng] = useState(null);
  const [newSavedLabel, setNewSavedLabel] = useState('Home');

  // Password reset states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Messages / loading states
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Preset locations for coordinate simulator
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

  // Password strength checker (entropy + dictionary)
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

  const fetchProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/customers/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setProfile(data);
        setName(data.user?.name || user.name);
        setPhone(data.phone || '');
        setAddress(data.address || '');
        setCuisines(data.favoriteCuisines ? data.favoriteCuisines.join(', ') : '');
        
        if (data.user?.location?.coordinates && data.user.location.coordinates.length === 2) {
          setLng(data.user.location.coordinates[0]);
          setLat(data.user.location.coordinates[1]);
        }
      } else {
        setProfileError(data.msg || 'Failed to load customer profile');
      }
    } catch (err) {
      console.error(err);
      setProfileError('Unable to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token, user.name]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel edit: restore original values and clear form messages
      if (profile) {
        setName(profile.user?.name || user.name);
        setPhone(profile.phone || '');
        setAddress(profile.address || '');
        setCuisines(profile.favoriteCuisines ? profile.favoriteCuisines.join(', ') : '');
        if (profile.user?.location?.coordinates && profile.user.location.coordinates.length === 2) {
          setLng(profile.user.location.coordinates[0]);
          setLat(profile.user.location.coordinates[1]);
        }
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

  // Submit Profile Changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileError('Name is required.');
      return;
    }

    setProfileError('');
    setProfileSuccess('');
    setIsSavingProfile(true);

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        favoriteCuisines: cuisines.split(',').map(c => c.trim()).filter(Boolean),
        lng: parseFloat(lng),
        lat: parseFloat(lat)
      };

      const response = await fetch('http://localhost:5000/api/customers/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setProfileSuccess('Profile details updated successfully!');
        setProfile(data.profile);
        setIsEditing(false);
        
        // Sync context user
        if (data.profile?.user) {
          updateUser({
            id: data.profile.user._id,
            name: data.profile.user.name,
            role: 'customer'
          });
        }
        setTimeout(() => setProfileSuccess(''), 3000);
      } else {
        setProfileError(data.msg || 'Failed to save changes.');
      }
    } catch (err) {
      console.error(err);
      setProfileError('Network error. Failed to save changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Submit Password Reset
  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (strength.score <= 3) {
      setPasswordError('New password is too weak. Please add caps, numbers, or symbols.');
      return;
    }

    setIsSavingPassword(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess('Password changed successfully! Refreshing session...');
        
        // Auto-login: Save newly generated token and user details in AuthContext
        updateUser(data.user, data.token);

        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');

        setTimeout(() => {
          setPasswordSuccess('');
          window.location.reload();
        }, 1500);
      } else {
        setPasswordError(data.msg || 'Failed to reset password.');
      }
    } catch (err) {
      console.error(err);
      setPasswordError('Network error. Failed to reset password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        Loading customer profile...
      </div>
    );
  }

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto' }}>
      
      <div className="flex-col gap-1">
        <h1 className="title-medium">My Profile Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Manage your personal details, cuisines preferences, and security settings in one place
        </p>
      </div>

      {/* Unified Profile & Password Card */}
      <div className="card flex-col gap-6" style={{ padding: '2.5rem' }}>
        
        {/* Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
          <div>
            <h2 className="title-small" style={{ fontSize: '1.25rem' }}>Account Profile Details</h2>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Registered Email: {profile?.user?.email}</span>
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={handleEditToggle}>
            {isEditing ? 'Cancel Edit' : 'Edit Details'}
          </button>
        </div>

        {/* Read-Only State */}
        {!isEditing && profile && (
          <div className="flex-col gap-4" style={{ fontSize: '0.95rem' }}>
            {profileSuccess && (
              <div style={{
                backgroundColor: '#C6F6D5', color: '#22543D', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem', borderLeft: '4px solid var(--secondary-success)', marginBottom: '0.5rem'
              }}>
                {profileSuccess}
              </div>
            )}
            
            <div style={{ display: 'flex', borderBottom: '1px solid #F0F4F8', paddingBottom: '0.75rem' }}>
              <span style={{ flex: '0 0 160px', color: 'var(--text-muted)', fontWeight: '500' }}>Full Name</span>
              <span style={{ fontWeight: '600' }}>{profile.user?.name}</span>
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid #F0F4F8', paddingBottom: '0.75rem' }}>
              <span style={{ flex: '0 0 160px', color: 'var(--text-muted)', fontWeight: '500' }}>Phone Number</span>
              <span>{profile.phone || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not provided</span>}</span>
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid #F0F4F8', paddingBottom: '0.75rem' }}>
              <span style={{ flex: '0 0 160px', color: 'var(--text-muted)', fontWeight: '500' }}>Street Address</span>
              <span>{profile.address || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not provided</span>}</span>
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid #F0F4F8', paddingBottom: '0.75rem' }}>
              <span style={{ flex: '0 0 160px', color: 'var(--text-muted)', fontWeight: '500' }}>Favorite Cuisines</span>
              <span>
                {profile.favoriteCuisines && profile.favoriteCuisines.length > 0 ? (
                  profile.favoriteCuisines.map(c => (
                    <span key={c} className="badge badge-preparing" style={{ marginRight: '0.35rem', textTransform: 'none' }}>{c}</span>
                  ))
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None configured</span>
                )}
              </span>
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid #F0F4F8', paddingBottom: '0.75rem' }}>
              <span style={{ flex: '0 0 160px', color: 'var(--text-muted)', fontWeight: '500' }}>Coordinates</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                [{profile.user?.location?.coordinates?.join(', ') || '0, 0'}]
              </span>
            </div>
            <div style={{ display: 'flex', paddingBottom: '0.25rem', borderBottom: '1px solid #F0F4F8', paddingBottom: '0.75rem' }}>
              <span style={{ flex: '0 0 160px', color: 'var(--text-muted)', fontWeight: '500' }}>Password Security</span>
              <span style={{ letterSpacing: '0.15em', fontWeight: 'bold' }}>••••••••</span>
            </div>

            {/* Saved Addresses List */}
            <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid #F0F4F8', paddingBottom: '1rem', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Saved Delivery Locations ({profile.savedAddresses?.length || 0})</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {profile.savedAddresses && profile.savedAddresses.length > 0 ? (
                  profile.savedAddresses.map(addr => (
                    <div key={addr._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FAFAFA', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1, paddingRight: '1rem' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>
                          {addr.label.toLowerCase() === 'home' ? '🏠' : addr.label.toLowerCase() === 'work' ? '💼' : '📍'} {addr.label}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{addr.address}</span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const updatedSaved = profile.savedAddresses.filter(a => a._id !== addr._id).map(a => ({
                            label: a.label,
                            address: a.address,
                            lat: a.lat,
                            lng: a.lng
                          }));
                          try {
                            const res = await fetch('http://localhost:5000/api/customers/profile', {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({ savedAddresses: updatedSaved })
                            });
                            const data = await res.json();
                            if (res.ok) {
                              setProfile(data.profile);
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: '#E53E3E', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                      >
                        Delete
                      </button>
                    </div>
                  ))
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>No saved addresses yet. Add one below.</span>
                )}
              </div>
            </div>

            {/* Add Saved Address inline form */}
            <div className="flex-col gap-3" style={{ paddingTop: '0.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>Add New Saved Location</h4>
              <div className="form-group" style={{ margin: 0 }}>
                <AddressAutocomplete
                  placeholder="Type landmark, building name or area..."
                  onSelectAddress={({ address, latitude, longitude }) => {
                    setNewSavedAddr(address);
                    if (latitude && longitude) {
                      setNewSavedLat(latitude);
                      setNewSavedLng(longitude);
                    }
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Label:</span>
                {['Home', 'Work', 'Other'].map(label => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setNewSavedLabel(label)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      border: newSavedLabel === label ? '1.5px solid var(--primary-color)' : '1px solid var(--border-color)',
                      backgroundColor: newSavedLabel === label ? '#FFEBE6' : '#FFFFFF',
                      color: newSavedLabel === label ? 'var(--primary-color)' : 'var(--text-main)',
                      cursor: 'pointer'
                    }}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={async () => {
                    if (!newSavedAddr.trim() || !newSavedLat || !newSavedLng) return;
                    const updatedSaved = [
                      ...(profile.savedAddresses || []).map(a => ({
                        label: a.label,
                        address: a.address,
                        lat: a.lat,
                        lng: a.lng
                      })),
                      { label: newSavedLabel, address: newSavedAddr, lat: newSavedLat, lng: newSavedLng }
                    ];
                    try {
                      const res = await fetch('http://localhost:5000/api/customers/profile', {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ savedAddresses: updatedSaved })
                      });
                      const data = await res.json();
                      if (res.ok) {
                        setProfile(data.profile);
                        setNewSavedAddr('');
                        setNewSavedLat(null);
                        setNewSavedLng(null);
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  disabled={!newSavedAddr.trim() || !newSavedLat || !newSavedLng}
                  className="btn btn-primary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', marginLeft: 'auto' }}
                >
                  Add Address
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Editable State */}
        {isEditing && (
          <div className="flex-col gap-6">
            
            {/* Form Part 1: Edit profile details */}
            <form onSubmit={handleSaveProfile} className="flex-col gap-4" style={{ borderBottom: '1px dashed var(--border-color)', paddingBottom: '2rem' }}>
              <h3 className="title-small" style={{ fontSize: '1rem', color: 'var(--primary-color)' }}>Update Profile Information</h3>
              
              {profileError && (
                <div style={{
                  backgroundColor: '#FED7D7', color: '#9B2C2C', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem', borderLeft: '4px solid #E53E3E'
                }}>
                  {profileError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} disabled={isSavingProfile} />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-input" placeholder="+1 555-0199" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isSavingProfile} />
              </div>

              <div className="form-group">
                <label className="form-label">Building / Street Address</label>
                <AddressAutocomplete
                  initialAddress={address}
                  placeholder="Type building or landmark (e.g. Park Ridge Apartments Guntur)..."
                  onSelectAddress={({ address, latitude, longitude }) => {
                    setAddress(address);
                    if (latitude && longitude) {
                      setLat(latitude);
                      setLng(longitude);
                    }
                  }}
                  disabled={isSavingProfile}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Favorite Cuisines (Comma-separated)</label>
                <input type="text" className="form-input" placeholder="Pizza, Burgers" value={cuisines} onChange={(e) => setCuisines(e.target.value)} disabled={isSavingProfile} />
              </div>

              {/* Coordinates Simulator */}
              <div className="form-group" style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-color)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Location Coordinate Simulator</span>
                <div className="flex gap-2" style={{ margin: '0.5rem 0' }}>
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleLocationPreset('center')}>Bangalore Center</button>
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleLocationPreset('north')}>North (1.5km)</button>
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleLocationPreset('east')}>East (1.7km)</button>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Longitude</span>
                    <input type="number" step="0.0001" className="form-input" style={{ padding: '0.4rem', fontSize: '0.85rem' }} value={lng} onChange={(e) => setLng(parseFloat(e.target.value))} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latitude</span>
                    <input type="number" step="0.0001" className="form-input" style={{ padding: '0.4rem', fontSize: '0.85rem' }} value={lat} onChange={(e) => setLat(parseFloat(e.target.value))} />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }} disabled={isSavingProfile}>
                {isSavingProfile ? 'Saving Details...' : 'Save Profile Changes'}
              </button>
            </form>

            {/* Form Part 2: Change Password inside same card */}
            <form onSubmit={handleSavePassword} className="flex-col gap-4">
              <h3 className="title-small" style={{ fontSize: '1rem', color: 'var(--primary-color)' }}>Reset Account Password</h3>

              {passwordError && (
                <div style={{
                  backgroundColor: '#FED7D7', color: '#9B2C2C', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem', borderLeft: '4px solid #E53E3E'
                }}>
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div style={{
                  backgroundColor: '#C6F6D5', color: '#22543D', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem', borderLeft: '4px solid var(--secondary-success)'
                }}>
                  {passwordSuccess}
                </div>
              )}

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
                {/* Strength indicator */}
                {newPassword && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Strength:</span>
                      <span style={{ fontWeight: '600', color: strength.color }}>{strength.label}</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', backgroundColor: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        width: strength.score === 0 ? '10%' : strength.score <= 3 ? '35%' : strength.score <= 5 ? '70%' : '100%',
                        height: '100%',
                        backgroundColor: strength.color,
                        transition: 'all 0.3s ease'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: strength.score <= 3 ? '#E53E3E' : 'var(--text-muted)' }}>
                      {strength.message}
                    </span>
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

              <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '0.85rem', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }} disabled={isSavingPassword}>
                {isSavingPassword ? 'Resetting Password...' : 'Reset Password & Refresh Session'}
              </button>
            </form>

          </div>
        )}

      </div>

    </div>
  );
};
