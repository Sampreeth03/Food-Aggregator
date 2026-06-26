const express = require('express');
const router = express.Router();
const { getCustomerProfile, updateCustomerProfile } = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/authMiddleware');

// GET /api/customers/profile -> Get customer profile details
router.get('/profile', protect, authorize('customer'), getCustomerProfile);

// PUT /api/customers/profile -> Edit/update customer profile details (syncs to User name/coords)
router.put('/profile', protect, authorize('customer'), updateCustomerProfile);

module.exports = router;
