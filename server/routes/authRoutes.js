const express = require('express');
const router = express.Router();
const { register, login, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');

// POST /api/auth/register
router.post('/register', registerLimiter, register);

// POST /api/auth/login
router.post('/login', loginLimiter, login);

// PUT /api/auth/reset-password -> Protected password reset endpoint
router.put('/reset-password', protect, resetPassword);

// GET /api/auth/verify -> Verify token validity on startup
router.get('/verify', protect, (req, res) => {
  res.status(200).json({ valid: true, user: { id: req.user.id, role: req.user.role } });
});

module.exports = router;