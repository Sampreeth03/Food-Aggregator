const mongoose = require("mongoose");

const RestaurantSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    cuisine: [String],
    address: String,
    location: {
        type: { type: String, default: "Point" },
        coordinates: { type: [Number], index: '2dsphere' }, // [longitude, latitude]
    },
    image: { type: String, default: '' },
    priceForTwo: { type: Number, default: 350 },
    deliveryTime: { type: String, default: '25-30 mins' },
    distance: { type: String, default: '2.5 km' },
    menu: [
        {
            name: String,
            price: Number,
            image: { type: String, default: '' },
            isVeg: { type: Boolean, default: true },
            averagePrepTime: { type: Number, default: 15 }, // minutes
        },
    ],
    rating: { type: Number, default: 4.2 },
    // Opening and closing times in "HH:MM" 24-hour format (e.g., "09:00", "22:00")
    openingTime: { 
        type: String, 
        default: "09:00" 
    },
    closingTime: { 
        type: String, 
        default: "22:00" 
    }
});

const ALLOWED_CUISINES = [
  'North Indian',
  'South Indian',
  'Biryani',
  'Pizza',
  'Burgers',
  'Chinese',
  'Asian',
  'Fast Food',
  'Desserts',
  'Beverages',
  'Italian',
  'Healthy Food'
];

const RestaurantModel = mongoose.model("Restaurant", RestaurantSchema);
RestaurantModel.ALLOWED_CUISINES = ALLOWED_CUISINES;

module.exports = RestaurantModel;
