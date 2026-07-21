import React, { useContext, useState, useEffect } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { CheckIcon } from '../components/Icons';

export const CustomerCart = ({ navigateTo, navigateToParams }) => {
  const { token } = useContext(AuthContext);
  const {
    cartItems,
    cartRestaurant,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal
  } = useContext(CartContext);

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState('');

  const subtotal = getCartTotal();
  const deliveryFee = subtotal > 0 ? 40 : 0;
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const grandTotal = subtotal + deliveryFee + tax;

  // Load customer profile to prefill saved address (if available)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/customers/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok && data.address && data.address.trim()) {
          setDeliveryAddress(data.address);
          setAddressConfirmed(true);
        } else {
          setIsEditingAddress(true);
        }
      } catch (err) {
        console.error('Failed to load profile address:', err);
        setIsEditingAddress(true);
      } finally {
        setFetchingProfile(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleConfirmAddress = (e) => {
    if (e) e.preventDefault();
    if (!deliveryAddress.trim()) {
      setError('Please enter a valid delivery address.');
      return;
    }
    setError('');
    setIsEditingAddress(false);
    setAddressConfirmed(true);
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0 || !cartRestaurant) {
      setError('Your cart is empty.');
      return;
    }

    if (!deliveryAddress.trim()) {
      setError('Delivery address is required. Please enter and confirm your delivery address before placing an order.');
      setIsEditingAddress(true);
      return;
    }

    setError('');
    setIsPlacingOrder(true);

    try {
      // Prepare request payload matching orderController placeOrder endpoint
      const payload = {
        restaurantId: cartRestaurant._id,
        deliveryAddress: deliveryAddress.trim(),
        items: cartItems.map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        // Clear cart state
        clearCart();
        // Redirect directly to the tracking page for this new order
        navigateToParams('customer-track', { orderId: data.order._id });
      } else {
        setError(data.msg || 'Failed to place order.');
      }
    } catch (err) {
      console.error(err);
      setError('Network connection error. Failed to place order.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '3rem auto', padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#FFEBE6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary-color)'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </div>
        <div>
          <h2 className="title-small" style={{ marginBottom: '0.25rem' }}>Your Cart is Empty</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Add items from your favorite restaurants to place an order
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigateTo('customer-home')}>
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="flex-col gap-6 animate-fade-in">
      <h1 className="title-medium">Your Shopping Cart</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '-1rem' }}>
        Ordering from: <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{cartRestaurant?.name}</span>
      </p>

      {error && (
        <div style={{
          backgroundColor: '#FED7D7',
          color: '#9B2C2C',
          padding: '0.75rem 1rem',
          borderRadius: '6px',
          fontSize: '0.85rem',
          borderLeft: '4px solid #E53E3E'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        {/* Left Column: Cart Items + Delivery Address */}
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Cart Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 className="title-small" style={{ fontSize: '1.1rem' }}>Selected Items ({cartItems.length})</h2>
            {cartItems.map((item) => (
              <div key={item.menuItemId} className="card flex items-center justify-between" style={{ padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: '#FFF3EE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-color)',
                    fontWeight: '700',
                    fontSize: '1.2rem'
                  }}>
                    {item.name.charAt(0)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span className="title-small" style={{ fontSize: '1.05rem' }}>{item.name}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      ₹{item.price} per item
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Swiggy-style Quantity Controller */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid var(--primary-color)',
                    borderRadius: '6px',
                    backgroundColor: '#FFFFFF',
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(255, 87, 34, 0.1)'
                  }}>
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        color: 'var(--primary-color)',
                        padding: '0.3rem 0.6rem'
                      }}
                      onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary-color)', minWidth: '24px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        color: 'var(--primary-color)',
                        padding: '0.3rem 0.6rem'
                      }}
                      onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  <span style={{ fontSize: '1.1rem', fontWeight: '700', width: '80px', textAlign: 'right', color: 'var(--text-main)' }}>
                    ₹{item.price * item.quantity}
                  </span>

                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.6rem', color: '#E53E3E', borderColor: 'rgba(229, 62, 62, 0.2)', fontSize: '0.8rem' }}
                    onClick={() => removeFromCart(item.menuItemId)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button className="btn btn-secondary" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }} onClick={clearCart}>
                Clear Cart
              </button>
            </div>
          </div>

          {/* Delivery Address Confirmation Card */}
          <div className="card flex-col gap-4" style={{
            padding: '1.5rem 2rem',
            border: !deliveryAddress.trim() ? '2px solid #E53E3E' : '1px solid var(--border-color)',
            backgroundColor: !deliveryAddress.trim() ? '#FFF5F5' : 'var(--card-bg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <h2 className="title-small" style={{ fontSize: '1.1rem', margin: 0 }}>Delivery Address</h2>
              </div>
              
              {deliveryAddress.trim() && !isEditingAddress && (
                <span className="badge badge-success" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckIcon size={12} /> Address Confirmed
                </span>
              )}
            </div>

            {fetchingProfile ? (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading address details...</span>
            ) : isEditingAddress || !deliveryAddress.trim() ? (
              <form onSubmit={handleConfirmAddress} className="flex-col gap-3">
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {!deliveryAddress.trim()
                    ? 'No address found. Please enter your delivery address to place an order:'
                    : 'Modify your delivery address for this order:'}
                </p>

                <div className="form-group">
                  <AddressAutocomplete
                    initialAddress={deliveryAddress}
                    placeholder="Search building / apartment / landmark (e.g. Park Ridge Apartments Guntur)..."
                    onSelectAddress={({ address }) => setDeliveryAddress(address)}
                  />
                </div>

                {/* Quick Presets for testing */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Presets:</span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={() => setDeliveryAddress('Apt 4B, 34 Oak Ave, MG Road, Bangalore')}
                  >
                    Central Bangalore
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={() => setDeliveryAddress('Flat 102, Green Glen Layout, Bellandur, Bangalore')}
                  >
                    Bellandur
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                  >
                    Confirm Address
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex justify-between items-center" style={{ gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>
                    {deliveryAddress}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Your order will be delivered to this location
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  onClick={() => setIsEditingAddress(true)}
                >
                  Modify Address
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Pricing Summary Card */}
        <div style={{ flex: '1 1 300px' }}>
          <div className="card flex-col gap-4" style={{ padding: '2rem', border: '1px solid var(--border-color)', sticky: 'top', top: '2rem' }}>
            <h2 className="title-small" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Bill Details</h2>
            
            <div className="flex justify-between" style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              <span>Item Total</span>
              <span>₹{subtotal}</span>
            </div>

            <div className="flex justify-between" style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              <span>Delivery Fee</span>
              <span>₹{deliveryFee}</span>
            </div>

            <div className="flex justify-between" style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              <span>Taxes & Charges (5% GST)</span>
              <span>₹{tax}</span>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

            <div className="flex justify-between" style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)' }}>
              <span>To Pay</span>
              <span style={{ color: 'var(--primary-color)' }}>₹{grandTotal}</span>
            </div>

            {!deliveryAddress.trim() && (
              <span style={{ fontSize: '0.75rem', color: '#E53E3E', fontWeight: '500', textAlign: 'center' }}>
                ⚠️ Please provide a delivery address before checking out
              </span>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '0.5rem' }}
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder || !deliveryAddress.trim()}
            >
              {isPlacingOrder ? 'Processing...' : 'Place Order & Complete Payment'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
