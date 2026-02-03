const express = require('express');
const { authController, loginSchema, registerSchema, refreshTokenSchema, changePasswordSchema, updateProfileSchema } = require('../controllers/authController');
const { validate } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public routes
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);

// Protected routes
router.use(authenticate);
router.post('/logout', authController.logout);
router.post('/change-password', validate(changePasswordSchema), authController.changePassword);
router.get('/me', authController.getProfile);
router.put('/profile', validate(updateProfileSchema), authController.updateProfile);

module.exports = router;
