const express = require('express');
const router = express.Router();
const {
  createReservation,
  getCustomerReservations,
  getRestaurantReservations,
  updateReservationStatus,
  cancelReservation,
} = require('../controllers/reservationController');
const { protect, authorize } = require('../middleware/auth');

// Customer routes
router.post('/', protect, authorize('customer'), createReservation);
router.get('/customer', protect, authorize('customer'), getCustomerReservations);
router.put('/:id/cancel', protect, authorize('customer'), cancelReservation);

// Restaurant routes
router.get(
  '/restaurant/:restaurantId',
  protect,
  authorize('restaurant'),
  getRestaurantReservations
);
router.put(
  '/:id/status',
  protect,
  authorize('restaurant'),
  updateReservationStatus
);

module.exports = router;