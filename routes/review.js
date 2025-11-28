const express = require('express');
const router = express.Router();
const {
  createReview,
  getRestaurantReviews,
  getMenuItemReviews,
  updateReview,
  deleteReview,
  respondToReview,
  markHelpful,
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
const { validate, reviewValidation } = require('../utils/validators');

// Public routes
router.get('/restaurant/:restaurantId', getRestaurantReviews);
router.get('/menu-item/:menuItemId', getMenuItemReviews);

// Protected routes - Customers
router.post('/', protect, authorize('customer'), validate(reviewValidation), createReview);
router.put('/:id', protect, authorize('customer'), updateReview);
router.delete('/:id', protect, authorize('customer'), deleteReview);
router.post('/:id/helpful', protect, authorize('customer'), markHelpful);

// Protected routes - Restaurant owners
router.post('/:id/respond', protect, authorize('restaurant'), respondToReview);

module.exports = router;