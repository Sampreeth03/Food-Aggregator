const express = require('express');
const router = express.Router();
const placesController = require('../controllers/placesController');

// GET /api/places/autocomplete?input=...&sessionToken=...&lat=...&lng=...
router.get('/autocomplete', placesController.autocomplete);

// GET /api/places/details?place_id=...&sessionToken=...
router.get('/details', placesController.getPlaceDetails);

module.exports = router;
