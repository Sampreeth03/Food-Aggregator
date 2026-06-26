const CustomerProfile = require('../models/CustomerProfile');
const User = require('../models/Users');

// 1. Fetch the customer profile (automatically creates a blank profile if it doesn't exist yet)
exports.getCustomerProfile = async (req, res) => {
  try {
    let profile = await CustomerProfile.findOne({ user: req.user.id }).populate('user', 'name email location');
    
    if (!profile) {
      // Create a default empty profile for the customer
      profile = await CustomerProfile.create({
        user: req.user.id,
        phone: '',
        address: '',
        favoriteCuisines: []
      });
      // Populate the newly created profile's user reference
      profile = await profile.populate('user', 'name email location');
    }

    res.status(200).json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// 2. Update the customer profile details and sync user details
exports.updateCustomerProfile = async (req, res) => {
  const { name, phone, address, favoriteCuisines, lng, lat } = req.body;

  try {
    // Find customer profile (or create if not found)
    let profile = await CustomerProfile.findOne({ user: req.user.id });
    
    if (!profile) {
      profile = new CustomerProfile({ user: req.user.id });
    }

    profile.phone = phone !== undefined ? phone : profile.phone;
    profile.address = address !== undefined ? address : profile.address;
    profile.favoriteCuisines = favoriteCuisines !== undefined ? favoriteCuisines : profile.favoriteCuisines;
    await profile.save();

    // Sync changes to the User document (Name and Location Coordinates)
    const userDoc = await User.findById(req.user.id);
    if (userDoc) {
      if (name) userDoc.name = name;
      if (lng !== undefined && lat !== undefined) {
        userDoc.location = {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        };
      }
      await userDoc.save();
    }

    // Return the updated profile with populated user details
    const updatedProfile = await CustomerProfile.findOne({ user: req.user.id }).populate('user', 'name email location');
    res.status(200).json({
      msg: 'Profile updated successfully',
      profile: updatedProfile
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};
