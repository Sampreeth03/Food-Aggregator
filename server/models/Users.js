const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  name: 
  { type: String, 
    required: true 
  },
  email: 
  { type: String, 
    unique: true, 
    required: true 
   },
  password: 
  { type: String,
     required: true 
  },
  role: 
  { type: String,
    enum: ['customer', 'rider', 'restaurant', 'admin'],
     default: 'customer'
  },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number] } // [lng, lat]
  }
}, 
{ timestamps: true });
UserSchema.index({ location: "2dsphere" });
module.exports = mongoose.model('User', UserSchema);