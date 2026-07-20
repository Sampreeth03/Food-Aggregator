// In-memory rate limiter middleware using the Sliding Window Counter algorithm.
// Blends request counts from the previous and current fixed windows to prevent boundary burst attacks.

const createRateLimiter = (options = {}) => {
  // Map structure: key -> { currentWindowStart, currentCount, previousCount }
  const cache = new Map();

  const windowMs = options.windowMs || 15 * 60 * 1000; // Time window (default 15 minutes)
  const maxAttempts = options.max || 5;              // Max allowed requests per window
  const message = options.message || 'Too many attempts, please try again later.';
  
  // Custom key generator function (defaults to IP address)
  const keyGenerator = options.keyGenerator || ((req) => req.ip);

  // Periodic cleanup of stale cache entries to prevent memory leaks over long runtimes
  const CLEANUP_INTERVAL = Math.max(windowMs * 2, 60 * 1000);
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of cache.entries()) {
      // Remove entries with no activity for more than two full windows
      if (now - record.currentWindowStart > windowMs * 2) {
        cache.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);

  // Prevent cleanup timer from blocking process exit in node
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Calculate start timestamp of current fixed window
    const currentWindowStart = Math.floor(now / windowMs) * windowMs;

    let record = cache.get(key);

    if (!record) {
      // New key: initialize window counts
      record = {
        currentWindowStart,
        currentCount: 0,
        previousCount: 0
      };
      cache.set(key, record);
    } else if (record.currentWindowStart < currentWindowStart) {
      // Time moved into a new window: slide window forward
      const windowsPassed = Math.floor((currentWindowStart - record.currentWindowStart) / windowMs);

      if (windowsPassed === 1) {
        // Advanced by 1 window: current window becomes previous window
        record.previousCount = record.currentCount;
      } else {
        // Advanced by 2 or more windows: previous window is empty
        record.previousCount = 0;
      }

      record.currentCount = 0;
      record.currentWindowStart = currentWindowStart;
    }

    // Calculate how far into the current window we are
    const elapsedTime = now - currentWindowStart;

    // Weight of previous window decreases linearly as current window progresses
    const previousWeight = (windowMs - elapsedTime) / windowMs;

    // Estimated total requests in the sliding rolling frame
    const estimatedRequests = record.previousCount * previousWeight + record.currentCount;

    // If estimated requests reach or exceed max limit, reject request
    if (estimatedRequests >= maxAttempts) {
      return res.status(429).json({ msg: message });
    }

    // Allow request and increment current count
    record.currentCount += 1;
    cache.set(key, record);

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
  createRateLimiter,
  loginLimiter,
  registerLimiter,
  orderLimiter
};
