const express = require('express');
const router = express.Router();
const {
  createCoupon,
  getAllCoupons,
  getCouponByCode,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/validate', protect, validateCoupon);

// Restaurant owner routes
router.post('/', protect, authorize('restaurant'), createCoupon);
router.get('/', protect, authorize('restaurant'), getAllCoupons);
router.get('/:code', protect, getCouponByCode);
router.put('/:id', protect, authorize('restaurant'), updateCoupon);
router.delete('/:id', protect, authorize('restaurant'), deleteCoupon);

module.exports = router;