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
    <div className="flex-col animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '5rem' }}>
      
      {/* Hero Section */}
      <section className="flex items-center justify-between" style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', padding: '3rem 0 1rem' }}>
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <span style={{
            backgroundColor: '#FFEBE6',
            color: 'var(--primary-color)',
            fontSize: '0.8rem',
            fontWeight: '600',
            padding: '0.35rem 0.85rem',
            borderRadius: '99px',
            alignSelf: 'flex-start',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Your Favorite Local Cuisines
          </span>
          <h1 className="title-large" style={{ fontSize: '3.2rem', lineHeight: '1.1' }}>
            Fresh food from local kitchens, <br />
            <span style={{ color: 'var(--primary-color)' }}>delivered to your door.</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem', maxWidth: '560px', lineHeight: '1.6' }}>
            Explore local menus, satisfy your cravings, and follow your food in real-time as it makes its way from the hot kitchen counter straight to your doorstep.
          </p>
          <div className="flex gap-4" style={{ marginTop: '0.5rem' }}>
            <button className="btn btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1rem' }} onClick={() => navigateTo('register')}>
              Order Now
            </button>
            <button className="btn btn-secondary" style={{ padding: '0.9rem 2rem', fontSize: '1rem' }} onClick={() => navigateTo('login')}>
              Partner Login
            </button>
          </div>
        </div>

        <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '460px',
            aspectRatio: '1.05',
            borderRadius: '24px',
            overflow: 'hidden',
            backgroundColor: '#FAFAFA',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Fresh Delivery Tracker</span>
              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>In Progress</span>
            </div>
            
            <div style={{ flex: 1, backgroundColor: '#F8FAFC', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>1. Preparing Food</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Chef is crafting your fresh meal</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--secondary-success)' }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>2. Out for Delivery</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Rider has picked up your hot order</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#2B6CB0' }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>3. Secure Handover</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Delivered fresh to your doorstep</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="card" style={{ padding: '2.5rem', backgroundColor: '#FFFFFF' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '2rem',
          textAlign: 'center'
        }}>
          {stats.map((stat, idx) => (
            <div key={idx} style={{ flex: '1 1 200px' }}>
              <span style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: 'var(--primary-color)',
                display: 'block',
                letterSpacing: '-0.03em'
              }}>
                {stat.value}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Features Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <h2 className="title-medium" style={{ fontSize: '2rem' }}>Delivering Comfort & Quality</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.5rem' }}>
            We focus on freshness, swift preparation, and secure drop-offs to make every meal feel like a special occasion.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
          {features.map((feat, idx) => (
            <div key={idx} className="card" style={{ flex: '1 1 300px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: idx === 0 ? '#FFEBE6' : idx === 1 ? '#E6F4EA' : '#E8F0FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: idx === 0 ? 'var(--primary-color)' : idx === 1 ? 'var(--secondary-success)' : '#1a73e8',
                marginBottom: '0.5rem'
              }}>
                {idx === 0 && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                )}
                {idx === 1 && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                )}
                {idx === 2 && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
              </div>
              <h3 className="title-small">{feat.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Partner Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <h2 className="title-medium">Join the BiteSpeed Family</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            We support local culinary creators and provide flexible income opportunities for couriers.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
          {partners.map((partner, idx) => (
            <div key={idx} className="card flex-col gap-4" style={{ flex: '1 1 450px', padding: '2.5rem', backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', justifyContent: 'space-between' }}>
              <div className="flex-col gap-2">
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary-color)', fontWeight: '600', letterSpacing: '0.05em' }}>
                  {partner.subtitle}
                </span>
                <h3 className="title-medium" style={{ fontSize: '1.4rem' }}>{partner.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginTop: '0.5rem' }}>
                  {partner.desc}
                </p>
              </div>
              <button className="btn btn-secondary" style={{ alignSelf: 'flex-start', marginTop: '1rem', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }} onClick={partner.action}>
                {partner.btnText}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section className="flex-col gap-6" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h2 className="title-medium" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Frequently Asked Questions</h2>
        
        <div className="flex-col gap-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className="card" style={{ padding: '1.25rem 1.75rem', cursor: 'pointer' }} onClick={() => toggleFaq(idx)}>
                <div className="flex justify-between items-center">
                  <h4 style={{ fontSize: '0.975rem', fontWeight: '600', color: 'var(--text-main)' }}>{faq.q}</h4>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                    {isOpen ? '−' : '+'}
                  </span>
                </div>
                {isOpen && (
                  <p style={{
                    marginTop: '0.75rem',
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)',
                    lineHeight: '1.6',
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
