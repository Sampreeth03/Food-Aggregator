const { test, describe } = require('node:test');
const assert = require('node:assert');
const {
  getHaversineDistance,
  getFallbackDuration,
  getPointAtRatio
} = require('../utils/etaHelper');

describe('1. ETA & Distance Helper Tests', () => {

  // Test: Distance between identical coordinates must be 0
  test('returns 0 meters when start and end coordinates are the same', () => {
    const coords = [77.5946, 12.9716]; // [lng, lat]
    const distance = getHaversineDistance(coords, coords);
    assert.strictEqual(distance, 0);
  });

  // Test: Real-world distance check (Bangalore Center to Indiranagar is ~5.2 km)
  test('calculates correct approximate distance between two points', () => {
    const cityCenter = [77.5946, 12.9716];
    const indiranagar = [77.6412, 12.9784];

    const distanceMeters = getHaversineDistance(cityCenter, indiranagar);

    // Should be between 5,000m and 5,500m
    assert.ok(distanceMeters > 5000, 'Distance must be > 5,000m');
    assert.ok(distanceMeters < 5500, 'Distance must be < 5,500m');
  });

  // Test: Travel time estimation
  test('calculates reasonable travel duration for 5km route', () => {
    const cityCenter = [77.5946, 12.9716];
    const indiranagar = [77.6412, 12.9784];

    const seconds = getFallbackDuration(cityCenter, indiranagar);

    // At 24 km/h with 1.3 road multiplier, ~5km should take 15-20 mins (900-1200 sec)
    assert.ok(seconds >= 900 && seconds <= 1250, 'Duration should be ~15-20 minutes');
  });

  // Test: Map Interpolation (Where is the courier at 0%, 50%, and 100% of route?)
  test('interpolates rider location accurately along path', () => {
    const path = [
      [10, 10],
      [20, 20]
    ];

    // At 0% progress -> exact start coordinate
    assert.deepStrictEqual(getPointAtRatio(path, 0), [10, 10]);

    // At 100% progress -> exact end coordinate
    assert.deepStrictEqual(getPointAtRatio(path, 1), [20, 20]);

    // At 50% progress -> exact midpoint [15, 15]
    const mid = getPointAtRatio(path, 0.5);
    assert.strictEqual(Math.round(mid[0]), 15);
    assert.strictEqual(Math.round(mid[1]), 15);
  });
});
