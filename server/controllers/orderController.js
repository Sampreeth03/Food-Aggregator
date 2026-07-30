const mongoose = require('mongoose');
const https = require('https');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const RiderProfile = require('../models/RiderProfile');
const User = require('../models/Users');
const CustomerProfile = require('../models/CustomerProfile');

// Passive helper to check if any assigned rider took too long to accept, and re-dispatches to next best rider
const checkAndProcessRiderTimeouts = async () => {
  try {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    const timedOutOrders = await Order.find({
      status: { $in: ['placed', 'confirmed', 'preparing'] },
      rider: { $ne: null },
      riderStatus: 'pending',
      riderAssignedAt: { $lt: threeMinutesAgo }
    });

    if (timedOutOrders.length > 0) {
      console.log(`Processing ${timedOutOrders.length} timed-out rider dispatches...`);
      const { assignNextRider } = require('../utils/riderDispatcher');

      for (const order of timedOutOrders) {
        const oldRiderId = order.rider;

        // Set old rider online again
        const riderProfile = await RiderProfile.findOne({ user: oldRiderId });
        if (riderProfile) {
          riderProfile.isOnline = true;
          await riderProfile.save();
        }

        // Add to rejected list so we don't assign them again
        if (!order.rejectedRiders.includes(oldRiderId)) {
          order.rejectedRiders.push(oldRiderId);
        }

        // Clear current assignment
        order.rider = null;
        order.riderStatus = 'pending';

        // Find next rider
        await assignNextRider(order);
        await order.save();
      }
    }
  } catch (err) {
    console.error('Error checking rider dispatch timeouts:', err);
  }
};

// Helper to dynamically geocode any address string using the Google Places Text Search API
const geocodeAddress = async (address) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    return null;
  }
  return new Promise((resolve) => {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(address)}&key=${apiKey}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.status === 'OK' && parsed.results && parsed.results.length > 0) {
            const loc = parsed.results[0].geometry.location;
            resolve([parseFloat(loc.lng), parseFloat(loc.lat)]);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
};

