const express = require('express');
const router = express.Router();
const {
  createRestaurant,
  getAllRestaurants,
  getRestaurantById,
  getRestaurantByQRCode,
  updateRestaurant,
  deleteRestaurant,
  uploadRestaurantImages,
  uploadRestaurantProfileImage,
  toggleFavorite,
  getFavorites,
  getRestaurantAnalytics,
  updateOperatingHours,
  getRestaurantMenu,
} = require('../controllers/restaurantController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getAllRestaurants);
router.get('/qr/:qrCode', getRestaurantByQRCode);

// Protected routes - Customers
// NOTE: This must be defined BEFORE /:id routes to avoid "favorites" being interpreted as an ID
router.get('/favorites', protect, authorize('customer'), getFavorites);

router.get('/:id/menu', getRestaurantMenu);
router.get('/:id', getRestaurantById);

// Protected routes - Restaurant owners
router.post('/', protect, authorize('restaurant'), createRestaurant);
router.put('/:id', protect, authorize('restaurant'), updateRestaurant);
router.delete('/:id', protect, authorize('restaurant'), deleteRestaurant);
router.post(
  '/:id/images',
  protect,
  authorize('restaurant'),
  upload.array('images', 10),
  uploadRestaurantImages
);
router.post(
  '/:id/profile-image',
  protect,
  authorize('restaurant'),
  upload.single('image'),
  uploadRestaurantProfileImage
);
router.put('/:id/operating-hours', protect, authorize('restaurant'), updateOperatingHours);
router.get('/:id/analytics', protect, authorize('restaurant'), getRestaurantAnalytics);

// Protected routes - Customers
router.post('/:id/favorite', protect, authorize('customer'), toggleFavorite);

module.exports = router;