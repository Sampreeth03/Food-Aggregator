import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { StarIcon, ClockIcon, MapPinIcon, VegIcon, NonVegIcon } from '../components/Icons';
import { API_BASE_URL } from '../config/api';

const CATEGORIES = [
  { id: 'all', label: 'All Cuisines', image: '/images/burger_banner.png' },
  { id: 'biryani', label: 'Biryani & Indian', image: '/images/biryani_banner.png' },
  { id: 'pizza', label: 'Pizza & Pasta', image: '/images/pizza_banner.png' },
  { id: 'burger', label: 'Burgers & Fast Food', image: '/images/burger_banner.png' },
  { id: 'asian', label: 'Asian & Noodles', image: '/images/asian_banner.png' },
  { id: 'dessert', label: 'Desserts & Sweets', image: '/images/dessert_banner.png' }
];

const getRestaurantCover = (rest) => {
  if (rest && rest.image && rest.image.trim()) {
    return rest.image;
  }
  const cuisineStr = Array.isArray(rest?.cuisine) ? rest.cuisine.join(' ').toLowerCase() : String(rest?.cuisine || '').toLowerCase();
  if (cuisineStr.includes('pizza') || cuisineStr.includes('italian')) return '/images/pizza_banner.png';
  if (cuisineStr.includes('biryani') || cuisineStr.includes('indian') || cuisineStr.includes('mughlai')) return '/images/biryani_banner.png';
  if (cuisineStr.includes('burger') || cuisineStr.includes('fast food') || cuisineStr.includes('american')) return '/images/burger_banner.png';
  if (cuisineStr.includes('asian') || cuisineStr.includes('chinese') || cuisineStr.includes('noodle')) return '/images/asian_banner.png';
  if (cuisineStr.includes('dessert') || cuisineStr.includes('bakery') || cuisineStr.includes('sweet')) return '/images/dessert_banner.png';
  return '/images/burger_banner.png';
};

