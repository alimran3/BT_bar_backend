const Coupon = require('../models/Coupon');
const Restaurant = require('../models/Restaurant');

// @desc    Create coupon
// @route   POST /api/coupons
// @access  Private (Restaurant)
exports.createCoupon = async (req, res, next) => {
  try {
    const couponData = {
      ...req.body,
      restaurant: req.user.restaurant,
    };

    const coupon = await Coupon.create(couponData);

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      coupon,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private (Restaurant)
exports.getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({
      restaurant: req.user.restaurant,
    }).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: coupons.length,
      coupons,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get coupon by code
// @route   GET /api/coupons/:code
// @access  Private
exports.getCouponByCode = async (req, res, next) => {
  try {
    const coupon = await Coupon.findOne({
      code: req.params.code.toUpperCase(),
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    res.status(200).json({
      success: true,
      coupon,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update coupon
// @route   PUT /api/coupons/:id
// @access  Private (Restaurant)
exports.updateCoupon = async (req, res, next) => {
  try {
    let coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    // Check ownership
    if (coupon.restaurant.toString() !== req.user.restaurant.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      coupon,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private (Restaurant)
exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    // Check ownership
    if (coupon.restaurant.toString() !== req.user.restaurant.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    await coupon.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate coupon
// @route   POST /api/coupons/validate
// @access  Private
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount, restaurantId } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      restaurant: restaurantId,
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code',
      });
    }

    if (!coupon.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Coupon is expired or inactive',
      });
    }

    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is $${coupon.minOrderAmount}`,
      });
    }

    if (!coupon.canUserUse(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You have already used this coupon',
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    res.status(200).json({
      success: true,
      message: 'Coupon is valid',
      coupon: {
        code: coupon.code,
        discountAmount,
        finalAmount: orderAmount - discountAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};