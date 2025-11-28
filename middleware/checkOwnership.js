const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');

// Check restaurant ownership
exports.checkRestaurantOwnership = async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId || req.params.id;
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this restaurant',
      });
    }

    req.restaurant = restaurant;
    next();
  } catch (error) {
    next(error);
  }
};

// Check menu item ownership
exports.checkMenuItemOwnership = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('restaurant');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    if (menuItem.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this menu item',
      });
    }

    req.menuItem = menuItem;
    next();
  } catch (error) {
    next(error);
  }
};

// Check order ownership (customer or restaurant)
exports.checkOrderAccess = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('restaurant');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const isCustomer = order.customer.toString() === req.user._id.toString();
    const isRestaurantOwner =
      req.user.userType === 'restaurant' &&
      order.restaurant.owner.toString() === req.user._id.toString();

    if (!isCustomer && !isRestaurantOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order',
      });
    }

    req.order = order;
    next();
  } catch (error) {
    next(error);
  }
};