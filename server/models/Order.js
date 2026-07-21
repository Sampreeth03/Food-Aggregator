const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  // 1. Link to the Customer who placed the order (Points to Users collection)
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  // 2. Link to the Restaurant where the food was ordered from
  restaurant: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant', 
    required: true 
  },

  // 3. Link to the Rider who will deliver the food (Will be null until a rider accepts)
  rider: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null 
  },

  // 4. Physical street address snapshot for food delivery
  deliveryAddress: {
    type: String,
    required: true,
    default: ''
  },

  // 4. Array of items purchased (Takes a snapshot of data at the exact time of purchase)
  items: [{
    menuItemId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true } // Storing the price here protects against future price changes
  }],

  // 5. Total bill amount calculated by the backend
  totalAmount: { 
    type: Number, 
    required: true 
  },

  // 6. Tracking the physical status of the food delivery workflow
  status: { 
    type: String, 
    enum: ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'placed' 
  },

  // 7. Tracking the financial status of the order transaction
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'], 
    default: 'pending' 
  },

  // 8. Timestamps for the Advanced Dynamic ETA calculations
  estimatedDeliveryTime: {
    type: Date
  },
  
  // 9. Simple Secure Delivery Verification Code (OTP)
  deliveryOtp: {
    type: Number
  },
  
  // 10. Rider dispatch acceptance status and times
  riderStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  riderAssignedAt: {
    type: Date
  },
  rejectedRiders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true }); // Automatically creates 'createdAt' and 'updatedAt' fields

module.exports = mongoose.model('Order', OrderSchema);