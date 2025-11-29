const mongoose = require('mongoose');
const QRCode = require('qrcode');

const restaurantSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    cuisineType: {
      type: String,
      required: [true, 'Cuisine type is required'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
    },
    images: [
      {
        type: String,
      },
    ],
    priceRange: {
      type: Number,
      min: 1,
      max: 4,
      default: 2,
    },
    seatingCapacity: {
      type: Number,
      required: [true, 'Seating capacity is required'],
    },
    operatingHours: {
      Monday: {
        isOpen: { type: Boolean, default: true },
        open: { type: String, default: '09:00' },
        close: { type: String, default: '22:00' },
      },
      Tuesday: {
        isOpen: { type: Boolean, default: true },
        open: { type: String, default: '09:00' },
        close: { type: String, default: '22:00' },
      },
      Wednesday: {
        isOpen: { type: Boolean, default: true },
        open: { type: String, default: '09:00' },
        close: { type: String, default: '22:00' },
      },
      Thursday: {
        isOpen: { type: Boolean, default: true },
        open: { type: String, default: '09:00' },
        close: { type: String, default: '22:00' },
      },
      Friday: {
        isOpen: { type: Boolean, default: true },
        open: { type: String, default: '09:00' },
        close: { type: String, default: '23:00' },
      },
      Saturday: {
        isOpen: { type: Boolean, default: true },
        open: { type: String, default: '09:00' },
        close: { type: String, default: '23:00' },
      },
      Sunday: {
        isOpen: { type: Boolean, default: true },
        open: { type: String, default: '10:00' },
        close: { type: String, default: '22:00' },
      },
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    qrCode: {
      type: String,
      unique: true,
    },
    qrCodeImage: {
      type: String,
    },
    businessLicense: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    hasVegetarianOptions: {
      type: Boolean,
      default: false,
    },
    deliveryAvailable: {
      type: Boolean,
      default: false,
    },
    takeawayAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for geospatial queries
restaurantSchema.index({ location: '2dsphere' });

// Generate unique QR code after saving
restaurantSchema.post('save', async function(doc) {
  // Generate QR code only if it doesn't exist yet
  if (!doc.qrCode) {
    // Generate the QR code with the actual _id
    const qrCode = `RESTORA-${doc._id}-${Date.now()}`;
    try {
      const qrCodeImage = await QRCode.toDataURL(qrCode);
      // Update the document with the QR code
      await doc.constructor.findByIdAndUpdate(doc._id, { 
        qrCode: qrCode,
        qrCodeImage: qrCodeImage
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }
});

// Virtual for checking if restaurant is currently open
restaurantSchema.virtual('isOpen').get(function () {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const todayHours = this.operatingHours[day];
  if (!todayHours || !todayHours.isOpen) return false;

  const [openHour, openMin] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = todayHours.close.split(':').map(Number);

  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  return currentTime >= openTime && currentTime <= closeTime;
});

// Ensure virtuals are included in JSON
restaurantSchema.set('toJSON', { virtuals: true });
restaurantSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);