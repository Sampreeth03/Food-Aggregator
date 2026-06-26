const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const RiderProfile = require('../models/RiderProfile');
const User = require('../models/Users');

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

// 1. Place a new order (Strictly for customers)
exports.placeOrder = async (req, res) => {
  const customerId = req.user.id; 
  const { restaurantId, items } = req.body;

  try {
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

    const newOrder = await Order.create({
      customer: customerId,
      restaurant: restaurantId,
      items: orderItemsSnapshot,
      totalAmount: totalAmount,
      status: 'placed',
      paymentStatus: 'pending'
    });

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