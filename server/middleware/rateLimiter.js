// Simple in-memory rate limiter middleware for request rate-limiting
// Keeps track of requests using a Map structure. Safe for development/mockup environments.

const createRateLimiter = (options = {}) => {
  const cache = new Map(); // Stores key -> { count, resetTime }

  const windowMs = options.windowMs || 15 * 60 * 1000; // Time window (default 15 minutes)
  const maxAttempts = options.max || 5;              // Max requests per window
  const message = options.message || 'Too many attempts, please try again later.';
  
  // Custom key generator function (defaults to IP address)
  const keyGenerator = options.keyGenerator || ((req) => req.ip);

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Cleanup old expired cache items periodically to prevent memory leaks
    cache.forEach((value, k) => {
      if (now > value.resetTime) {
        cache.delete(k);
      }
    });

    let record = cache.get(key);

    if (!record) {
      // First request in the time window
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      cache.set(key, record);
      return next();
    }

    // Check if the current time has passed the reset window
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      cache.set(key, record);
      return next();
    }

    // Increment request count
    record.count += 1;
    cache.set(key, record);

    // Block request if count exceeds limit
    if (record.count > maxAttempts) {
      return res.status(429).json({ msg: message });
    }

    next();
  };
};

// 1. Rate limiter for logins (5 attempts per 15 minutes per IP/Email)
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again after 15 minutes.',
  keyGenerator: (req) => {
    const email = req.body && req.body.email ? req.body.email.toLowerCase().trim() : '';
    return `${req.ip}_${email}`;
  }
});

// 2. Rate limiter for registration (3 accounts per hour per IP)
const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many account registrations from this location. Please try again in an hour.'
});

// 3. Rate limiter for order placement (3 orders per 10 minutes per authenticated user)
const orderLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: 'Too many orders placed recently. Please wait 10 minutes before placing another order.',
  keyGenerator: (req) => {
    // Falls back to IP if req.user is not yet populated by protect middleware
    return req.user ? req.user.id : req.ip;
  }
});

module.exports = {
  loginLimiter,
  registerLimiter,
  orderLimiter
};
