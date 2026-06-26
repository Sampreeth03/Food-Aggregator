import React, { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

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

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState('');

  const subtotal = getCartTotal();
  const deliveryFee = subtotal > 0 ? 40 : 0;
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const grandTotal = subtotal + deliveryFee + tax;

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0 || !cartRestaurant) {
      setError('Your cart is empty.');
      return;
    }

    setError('');
    setIsPlacingOrder(true);

    try {
      // Prepare request payload matching orderController placeOrder endpoint
      const payload = {
        restaurantId: cartRestaurant._id,
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
        {/* Cart Items List */}
        <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cartItems.map((item) => (
            <div key={item.menuItemId} className="card flex items-center justify-between" style={{ padding: '1rem 1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span className="title-small" style={{ fontSize: '1rem' }}>{item.name}</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  ₹{item.price} each
                </span>
              </div>

              <div className="flex items-center gap-6">
                {/* Quantity Editor */}
                <div className="flex items-center gap-3" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.25rem 0.5rem', backgroundColor: 'var(--bg-color)' }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-muted)', padding: '0 0.25rem' }}
                    onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span style={{ fontSize: '0.95rem', fontWeight: '600', width: '20px', textAlign: 'center' }}>
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-muted)', padding: '0 0.25rem' }}
                    onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>

                <span style={{ fontSize: '1.05rem', fontWeight: '600', width: '80px', textAlign: 'right' }}>
                  ₹{item.price * item.quantity}
                </span>

                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.6rem', color: '#E53E3E', borderColor: 'rgba(229, 62, 62, 0.2)' }}
                  onClick={() => removeFromCart(item.menuItemId)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button className="btn btn-secondary" style={{ color: 'var(--text-muted)' }} onClick={clearCart}>
              Clear Cart
            </button>
          </div>
        </div>

        {/* Pricing Summary Card */}
        <div style={{ flex: '1 1 300px' }}>
          <div className="card flex-col gap-4" style={{ padding: '2rem', border: '1px solid var(--border-color)' }}>
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

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '1rem' }}
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
            >
              {isPlacingOrder ? 'Processing...' : 'Place Order & Complete Payment'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
