import React, { useState } from 'react';

export const LandingPage = ({ navigateTo }) => {
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const stats = [
    { label: 'Average Delivery Time', value: '12 Mins' },
    { label: 'Happy Diners Served', value: '500K+' },
    { label: 'Hot & Fresh Delivery', value: '99.9%' },
    { label: 'Local Restaurant Partners', value: '1,200+' }
  ];

  const features = [
    {
      title: 'Cooked by Culinary Experts',
      desc: 'We partner with the finest local kitchens and restaurants to bring you delicious, chef-crafted meals made from fresh, premium ingredients.'
    },
    {
      title: 'Direct Hot-Box Delivery',
      desc: 'Our delivery network is optimized to ensure your food spends minimal time in transit and arrives piping hot in specialized temperature-insulated bags.'
    },
    {
      title: 'Effortless Ordering Experience',
      desc: 'Enjoy a sleek, zero-hassle checkout process, save multiple favorite addresses for quick selection, and get your food exactly where you want it.'
    }
  ];

  const partners = [
    {
      title: 'Grow Your Culinary Business',
      subtitle: 'For Restaurants',
      desc: 'Reach thousands of hungry diners. List your specialty menus, manage incoming orders with ease, track performance, and delight local food lovers.',
      btnText: 'Register Restaurant',
      action: () => navigateTo('register')
    },
    {
      title: 'Share the Joy of Good Food',
      subtitle: 'For Riders',
      desc: 'Enjoy flexible earning opportunities. Deliver delicious meals on your own schedule using your bicycle, scooter, or motorcycle with daily payouts.',
      btnText: 'Join as Rider',
      action: () => navigateTo('register')
    }
  ];

  const faqs = [
    {
      q: 'How do you guarantee my food arrives hot and fresh?',
      a: 'Our riders use premium insulated thermal bags. We also schedule dispatches dynamically so that a rider is matched exactly when the kitchen finishes preparing your food.'
    },
    {
      q: 'Can I order from multiple restaurants at once?',
      a: 'To guarantee speed and food quality, we route orders individually. You can place separate orders if you wish to enjoy meals from different restaurants.'
    },
    {
      q: 'Is there a way to save my home and office addresses?',
      a: 'Yes! You can save multiple delivery addresses with custom labels (like Home, Work, or Other) during checkout or directly in your profile for instant one-click selection.'
    }
  ];

  return (
    <div className="flex-col" style={{ display: 'flex', flexDirection: 'column', gap: '6rem', paddingBottom: '4rem' }}>
      <style>{`
        @keyframes slideInLeft {
          from {
            transform: translateX(-60px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideInRight {
          from {
            transform: translateX(60px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .slide-left-animated {
          animation: slideInLeft 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .slide-right-animated {
          animation: slideInRight 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      
      {/* Hero Section */}
      <section className="flex items-center justify-between" style={{ display: 'flex', flexWrap: 'wrap', gap: '4rem', padding: '4rem 0 2rem' }}>
        <div className="slide-left-animated" style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
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
            ⚡ Gourmet Food Delivered Hot
          </span>
          <h1 className="title-large" style={{ fontSize: '3.6rem', lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.02em' }}>
            Delectable dishes from local kitchens, <br />
            <span style={{ color: 'var(--primary-color)', position: 'relative' }}>
              delivered to your table.
            </span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '560px', lineHeight: '1.7' }}>
            Savor the best local flavors with curated specialty menus and direct hot-box deliveries. Order gourmet pizzas, clay-pot biryanis, flame-grilled burgers, and rich desserts in just a few taps.
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
              Order Now
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

        {/* Hero Food Image Container */}
        <div className="slide-right-animated" style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '460px',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
            border: '1px solid var(--border-color)',
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.03) translateY(-5px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
          }}
          >
            <img 
              src="/images/hero_food.jpg" 
              alt="Steaming Hot Gourmet Food Selection" 
              style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
              padding: '2rem 1.5rem',
              color: '#FFFFFF'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>Taste the Passion</h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>Freshly made, hot & bursting with rich flavors.</p>
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
