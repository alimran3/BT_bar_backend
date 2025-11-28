const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      minlength: [10, 'Comment must be at least 10 characters'],
    },
    images: [String],
    foodRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    serviceRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    ambianceRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    response: {
      comment: String,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      respondedAt: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    helpful: {
      type: Number,
      default: 0,
    },
    helpfulBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Ensure one review per customer per order
reviewSchema.index({ customer: 1, order: 1 }, { unique: true, sparse: true });

// Update restaurant average rating after saving review
reviewSchema.post('save', async function () {
  const Restaurant = mongoose.model('Restaurant');
  const reviews = await this.constructor.find({
    restaurant: this.restaurant,
  });

  const avgRating =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  await Restaurant.findByIdAndUpdate(this.restaurant, {
    averageRating: avgRating,
    totalReviews: reviews.length,
  });
});

module.exports = mongoose.model('Review', reviewSchema);