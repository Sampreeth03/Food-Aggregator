const express = require('express');
const router = express.Router();
const { 
  createRestaurant, 
  getAllRestaurants, 
  getMyRestaurant,
  updateRestaurantMenu,
  updateOperatingHours
} = require('../controllers/restaurantController');
const { protect, authorize } = require('../middleware/authMiddleware');

// POST /api/restaurants -> To onboard a new restaurant
router.post('/', protect, authorize('restaurant'), createRestaurant);

// GET /api/restaurants -> For customers to get the list of all restaurants
router.get('/', protect, getAllRestaurants);

// GET /api/restaurants/my-restaurant -> For restaurant owners to view their own profile
router.get('/my-restaurant', protect, authorize('restaurant'), getMyRestaurant);

// PUT /api/restaurants/menu -> For restaurant owners to update their menu live
router.put('/menu', protect, authorize('restaurant'), updateRestaurantMenu);

// PUT /api/restaurants/operating-hours -> For restaurant owners to update operating hours
router.put('/operating-hours', protect, authorize('restaurant'), updateOperatingHours);

module.exports = router;