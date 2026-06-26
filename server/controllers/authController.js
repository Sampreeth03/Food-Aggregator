const User = require('../models/Users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { name, email, password, role, lng, lat } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ msg: 'name, email, and password are required' });
  }

  try {
    // 1. Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // 2. Hash the password BEFORE creating the user document
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create and save the user in one single line using User.create()
    const newUser = await User.create({
      name: name,
      email: email,
      password: hashedPassword, // Passing the already hashed password here
      role: role,
      location: { 
        type: 'Point', 
        coordinates: [lng, lat] 
      }
    });

    // 4. Generate the JWT Token using the newly created user's ID
    const token = jwt.sign({ id: newUser._id ,role: newUser.role}, process.env.JWT_SECRET, { expiresIn: '1d' });

    // 5. Send the response back
    res.status(201).json({ 
      token: token, 
      user: { 
        id: newUser._id, 
        name: newUser.name, 
        role: newUser.role 
      } 
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};
exports.login = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ msg: 'email and password are required' });
  }

  try {
    // 1. Check if the user exists in the database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // 2. Compare the entered password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // 3. Generate the JWT Token using the user's ID and role
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 4. Send back the token and user details (including their role)
    res.status(200).json({
      token: token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// 3. Reset password (updates password, hashes it, and returns refreshed token)
exports.resetPassword = async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ msg: 'All password fields are required.' });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ msg: 'New passwords do not match.' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    // 1. Verify current password matches database hash
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Incorrect current password.' });
    }

    // 2. Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    // 3. Generate refreshed JWT Token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      msg: 'Password updated successfully',
      token: token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};