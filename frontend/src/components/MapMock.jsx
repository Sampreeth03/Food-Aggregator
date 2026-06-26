import React, { useEffect, useRef } from 'react';

export const MapMock = ({ restaurantCoords, customerCoords, riderCoords, status }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let progress = 0.5; // used to animate rider pulse or movement
    let pulseDirection = 1;

    const drawMap = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Define internal coordinates mapped to canvas space
      // Let's create a bounding box based on the inputs or place them at fixed visual points for clean design
      const padding = 60;
      const w = canvas.width;
      const h = canvas.height;

      // Define static clean layout positions for restaurant, customer, rider
      // This is a mockup map, so we map the coordinates to logical screen points:
      // Restaurant in center-left, Customer in center-right, Rider starting bottom-left
      const restaurantPt = { x: padding + 80, y: h / 2 - 20 };
      const customerPt = { x: w - padding - 80, y: h / 2 - 20 };
      
      let riderPt = null;
      if (riderCoords) {
        // Rider starts near bottom left, moves towards restaurant, then to customer
        if (status === 'preparing' || status === 'confirmed' || status === 'placed') {
          // Rider moving towards restaurant
          const ratio = progress;
          const startX = padding;
          const startY = h - padding;
          riderPt = {
            x: startX + (restaurantPt.x - startX) * ratio,
            y: startY + (restaurantPt.y - startY) * ratio
          };
        } else if (status === 'out_for_delivery') {
          // Rider moving from restaurant to customer
          const ratio = progress;
          riderPt = {
            x: restaurantPt.x + (customerPt.x - restaurantPt.x) * ratio,
            y: restaurantPt.y + (customerPt.y - restaurantPt.y) * ratio
          };
        } else if (status === 'delivered') {
          // Rider is at customer
          riderPt = { x: customerPt.x, y: customerPt.y };
        }
      }

      // Draw background grid lines (sleek map style)
      ctx.strokeStyle = '#F0F4F8';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw Route Path from Rider -> Restaurant -> Customer
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 3;

      // Part 1: Rider to Restaurant
      if (riderCoords && (status === 'preparing' || status === 'confirmed' || status === 'placed')) {
        ctx.strokeStyle = 'rgba(113, 128, 150, 0.4)';
        ctx.beginPath();
        ctx.moveTo(padding, h - padding);
        ctx.lineTo(restaurantPt.x, restaurantPt.y);
        ctx.stroke();
      }

      // Part 2: Restaurant to Customer
      ctx.beginPath();
      ctx.moveTo(restaurantPt.x, restaurantPt.y);
      ctx.lineTo(customerPt.x, customerPt.y);
      if (status === 'out_for_delivery') {
        ctx.strokeStyle = 'var(--primary-color)'; // Highlight active route
        ctx.setLineDash([]); // Solid line for active delivery
      } else {
        ctx.strokeStyle = 'rgba(113, 128, 150, 0.3)';
      }
      ctx.stroke();
      ctx.setLineDash([]); // Reset to solid

      // Draw Restaurant Hub (warm coral circle with white dot)
      ctx.beginPath();
      ctx.arc(restaurantPt.x, restaurantPt.y, 22, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFEBE6';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(restaurantPt.x, restaurantPt.y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = 'var(--primary-color)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(restaurantPt.x, restaurantPt.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Label Restaurant
      ctx.font = '500 11px Inter';
      ctx.fillStyle = 'var(--text-main)';
      ctx.textAlign = 'center';
      ctx.fillText('Restaurant', restaurantPt.x, restaurantPt.y - 28);

      // Draw Customer Hub (dark gray circle with white dot)
      ctx.beginPath();
      ctx.arc(customerPt.x, customerPt.y, 20, 0, 2 * Math.PI);
      ctx.fillStyle = '#E2E8F0';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(customerPt.x, customerPt.y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = 'var(--text-main)';
      ctx.fill();

      // Label Customer
      ctx.font = '500 11px Inter';
      ctx.fillStyle = 'var(--text-main)';
      ctx.textAlign = 'center';
      ctx.fillText('Delivery Location', customerPt.x, customerPt.y - 28);

      // Draw Rider (Green pulsing delivery icon)
      if (riderPt) {
        // Draw pulsing outer ring
        ctx.beginPath();
        ctx.arc(riderPt.x, riderPt.y, 14 + progress * 6, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
        ctx.fill();

        // Draw solid rider ring
        ctx.beginPath();
        ctx.arc(riderPt.x, riderPt.y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = 'var(--secondary-success)';
        ctx.fill();

        // Draw inner rider core
        ctx.beginPath();
        ctx.arc(riderPt.x, riderPt.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Label Rider
        ctx.font = '600 10px Inter';
        ctx.fillStyle = 'var(--secondary-success-hover)';
        ctx.textAlign = 'center';
        ctx.fillText('Courier', riderPt.x, riderPt.y + 24);
      }

      // Update progress for animation
      progress += 0.005 * pulseDirection;
      if (progress >= 0.95) {
        pulseDirection = -1;
      } else if (progress <= 0.05) {
        pulseDirection = 1;
      }

      animationId = requestAnimationFrame(drawMap);
    };

    drawMap();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [restaurantCoords, customerCoords, riderCoords, status]);

  return (
    <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative', height: '300px', backgroundColor: '#F8FAFC' }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={300}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        backgroundColor: '#FFFFFF',
        padding: '0.4rem 0.8rem',
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: '500',
        boxShadow: 'var(--shadow-sm)',
        color: 'var(--text-muted)',
        border: '1px solid var(--border-color)'
      }}>
        Live Route Simulation
      </div>
    </div>
  );
};
