const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
require('dotenv').config();

const crypto = require('crypto');
process.env.JWT_SECRET = crypto.randomBytes(64).toString('hex');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/restaurants', require('./routes/restaurantRoutes'));
app.use('/api/riders', require('./routes/riderRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/restaurant-orders', require('./routes/restaurantOrderRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/places', require('./routes/placesRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));