const Table = require('../models/Table');
const Restaurant = require('../models/Restaurant');
const QRCode = require('qrcode');

// @desc    Create table
// @route   POST /api/tables
// @access  Private (Restaurant)
exports.createTable = async (req, res, next) => {
  try {
    const tableData = {
      ...req.body,
      restaurant: req.user.restaurant,
    };

    const table = await Table.create(tableData);

    // Generate QR code image
    const qrCodeImage = await QRCode.toDataURL(table.qrCode);
    table.qrCodeImage = qrCodeImage;
    await table.save();

    res.status(201).json({
      success: true,
      message: 'Table created successfully',
      table,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tables for restaurant
// @route   GET /api/tables/restaurant/:restaurantId
// @access  Private (Restaurant)
exports.getAllTables = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Check ownership
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const tables = await Table.find({ restaurant: req.params.restaurantId })
      .populate('currentOrder')
      .sort('tableNumber');

    res.status(200).json({
      success: true,
      count: tables.length,
      tables,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get table by ID
// @route   GET /api/tables/:id
// @access  Private (Restaurant)
exports.getTableById = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id).populate('currentOrder');

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    res.status(200).json({
      success: true,
      table,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update table
// @route   PUT /api/tables/:id
// @access  Private (Restaurant)
exports.updateTable = async (req, res, next) => {
  try {
    let table = await Table.findById(req.params.id).populate('restaurant');

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    // Check ownership
    if (table.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    table = await Table.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Table updated successfully',
      table,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete table
// @route   DELETE /api/tables/:id
// @access  Private (Restaurant)
exports.deleteTable = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id).populate('restaurant');

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    // Check ownership
    if (table.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    await table.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Table deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get table by QR code
// @route   GET /api/tables/qr/:qrCode
// @access  Public
exports.getTableByQRCode = async (req, res, next) => {
  try {
    const table = await Table.findOne({ qrCode: req.params.qrCode })
      .populate('restaurant')
      .populate('currentOrder');

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Invalid table QR code',
      });
    }

    res.status(200).json({
      success: true,
      table,
    });
  } catch (error) {
    next(error);
  }
};