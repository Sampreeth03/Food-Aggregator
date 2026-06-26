const mongoose = require('mongoose');

const CustomerProfileSchema = new mongoose.Schema({
  // Links the profile back to a secure account in the users collection
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true // A user can only have one customer profile
  },
  phone: { 
    type: String, 
    default: '' 
  },
  address: { 
    type: String, 
    default: '' 
  },
  favoriteCuisines: { 
    type: [String], 
    default: [] 
  }
}, { timestamps: true });

module.exports = mongoose.model('CustomerProfile', CustomerProfileSchema);
