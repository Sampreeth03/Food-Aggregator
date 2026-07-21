import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AddressAutocomplete } from '../components/AddressAutocomplete';

const AVAILABLE_CUISINES = [
  'North Indian',
  'South Indian',
  'Biryani',
  'Pizza',
  'Burgers',
  'Chinese',
  'Asian',
  'Fast Food',
  'Desserts',
  'Beverages',
  'Italian',
  'Healthy Food'
];

export const RestaurantDashboard = () => {
  const { token, user } = useContext(AuthContext);

  const [restaurant, setRestaurant] = useState(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(true);
  
  // Dashboard Tabs: 'orders' | 'menu' | 'earnings'
  const [activeTab, setActiveTab] = useState('orders');

  // Live Orders state
  const [activeOrders, setActiveOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Historic Orders state (for Earnings & Analytics)
  const [orderHistory, setOrderHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Live Menu Item Editing States
  const [editingIndex, setEditingIndex] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editPrep, setEditPrep] = useState('15');
  const [editVeg, setEditVeg] = useState(true);

  // Onboarding Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState(['North Indian', 'Fast Food']);
  const [lng, setLng] = useState(77.5946);
  const [lat, setLat] = useState(12.9716);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('22:00');

  const handleCuisineToggle = (c) => {
    if (selectedCuisines.includes(c)) {
      setSelectedCuisines(selectedCuisines.filter(item => item !== c));
    } else {
      setSelectedCuisines([...selectedCuisines, c]);
    }
  };

  // Onboarding Menu Items state
  const [onboardMenuItems, setOnboardMenuItems] = useState([
    { name: 'Classic Burger', price: 180, averagePrepTime: 12, isVeg: false },
    { name: 'Margherita Pizza', price: 290, averagePrepTime: 15, isVeg: true },
    { name: 'Veg Hakka Noodles', price: 220, averagePrepTime: 10, isVeg: true }
  ]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemPrep, setNewItemPrep] = useState('15');
  const [newItemVeg, setNewItemVeg] = useState(true);

  const [onboardError, setOnboardError] = useState('');
  const [onboardSuccess, setOnboardSuccess] = useState('');
  const [isSubmittingOnboard, setIsSubmittingOnboard] = useState(false);

  // Live Menu Management States (for Menu Manager Tab)
  const [currentMenu, setCurrentMenu] = useState([]);
  const [isSavingMenu, setIsSavingMenu] = useState(false);
  const [menuMessage, setMenuMessage] = useState('');
  const [liveOpeningTime, setLiveOpeningTime] = useState('09:00');
  const [liveClosingTime, setLiveClosingTime] = useState('22:00');
  const [isSavingHours, setIsSavingHours] = useState(false);
  const [hoursMessage, setHoursMessage] = useState('');

  // Fetch restaurant profile
  const fetchRestaurantProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/restaurants/my-restaurant', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setRestaurant(data);
        setCurrentMenu(data.menu || []);
        setLiveOpeningTime(data.openingTime || '09:00');
        setLiveClosingTime(data.closingTime || '22:00');
      } else {
        setRestaurant(null); // Triggers onboarding view
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRestaurant(false);
    }
  };

  // Fetch live active orders
  const fetchActiveOrders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/restaurant-orders/active', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setActiveOrders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch complete order history for earnings & analytics
  const fetchOrderHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/restaurant-orders/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setOrderHistory(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchRestaurantProfile();
  }, [token]);

  // Poller effects
  useEffect(() => {
    if (restaurant) {
      if (activeTab === 'orders') {
        fetchActiveOrders();
        const interval = setInterval(fetchActiveOrders, 4000);
        return () => clearInterval(interval);
      } else if (activeTab === 'earnings') {
        fetchOrderHistory();
        const interval = setInterval(fetchOrderHistory, 6000);
        return () => clearInterval(interval);
      }
    }
  }, [restaurant, activeTab, token]);

  // Add Item to Onboarding Menu list
  const handleAddOnboardItem = (e) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice) return;
    
    setOnboardMenuItems([
      ...onboardMenuItems,
      {
        name: newItemName,
        price: parseFloat(newItemPrice),
        averagePrepTime: parseInt(newItemPrep),
        isVeg: newItemVeg
      }
    ]);

    setNewItemName('');
    setNewItemPrice('');
    setNewItemPrep('15');
    setNewItemVeg(true);
  };

  // Remove Item from Onboarding Menu list
  const handleRemoveOnboardItem = (index) => {
    setOnboardMenuItems(onboardMenuItems.filter((_, idx) => idx !== index));
  };

  // Onboard restaurant submit
  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!name || !address || selectedCuisines.length === 0) {
      setOnboardError('Please fill in restaurant details and select at least one cuisine.');
      return;
    }
    if (onboardMenuItems.length === 0) {
      setOnboardError('Please configure at least one menu item.');
      return;
    }

    setOnboardError('');
    setIsSubmittingOnboard(true);

    try {
      const payload = {
        name,
        address,
        cuisine: selectedCuisines,
        lng: parseFloat(lng),
        lat: parseFloat(lat),
        menu: onboardMenuItems,
        openingTime,
        closingTime,
        ownerId: user.id
      };

      const response = await fetch('http://localhost:5000/api/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        setRestaurant(data.restaurant);
        setCurrentMenu(data.restaurant.menu || []);
        setLiveOpeningTime(data.restaurant.openingTime || '09:00');
        setLiveClosingTime(data.restaurant.closingTime || '22:00');
        setOnboardSuccess('Restaurant onboarded successfully!');
      } else {
        setOnboardError(data.msg || 'Onboarding failed.');
      }
    } catch (err) {
      console.error(err);
      setOnboardError('Connection error.');
    } finally {
      setIsSubmittingOnboard(false);
    }
  };

  // Update active order status
  const handleUpdateStatus = async (orderId, nextStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/restaurant-orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (response.ok) {
        fetchActiveOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save changes to current menu (Menu Manager Tab)
  const handleSaveMenuChanges = async () => {
    setIsSavingMenu(true);
    setMenuMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/restaurants/menu', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ menu: currentMenu })
      });

      const data = await response.json();
      if (response.ok) {
        setRestaurant(data.restaurant);
        setCurrentMenu(data.restaurant.menu || []);
        setMenuMessage('Menu changes saved successfully!');
        setTimeout(() => setMenuMessage(''), 3000);
      } else {
        setMenuMessage('Error: ' + data.msg);
      }
    } catch (err) {
      console.error(err);
      setMenuMessage('Network connection error.');
    } finally {
      setIsSavingMenu(false);
    }
  };

  // Save Operating Hours
  const handleSaveHours = async (e) => {
    e.preventDefault();
    setIsSavingHours(true);
    setHoursMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/restaurants/operating-hours', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ openingTime: liveOpeningTime, closingTime: liveClosingTime })
      });

      const data = await response.json();
      if (response.ok) {
        setRestaurant(data.restaurant);
        setLiveOpeningTime(data.restaurant.openingTime || '09:00');
        setLiveClosingTime(data.restaurant.closingTime || '22:00');
        setHoursMessage('Operating hours updated successfully!');
        setTimeout(() => setHoursMessage(''), 3000);
      } else {
        setHoursMessage('Error: ' + data.msg);
      }
    } catch (err) {
      console.error(err);
      setHoursMessage('Network connection error.');
    } finally {
      setIsSavingHours(false);
    }
  };

  // Add Item inside Menu Manager Tab
  const handleAddLiveMenuItem = (e) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice) return;

    const updatedMenu = [
      ...currentMenu,
      {
        name: newItemName,
        price: parseFloat(newItemPrice),
        averagePrepTime: parseInt(newItemPrep),
        isVeg: newItemVeg
      }
    ];

    setCurrentMenu(updatedMenu);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemPrep('15');
    setNewItemVeg(true);
  };

  // Delete Item inside Menu Manager Tab
  const handleDeleteLiveMenuItem = (index) => {
    setCurrentMenu(currentMenu.filter((_, idx) => idx !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const startEdit = (index, item) => {
    setEditingIndex(index);
    setEditName(item.name);
    setEditPrice(item.price);
    setEditPrep(item.averagePrepTime || 15);
    setEditVeg(item.isVeg);
  };

  const saveEdit = (index) => {
    if (!editName || !editPrice) return;
    const updatedMenu = [...currentMenu];
    updatedMenu[index] = {
      ...updatedMenu[index],
      name: editName,
      price: parseFloat(editPrice),
      averagePrepTime: parseInt(editPrep),
      isVeg: editVeg
    };
    setCurrentMenu(updatedMenu);
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
  };

  // Earnings Analytics calculation
  const calculateAnalytics = () => {
    const delivered = orderHistory.filter(o => o.status === 'delivered');
    const cancelled = orderHistory.filter(o => o.status === 'cancelled');
    const active = orderHistory.filter(o => !['delivered', 'cancelled'].includes(o.status));
    
    const revenue = delivered.reduce((sum, o) => sum + o.totalAmount, 0);
    const orderCount = delivered.length;
    const avgOrderVal = orderCount > 0 ? Math.round(revenue / orderCount) : 0;

    // Platform fee calculation (10%)
    const commission = Math.round(revenue * 0.1);
    const netEarnings = revenue - commission;
    
    // Total items sold and Top Selling Items
    let totalItemsSold = 0;
    const itemSalesMap = {};

    delivered.forEach(order => {
      order.items.forEach(item => {
        totalItemsSold += item.quantity;
        if (!itemSalesMap[item.name]) {
          itemSalesMap[item.name] = {
            name: item.name,
            quantity: 0,
            revenue: 0
          };
        }
        itemSalesMap[item.name].quantity += item.quantity;
        itemSalesMap[item.name].revenue += item.price * item.quantity;
      });
    });

    const topSellingItems = Object.values(itemSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5); // top 5 items
    
    // Average preparation time configured in menu
    const menuCount = restaurant?.menu ? restaurant.menu.length : 0;
    const totalPrep = restaurant?.menu ? restaurant.menu.reduce((sum, item) => sum + (item.averagePrepTime || 15), 0) : 0;
    const avgPrep = menuCount > 0 ? Math.round(totalPrep / menuCount) : 15;

    return { 
      revenue, 
      orderCount, 
      avgOrderVal, 
      avgPrep, 
      commission, 
      netEarnings, 
      totalItemsSold,
      topSellingItems,
      statusCounts: {
        total: orderHistory.length,
        delivered: orderCount,
        cancelled: cancelled.length,
        active: active.length
      }
    };
  };

  if (loadingRestaurant) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        Loading restaurant profile...
      </div>
    );
  }

  // ONBOARDING VIEW
  if (!restaurant) {
    return (
      <div className="flex-col gap-6 animate-fade-in" style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 className="title-medium" style={{ fontSize: '1.8rem' }}>Register Your Restaurant</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Setup your business profile and menu to start taking incoming orders
          </p>
        </div>

        {onboardError && (
          <div style={{
            backgroundColor: '#FED7D7',
            color: '#9B2C2C',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            borderLeft: '4px solid #E53E3E'
          }}>
            {onboardError}
          </div>
        )}

        <form onSubmit={handleOnboardSubmit} className="flex-col gap-6">
          
          {/* Section 1: Business Details */}
          <div className="card flex-col gap-4">
            <h3 className="title-small" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Business Profile</h3>
            
            <div className="form-group">
              <label className="form-label">Restaurant Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="The Spice Garden"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmittingOnboard}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Building / Street Address</label>
              <AddressAutocomplete
                initialAddress={address}
                placeholder="Search restaurant building or landmark (e.g. Park Ridge Apartments Guntur)..."
                onSelectAddress={({ address, latitude, longitude }) => {
                  setAddress(address);
                  if (latitude && longitude) {
                    setLat(latitude);
                    setLng(longitude);
                  }
                }}
                disabled={isSubmittingOnboard}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Select Cuisines (Click to select multiple)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.35rem' }}>
                {AVAILABLE_CUISINES.map(c => {
                  const isChecked = selectedCuisines.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleCuisineToggle(c)}
                      disabled={isSubmittingOnboard}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        border: isChecked ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                        backgroundColor: isChecked ? '#FFEBE6' : '#FFFFFF',
                        color: isChecked ? 'var(--primary-color)' : 'var(--text-main)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isChecked ? '✓ ' : '+ '}{c}
                    </button>
                  );
                })}
              </div>
              {selectedCuisines.length === 0 && (
                <span style={{ fontSize: '0.75rem', color: '#E53E3E', marginTop: '0.25rem', display: 'block' }}>
                  Please select at least one cuisine option.
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Longitude (default Bangalore location)</label>
                <input
                  type="number"
                  step="0.0001"
                  className="form-input"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value))}
                  disabled={isSubmittingOnboard}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  className="form-input"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value))}
                  disabled={isSubmittingOnboard}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Opening Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  disabled={isSubmittingOnboard}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Closing Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  disabled={isSubmittingOnboard}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Menu Config */}
          <div className="card flex-col gap-4">
            <h3 className="title-small" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Configure Menu Items</h3>
            
            {/* Added Menu Items list */}
            <div className="flex-col gap-2">
              {onboardMenuItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center" style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  backgroundColor: '#FAFAFA',
                  fontSize: '0.9rem'
                }}>
                  <div className="flex items-center gap-2">
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: item.isVeg ? '#4CAF50' : '#E53E3E'
                    }} />
                    <span style={{ fontWeight: '500' }}>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>₹{item.price}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({item.averagePrepTime} mins prep)</span>
                    <button type="button" style={{
                      background: 'none',
                      border: 'none',
                      color: '#E53E3E',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }} onClick={() => handleRemoveOnboardItem(index)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Add Menu Item Form */}
            <div style={{
              marginTop: '1rem',
              borderTop: '1px dashed var(--border-color)',
              paddingTop: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>Add A New Menu Item</span>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: '2 1 180px', padding: '0.5rem' }}
                  placeholder="Item Name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                />
                <input
                  type="number"
                  className="form-input"
                  style={{ flex: '1 1 80px', padding: '0.5rem' }}
                  placeholder="Price"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                />
                <input
                  type="number"
                  className="form-input"
                  style={{ flex: '1 1 80px', padding: '0.5rem' }}
                  placeholder="Prep (mins)"
                  value={newItemPrep}
                  onChange={(e) => setNewItemPrep(e.target.value)}
                />
                <select
                  className="form-select"
                  style={{ flex: '1 1 80px', padding: '0.5rem' }}
                  value={newItemVeg ? 'veg' : 'nonveg'}
                  onChange={(e) => setNewItemVeg(e.target.value === 'veg')}
                >
                  <option value="veg">Veg</option>
                  <option value="nonveg">Non-Veg</option>
                </select>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={handleAddOnboardItem}>
                  Add Item
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
            disabled={isSubmittingOnboard}
          >
            {isSubmittingOnboard ? 'Registering Business...' : 'Complete Registration & Open Dashboard'}
          </button>
        </form>
      </div>
    );
  }

  // ACTIVE DASHBOARD VIEW WITH TABS
  const analytics = calculateAnalytics();

  return (
    <div className="flex-col gap-6 animate-fade-in">
      
      {/* Restaurant Header Card */}
      <div className="card flex justify-between" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', padding: '1.5rem 2rem' }}>
        <div>
          <span className="badge badge-success">Live Panel</span>
          <h1 className="title-medium" style={{ fontSize: '1.6rem', marginTop: '0.5rem' }}>{restaurant.name}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {restaurant.cuisine.join(', ')} &bull; {restaurant.address} &bull; Operating hours: {restaurant.openingTime || '09:00'} - {restaurant.closingTime || '22:00'}
          </p>
        </div>
        <div className="flex gap-4" style={{ alignItems: 'center' }}>
          {/* Tabs Navigation */}
          <button
            className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            onClick={() => setActiveTab('orders')}
          >
            Active Orders ({activeOrders.length})
          </button>
          <button
            className={`btn ${activeTab === 'menu' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            onClick={() => setActiveTab('menu')}
          >
            Menu Manager ({currentMenu.length})
          </button>
          <button
            className={`btn ${activeTab === 'earnings' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            onClick={() => setActiveTab('earnings')}
          >
            Money &amp; Analytics
          </button>
        </div>
      </div>

      {/* TAB 1: LIVE ORDERS */}
      {activeTab === 'orders' && (
        <div className="flex-col gap-4">
          <h2 className="title-small">Active Live Orders</h2>
          
          {loadingOrders ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Polling live order updates...</div>
          ) : activeOrders.length > 0 ? (
            <div className="flex-col gap-4">
              {activeOrders.map((order) => (
                <div key={order._id} className="card flex justify-between" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', padding: '1.5rem' }}>
                  
                  {/* Details */}
                  <div className="flex-col gap-2" style={{ flex: '1 1 300px' }}>
                    <div className="flex items-center gap-3">
                      <span className="title-small" style={{ fontSize: '1rem' }}>
                        Order Ref: {order._id.substring(order._id.length - 8)}...
                      </span>
                      <span className="badge badge-preparing">
                        {order.status.toUpperCase()}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Time Placed: {new Date(order.createdAt).toLocaleTimeString()}
                    </span>

                    <div style={{
                      marginTop: '0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: '0.5rem'
                    }}>
                      {order.items.map((item, index) => (
                        <span key={index} style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                          {item.quantity} x {item.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex-col justify-between items-center" style={{ flex: '0 0 200px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textAlign: 'right' }}>Revenue</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>
                        ₹{order.totalAmount}
                      </span>
                    </div>

                    <div style={{ width: '100%', marginTop: '1rem' }}>
                      {order.status === 'placed' && (
                        <button
                          className="btn btn-primary"
                          style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
                          onClick={() => handleUpdateStatus(order._id, 'confirmed')}
                        >
                          Confirm Order
                        </button>
                      )}

                      {order.status === 'confirmed' && (
                        <button
                          className="btn btn-success"
                          style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
                          onClick={() => handleUpdateStatus(order._id, 'preparing')}
                        >
                          Start Cooking (Match Rider)
                        </button>
                      )}

                      {order.status === 'preparing' && (
                        <div style={{
                          textAlign: 'center',
                          fontSize: '0.8rem',
                          color: 'var(--text-muted)',
                          backgroundColor: 'var(--bg-color)',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          width: '100%'
                        }}>
                          {order.rider ? 'Rider Matched & Routing...' : 'Finding nearest rider...'}
                        </div>
                      )}
                      
                      {order.status === 'out_for_delivery' && (
                        <div style={{
                          textAlign: 'center',
                          fontSize: '0.8rem',
                          color: 'var(--secondary-success)',
                          backgroundColor: '#E6F4EA',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(76, 175, 80, 0.2)',
                          width: '100%',
                          fontWeight: '500'
                        }}>
                          Courier is delivering food
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No incoming active orders at the moment.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MENU MANAGER */}
      {activeTab === 'menu' && (
        <div className="flex-col gap-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="title-small">Live Menu Management</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Add, remove, or modify your menu items. Make sure to click 'Save Menu Changes' to apply your updates.
              </p>
            </div>
            <div className="flex items-center gap-4">
              {menuMessage && (
                <span style={{ fontSize: '0.85rem', fontWeight: '500', color: menuMessage.startsWith('Error') ? '#E53E3E' : 'var(--secondary-success)' }}>
                  {menuMessage}
                </span>
              )}
              <button
                className="btn btn-success"
                style={{ padding: '0.6rem 1.25rem' }}
                onClick={handleSaveMenuChanges}
                disabled={isSavingMenu}
              >
                {isSavingMenu ? 'Saving...' : 'Save Menu Changes'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
            {/* Current Menu Table/List */}
            <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {currentMenu.map((item, index) => {
                if (editingIndex === index) {
                  return (
                    <div key={index} className="card flex-col gap-3" style={{ padding: '1rem 1.5rem', borderLeft: '4px solid var(--primary-color)' }}>
                      <div className="flex gap-4 items-center" style={{ flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ flex: '2 1 180px', marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Item Name</label>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        </div>
                        <div className="form-group" style={{ flex: '1 1 80px', marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Price (₹)</label>
                          <input
                            type="number"
                            className="form-input"
                            style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                          />
                        </div>
                        <div className="form-group" style={{ flex: '1 1 80px', marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Prep (mins)</label>
                          <input
                            type="number"
                            className="form-input"
                            style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                            value={editPrep}
                            onChange={(e) => setEditPrep(e.target.value)}
                          />
                        </div>
                        <div className="form-group" style={{ flex: '1 1 80px', marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Dietary</label>
                          <select
                            className="form-select"
                            style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                            value={editVeg ? 'veg' : 'nonveg'}
                            onChange={(e) => setEditVeg(e.target.value === 'veg')}
                          >
                            <option value="veg">Veg</option>
                            <option value="nonveg">Non-Veg</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end" style={{ marginTop: '0.5rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-success"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => saveEdit(index)}
                        >
                          Update Item
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={index} className="card flex justify-between items-center" style={{ padding: '1rem 1.5rem' }}>
                    <div className="flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: item.isVeg ? '#4CAF50' : '#E53E3E'
                        }} />
                        <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{item.name}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Preparation time: {item.averagePrepTime || 15} mins
                      </span>
                    </div>

                    <div className="flex items-center gap-6">
                      <span style={{ fontWeight: '700', fontSize: '1rem' }}>₹{item.price}</span>
                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                          onClick={() => startEdit(index, item)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', color: '#E53E3E', borderColor: 'rgba(229, 62, 62, 0.2)', fontSize: '0.8rem' }}
                          onClick={() => handleDeleteLiveMenuItem(index)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Menu Item Form */}
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card flex-col gap-4" style={{ padding: '1.5rem' }}>
                <h3 className="title-small" style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Quick Add Item</h3>
                
                <form onSubmit={handleAddLiveMenuItem} className="flex-col gap-3">
                  <div className="form-group">
                    <label className="form-label">Item Name</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '0.5rem' }}
                      placeholder="Garlic Bread"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Price (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      style={{ padding: '0.5rem' }}
                      placeholder="150"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Prep Time (Mins)</label>
                    <input
                      type="number"
                      className="form-input"
                      style={{ padding: '0.5rem' }}
                      placeholder="15"
                      value={newItemPrep}
                      onChange={(e) => setNewItemPrep(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Dietary type</label>
                    <select
                      className="form-select"
                      style={{ padding: '0.5rem' }}
                      value={newItemVeg ? 'veg' : 'nonveg'}
                      onChange={(e) => setNewItemVeg(e.target.value === 'veg')}
                    >
                      <option value="veg">Vegetarian</option>
                      <option value="nonveg">Non-Vegetarian</option>
                    </select>
                  </div>

                  <button type="submit" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    Add to Menu List
                  </button>
                </form>
              </div>

              {/* Operating Hours Settings Card */}
              <div className="card flex-col gap-4" style={{ padding: '1.5rem' }}>
                <h3 className="title-small" style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Operating Hours</h3>
                
                <form onSubmit={handleSaveHours} className="flex-col gap-3">
                  <div className="form-group">
                    <label className="form-label">Opening Time</label>
                    <input
                      type="time"
                      className="form-input"
                      style={{ padding: '0.5rem' }}
                      value={liveOpeningTime}
                      onChange={(e) => setLiveOpeningTime(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Closing Time</label>
                    <input
                      type="time"
                      className="form-input"
                      style={{ padding: '0.5rem' }}
                      value={liveClosingTime}
                      onChange={(e) => setLiveClosingTime(e.target.value)}
                    />
                  </div>

                  {hoursMessage && (
                    <span style={{ fontSize: '0.85rem', fontWeight: '500', color: hoursMessage.startsWith('Error') ? '#E53E3E' : 'var(--secondary-success)' }}>
                      {hoursMessage}
                    </span>
                  )}

                  <button type="submit" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={isSavingHours}>
                    {isSavingHours ? 'Updating...' : 'Update Operating Hours'}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: MONEY DASHBOARD & ANALYTICS */}
      {activeTab === 'earnings' && (
        <div className="flex-col gap-6 animate-fade-in">
          <div className="flex-col gap-1">
            <h2 className="title-small">Earnings &amp; Analytics Dashboard</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Historical summary of order volume, revenue aggregates, and past transactions
            </p>
          </div>

          {/* Stats Analytics Grid */}
          {loadingHistory ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Analyzing financials...</div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-6" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                
                <div className="card flex-col gap-2" style={{ flex: '1 1 200px', padding: '1.5rem 2rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Gross Sales
                  </span>
                  <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    ₹{analytics.revenue}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Commission (10%): ₹{analytics.commission}</span>
                </div>

                <div className="card flex-col gap-2" style={{ flex: '1 1 200px', padding: '1.5rem 2rem', borderLeft: '4px solid var(--secondary-success)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--secondary-success)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Net Earnings
                  </span>
                  <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--secondary-success)' }}>
                    ₹{analytics.netEarnings}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Credited directly to account</span>
                </div>

                <div className="card flex-col gap-2" style={{ flex: '1 1 200px', padding: '1.5rem 2rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Delivered Orders
                  </span>
                  <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {analytics.orderCount}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {analytics.statusCounts.active} active / {analytics.statusCounts.cancelled} cancelled
                  </span>
                </div>

                <div className="card flex-col gap-2" style={{ flex: '1 1 200px', padding: '1.5rem 2rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total Items Sold
                  </span>
                  <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary-color)' }}>
                    {analytics.totalItemsSold}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Avg. Order Value: ₹{analytics.avgOrderVal}
                  </span>
                </div>

              </div>

              {/* Detailed Business Summary & Top Items */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginTop: '1rem' }}>
                
                {/* Top Selling Items Card */}
                <div className="card flex-col gap-4" style={{ flex: '1 1 450px', backgroundColor: '#FFFFFF' }}>
                  <h3 className="title-small" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Top Selling Items</h3>
                  {analytics.topSellingItems.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {analytics.topSellingItems.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: '500' }}>
                            <span>{item.name}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{item.quantity} sold (₹{item.revenue})</span>
                          </div>
                          <div style={{
                            width: '100%',
                            height: '6px',
                            backgroundColor: '#E2E8F0',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${Math.min(100, (item.quantity / analytics.totalItemsSold) * 100)}%`,
                              height: '100%',
                              backgroundColor: 'var(--primary-color)',
                              borderRadius: '3px'
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
                      No items sold yet.
                    </div>
                  )}
                </div>

                {/* Operations & Volume Analytics */}
                <div className="card flex-col gap-4" style={{ flex: '1 1 350px', backgroundColor: '#FFFFFF' }}>
                  <h3 className="title-small" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Business Summary</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem' }}>
                    <div className="flex justify-between" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid #F7FAFC' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Total Orders Logged</span>
                      <span style={{ fontWeight: '600' }}>{analytics.statusCounts.total}</span>
                    </div>
                    <div className="flex justify-between" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid #F7FAFC' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Completed Deliveries</span>
                      <span style={{ fontWeight: '600', color: 'var(--secondary-success)' }}>{analytics.statusCounts.delivered}</span>
                    </div>
                    <div className="flex justify-between" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid #F7FAFC' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Active Orders (Cooking/Route)</span>
                      <span style={{ fontWeight: '600', color: '#2B6CB0' }}>{analytics.statusCounts.active}</span>
                    </div>
                    <div className="flex justify-between" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid #F7FAFC' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Cancelled Orders</span>
                      <span style={{ fontWeight: '600', color: '#E53E3E' }}>{analytics.statusCounts.cancelled}</span>
                    </div>
                    <div className="flex justify-between" style={{ paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Avg configured Prep time</span>
                      <span style={{ fontWeight: '600' }}>{analytics.avgPrep} mins</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Transactions Ledger */}
              <div className="card flex-col gap-4" style={{ padding: '2rem', backgroundColor: '#FFFFFF' }}>
                <h3 className="title-small" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Transaction History</h3>
                
                {orderHistory.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: '600' }}>
                          <th style={{ padding: '0.75rem 1rem' }}>Order Ref</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Payment</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderHistory.map((histOrder) => (
                          <tr key={histOrder._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                              #{histOrder._id.substring(histOrder._id.length - 8)}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>
                              {histOrder.customer?.name || 'Customer'}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                              {new Date(histOrder.createdAt).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>
                              ₹{histOrder.totalAmount}
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span className={`badge ${histOrder.paymentStatus === 'completed' ? 'badge-success' : 'badge-pending'}`}>
                                {histOrder.paymentStatus}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span className={`badge ${histOrder.status === 'delivered' ? 'badge-success' : histOrder.status === 'cancelled' ? 'badge-danger' : 'badge-preparing'}`}>
                                {histOrder.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>
                    No transactions recorded in system history yet.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
};