export const CustomerHome = ({ navigateTo }) => {
  const { token, user } = useContext(AuthContext);
  const { addToCart, cartRestaurant, getCartCount, getCartTotal } = useContext(CartContext);

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartError, setCartError] = useState('');

  // Fetch all onboarded restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/restaurants`, {
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
        setError('Unable to connect to server. Please try again later.');
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
      // Flash a brief visual success badge
      const element = document.getElementById(`success-badge-${item._id}`);
      if (element) {
        element.style.opacity = '1';
        setTimeout(() => {
          element.style.opacity = '0';
        }, 1200);
      }
    }
  };

  // Filter restaurants by selected category chip
  const filteredRestaurants = restaurants.filter(r => {
    if (selectedCategory === 'all') return true;
    const cuisineStr = (r.cuisine || []).join(' ').toLowerCase();
    return cuisineStr.includes(selectedCategory);
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        Loading restaurant options...
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
    <div className="flex-col gap-6 animate-fade-in" style={{ paddingBottom: getCartCount() > 0 ? '90px' : '0' }}>
      
      {/* View Menu Mode */}
      {selectedRestaurant ? (
        <div className="flex-col gap-6">
          
          {/* Back button */}
          <div>
            <button className="btn btn-secondary" onClick={() => setSelectedRestaurant(null)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Restaurants
            </button>
          </div>

          {/* Restaurant Banner Info Header */}
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

            const coverImage = getRestaurantCover(selectedRestaurant);

            return (
              <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  height: '200px',
                  width: '100%',
                  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.75)), url(${coverImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '1.5rem',
                  color: '#FFFFFF'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h1 className="title-medium" style={{ fontSize: '2rem', color: '#FFFFFF', margin: 0 }}>
                        {selectedRestaurant.name}
                      </h1>
                      <div className="flex gap-2" style={{ alignItems: 'center' }}>
                        <span style={{
                          backgroundColor: '#2E7D32',
                          color: '#FFFFFF',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          <StarIcon size={13} color="#FFFFFF" />
                          {typeof selectedRestaurant.rating === 'number' ? selectedRestaurant.rating.toFixed(1) : (selectedRestaurant.rating || '4.2')}
                        </span>
                        <span className={`badge ${isOpen ? 'badge-success' : 'badge-danger'}`}>
                          {isOpen ? 'Open Now' : 'Closed'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#E0E0E0', flexWrap: 'wrap' }}>
                      <span>Cuisines: {(selectedRestaurant.cuisine || []).join(', ')}</span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPinIcon size={14} color="#E0E0E0" />
                        {selectedRestaurant.address}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <ClockIcon size={14} color="#E0E0E0" />
                        {openTime} - {closeTime}
                      </span>
                    </div>
                  </div>
                </div>

                {cartRestaurant && cartRestaurant._id !== selectedRestaurant._id && (
                  <div style={{
                    padding: '0.5rem 1.5rem',
                    fontSize: '0.8rem',
                    color: 'var(--primary-color)',
                    backgroundColor: '#FFEBE6',
                    borderTop: '1px solid rgba(255, 87, 34, 0.2)'
                  }}>
                    Active cart from: <span style={{ fontWeight: '600' }}>{cartRestaurant.name}</span>
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

          {/* Menu Listing */}
          <div>
            <h2 className="title-small" style={{ marginBottom: '1.25rem', fontSize: '1.3rem' }}>Recommended Dishes</h2>
            
            {selectedRestaurant.menu && selectedRestaurant.menu.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {selectedRestaurant.menu.map((item) => (
                  <div key={item._id} className="card flex items-center justify-between" style={{ padding: '1.25rem' }}>
                    <div className="flex-col gap-1" style={{ flex: '1 1 auto', marginRight: '1rem' }}>
                      <div className="flex items-center gap-2">
                        {item.isVeg ? <VegIcon size={16} /> : <NonVegIcon size={16} />}
                        <span className="title-small" style={{ fontSize: '1.05rem' }}>{item.name}</span>
                      </div>
                      
                      <span style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                        ₹{item.price}
                      </span>
                      
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <ClockIcon size={12} />
                        Prep time: {item.averagePrepTime || 15} mins
                      </span>
                    </div>

                    <div className="flex-col items-center gap-2" style={{ flex: '0 0 100px', display: 'flex', alignItems: 'center' }}>
                      <button className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: '600' }} onClick={() => handleAddToCart(item)}>
                        ADD
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
                This kitchen does not have menu items listed yet.
              </div>
            )}
          </div>

        </div>
      ) : (
        // Browsing Restaurants List
        <div className="flex-col gap-6">
          
          {/* Welcome Banner */}
          <div className="card animate-fade-in" style={{
            backgroundColor: '#FFF5F2',
            border: '1px solid #FFD8CC',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h1 className="title-medium" style={{ color: 'var(--primary-color)', fontSize: '1.8rem', fontWeight: '700' }}>
              Welcome back, {user?.name || 'Customer'}
            </h1>
            <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
              Order fresh, hot meals delivered right to your building door step
            </p>
          </div>

          {/* B1: Food Category Filter Chips */}
          <div className="flex-col gap-3">
            <h2 className="title-small" style={{ fontSize: '1.2rem' }}>Explore Cuisines</h2>
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {CATEGORIES.map(cat => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                      backgroundColor: isSelected ? '#FFEBE6' : '#FFFFFF',
                      color: isSelected ? 'var(--primary-color)' : 'var(--text-main)',
                      padding: '0.5rem 1rem',
                      borderRadius: '25px',
                      fontSize: '0.85rem',
                      fontWeight: isSelected ? '700' : '500',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* B3: Commercial Food App Restaurant Grid */}
          <div className="flex-col gap-2">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="title-small" style={{ fontSize: '1.3rem' }}>Popular Restaurants</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {filteredRestaurants.length} Restaurants Available
              </span>
            </div>
          </div>

          {filteredRestaurants.length > 0 ? (
            <div className="grid grid-cols-3 gap-6">
              {filteredRestaurants.map((rest) => {
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

                const coverImage = getRestaurantCover(rest);

                return (
                  <div
                    key={rest._id}
                    className="card card-hover flex-col gap-3"
                    style={{ cursor: 'pointer', padding: 0, overflow: 'hidden' }}
                    onClick={() => handleSelectRestaurant(rest)}
                  >
                    {/* Restaurant Cover Image Header */}
                    <div style={{
                      height: '160px',
                      width: '100%',
                      backgroundImage: `url(${coverImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        display: 'flex',
                        gap: '0.5rem'
                      }}>
                        <span className={`badge ${isOpen ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                          {isOpen ? 'Open' : 'Closed'}
                        </span>
                      </div>

                      {/* Rating pill overlay */}
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        backgroundColor: '#2E7D32',
                        color: '#FFFFFF',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                      }}>
                        <StarIcon size={12} color="#FFFFFF" />
                        {typeof rest.rating === 'number' ? rest.rating.toFixed(1) : (rest.rating || '4.2')}
                      </div>
                    </div>

                    {/* Restaurant Body Details */}
                    <div className="flex-col gap-2" style={{ padding: '1rem 1.25rem 1.25rem 1.25rem' }}>
                      <h3 className="title-small" style={{ fontSize: '1.15rem', margin: 0 }}>{rest.name}</h3>

                      <div className="flex items-center gap-2" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <ClockIcon size={14} color="var(--primary-color)" />
                        <span>{rest.deliveryTime || '25-30 mins'} • {rest.distance || '2.5 km'}</span>
                        <span>•</span>
                        <span>₹{rest.priceForTwo || 350} for two</span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {(rest.cuisine || []).join(', ')}
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {rest.address}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '600' }}>
                          View Menu &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card" style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8" />
              </svg>
              <div>
                <h3 className="title-small" style={{ marginBottom: '0.25rem' }}>No Restaurants Found</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Try selecting a different cuisine filter above.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom Cart Bar */}
      {getCartCount() > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '0',
          left: '0',
          width: '100%',
          backgroundColor: '#2E7D32', // Premium green
          color: '#FFFFFF',
          padding: '1.25rem 2.5rem',
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1000,
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          {/* Keyframe animation injected inline */}
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(100%); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
              {getCartCount()} {getCartCount() === 1 ? 'Item' : 'Items'} added
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>
              ₹{getCartTotal()} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', opacity: 0.8 }}>plus taxes</span>
            </span>
          </div>

          <button 
            onClick={() => navigateTo('customer-cart')}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#2E7D32',
              border: 'none',
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F5F5F5';
              e.currentTarget.style.transform = 'scale(1.03)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Go to Cart
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
