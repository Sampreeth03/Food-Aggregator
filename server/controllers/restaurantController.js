const Restaurant = require('../models/Restaurant');

const getDefaultImageForCuisine = (cuisines = []) => {
  const cuisineStr = Array.isArray(cuisines) ? cuisines.join(' ').toLowerCase() : String(cuisines).toLowerCase();
  if (cuisineStr.includes('pizza') || cuisineStr.includes('italian')) return '/images/pizza_banner.png';
  if (cuisineStr.includes('biryani') || cuisineStr.includes('indian') || cuisineStr.includes('mughlai')) return '/images/biryani_banner.png';
  if (cuisineStr.includes('burger') || cuisineStr.includes('fast food') || cuisineStr.includes('american')) return '/images/burger_banner.png';
  if (cuisineStr.includes('asian') || cuisineStr.includes('chinese') || cuisineStr.includes('noodle')) return '/images/asian_banner.png';
  if (cuisineStr.includes('dessert') || cuisineStr.includes('bakery') || cuisineStr.includes('sweet')) return '/images/dessert_banner.png';
  return '/images/burger_banner.png';
};

// 1. Create a new restaurant business profile
exports.createRestaurant = async (req, res) => {
  const ownerId = req.user.id;
  const { name, cuisine, address, lng, lat, menu, openingTime, closingTime, image } = req.body;

  try {
    // Check if this owner already has a restaurant registered
    const existingRestaurant = await Restaurant.findOne({ owner: ownerId });
    if (existingRestaurant) {
      return res.status(400).json({ msg: 'This user account already owns a restaurant.' });
    }

    const cuisineArray = Array.isArray(cuisine) ? cuisine : String(cuisine || '').split(',').map(c => c.trim()).filter(Boolean);
    if (cuisineArray.length === 0) {
      return res.status(400).json({ msg: 'Please select at least one cuisine option.' });
    }

    const assignedImage = image || getDefaultImageForCuisine(cuisineArray);

    // Create and save the restaurant profile
    const newRestaurant = await Restaurant.create({
      owner: ownerId,
      name: name,
      cuisine: cuisineArray,
      address: address,
      image: assignedImage,
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      menu: menu,
      openingTime: openingTime || '09:00',
      closingTime: closingTime || '22:00'
    });

    res.status(201).json({
      msg: 'Restaurant business profile created and linked successfully.',
      restaurant: newRestaurant
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// 2. Simple fetch route for customers to browse restaurants
exports.getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    
    // Attach dynamic default images to restaurants if missing
    const enriched = restaurants.map(r => {
      const doc = r.toObject();
      if (!doc.image) {
        doc.image = getDefaultImageForCuisine(doc.cuisine);
      }
      return doc;
    });

    res.status(200).json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// 3. Get my own restaurant profile
exports.getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ msg: 'No restaurant profile found for this user account.' });
    }
    res.status(200).json(restaurant);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// 4. Update restaurant menu items (Live Menu Manager)
exports.updateRestaurantMenu = async (req, res) => {
  const { menu } = req.body;
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ msg: 'No restaurant profile found for this user account.' });
    }
    
    restaurant.menu = menu;
    await restaurant.save();
    
    res.status(200).json({
      msg: 'Menu items updated successfully.',
      restaurant
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// 5. Update restaurant operating hours
exports.updateOperatingHours = async (req, res) => {
  const { openingTime, closingTime } = req.body;
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ msg: 'No restaurant profile found for this user account.' });
    }
    
    if (openingTime) restaurant.openingTime = openingTime;
    if (closingTime) restaurant.closingTime = closingTime;
    await restaurant.save();
    
    res.status(200).json({
      msg: 'Operating hours updated successfully.',
      restaurant
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};