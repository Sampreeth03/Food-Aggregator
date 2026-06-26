const express = require('express');
const router = express.Router();
const { 
  placeOrder, 
  getCustomerOrders, 
  getOrderById, 
  getRiderOrders, 
  updateRiderOrderStatus,
  acceptDispatch,
  rejectDispatch
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { orderLimiter } = require('../middleware/rateLimiter');

// POST /api/orders -> Protected, rate-limited endpoint strictly for customers to place an order
router.post('/', protect, authorize('customer'), orderLimiter, placeOrder);

// GET /api/orders -> Get order history for the logged-in customer
router.get('/', protect, authorize('customer'), getCustomerOrders);

// GET /api/orders/rider -> Get active delivery jobs for the logged-in rider
router.get('/rider', protect, authorize('rider'), getRiderOrders);

// GET /api/orders/:orderId -> Get single order details (authorized for customer, restaurant owner, or rider)
router.get('/:orderId', protect, getOrderById);

// PUT /api/orders/:orderId/rider-status -> Update delivery status by rider
router.put('/:orderId/rider-status', protect, authorize('rider'), updateRiderOrderStatus);

// PUT /api/orders/:orderId/accept-dispatch -> Accept incoming delivery dispatch request
router.put('/:orderId/accept-dispatch', protect, authorize('rider'), acceptDispatch);

// PUT /api/orders/:orderId/reject-dispatch -> Reject incoming delivery dispatch request
router.put('/:orderId/reject-dispatch', protect, authorize('rider'), rejectDispatch);

module.exports = router;