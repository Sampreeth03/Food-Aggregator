import React from 'react';

export const Footer = () => {
  return (
    <footer className="footer">
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '1.2rem' }}>
            BiteSpeed
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
            <span>About Us</span>
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
            <span>Contact Support</span>
          </div>
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          &copy; {new Date().getFullYear()} BiteSpeed Inc. Crafted for freshness and speed. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
