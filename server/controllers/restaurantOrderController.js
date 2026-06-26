const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const RiderProfile = require('../models/RiderProfile');
const User = require('../models/Users');
const { assignNextRider } = require('../utils/riderDispatcher');


// 1. Get all active orders for a specific restaurant owner
exports.getRestaurantOrders = async (req, res) => {
  try {
    // Find the restaurant owned by the currently logged-in user
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ msg: 'No restaurant profile found for this user account.' });
    }

    // Find all orders placed at this restaurant, sorted by newest first
    // Exclude 'delivered' or 'cancelled' orders to keep the dashboard focused on active tasks
    const activeOrders = await Order.find({
      restaurant: restaurant._id,
      status: { $nin: ['delivered', 'cancelled'] }
    }).sort({ createdAt: -1 });

    res.status(200).json(activeOrders);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};
// 2. Update the status of an order (Confirmed, Preparing, etc.)
exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ msg: 'Order not found' });

    const restaurant = await Restaurant.findById(order.restaurant);
    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    order.status = status;
    console.log("Status updated")
    // INTERCEPT ENGINE: If food is cooking, dispatch the closest rider!
    if (status === 'preparing') {
      await assignNextRider(order);
    }

    await order.save();
    res.status(200).json({
      msg: `Order updated to ${status} and optimized rider dispatch completed.`,
      order: order
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// 3. Get complete order history (active, cancelled, delivered) for a specific restaurant
exports.getRestaurantOrderHistory = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ msg: 'No restaurant profile found for this user account.' });
    }

    const orders = await Order.find({ restaurant: restaurant._id })
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};