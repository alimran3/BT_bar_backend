const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  uploadMenuItemImage,
  toggleAvailability,
  generateMenuItemQR,
} = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validate } = require('../middleware/validation');
const { menuItemValidation } = require('../utils/validators');

// Public routes
router.get('/restaurant/:restaurantId', getMenuItems);
router.get('/:id', getMenuItemById);

// Protected routes - Restaurant owners
router.post(
  '/restaurant/:restaurantId',
  protect,
  authorize('restaurant'),
  validate(menuItemValidation),
  createMenuItem
);
router.put(
  '/:id',
  protect,
  authorize('restaurant'),
  validate(menuItemValidation),
  updateMenuItem
);
router.delete('/:id', protect, authorize('restaurant'), deleteMenuItem);
router.post(
  '/:id/image',
  protect,
  authorize('restaurant'),
  upload.single('image'),
  uploadMenuItemImage
);
router.patch('/:id/availability', protect, authorize('restaurant'), toggleAvailability);
router.get('/:id/qr', protect, authorize('restaurant'), generateMenuItemQR);

module.exports = router;
