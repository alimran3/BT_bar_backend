const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Review = require('../models/Review');
const User = require('../models/User');

// @desc    Get restaurant analytics
// @route   GET /api/analytics/restaurant/:restaurantId
// @access  Private (Restaurant)
exports.getRestaurantAnalytics = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const { period = 'month' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    // Get orders
    const orders = await Order.find({
      restaurant: req.params.restaurantId,
      createdAt: { $gte: startDate },
    });

    // Calculate metrics
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'completed');
    const totalRevenue = completedOrders.reduce(
      (sum, order) => sum + order.finalAmount,
      0
    );
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get unique customers
    const uniqueCustomers = [
      ...new Set(orders.map((o) => o.customer.toString())),
    ];

    // Order status breakdown
    const statusBreakdown = {
      pending: orders.filter((o) => o.status === 'pending').length,
      received: orders.filter((o) => o.status === 'received').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      ready: orders.filter((o) => o.status === 'ready').length,
      served: orders.filter((o) => o.status === 'served').length,
      completed: completedOrders.length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };

    // Revenue by day
    const revenueByDay = {};
    completedOrders.forEach((order) => {
      const day = new Date(order.createdAt).toLocaleDateString();
      revenueByDay[day] = (revenueByDay[day] || 0) + order.finalAmount;
    });

    // Get reviews
    const reviews = await Review.find({
      restaurant: req.params.restaurantId,
      createdAt: { $gte: startDate },
    });

    const analytics = {
      overview: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        totalCustomers: uniqueCustomers.length,
        averageRating: restaurant.averageRating,
        totalReviews: reviews.length,
      },
      orderMetrics: {
        statusBreakdown,
        completionRate:
          totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0,
        cancellationRate:
          totalOrders > 0
            ? (statusBreakdown.cancelled / totalOrders) * 100
            : 0,
      },
      revenue: {
        total: totalRevenue,
        byDay: revenueByDay,
        growth: 0, // Calculate growth compared to previous period
      },
      period,
      startDate,
      endDate: new Date(),
    };

    res.status(200).json({
      success: true,
      analytics,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales report
// @route   GET /api/analytics/restaurant/:restaurantId/sales
// @access  Private (Restaurant)
exports.getSalesReport = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const { startDate, endDate } = req.query;

    const orders = await Order.find({
      restaurant: req.params.restaurantId,
      status: 'completed',
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).populate('items.menuItem', 'name category');

    // Calculate sales by item
    const salesByItem = {};
    const salesByCategory = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const itemName = item.name;
        const category = item.menuItem?.category || 'Other';

        salesByItem[itemName] = salesByItem[itemName] || {
          quantity: 0,
          revenue: 0,
        };
        salesByItem[itemName].quantity += item.quantity;
        salesByItem[itemName].revenue += item.price * item.quantity;

        salesByCategory[category] = salesByCategory[category] || {
          quantity: 0,
          revenue: 0,
        };
        salesByCategory[category].quantity += item.quantity;
        salesByCategory[category].revenue += item.price * item.quantity;
      });
    });

    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.finalAmount,
      0
    );

    res.status(200).json({
      success: true,
      report: {
        totalOrders: orders.length,
        totalRevenue,
        salesByItem,
        salesByCategory,
        period: { startDate, endDate },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer analytics
// @route   GET /api/analytics/restaurant/:restaurantId/customers
// @access  Private (Restaurant)
exports.getCustomerAnalytics = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const orders = await Order.find({
      restaurant: req.params.restaurantId,
    }).populate('customer', 'fullName email');

    // Calculate customer metrics
    const customerData = {};

    orders.forEach((order) => {
      const customerId = order.customer._id.toString();

      if (!customerData[customerId]) {
        customerData[customerId] = {
          customer: order.customer,
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: null,
        };
      }

      customerData[customerId].totalOrders += 1;
      if (order.status === 'completed') {
        customerData[customerId].totalSpent += order.finalAmount;
      }

      if (
        !customerData[customerId].lastOrderDate ||
        order.createdAt > customerData[customerId].lastOrderDate
      ) {
        customerData[customerId].lastOrderDate = order.createdAt;
      }
    });

    const topCustomers = Object.values(customerData)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    res.status(200).json({
      success: true,
      analytics: {
        totalCustomers: Object.keys(customerData).length,
        topCustomers,
        newCustomersThisMonth: 0, // Calculate this
        returningCustomerRate: 0, // Calculate this
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get menu analytics
// @route   GET /api/analytics/restaurant/:restaurantId/menu
// @access  Private (Restaurant)
exports.getMenuAnalytics = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const menuItems = await MenuItem.find({
      restaurant: req.params.restaurantId,
    });

    const topSellers = menuItems
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 10);

    const lowPerformers = menuItems
      .filter((item) => item.isAvailable)
      .sort((a, b) => a.totalOrders - b.totalOrders)
      .slice(0, 10);

    res.status(200).json({
      success: true,
      analytics: {
        totalMenuItems: menuItems.length,
        activeItems: menuItems.filter((item) => item.isAvailable).length,
        topSellers,
        lowPerformers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export analytics report
// @route   GET /api/analytics/restaurant/:restaurantId/export
// @access  Private (Restaurant)
exports.exportReport = async (req, res, next) => {
  try {
    // Implement CSV/PDF export functionality
    res.status(200).json({
      success: true,
      message: 'Export functionality coming soon',
    });
  } catch (error) {
    next(error);
  }
};