// 1. Place a new order (Strictly for customers)
exports.placeOrder = async (req, res) => {
  const customerId = req.user.id; 
  const { restaurantId, items, deliveryAddress, address, lat, lng, saveAddress, saveAddressLabel } = req.body;

  try {
    let finalAddress = (deliveryAddress || address || '').trim();

    // Check if address was provided in profile if not in request body
    if (!finalAddress) {
      const profileDoc = await CustomerProfile.findOne({ user: customerId });
      if (profileDoc && profileDoc.address) {
        finalAddress = profileDoc.address.trim();
      }
    }

    if (!finalAddress) {
      return res.status(400).json({ 
        msg: 'Delivery address is required to place an order. Please provide or confirm your delivery address.' 
      });
    }

    // STEP 1: Coordinate Resolution & Validation (moved to top)
    let finalCoordinates = null;

    // Check if the coordinates passed by the client are the corrupt profile coordinates [10.5, 23.5]
    if (lat !== undefined && lng !== undefined && lat !== null && lng !== null) {
      if (parseFloat(lat) === 23.5 && parseFloat(lng) === 10.5) {
        // Corrupt coordinates - trigger geocoder lookup
      } else {
        finalCoordinates = [parseFloat(lng), parseFloat(lat)];
      }
    }

    if (!finalCoordinates) {
      // Try to dynamically geocode the custom address string using Places Text Search API
      const geocoded = await geocodeAddress(finalAddress);
      if (geocoded) {
        finalCoordinates = geocoded;
      } else {
        // Fall back to profile coordinates only if they are not the corrupt mock coordinates [10.5, 23.5]
        const profileDoc = await CustomerProfile.findOne({ user: customerId });
        if (profileDoc && profileDoc.address && profileDoc.address.trim().toLowerCase() === finalAddress.toLowerCase()) {
          const customerUser = await User.findById(customerId);
          if (customerUser && customerUser.location && customerUser.location.coordinates) {
            const userCoords = customerUser.location.coordinates;
            if (userCoords[0] !== 10.5 || userCoords[1] !== 23.5) {
              finalCoordinates = userCoords;
            }
          }
        }
      }
    }

    if (!finalCoordinates || !Array.isArray(finalCoordinates) || finalCoordinates.length !== 2 || isNaN(finalCoordinates[0]) || isNaN(finalCoordinates[1])) {
      return res.status(400).json({
        msg: 'Unable to resolve precise coordinates for the entered address. Please select a valid building or landmark from the search autocomplete suggestions dropdown to place your order.'
      });
    }

    // STEP 2: Update Customer Profile & User coordinates with resolved coordinates
    let customerProfile = await CustomerProfile.findOne({ user: customerId });
    if (customerProfile) {
      customerProfile.address = finalAddress;
      // Handle appending to savedAddresses list if requested
      if (saveAddress && saveAddressLabel) {
        customerProfile.savedAddresses = customerProfile.savedAddresses.filter(
          addr => addr.label.toLowerCase() !== saveAddressLabel.trim().toLowerCase()
        );
        customerProfile.savedAddresses.push({
          label: saveAddressLabel.trim(),
          address: finalAddress,
          lat: finalCoordinates[1], // Latitude
          lng: finalCoordinates[0]  // Longitude
        });
      }
      await customerProfile.save();
    } else {
      const newProfileData = {
        user: customerId,
        address: finalAddress
      };
      if (saveAddress && saveAddressLabel) {
        newProfileData.savedAddresses = [{
          label: saveAddressLabel.trim(),
          address: finalAddress,
          lat: finalCoordinates[1],
          lng: finalCoordinates[0]
        }];
      }
      customerProfile = await CustomerProfile.create(newProfileData);
    }

    // Sync updated coordinates to User document
    const userDoc = await User.findById(customerId);
    if (userDoc) {
      userDoc.location = {
        type: 'Point',
        coordinates: finalCoordinates
      };
      await userDoc.save();
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ msg: 'Restaurant not found' });
    }

    // Check if the restaurant is currently open (supports daytime & overnight hours)
    const now = new Date();
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMins = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHours}:${currentMins}`;

    const openTime = restaurant.openingTime || '09:00';
    const closeTime = restaurant.closingTime || '22:00';

    let isOpen = false;
    if (openTime <= closeTime) {
      isOpen = currentTime >= openTime && currentTime <= closeTime;
    } else {
      isOpen = currentTime >= openTime || currentTime <= closeTime;
    }

    if (!isOpen) {
      return res.status(400).json({ 
        msg: `Restaurant is currently closed. Operating hours: ${openTime} - ${closeTime}. Current time: ${currentTime}.` 
      });
    }

    let totalAmount = 0;
    const orderItemsSnapshot = [];

    for (let i = 0; i < items.length; i++) {
      const cartItem = items[i];
      const officialMenuItem = restaurant.menu.find(function(menuItem) {
        return menuItem._id.toString() === cartItem.menuItemId;
      });

      if (!officialMenuItem) {
        return res.status(400).json({ msg: `Item ${cartItem.name} is no longer on the menu` });
      }

      const itemTotal = officialMenuItem.price * cartItem.quantity;
      totalAmount = totalAmount + itemTotal;

      orderItemsSnapshot.push({
        menuItemId: officialMenuItem._id,
        name: officialMenuItem.name,
        quantity: cartItem.quantity,
        price: officialMenuItem.price
      });
    }

    const orderData = {
      customer: customerId,
      restaurant: restaurantId,
      deliveryAddress: finalAddress,
      items: orderItemsSnapshot,
      totalAmount: totalAmount,
      status: 'placed',
      paymentStatus: 'pending',
      deliveryLocation: {
        type: 'Point',
        coordinates: finalCoordinates
      }
    };

    const newOrder = await Order.create(orderData);

    res.status(201).json({
      msg: 'Order placed successfully. Awaiting payment processing.',
      order: newOrder
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// 2. Get all orders placed by the logged-in customer
exports.getCustomerOrders = async (req, res) => {
  try {
    await checkAndProcessRiderTimeouts();
    const orders = await Order.find({ customer: req.user.id })
      .populate('restaurant', 'name address')
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// 3. Get details of a single order (For tracking/review)
exports.getOrderById = async (req, res) => {
  const { orderId } = req.params;

  try {
    await checkAndProcessRiderTimeouts();
    const order = await Order.findById(orderId)
      .populate('restaurant', 'name address location')
      .populate('customer', 'name email location')
      .populate('rider', 'name location');

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    // Verify authorized user (Customer who ordered, Restaurant Owner, or Assigned Rider)
    const isCustomer = order.customer && order.customer._id.toString() === req.user.id;
    const isRider = order.rider && order.rider._id.toString() === req.user.id;
    
    let isRestaurantOwner = false;
    if (order.restaurant) {
      const restaurantDoc = await Restaurant.findById(order.restaurant._id);
      if (restaurantDoc && restaurantDoc.owner.toString() === req.user.id) {
        isRestaurantOwner = true;
      }
    }

    if (!isCustomer && !isRider && !isRestaurantOwner) {
      return res.status(403).json({ msg: 'Access denied to this order' });
    }

    res.status(200).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// 4. Get active delivery jobs for the logged-in rider
exports.getRiderOrders = async (req, res) => {
  try {
    await checkAndProcessRiderTimeouts();
    const orders = await Order.find({ rider: req.user.id })
      .populate('restaurant', 'name address location')
      .populate('customer', 'name location')
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// 5. Update status by rider (out_for_delivery / delivered)
exports.updateRiderOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status, deliveryOtp } = req.body;

  if (!['out_for_delivery', 'delivered'].includes(status)) {
    return res.status(400).json({ msg: 'Invalid status update for rider' });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    // Verify this rider is assigned to the order
    if (!order.rider || order.rider.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'You are not authorized to deliver this order' });
    }

    if (status === 'delivered') {
      // Validate OTP
      if (!deliveryOtp || parseInt(deliveryOtp) !== order.deliveryOtp) {
        return res.status(400).json({ msg: 'Invalid Delivery OTP' });
      }
      
      order.status = 'delivered';
      order.paymentStatus = 'completed'; // auto-complete payment upon delivery for mockup simplicity

      // Make rider online again
      const riderProfile = await RiderProfile.findOne({ user: req.user.id });
      if (riderProfile) {
        riderProfile.isOnline = true;
        await riderProfile.save();
      }
    } else {
      order.status = status;
    }

    await order.save();
    res.status(200).json({ msg: `Order status updated to ${status}`, order });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// 6. Accept incoming rider dispatch request
exports.acceptDispatch = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ msg: 'Order not found' });

    if (!order.rider || order.rider.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'You are not authorized to accept this dispatch request' });
    }

    if (order.riderStatus !== 'pending') {
      return res.status(400).json({ msg: `Order dispatch is already ${order.riderStatus}` });
    }

    order.riderStatus = 'accepted';
    await order.save();

    res.status(200).json({ msg: 'Dispatch request accepted successfully', order });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// 7. Reject incoming rider dispatch request (causes search for next best rider)
exports.rejectDispatch = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ msg: 'Order not found' });

    if (!order.rider || order.rider.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'You are not authorized to reject this dispatch request' });
    }

    // Set rider online again
    const riderProfile = await RiderProfile.findOne({ user: req.user.id });
    if (riderProfile) {
      riderProfile.isOnline = true;
      await riderProfile.save();
    }

    // Add rider to rejected list so we don't assign them again
    if (!order.rejectedRiders.includes(req.user.id)) {
      order.rejectedRiders.push(req.user.id);
    }

    // Clear the current assignment
    order.rider = null;
    order.riderStatus = 'pending';

    // Call the dispatcher helper to find next rider
    const { assignNextRider } = require('../utils/riderDispatcher');
    await assignNextRider(order);
    await order.save();

    res.status(200).json({ msg: 'Dispatch request rejected. Searching for another delivery partner.', order });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// 8. Rate restaurant and rider for a delivered order
exports.rateOrder = async (req, res) => {
  const { orderId } = req.params;
  const { restaurantRating, riderRating } = req.body;
  const customerId = req.user.id;

  if (restaurantRating === undefined && riderRating === undefined) {
    return res.status(400).json({ msg: 'Please provide at least one rating (restaurant or rider).' });
  }

  // Helper validation for rating value (1 to 5)
  const isValidRating = (val) => {
    if (val === undefined || val === null) return true; // optional
    const num = Number(val);
    return !isNaN(num) && num >= 1 && num <= 5;
  };

  if (!isValidRating(restaurantRating) || !isValidRating(riderRating)) {
    return res.status(400).json({ msg: 'Ratings must be numbers between 1 and 5.' });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    // Verify this is the customer who placed the order
    if (order.customer.toString() !== customerId) {
      return res.status(403).json({ msg: 'You are not authorized to rate this order' });
    }

    // Verify order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({ msg: 'You can only rate an order after it has been delivered' });
    }

    // Update ratings on order
    if (restaurantRating !== undefined && restaurantRating !== null) {
      order.restaurantRating = Number(restaurantRating);
    }
    if (riderRating !== undefined && riderRating !== null) {
      order.riderRating = Number(riderRating);
    }

    await order.save();

    // Recalculate average rating for the Restaurant
    if (restaurantRating !== undefined && restaurantRating !== null) {
      const restaurantStats = await Order.aggregate([
        { $match: { restaurant: new mongoose.Types.ObjectId(order.restaurant), restaurantRating: { $ne: null } } },
        { $group: { _id: null, avgRating: { $avg: '$restaurantRating' } } }
      ]);
      if (restaurantStats.length > 0) {
        const newRestaurantRating = parseFloat(restaurantStats[0].avgRating.toFixed(1));
        await Restaurant.findByIdAndUpdate(order.restaurant, { rating: newRestaurantRating });
      }
    }

    // Recalculate average rating for the Rider
    if (order.rider && riderRating !== undefined && riderRating !== null) {
      const riderStats = await Order.aggregate([
        { $match: { rider: new mongoose.Types.ObjectId(order.rider), riderRating: { $ne: null } } },
        { $group: { _id: null, avgRating: { $avg: '$riderRating' } } }
      ]);
      if (riderStats.length > 0) {
        const newRiderRating = parseFloat(riderStats[0].avgRating.toFixed(1));
        await RiderProfile.findOneAndUpdate({ user: order.rider }, { rating: newRiderRating });
      }
    }

    res.status(200).json({ msg: 'Ratings submitted successfully', order });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};