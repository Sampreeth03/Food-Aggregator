const express = require('express');
const router = express.Router();
const { 
  createRiderProfile, 
  getRiderProfile, 
  toggleRiderOnline,
  updateRiderProfile
} = require('../controllers/riderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// POST /api/riders/profile -> Create a new rider profile
router.post('/profile', protect, authorize('rider'), createRiderProfile);

// GET /api/riders/profile -> Fetch rider profile
router.get('/profile', protect, authorize('rider'), getRiderProfile);

// PUT /api/riders/profile -> Update rider profile details
router.put('/profile', protect, authorize('rider'), updateRiderProfile);

// PUT /api/riders/profile/toggle-online -> Toggle online/offline status
router.put('/profile/toggle-online', protect, authorize('rider'), toggleRiderOnline);

module.exports = router;