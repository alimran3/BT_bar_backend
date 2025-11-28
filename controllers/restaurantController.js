const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const { uploadToCloudinary } = require('../config/cloudinary');

// @desc    Create restaurant
// @route   POST /api/restaurants
// @access  Private (Restaurant owners)
exports.createRestaurant = async (req, res, next) => {
  try {
    const restaurantData = {
      ...req.body,
      owner: req.user._id,
    };

    const restaurant = await Restaurant.create(restaurantData);

    // Update user with restaurant reference
    await User.findByIdAndUpdate(req.user._id, { restaurant: restaurant._id });

    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
exports.getAllRestaurants = async (req, res, next) => {
  try {
    const {
      cuisineType,
      priceRange,
      rating,
      search,
      lat,
      lng,
      maxDistance = 10000,
    } = req.query;

    let query = { isActive: true };

    // Filter by cuisine type
    if (cuisineType) {
      query.cuisineType = cuisineType;
    }

    // Filter by price range
    if (priceRange) {
      query.priceRange = parseInt(priceRange);
    }

    // Filter by rating
    if (rating) {
      query.averageRating = { $gte: parseFloat(rating) };
    }

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    let restaurants;

    // Geospatial query if coordinates provided
    if (lat && lng) {
      restaurants = await Restaurant.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)],
            },
            $maxDistance: parseInt(maxDistance),
          },
        },
      }).populate('owner', 'fullName email');
    } else {
      restaurants = await Restaurant.find(query)
        .populate('owner', 'fullName email')
        .sort('-createdAt');
    }

    res.status(200).json({
      success: true,
      count: restaurants.length,
      restaurants,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get restaurant by ID
// @route   GET /api/restaurants/:id
// @access  Public
exports.getRestaurantById = async (req, res, next) => {
  try {
    console.log('🔍 Backend: Searching for restaurant with ID:', req.params.id);
    
    // Validate ObjectId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('❌ Backend: Invalid ObjectId format:', req.params.id);
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    const restaurant = await Restaurant.findById(req.params.id).populate(
      'owner',
      'fullName email phone'
    );

    if (!restaurant) {
      console.log('❌ Backend: Restaurant not found with ID:', req.params.id);
      // Let's also check how many restaurants exist
      const totalRestaurants = await Restaurant.countDocuments();
      console.log('📊 Backend: Total restaurants in database:', totalRestaurants);
      
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    console.log('✅ Backend: Found restaurant:', restaurant.name);
    res.status(200).json({
      success: true,
      restaurant,
    });
  } catch (error) {
    console.error('❌ Backend Error in getRestaurantById:', error);
    next(error);
  }
};

// @desc    Get restaurant by QR code
// @route   GET /api/restaurants/qr/:qrCode
// @access  Public
exports.getRestaurantByQRCode = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({
      qrCode: req.params.qrCode,
      isActive: true,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Invalid QR code',
      });
    }

    res.status(200).json({
      success: true,
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private (Restaurant owners)
exports.updateRestaurant = async (req, res, next) => {
  try {
    let restaurant = await Restaurant.findById(req.params.id);

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
        message: 'Not authorized to update this restaurant',
      });
    }

    restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Restaurant updated successfully',
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete restaurant
// @route   DELETE /api/restaurants/:id
// @access  Private (Restaurant owners)
exports.deleteRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

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
        message: 'Not authorized to delete this restaurant',
      });
    }

    // Soft delete
    restaurant.isActive = false;
    await restaurant.save();

    res.status(200).json({
      success: true,
      message: 'Restaurant deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload restaurant images
// @route   POST /api/restaurants/:id/images
// @access  Private (Restaurant owners)
exports.uploadRestaurantImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image',
      });
    }

    const restaurant = await Restaurant.findById(req.params.id);

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

    // Upload images to Cloudinary
    const uploadPromises = req.files.map(async (file) => {
      const fileStr = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      const result = await uploadToCloudinary(fileStr, 'restora/restaurants');
      return result.url;
    });

    const imageUrls = await Promise.all(uploadPromises);

    // Add images to restaurant
    restaurant.images = [...restaurant.images, ...imageUrls];
    await restaurant.save();

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      images: imageUrls,
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle favorite restaurant
// @route   POST /api/restaurants/:id/favorite
// @access  Private (Customers)
exports.toggleFavorite = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const restaurantId = req.params.id;

    const index = user.favoriteRestaurants.indexOf(restaurantId);

    if (index > -1) {
      // Remove from favorites
      user.favoriteRestaurants.splice(index, 1);
    } else {
      // Add to favorites
      user.favoriteRestaurants.push(restaurantId);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message:
        index > -1
          ? 'Removed from favorites'
          : 'Added to favorites',
      favorites: user.favoriteRestaurants,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get favorite restaurants
// @route   GET /api/restaurants/favorites
// @access  Private (Customers)
exports.getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('favoriteRestaurants');

    res.status(200).json({
      success: true,
      count: user.favoriteRestaurants.length,
      favorites: user.favoriteRestaurants,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get restaurant analytics
// @route   GET /api/restaurants/:id/analytics
// @access  Private (Restaurant owners)
exports.getRestaurantAnalytics = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

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

    const { period = 'week' } = req.query;

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
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    // Get orders
    const orders = await Order.find({
      restaurant: req.params.id,
      createdAt: { $gte: startDate },
    });

    // Calculate analytics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.finalAmount, 0);
    const completedOrders = orders.filter((o) => o.status === 'completed').length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(
      (o) => new Date(o.createdAt) >= todayStart
    ).length;

    const todayRevenue = orders
      .filter((o) => new Date(o.createdAt) >= todayStart)
      .reduce((sum, order) => sum + order.finalAmount, 0);

    // Get unique customers
    const uniqueCustomers = [...new Set(orders.map((o) => o.customer.toString()))];

    res.status(200).json({
      success: true,
      analytics: {
        totalOrders,
        totalRevenue,
        completedOrders,
        averageOrderValue,
        todayOrders,
        todayRevenue,
        totalCustomers: uniqueCustomers.length,
        averageRating: restaurant.averageRating,
        totalReviews: restaurant.totalReviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update operating hours
// @route   PUT /api/restaurants/:id/operating-hours
// @access  Private (Restaurant owners)
exports.updateOperatingHours = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

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

    restaurant.operatingHours = req.body.operatingHours;
    await restaurant.save();

    res.status(200).json({
      success: true,
      message: 'Operating hours updated successfully',
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get restaurant menu
// @route   GET /api/restaurants/:id/menu
// @access  Public
exports.getRestaurantMenu = async (req, res, next) => {
  try {
    const { category, search, available } = req.query;

    let query = { restaurant: req.params.id };

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by availability
    if (available !== undefined) {
      query.isAvailable = available === 'true';
    }

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const menuItems = await MenuItem.find(query).sort('category name');

    res.status(200).json({
      success: true,
      count: menuItems.length,
      menuItems,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add menu item
// @route   POST /api/restaurants/:id/menu
// @access  Private (Restaurant owners)
exports.addMenuItem = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Ownership check is handled by middleware

    let imageUrl = null;
    if (req.body.image) {
      // Upload image to Cloudinary
      const result = await uploadToCloudinary(req.body.image, 'restora/menu-items');
      imageUrl = result.url;
    }

    const menuItemData = {
      ...req.body,
      restaurant: req.params.id,
      image: imageUrl,
    };

    const menuItem = await MenuItem.create(menuItemData);

    res.status(201).json({
      success: true,
      message: 'Menu item added successfully',
      menuItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update menu item
// @route   PUT /api/restaurants/:id/menu/:itemId
// @access  Private (Restaurant owners)
exports.updateMenuItem = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.itemId);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    // Ownership check is handled by middleware

    let imageUrl = menuItem.image;
    if (req.body.image && req.body.image !== menuItem.image) {
      // Upload new image to Cloudinary
      const result = await uploadToCloudinary(req.body.image, 'restora/menu-items');
      imageUrl = result.url;
    }

    const updatedMenuItem = await MenuItem.findByIdAndUpdate(
      req.params.itemId,
      { ...req.body, image: imageUrl },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      menuItem: updatedMenuItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete menu item
// @route   DELETE /api/restaurants/:id/menu/:itemId
// @access  Private (Restaurant owners)
exports.deleteMenuItem = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.itemId);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    // Ownership check is handled by middleware

    await MenuItem.findByIdAndDelete(req.params.itemId);

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
