const jwt = require('jsonwebtoken');

// 1. Middleware to protect routes (Verify JWT)
const protect = (req, res, next) => {
  // Grab the Authorization header
  const authHeader = req.headers.authorization;

  // If header is missing or doesn't start with 'Bearer ', block access immediately
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'Not authorized, token missing' });
  }

  try {
    // Extract token string by splitting "Bearer <token>"
    const token = authHeader.split(' ')[1];

    // Decode and verify token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded data (id, role) directly to the request object
    req.user = decoded; 

    // Move to the controller
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Not authorized, token invalid' });
  }
};

// 2. Middleware to check specific user roles
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if the role attached by protect middleware is in the allowed list
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ msg: 'Access denied: Unauthorized role' });
    }
    next();
  };
};

module.exports = { protect, authorize };