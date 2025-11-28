const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

// @desc    Search restaurants
// @route   GET /api/search/restaurants
// @access  Public
exports.searchRestaurants = async (req, res, next) => {
  try {
    const { q, cuisineType, priceRange, rating, lat, lng, distance = 10 } = req.query;

    let query = { isActive: true };

    // Text search
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { cuisineType: { $regex: q, $options: 'i' } },
      ];
    }

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

    let restaurants;

    // Geospatial search
    if (lat && lng) {
      restaurants = await Restaurant.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)],
            },
            $maxDistance: parseFloat(distance) * 1000, // Convert km to meters
          },
        },
      });
    } else {
      restaurants = await Restaurant.find(query).limit(50);
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

// @desc    Search menu items
// @route   GET /api/search/menu-items
// @access  Public
exports.searchMenuItems = async (req, res, next) => {
  try {
    const { q, category, vegetarian, restaurant } = req.query;

    let query = { isAvailable: true };

    // Text search
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by vegetarian
    if (vegetarian === 'true') {
      query.isVegetarian = true;
    }

    // Filter by restaurant
    if (restaurant) {
      query.restaurant = restaurant;
    }

    const menuItems = await MenuItem.find(query)
      .populate('restaurant', 'name images')
      .limit(50);

    res.status(200).json({
      success: true,
      count: menuItems.length,
      menuItems,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Global search
// @route   GET /api/search/global
// @access  Public
exports.globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    // Search restaurants
    const restaurants = await Restaurant.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { cuisineType: { $regex: q, $options: 'i' } },
      ],
    }).limit(10);

    // Search menu items
    const menuItems = await MenuItem.find({
      isAvailable: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ],
    })
      .populate('restaurant', 'name')
      .limit(10);

    res.status(200).json({
      success: true,
      results: {
        restaurants: {
          count: restaurants.length,
          data: restaurants,
        },
        menuItems: {
          count: menuItems.length,
          data: menuItems,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get search suggestions
// @route   GET /api/search/suggestions
// @access  Public
exports.getSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json({
        success: true,
        suggestions: [],
      });
    }

    // Get restaurant name suggestions
    const restaurantSuggestions = await Restaurant.distinct('name', {
      isActive: true,
      name: { $regex: q, $options: 'i' },
    }).limit(5);

    // Get cuisine type suggestions
    const cuisineSuggestions = await Restaurant.distinct('cuisineType', {
      isActive: true,
      cuisineType: { $regex: q, $options: 'i' },
    }).limit(5);

    const suggestions = [
      ...restaurantSuggestions.map((name) => ({ type: 'restaurant', value: name })),
      ...cuisineSuggestions.map((cuisine) => ({ type: 'cuisine', value: cuisine })),
    ];

    res.status(200).json({
      success: true,
      suggestions,
    });
  } catch (error) {
    next(error);
  }
};