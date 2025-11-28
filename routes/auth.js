const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  uploadProfileImage,
  savePushToken,
  forgotPassword,
  resetPassword,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');
const { validate, registerValidation, loginValidation } = require('../utils/validators');

// Public routes with rate limiting
router.post('/register', authLimiter, validate(registerValidation), register);
router.post('/login', authLimiter, validate(loginValidation), login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/upload-profile-image', protect, upload.single('image'), uploadProfileImage);
router.post('/push-token', protect, savePushToken);
router.put('/change-password', protect, changePassword);

module.exports = router;