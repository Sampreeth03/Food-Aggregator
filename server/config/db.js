const mongoose = require("mongoose");

const connectDB = () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("MONGO_URI is missing from .env");
    process.exit(1);
  }

  mongoose.connect(mongoUri)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => {
      console.error("MongoDB connection failed:", err.message);
      process.exit(1);
    });
};

module.exports = connectDB;