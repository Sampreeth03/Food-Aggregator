import React, { useState, useContext, useEffect } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { CustomerHome } from './pages/CustomerHome';
import { CustomerCart } from './pages/CustomerCart';
import { CustomerOrders } from './pages/CustomerOrders';
import { CustomerTrack } from './pages/CustomerTrack';
import { RestaurantDashboard } from './pages/RestaurantDashboard';
import { RiderProfileView } from './pages/RiderProfile';
import { RiderOrdersView } from './pages/RiderOrders';
import { RiderDashboardView } from './pages/RiderDashboard';
import { CustomerProfileView } from './pages/CustomerProfile';

function AppContent() {
  const { user, loading } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState('landing');
  const [pageParams, setPageParams] = useState({});

  const navigateTo = (page) => {
    setCurrentPage(page);
    setPageParams({});
  };

  const navigateToParams = (page, params) => {
    setCurrentPage(page);
    setPageParams(params);
  };

  // Route protection / Redirect logic based on login status and role
  useEffect(() => {
    if (loading) return;

    const publicPages = ['landing', 'login', 'register'];
    const isPublic = publicPages.includes(currentPage);

    if (!user && !isPublic) {
      // If not logged in and trying to access private page, redirect to landing
      setCurrentPage('landing');
    } else if (user && isPublic) {
      // If logged in and trying to access landing/login/register, redirect to role dashboard
      if (user.role === 'customer') {
        setCurrentPage('customer-home');
      } else if (user.role === 'restaurant') {
        setCurrentPage('restaurant-dashboard');
      } else if (user.role === 'rider') {
        setCurrentPage('rider-orders');
      }
    }
  }, [user, loading, currentPage]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#718096' }}>
        Loading BiteSpeed...
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage navigateTo={navigateTo} />;
      case 'login':
        return <Login navigateTo={navigateTo} />;
      case 'register':
        return <Register navigateTo={navigateTo} />;
      case 'customer-home':
        return <CustomerHome navigateTo={navigateTo} />;
      case 'customer-cart':
        return <CustomerCart navigateTo={navigateTo} navigateToParams={navigateToParams} />;
      case 'customer-orders':
        return <CustomerOrders navigateToParams={navigateToParams} />;
      case 'customer-profile':
        return <CustomerProfileView />;
      case 'customer-track':
        return <CustomerTrack pageParams={pageParams} navigateTo={navigateTo} />;
      case 'restaurant-dashboard':
        return <RestaurantDashboard />;
      case 'rider-profile':
        return <RiderProfileView />;
      case 'rider-dashboard':
        return <RiderDashboardView />;
      case 'rider-orders':
        return <RiderOrdersView navigateTo={navigateTo} />;
      default:
        return <LandingPage navigateTo={navigateTo} />;
    }
  };

  return (
    <div className="app-container">
      <Header currentPage={currentPage} navigateTo={navigateTo} />
      <main className="main-content">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
