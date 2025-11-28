const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    tableNumber: {
      type: String,
      required: [true, 'Table number is required'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: 1,
    },
    qrCode: {
      type: String,
      unique: true,
    },
    qrCodeImage: {
      type: String,
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'maintenance'],
      default: 'available',
    },
    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    location: {
      type: String,
      enum: ['indoor', 'outdoor', 'patio', 'bar'],
      default: 'indoor',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate QR code before saving
tableSchema.pre('save', async function (next) {
  if (!this.qrCode) {
    this.qrCode = `TABLE-${this.restaurant}-${this.tableNumber}-${Date.now()}`;
  }
  next();
});

// Index
tableSchema.index({ restaurant: 1, tableNumber: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);