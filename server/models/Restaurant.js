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
    menu: [
        {
            name: String,
            price: Number,
            isVeg: { type: Boolean, default: true },
            averagePrepTime: { type: Number, default: 15 }, // minutes
        },
    ],
    rating: { type: Number, default: 4.0 },
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

module.exports = mongoose.model("Restaurant", RestaurantSchema);
