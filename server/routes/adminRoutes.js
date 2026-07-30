const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Secure all endpoints to admin only
router.get('/stats', protect, authorize('admin'), adminController.getStats);
router.get('/customers', protect, authorize('admin'), adminController.getCustomers);
router.get('/restaurants', protect, authorize('admin'), adminController.getRestaurants);
router.get('/riders', protect, authorize('admin'), adminController.getRiders);
router.get('/orders', protect, authorize('admin'), adminController.getOrders);

module.exports = router;
