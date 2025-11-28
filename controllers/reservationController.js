const Reservation = require('../models/Reservation');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

// @desc    Create reservation
// @route   POST /api/reservations
// @access  Private (Customer)
exports.createReservation = async (req, res, next) => {
  try {
    const reservationData = {
      ...req.body,
      customer: req.user._id,
      customerName: req.user.fullName,
      customerPhone: req.user.phone,
      customerEmail: req.user.email,
    };

    const reservation = await Reservation.create(reservationData);

    await reservation.populate([
      { path: 'customer', select: 'fullName email phone' },
      { path: 'restaurant', select: 'name address phone' },
    ]);

    // TODO: Send confirmation email/notification

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      reservation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer reservations
// @route   GET /api/reservations/customer
// @access  Private (Customer)
exports.getCustomerReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ customer: req.user._id })
      .populate('restaurant', 'name address phone images')
      .populate('assignedTable', 'tableNumber')
      .sort('-date');

    res.status(200).json({
      success: true,
      count: reservations.length,
      reservations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get restaurant reservations
// @route   GET /api/reservations/restaurant/:restaurantId
// @access  Private (Restaurant)
exports.getRestaurantReservations = async (req, res, next) => {
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

    const { date, status } = req.query;
    let query = { restaurant: req.params.restaurantId };

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    if (status) {
      query.status = status;
    }

    const reservations = await Reservation.find(query)
      .populate('customer', 'fullName email phone')
      .populate('assignedTable', 'tableNumber')
      .sort('date time');

    res.status(200).json({
      success: true,
      count: reservations.length,
      reservations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update reservation status
// @route   PUT /api/reservations/:id/status
// @access  Private (Restaurant)
exports.updateReservationStatus = async (req, res, next) => {
  try {
    const { status, assignedTable } = req.body;

    const reservation = await Reservation.findById(req.params.id).populate(
      'restaurant'
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found',
      });
    }

    // Check ownership
    if (
      reservation.restaurant.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    reservation.status = status;
    if (assignedTable) {
      reservation.assignedTable = assignedTable;
    }

    if (status === 'confirmed') {
      reservation.confirmedAt = new Date();
    }

    await reservation.save();

    // TODO: Send notification to customer

    res.status(200).json({
      success: true,
      message: 'Reservation status updated',
      reservation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel reservation
// @route   PUT /api/reservations/:id/cancel
// @access  Private (Customer)
exports.cancelReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found',
      });
    }

    // Check ownership
    if (reservation.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Reservation already cancelled',
      });
    }

    reservation.status = 'cancelled';
    reservation.cancelledAt = new Date();
    reservation.cancellationReason = req.body.reason;
    await reservation.save();

    res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully',
      reservation,
    });
  } catch (error) {
    next(error);
  }
};