const express = require('express');
const router = express.Router();
const { 
  getRestaurantOrders, 
  updateOrderStatus,
  getRestaurantOrderHistory
} = require('../controllers/restaurantOrderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// GET /api/restaurant-orders/active -> View live incoming active orders
router.get('/active', protect, authorize('restaurant'), getRestaurantOrders);

// GET /api/restaurant-orders/history -> View all restaurant order history (for earnings & analytics)
router.get('/history', protect, authorize('restaurant'), getRestaurantOrderHistory);

// PUT /api/restaurant-orders/:orderId/status -> Accept or change step of cooking
router.put('/:orderId/status', protect, authorize('restaurant'), updateOrderStatus);

module.exports = router;