const { test, describe } = require('node:test');
const assert = require('node:assert');
const { getRoadDuration, calculateTotalETA } = require('../utils/etaHelper');

describe('3. OSRM Routing & ETA Integration Tests', () => {

  // Test 1: Real-world OSRM network call
  test('calls OSRM routing service and receives driving duration in seconds', async () => {
    // Bangalore City Center to Indiranagar
    const startCoords = [77.5946, 12.9716]; // [lng, lat]
    const endCoords = [77.6412, 12.9784];

    const durationSeconds = await getRoadDuration(startCoords, endCoords);

    // Verifies OSRM responded with a positive travel time (usually 600-1500s)
    assert.ok(typeof durationSeconds === 'number', 'Duration should be a number');
    assert.ok(durationSeconds > 0, 'Duration must be greater than 0');
  });

  // Test 2: End-to-end Total ETA Calculation
  test('calculates total order ETA including kitchen prep time and road transit', async () => {
    const rider = [77.5946, 12.9716];
    const restaurant = [77.6100, 12.9750];
    const customer = [77.6412, 12.9784];
    const prepTimeMinutes = 20;

    const totalETA = await calculateTotalETA(rider, restaurant, customer, prepTimeMinutes);

    // Total ETA should be prep time (20m) + travel time (~10-20m) -> between 20 and 60 minutes
    assert.ok(totalETA >= 20, 'ETA must be at least the food preparation time');
    assert.ok(totalETA <= 60, 'ETA should not unrealistically exceed 60 minutes');
  });

});
