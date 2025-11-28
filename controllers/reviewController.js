const Review = require('../models/Review');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');

// @desc    Create review
// @route   POST /api/reviews
// @access  Private (Customers)
exports.createReview = async (req, res, next) => {
  try {
    const { restaurant, menuItem, order, rating, comment, ...otherData } = req.body;

    // Verify restaurant exists
    const restaurantDoc = await Restaurant.findById(restaurant);
    if (!restaurantDoc) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // If order provided, verify it exists and belongs to user
    if (order) {
      const orderDoc = await Order.findById(order);
      if (!orderDoc) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }

      if (orderDoc.customer.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized',
        });
      }

      if (orderDoc.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Can only review completed orders',
        });
      }

      // Check if already reviewed
      const existingReview = await Review.findOne({
        customer: req.user._id,
        order,
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'Order already reviewed',
        });
      }
    }

    const reviewData = {
      customer: req.user._id,
      restaurant,
      menuItem,
      order,
      rating,
      comment,
      ...otherData,
    };

    const review = await Review.create(reviewData);

    // Populate review
    await review.populate([
      { path: 'customer', select: 'fullName profileImage' },
      { path: 'restaurant', select: 'name' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get restaurant reviews
// @route   GET /api/reviews/restaurant/:restaurantId
// @access  Public
exports.getRestaurantReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, rating } = req.query;

    let query = { restaurant: req.params.restaurantId };

    if (rating) {
      query.rating = parseInt(rating);
    }

    const reviews = await Review.find(query)
      .populate('customer', 'fullName profileImage')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Review.countDocuments(query);

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get menu item reviews
// @route   GET /api/reviews/menu-item/:menuItemId
// @access  Public
exports.getMenuItemReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ menuItem: req.params.menuItemId })
      .populate('customer', 'fullName profileImage')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private (Customers)
exports.updateReview = async (req, res, next) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Check ownership
    if (review.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const { rating, comment, foodRating, serviceRating, ambianceRating } = req.body;

    review = await Review.findByIdAndUpdate(
      req.params.id,
      { rating, comment, foodRating, serviceRating, ambianceRating },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (Customers)
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Check ownership
    if (review.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Respond to review
// @route   POST /api/reviews/:id/respond
// @access  Private (Restaurant owners)
exports.respondToReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id).populate('restaurant');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Check ownership
    if (review.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    review.response = {
      comment: req.body.comment,
      respondedBy: req.user._id,
      respondedAt: new Date(),
    };

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Response added successfully',
      review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private (Customers)
exports.markHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    const userIndex = review.helpfulBy.indexOf(req.user._id);

    if (userIndex > -1) {
      // Remove helpful
      review.helpfulBy.splice(userIndex, 1);
      review.helpful -= 1;
    } else {
      // Add helpful
      review.helpfulBy.push(req.user._id);
      review.helpful += 1;
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: userIndex > -1 ? 'Removed from helpful' : 'Marked as helpful',
      review,
    });
  } catch (error) {
    next(error);
  }
};