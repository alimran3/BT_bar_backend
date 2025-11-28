const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  getCustomerOrders,
  getRestaurantOrders,
  updateOrderStatus,
  cancelOrder,
  rateOrder,
  getOrderStats,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const { validate, orderValidation } = require('../utils/validators');

// Protected routes - Customers
router.post('/', protect, authorize('customer'), validate(orderValidation), createOrder);
router.get('/customer', protect, authorize('customer'), getCustomerOrders);
router.put('/:id/cancel', protect, authorize('customer'), cancelOrder);
router.post('/:id/rate', protect, authorize('customer'), rateOrder);

// Protected routes - Restaurant owners
router.get('/restaurant/:restaurantId', protect, authorize('restaurant'), getRestaurantOrders);
router.put('/:id/status', protect, authorize('restaurant'), updateOrderStatus);
router.get('/restaurant/:restaurantId/stats', protect, authorize('restaurant'), getOrderStats);

// Protected routes - Both
router.get('/:id', protect, getOrderById);

module.exports = router;