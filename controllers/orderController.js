const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Create order
// @route   POST /api/orders
// @access  Private (Customers)
exports.createOrder = async (req, res, next) => {
  try {
    const { restaurant, items, totalAmount, ...otherData } = req.body;

    // Verify restaurant exists
    const restaurantDoc = await Restaurant.findById(restaurant);
    if (!restaurantDoc) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Verify all menu items exist
    const itemIds = items.map((item) => item.menuItem);
    const menuItems = await MenuItem.find({ _id: { $in: itemIds } });

    if (menuItems.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: 'Some menu items not found',
      });
    }

    // Calculate estimated time (max preparation time + buffer)
    const maxPrepTime = Math.max(...menuItems.map((item) => item.preparationTime));
    const estimatedTime = maxPrepTime + 5;

    // Calculate tax (10%)
    const taxAmount = totalAmount * 0.1;

    const orderData = {
      customer: req.user._id,
      restaurant,
      items,
      totalAmount,
      taxAmount,
      finalAmount: totalAmount + taxAmount,
      estimatedTime,
      ...otherData,
    };

    const order = await Order.create(orderData);

    // Populate order details
    await order.populate([
      { path: 'customer', select: 'fullName email phone' },
      { path: 'restaurant', select: 'name address phone' },
      { path: 'items.menuItem', select: 'name price' },
    ]);

    // Update restaurant total orders
    restaurantDoc.totalOrders += 1;
    await restaurantDoc.save();

    // Update menu items total orders
    await Promise.all(
      items.map((item) =>
        MenuItem.findByIdAndUpdate(item.menuItem, {
          $inc: { totalOrders: item.quantity },
        })
      )
    );

    // Emit socket event to restaurant
    const io = req.app.get('io');
    io.to(`restaurant-${restaurant}`).emit('new-order', order);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res, next) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID',
      });
    }

    const order = await Order.findById(req.params.id)
      .populate('customer', 'fullName email phone profileImage')
      .populate('restaurant', 'name address phone images')
      .populate('items.menuItem', 'name price image');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check authorization
    const isCustomer = order.customer._id.toString() === req.user._id.toString();
    const isRestaurantOwner =
      req.user.userType === 'restaurant' &&
      req.user.restaurant.toString() === order.restaurant._id.toString();

    if (!isCustomer && !isRestaurantOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order',
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer orders
// @route   GET /api/orders/customer
// @access  Private (Customers)
exports.getCustomerOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = { customer: req.user._id };

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('restaurant', 'name address phone images')
      .populate('items.menuItem', 'name price image')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get restaurant orders
// @route   GET /api/orders/restaurant/:restaurantId
// @access  Private (Restaurant owners)
exports.getRestaurantOrders = async (req, res, next) => {
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

    const { status, page = 1, limit = 20 } = req.query;

    let query = { restaurant: req.params.restaurantId };

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('customer', 'fullName email phone profileImage')
      .populate('items.menuItem', 'name price image')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Restaurant owners)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id).populate('restaurant');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check ownership
    if (order.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Validate status transition
    const allowedTransitions = {
      pending: ['received', 'cancelled'],
      received: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['served'],
      served: ['completed'],
    };

    if (
      !allowedTransitions[order.status] ||
      !allowedTransitions[order.status].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status transition',
      });
    }

    order.status = status;
    await order.save();

    // Emit socket event to customer
    const io = req.app.get('io');
    io.to(`order-${order._id}`).emit('order-status-updated', {
      orderId: order._id,
      status: order.status,
    });

    // TODO: Send push notification to customer

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private (Customers)
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check ownership
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Check if order can be cancelled
    if (!['pending', 'received'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage',
      });
    }

    order.status = 'cancelled';
    order.cancelledBy = req.user._id;
    order.cancellationReason = req.body.reason;
    await order.save();

    // Emit socket event to restaurant
    const io = req.app.get('io');
    io.to(`restaurant-${order.restaurant}`).emit('order-cancelled', {
      orderId: order._id,
    });

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rate order
// @route   POST /api/orders/:id/rate
// @access  Private (Customers)
exports.rateOrder = async (req, res, next) => {
  try {
    const { rating, review } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check ownership
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Check if order is completed
    if (order.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed orders',
      });
    }

    // Check if already rated
    if (order.rating) {
      return res.status(400).json({
        success: false,
        message: 'Order already rated',
      });
    }

    order.rating = rating;
    order.review = review;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order rated successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order stats
// @route   GET /api/orders/restaurant/:restaurantId/stats
// @access  Private (Restaurant owners)
exports.getOrderStats = async (req, res, next) => {
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

    const orders = await Order.find({ restaurant: req.params.restaurantId });

    const stats = {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      received: orders.filter((o) => o.status === 'received').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      ready: orders.filter((o) => o.status === 'ready').length,
      served: orders.filter((o) => o.status === 'served').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
      totalRevenue: orders
        .filter((o) => o.status === 'completed')
        .reduce((sum, order) => sum + order.finalAmount, 0),
    };

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};