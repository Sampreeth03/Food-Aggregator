// Helper functions for ETA (Estimated Time of Arrival) calculations
// Uses a Straight-Line Haversine Distance + Road Multiplier (Tortuosity factor) fallback

// 1. Calculate straight-line distance in meters between two coordinates [lng, lat] using the Haversine formula
const getHaversineDistance = (coords1, coords2) => {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // returns distance in meters
};

// 2. Fallback travel duration using Haversine straight-line distance + Tortuosity road multiplier
const getFallbackDuration = (coords1, coords2) => {
  // Step 1: Calculate straight-line distance using the Haversine formula
  const straightLineDistance = getHaversineDistance(coords1, coords2);

  // Step 2: Apply a road multiplier (Tortuosity factor) to account for road winding
  // Urban/City areas winding factor: 1.3
  const tortuosityFactor = 1.3;
  const estimatedRoadDistance = straightLineDistance * tortuosityFactor;

  // Step 3: Divide by average courier speed: 24 km/h (6.67 m/s)
  const averageSpeed = 24 * (1000 / 3600); // 6.67 meters per second
  return Math.round(estimatedRoadDistance / averageSpeed);
};

// 3. Get actual driving duration in seconds using the OSRM Routing API
const getRoadDuration = async (startCoords, endCoords) => {
  const url = `http://router.project-osrm.org/route/v1/driving/${startCoords[0]},${startCoords[1]};${endCoords[0]},${endCoords[1]}?overview=false`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data && data.routes && data.routes.length > 0) {
      return data.routes[0].duration; // Returns duration in seconds from OSRM
    }
  } catch (err) {
    console.error("OSRM Routing API offline. Switching to Haversine + Tortuosity Multiplier fallback:", err.message);
  }

  // Fallback to Haversine + Tortuosity road multiplier if API is down
  return getFallbackDuration(startCoords, endCoords);
};

// 4. Calculate full ETA: Travel time (Rider -> Restaurant + Restaurant -> Customer) + Prep Time
const calculateTotalETA = async (riderCoords, restaurantCoords, customerCoords, prepTimeMinutes) => {
  let riderToRestaurantSec = 0;
  if (riderCoords && riderCoords.length === 2) {
    riderToRestaurantSec = await getRoadDuration(riderCoords, restaurantCoords);
  }

  const restaurantToCustomerSec = await getRoadDuration(restaurantCoords, customerCoords);

  const totalTravelTimeMinutes = (riderToRestaurantSec + restaurantToCustomerSec) / 60;
  const totalETAMinutes = prepTimeMinutes + totalTravelTimeMinutes;

  return Math.round(totalETAMinutes);
};

// 5. Linear interpolation along a path of coordinates [lng, lat] by ratio (0 to 1)
const getPointAtRatio = (coords, ratio) => {
  if (!coords || coords.length === 0) return null;
  if (coords.length === 1) return coords[0];
  if (ratio <= 0) return coords[0];
  if (ratio >= 1) return coords[coords.length - 1];

  const segments = [];
  let totalLength = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const dist = Math.sqrt(dx * dx + dy * dy);
    segments.push(dist);
    totalLength += dist;
  }

  if (totalLength === 0) return coords[0];

  const targetDist = totalLength * ratio;
  let accumulatedDist = 0;

  for (let i = 0; i < segments.length; i++) {
    const segLength = segments[i];
    if (accumulatedDist + segLength >= targetDist) {
      const segRatio = (targetDist - accumulatedDist) / segLength;
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const lng = p1[0] + (p2[0] - p1[0]) * segRatio;
      const lat = p1[1] + (p2[1] - p1[1]) * segRatio;
      return [lng, lat];
    }
    accumulatedDist += segLength;
  }

  return coords[coords.length - 1];
};

module.exports = {
  getHaversineDistance,
  getFallbackDuration,
  getRoadDuration,
  calculateTotalETA,
  getPointAtRatio
};
