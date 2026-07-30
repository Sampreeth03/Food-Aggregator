import React, { useState } from 'react';

export const LandingPage = ({ navigateTo }) => {
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const stats = [
    { label: 'Average Delivery Time', value: '12 Mins' },
    { label: 'Happy Customers served', value: '500K+' },
    { label: 'Hot & Fresh Delivery', value: '99.9%' },
    { label: 'Local Kitchen Partners', value: '1,200+' }
  ];

  const features = [
    {
      title: 'Always Hot & Fresh',
      desc: 'We optimize every delivery path so your food spends less time in transit and arrives at your door just as the chef intended—fresh, hot, and delicious.'
    },
    {
      title: 'Matched Instantly',
      desc: 'The moment your meal is ready at the kitchen, a local delivery partner is already waiting at the counter, ensuring zero delays in getting your meal to you.'
    },
    {
      title: 'Safe & Secure Handover',
      desc: 'Your peace of mind is our priority. Every order is verified at your doorstep using a secure 4-digit code, ensuring your meal goes directly to you.'
    }
  ];

  const partners = [
    {
      title: 'Share Your Cooking',
      subtitle: 'For Restaurants',
      desc: 'Partner with BiteSpeed to list your specialty menus, manage incoming orders with ease, track your kitchen performance, and delight hungry customers nearby.',
      btnText: 'Register Restaurant',
      action: () => navigateTo('register')
    },
    {
      title: 'Deliver and Earn',
      subtitle: 'For Couriers',
      desc: 'Deliver hot meals using your bicycle, scooter, or bike. Choose your own flexible schedule, accept delivery orders close to you, and secure daily payouts.',
      btnText: 'Join as Rider',
      action: () => navigateTo('register')
    }
  ];

  const faqs = [
    {
      q: 'How do you guarantee my food arrives hot?',
      a: 'We monitor preparation times and coordinate with delivery partners to ensure they arrive at the restaurant just as your order is packaged. This minimizes kitchen counter wait times.'
    },
    {
      q: 'Can I order from multiple restaurants at once?',
      a: 'To guarantee speed and food quality, we route orders individually. You can place separate orders if you wish to enjoy meals from different kitchens.'
    },
    {
      q: 'How do I track my active order?',
      a: 'Once the restaurant begins cooking, you can view your live tracking dashboard. It shows exactly which step your meal is in and counts down the minutes to arrival.'
    }
  ];

  return (
    <div className="flex-col animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '6rem', paddingBottom: '4rem' }}>
      
      {/* Hero Section */}
      <section className="flex items-center justify-between" style={{ display: 'flex', flexWrap: 'wrap', gap: '4rem', padding: '4rem 0 2rem' }}>
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <span style={{
            backgroundColor: '#FFEBE6',
            color: 'var(--primary-color)',
            fontSize: '0.8rem',
            fontWeight: '700',
            padding: '0.4rem 1rem',
            borderRadius: '99px',
            alignSelf: 'flex-start',
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>
            ⚡ Ultra Fast Delivery Platform
          </span>
          <h1 className="title-large" style={{ fontSize: '3.6rem', lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.02em' }}>
            Fresh food from local kitchens, <br />
            <span style={{ color: 'var(--primary-color)', position: 'relative' }}>
              delivered to your door.
            </span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '560px', lineHeight: '1.7' }}>
            Satisfy your cravings with hyper-local menus, custom building coordinates, and watch your delivery partner arrive live on our interactive tracking map.
          </p>
          <div className="flex gap-4" style={{ marginTop: '0.75rem' }}>
            <button 
              className="btn btn-primary" 
              style={{ 
                padding: '1rem 2.25rem', 
                fontSize: '1.05rem', 
                fontWeight: '600', 
                boxShadow: '0 4px 14px rgba(255, 87, 34, 0.3)',
                transform: 'translateY(0)',
                transition: 'all 0.2s ease'
              }} 
              onClick={() => navigateTo('register')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 87, 34, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(255, 87, 34, 0.3)';
              }}
            >
              Get Started
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ 
                padding: '1rem 2.25rem', 
                fontSize: '1.05rem', 
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }} 
              onClick={() => navigateTo('login')}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FAFAFA';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Hero Illustration / Mockup Card */}
        <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '460px',
            borderRadius: '24px',
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0,0,0,0.06)'
          }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#E53E3E' }}></span>
                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>Live Tracker Mockup</span>
              </div>
              <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem' }}>In Transit</span>
            </div>
            
            <div style={{ flex: 1, backgroundColor: '#FAFBFC', padding: '2rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: '700' }}>Step 1: Preparing</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>Restaurant is packing your meal</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--secondary-success)' }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: '700' }}>Step 2: On The Way</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>Rider is navigating to your rooftop</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2B6CB0' }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: '700' }}>Step 3: Secure Handover</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>Confirm delivery with your 4-digit code</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="card" style={{ padding: '2.5rem', backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', borderRadius: '16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '2.5rem',
          textAlign: 'center'
        }}>
          {stats.map((stat, idx) => (
            <div key={idx} style={{ flex: '1 1 200px' }}>
              <span style={{
                fontSize: '2.75rem',
                fontWeight: '900',
                color: 'var(--primary-color)',
                display: 'block',
                letterSpacing: '-0.04em',
                marginBottom: '0.25rem'
              }}>
                {stat.value}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Premium Cuisine Showcase Section */}
      <section className="flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <h2 className="title-medium" style={{ fontSize: '2.2rem', fontWeight: '800' }}>Explore Popular Cuisines</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '0.5rem' }}>
            Order from top local restaurants and kitchens offering high-quality dishes.
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '1.5rem',
          overflowX: 'auto',
          paddingBottom: '1rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {[
            { name: 'Wood-fired Pizzas', desc: 'Crafted with premium mozzarella', img: '/images/pizza_banner.png', rating: '4.9', time: '15 mins' },
            { name: 'Clay-pot Biryanis', desc: 'Slow-cooked fragrant basmati rice', img: '/images/biryani_banner.png', rating: '4.8', time: '20 mins' },
            { name: 'Gourmet Burgers', desc: 'Flame-grilled beef patties', img: '/images/burger_banner.png', rating: '4.7', time: '12 mins' },
            { name: 'Szechuan Noodles', desc: 'Wok-tossed spicy noodles', img: '/images/asian_banner.png', rating: '4.6', time: '18 mins' },
            { name: 'Molten Chocolate Cake', desc: 'Decadent chocolate desserts', img: '/images/dessert_banner.png', rating: '4.9', time: '10 mins' }
          ].map((cat, idx) => (
            <div 
              key={idx} 
              className="card"
              style={{
                flex: '0 0 280px',
                padding: 0,
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.03)';
              }}
              onClick={() => navigateTo('register')}
            >
              <div style={{
                height: '150px',
                backgroundImage: `url(${cat.img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}>
                  ⭐ {cat.rating}
                </div>
              </div>
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>{cat.name}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{cat.desc}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', borderTop: '1px solid #F0F0F0', paddingTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>⏱ Avg {cat.time}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: '600' }}>Order Now &rarr;</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Features Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <h2 className="title-medium" style={{ fontSize: '2.2rem', fontWeight: '800' }}>Delivering Comfort & Quality</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '0.5rem' }}>
            We focus on freshness, swift preparation, and secure drop-offs to make every meal feel like a special occasion.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
          {features.map((feat, idx) => (
            <div 
              key={idx} 
              className="card" 
              style={{ 
                flex: '1 1 300px', 
                padding: '2.5rem 2rem', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1rem',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: idx === 0 ? '#FFEBE6' : idx === 1 ? '#E6F4EA' : '#E8F0FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: idx === 0 ? 'var(--primary-color)' : idx === 1 ? 'var(--secondary-success)' : '#1a73e8',
                marginBottom: '0.25rem'
              }}>
                {idx === 0 && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                )}
                {idx === 1 && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                )}
                {idx === 2 && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
              </div>
              <h3 className="title-small" style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>{feat.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Partner Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <h2 className="title-medium" style={{ fontSize: '2.2rem', fontWeight: '800' }}>Join the BiteSpeed Family</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '0.5rem' }}>
            We support local culinary creators and provide flexible income opportunities for couriers.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
          {partners.map((partner, idx) => (
            <div 
              key={idx} 
              className="card flex-col gap-4" 
              style={{ 
                flex: '1 1 450px', 
                padding: '3rem 2.5rem', 
                backgroundColor: '#FFFFFF', 
                border: '1px solid var(--border-color)', 
                boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                justifyContent: 'space-between',
                borderRadius: '16px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-color)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <div className="flex-col gap-2">
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--primary-color)', fontWeight: '700', letterSpacing: '0.08em' }}>
                  {partner.subtitle}
                </span>
                <h3 className="title-medium" style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.25rem' }}>{partner.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: '1.6', marginTop: '0.5rem' }}>
                  {partner.desc}
                </p>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ 
                  alignSelf: 'flex-start', 
                  marginTop: '1.25rem', 
                  borderColor: 'var(--primary-color)', 
                  color: 'var(--primary-color)',
                  fontWeight: '600',
                  padding: '0.6rem 1.5rem'
                }} 
                onClick={partner.action}
              >
                {partner.btnText}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section className="flex-col gap-6" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h2 className="title-medium" style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2.2rem', fontWeight: '800' }}>Frequently Asked Questions</h2>
        
        <div className="flex-col gap-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx} 
                className="card" 
                style={{ 
                  padding: '1.5rem 2rem', 
                  cursor: 'pointer', 
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.01)'
                }} 
                onClick={() => toggleFaq(idx)}
              >
                <div className="flex justify-between items-center">
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{faq.q}</h4>
                  <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                    {isOpen ? '−' : '+'}
                  </span>
                </div>
                {isOpen && (
                  <p style={{
                    marginTop: '1rem',
                    fontSize: '0.9rem',
                    color: 'var(--text-muted)',
                    lineHeight: '1.6',
                    margin: '1rem 0 0 0',
                    animation: 'fadeIn 0.25s ease'
                  }}>
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};
