const RiderProfile = require('../models/RiderProfile');
const User = require('../models/Users');

// 1. Configure or onboard new courier profile
exports.createRiderProfile = async (req, res) => {
  const { vehicleType } = req.body;

  try {
    // Check if profile already exists for this logged-in user
    const existingProfile = await RiderProfile.findOne({ user: req.user.id });
    if (existingProfile) {
      return res.status(400).json({ msg: 'Rider profile already exists for this user.' });
    }

    // Create the profile using req.user.id populated by our protect middleware
    const newProfile = await RiderProfile.create({
      user: req.user.id,
      vehicleType: vehicleType,
      isOnline: true // Default them to online when profile is built
    });

    const populatedProfile = await RiderProfile.findById(newProfile._id).populate('user', 'name email location');

    res.status(201).json({
      msg: 'Rider profile configured successfully',
      profile: populatedProfile
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// 2. Fetch the profile of the currently logged-in courier (with User data populated)
exports.getRiderProfile = async (req, res) => {
  try {
    const profile = await RiderProfile.findOne({ user: req.user.id }).populate('user', 'name email location');
    if (!profile) {
      return res.status(404).json({ msg: 'Rider profile not found' });
    }
    res.status(200).json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// 3. Toggle the online/offline status of the courier
exports.toggleRiderOnline = async (req, res) => {
  try {
    const profile = await RiderProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ msg: 'Rider profile not found' });
    }
    profile.isOnline = !profile.isOnline;
    await profile.save();
    
    const populatedProfile = await RiderProfile.findOne({ user: req.user.id }).populate('user', 'name email location');
    res.status(200).json({ msg: 'Rider online status updated', profile: populatedProfile });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// 4. Update courier profile details (vehicle type) and associated account info (name, email, location coordinates)
exports.updateRiderProfile = async (req, res) => {
  const { name, email, vehicleType, lng, lat } = req.body;

  try {
    const profile = await RiderProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ msg: 'Rider profile not found' });
    }

    // Update vehicle type
    if (vehicleType) {
      if (!['bike', 'scooter', 'cycle'].includes(vehicleType)) {
        return res.status(400).json({ msg: 'Invalid vehicle type choice.' });
      }
      profile.vehicleType = vehicleType;
      await profile.save();
    }

    // Update User account details
    const user = await User.findById(req.user.id);
    if (user) {
      if (name) user.name = name;
      
      if (email) {
        // Ensure email isn't in use by another user account
        const emailExists = await User.findOne({ email, _id: { $ne: req.user.id } });
        if (emailExists) {
          return res.status(400).json({ msg: 'Email is already associated with another account.' });
        }
        user.email = email;
      }

      if (lng !== undefined && lat !== undefined) {
        user.location = {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        };
      }
      await user.save();
    }

    const populatedProfile = await RiderProfile.findOne({ user: req.user.id }).populate('user', 'name email location');

    res.status(200).json({
      msg: 'Rider profile and account details updated successfully',
      profile: populatedProfile
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};