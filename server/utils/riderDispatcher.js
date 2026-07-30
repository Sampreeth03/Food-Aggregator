const Restaurant = require('../models/Restaurant');
const RiderProfile = require('../models/RiderProfile');
const User = require('../models/Users');
const { getRoadDuration, calculateTotalETA } = require('./etaHelper');

/**
 * Assigns the next best available online rider to an order.
 * Calculates ETA and updates the order document.
 * 
 * @param {Object} order - The mongoose order document.
 */
const assignNextRider = async (order) => {
  try {
    const restaurant = await Restaurant.findById(order.restaurant);
    if (!restaurant) {
      console.error(`Restaurant not found for order ${order._id}`);
      return;
    }

    if (!restaurant.location || !restaurant.location.coordinates || restaurant.location.coordinates.length !== 2) {
      console.log('Restaurant location not set, skipping rider dispatch.');
      return;
    }

    // Step 1: Find all online rider profiles who have NOT rejected this order
    const rejectedRidersList = order.rejectedRiders || [];
    const onlineProfiles = await RiderProfile.find({
      isOnline: true,
      user: { $nin: rejectedRidersList }
    });
    
    const onlineRiderUserIds = onlineProfiles.map(profile => profile.user);

    // Find nearby rider users
    const nearbyRiders = await User.find({
      role: 'rider',
      _id: { $in: onlineRiderUserIds },
      location: {
        $near: {
          $geometry: restaurant.location,
          $maxDistance: 10000 // 10km radius
        }
      }
    }).limit(3);

    if (nearbyRiders.length === 0) {
      console.log('No online nearby riders available for dispatch.');
      order.rider = null;
      order.riderStatus = 'pending';
      return;
    }

    const onlineRiderProfilesFiltered = onlineProfiles.filter(profile =>
      nearbyRiders.some(rider => rider._id.toString() === profile.user.toString())
    );

    // Step 2: Use road duration routing to find the fastest rider
    let bestRiderProfile = null;
    let shortestRoadTime = Infinity;

    for (let i = 0; i < onlineRiderProfilesFiltered.length; i++) {
      const riderUser = nearbyRiders.find(
        candidate => candidate._id.toString() === onlineRiderProfilesFiltered[i].user.toString()
      );

      if (!riderUser || !riderUser.location || !riderUser.location.coordinates || riderUser.location.coordinates.length !== 2) {
        continue;
      }

      const riderCoords = riderUser.location.coordinates;
      const restaurantCoords = restaurant.location.coordinates;

      const timeInSeconds = await getRoadDuration(riderCoords, restaurantCoords);
      if (timeInSeconds < shortestRoadTime) {
        shortestRoadTime = timeInSeconds;
        bestRiderProfile = onlineRiderProfilesFiltered[i];
      }
    }

    // Step 3: Assign the best rider, take them offline, and compute dynamic ETA
    if (bestRiderProfile) {
      order.rider = bestRiderProfile.user;
      order.riderStatus = 'pending';
      order.riderAssignedAt = new Date();

      // Set the matched rider offline so they aren't assigned multiple orders
      bestRiderProfile.isOnline = false;
      await bestRiderProfile.save();

      // Calculate ETA
      const customerUser = await User.findById(order.customer);
      let customerCoords = null;
      if (order.deliveryLocation && order.deliveryLocation.coordinates && order.deliveryLocation.coordinates.length === 2) {
        customerCoords = order.deliveryLocation.coordinates;
      } else if (customerUser && customerUser.location && customerUser.location.coordinates) {
        customerCoords = customerUser.location.coordinates;
      }

      if (customerCoords) {
        const restaurantCoords = restaurant.location.coordinates;
        const matchedRiderUser = nearbyRiders.find(r => r._id.toString() === bestRiderProfile.user.toString());
        const riderCoords = matchedRiderUser ? matchedRiderUser.location.coordinates : null;

        // Calculate max prep time
        let maxPrepTime = 15; // default prep time in minutes
        if (restaurant.menu && restaurant.menu.length > 0) {
          for (let i = 0; i < order.items.length; i++) {
            const menuItem = restaurant.menu.find(m => m._id.toString() === order.items[i].menuItemId);
            if (menuItem && menuItem.averagePrepTime > maxPrepTime) {
              maxPrepTime = menuItem.averagePrepTime;
            }
          }
        }

        const etaMinutes = await calculateTotalETA(riderCoords, restaurantCoords, customerCoords, maxPrepTime);
        order.estimatedDeliveryTime = new Date(Date.now() + etaMinutes * 60 * 1000);
      }
      
      // Generate OTP if not present
      if (!order.deliveryOtp) {
        order.deliveryOtp = Math.floor(1000 + Math.random() * 9000);
      }
      
      console.log(`Successfully assigned rider ${order.rider} to order ${order._id}`);
    } else {
      order.rider = null;
      order.riderStatus = 'pending';
      console.log('No suitable rider profile found after route comparisons.');
    }
  } catch (err) {
    console.error('Error in assignNextRider dispatcher:', err);
  }
};

module.exports = { assignNextRider };
