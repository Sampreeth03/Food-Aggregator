import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

export const CustomerHome = ({ navigateTo }) => {
  const { token, user } = useContext(AuthContext);
  const { addToCart, cartRestaurant } = useContext(CartContext);

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartError, setCartError] = useState('');

  // Fetch all onboarded restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/restaurants', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (response.ok) {
          setRestaurants(data);
        } else {
          setError(data.msg || 'Failed to fetch restaurants');
        }
      } catch (err) {
        console.error(err);
        setError('Unable to connect. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [token]);

  const handleSelectRestaurant = (rest) => {
    setSelectedRestaurant(rest);
    setCartError('');
  };

  const handleAddToCart = (item) => {
    const result = addToCart(selectedRestaurant, item);
    if (result && result.error) {
      setCartError(result.error);
    } else {
      setCartError('');
      // Flash a brief visual success
      const element = document.getElementById(`success-badge-${item._id}`);
      if (element) {
        element.style.opacity = '1';
        setTimeout(() => {
          element.style.opacity = '0';
        }, 1200);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        Loading culinary options...
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem', textAlign: 'center' }}>
        <h3 className="title-small" style={{ color: '#E53E3E', marginBottom: '1rem' }}>Error Loading Restaurants</h3>
        <p style={{ color: 'var(--text-muted)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-col gap-6 animate-fade-in">
      
      {/* If viewing a specific restaurant's menu */}
      {selectedRestaurant ? (
        <div className="flex-col gap-6">
          
          {/* Menu Back button */}
          <div>
            <button className="btn btn-secondary" onClick={() => setSelectedRestaurant(null)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Restaurants
            </button>
          </div>

          {/* Restaurant Banner Info */}
          {(() => {
            const now = new Date();
            const currentHours = now.getHours().toString().padStart(2, '0');
            const currentMins = now.getMinutes().toString().padStart(2, '0');
            const currentTime = `${currentHours}:${currentMins}`;

            const openTime = selectedRestaurant.openingTime || '09:00';
            const closeTime = selectedRestaurant.closingTime || '22:00';

            let isOpen = false;
            if (openTime <= closeTime) {
              isOpen = currentTime >= openTime && currentTime <= closeTime;
            } else {
              isOpen = currentTime >= openTime || currentTime <= closeTime;
            }

            return (
              <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
                <div className="flex gap-2" style={{ alignSelf: 'flex-start', flexWrap: 'wrap' }}>
                  <span className="badge badge-preparing">★ {selectedRestaurant.rating || '4.0'} Rating</span>
                  <span className={`badge ${isOpen ? 'badge-success' : 'badge-danger'}`}>
                    {isOpen ? 'Open Now' : 'Closed'}
                  </span>
                  <span className="badge badge-shipping" style={{ textTransform: 'none' }}>
                    Hours: {openTime} - {closeTime}
                  </span>
                </div>
                <h1 className="title-medium" style={{ fontSize: '1.8rem', margin: '0.25rem 0' }}>{selectedRestaurant.name}</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  Cuisines: {selectedRestaurant.cuisine.join(', ')}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Address: {selectedRestaurant.address}
                </p>
                {cartRestaurant && cartRestaurant._id !== selectedRestaurant._id && (
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    fontSize: '0.8rem',
                    color: 'var(--primary-color)',
                    backgroundColor: '#FFEBE6',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 87, 34, 0.2)'
                  }}>
                    Active cart from: {cartRestaurant.name}
                  </div>
                )}
              </div>
            );
          })()}

          {cartError && (
            <div style={{
              backgroundColor: '#FED7D7',
              color: '#9B2C2C',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              borderLeft: '4px solid #E53E3E'
            }}>
              {cartError}
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', marginLeft: '1rem', border: '1px solid #9B2C2C' }} onClick={() => navigateTo('customer-cart')}>
                View Cart / Clear
              </button>
            </div>
          )}

          {(() => {
            const now = new Date();
            const currentHours = now.getHours().toString().padStart(2, '0');
            const currentMins = now.getMinutes().toString().padStart(2, '0');
            const currentTime = `${currentHours}:${currentMins}`;

            const openTime = selectedRestaurant.openingTime || '09:00';
            const closeTime = selectedRestaurant.closingTime || '22:00';

            let isOpen = false;
            if (openTime <= closeTime) {
              isOpen = currentTime >= openTime && currentTime <= closeTime;
            } else {
              isOpen = currentTime >= openTime || currentTime <= closeTime;
            }

            if (!isOpen) {
              return (
                <div style={{
                  backgroundColor: '#FFF5F5',
                  color: '#C53030',
                  padding: '1rem',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  borderLeft: '4px solid #E53E3E',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}>
                  <span style={{ fontWeight: '600' }}>Restaurant is Closed</span>
                  <span>This kitchen is currently closed. Operating hours are {openTime} to {closeTime}. You can add items, but checking out will be restricted.</span>
                </div>
              );
            }
            return null;
          })()}

          {/* Menu Listing */}
          <div>
            <h2 className="title-small" style={{ marginBottom: '1.25rem' }}>Menu Items</h2>
            
            {selectedRestaurant.menu && selectedRestaurant.menu.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {selectedRestaurant.menu.map((item) => (
                  <div key={item._id} className="card flex items-center justify-between" style={{ padding: '1.25rem' }}>
                    <div className="flex-col gap-1" style={{ flex: '1 1 auto', marginRight: '1rem' }}>
                      <div className="flex items-center gap-2">
                        <span style={{
                          width: '12px',
                          height: '12px',
                          border: `1px solid ${item.isVeg ? '#4CAF50' : '#E53E3E'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '1px'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: item.isVeg ? '#4CAF50' : '#E53E3E',
                            display: 'block'
                          }} />
                        </span>
                        <span className="title-small" style={{ fontSize: '1rem' }}>{item.name}</span>
                      </div>
                      <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                        ₹{item.price}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Prep Time: {item.averagePrepTime || 15} mins
                      </span>
                    </div>

                    <div className="flex-col items-center gap-2" style={{ flex: '0 0 100px', display: 'flex', alignItems: 'center' }}>
                      <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => handleAddToCart(item)}>
                        Add
                      </button>
                      <span
                        id={`success-badge-${item._id}`}
                        style={{
                          opacity: 0,
                          transition: 'opacity 0.2s ease',
                          fontSize: '0.75rem',
                          color: 'var(--secondary-success)',
                          fontWeight: '500'
                        }}
                      >
                        Added to cart
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                This restaurant does not have any menu items configured yet.
              </div>
            )}
          </div>

        </div>
      ) : (
        // Browsing Restaurants lists
        <div className="flex-col gap-6">
          {/* Welcome Banner */}
          <div className="card animate-fade-in" style={{
            backgroundColor: '#FFEBE6',
            border: 'none',
            padding: '2rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '1rem'
          }}>
            <h1 className="title-medium" style={{ color: 'var(--primary-color)', fontSize: '1.75rem', fontWeight: '700' }}>
              Welcome back, {user?.name || 'Customer'}!
            </h1>
            <p style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>
              Hungry for something delicious? Browse our top partners below and place your order.
            </p>
          </div>

          <div className="flex-col gap-2">
            <h2 className="title-small" style={{ fontSize: '1.25rem' }}>Popular Restaurants Near You</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Handpicked kitchens serving fresh quality meals
            </p>
          </div>

          {restaurants.length > 0 ? (
            <div className="grid grid-cols-3 gap-6">
              {restaurants.map((rest) => {
                const now = new Date();
                const currentHours = now.getHours().toString().padStart(2, '0');
                const currentMins = now.getMinutes().toString().padStart(2, '0');
                const currentTime = `${currentHours}:${currentMins}`;

                const openTime = rest.openingTime || '09:00';
                const closeTime = rest.closingTime || '22:00';

                let isOpen = false;
                if (openTime <= closeTime) {
                  isOpen = currentTime >= openTime && currentTime <= closeTime;
                } else {
                  isOpen = currentTime >= openTime || currentTime <= closeTime;
                }

                return (
                  <div key={rest._id} className="card card-hover flex-col gap-4" style={{ cursor: 'pointer' }} onClick={() => handleSelectRestaurant(rest)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 className="title-small" style={{ fontSize: '1.15rem' }}>{rest.name}</h3>
                      <div className="flex gap-2" style={{ alignItems: 'center' }}>
                        <span className={`badge ${isOpen ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
                          {isOpen ? 'Open' : 'Closed'}
                        </span>
                        <span className="badge badge-preparing" style={{ fontSize: '0.65rem' }}>
                          ★ {rest.rating || '4.0'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-col gap-1" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <span>Cuisines: {rest.cuisine.join(', ')}</span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Address: {rest.address}
                      </span>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Hours: {openTime} - {closeTime}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '600' }}>
                        View Menu &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card" style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8" />
              </svg>
              <div>
                <h3 className="title-small" style={{ marginBottom: '0.25rem' }}>No Restaurants Registered</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>There are currently no restaurants available in the system.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
