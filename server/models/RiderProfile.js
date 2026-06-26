const mongoose = require('mongoose');

const RiderProfileSchema = new mongoose.Schema({
  // Links the profile back to a secure account in the users collection
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true // A user can only have one rider profile
  },
  vehicleType: { 
    type: String, 
    enum: ['bike', 'scooter', 'cycle'], 
    required: true 
  },
  isOnline: { 
    type: Boolean, 
    default: true // Riders choose when to go online to accept orders
  },
  rating: { 
    type: Number, 
    default: 5.0 
  }
}, { timestamps: true });

module.exports = mongoose.model('RiderProfile', RiderProfileSchema);