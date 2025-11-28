const express = require('express');
const router = express.Router();
const {
  getRestaurantAnalytics,
  getSalesReport,
  getCustomerAnalytics,
  getMenuAnalytics,
  exportReport,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and for restaurant owners only
router.use(protect);
router.use(authorize('restaurant'));

router.get('/restaurant/:restaurantId', getRestaurantAnalytics);
router.get('/restaurant/:restaurantId/sales', getSalesReport);
router.get('/restaurant/:restaurantId/customers', getCustomerAnalytics);
router.get('/restaurant/:restaurantId/menu', getMenuAnalytics);
router.get('/restaurant/:restaurantId/export', exportReport);

module.exports = router;