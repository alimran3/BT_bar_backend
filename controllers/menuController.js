const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const { uploadToCloudinary } = require('../config/cloudinary');
const { generateQRCode } = require('../utils/qrGenerator');

// @desc    Get menu items for a restaurant
// @route   GET /api/menu/restaurant/:restaurantId
// @access  Public
exports.getMenuItems = async (req, res, next) => {
  try {
    const { category, search, available } = req.query;

    let query = { restaurant: req.params.restaurantId };

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

// @desc    Get menu item by ID
// @route   GET /api/menu/:id
// @access  Public
exports.getMenuItemById = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate(
      'restaurant',
      'name'
    );

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    res.status(200).json({
      success: true,
      menuItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create menu item
// @route   POST /api/menu/restaurant/:restaurantId
// @access  Private (Restaurant owners)
exports.createMenuItem = async (req, res, next) => {
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
        message: 'Not authorized to add menu items to this restaurant',
      });
    }

    const menuItemData = {
      ...req.body,
      restaurant: req.params.restaurantId,
    };

    const menuItem = await MenuItem.create(menuItemData);

    // Update restaurant hasVegetarianOptions if needed
    if (menuItem.isVegetarian && !restaurant.hasVegetarianOptions) {
      restaurant.hasVegetarianOptions = true;
      await restaurant.save();
    }

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      menuItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update menu item
// @route   PUT /api/menu/:id
// @access  Private (Restaurant owners)
exports.updateMenuItem = async (req, res, next) => {
  try {
    let menuItem = await MenuItem.findById(req.params.id).populate('restaurant');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    // Check ownership
    if (menuItem.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this menu item',
      });
    }

    menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      menuItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Private (Restaurant owners)
exports.deleteMenuItem = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('restaurant');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    // Check ownership
    if (menuItem.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this menu item',
      });
    }

    await menuItem.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload menu item image
// @route   POST /api/menu/:id/image
// @access  Private (Restaurant owners)
exports.uploadMenuItemImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image',
      });
    }

    const menuItem = await MenuItem.findById(req.params.id).populate('restaurant');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    // Check ownership
    if (menuItem.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Convert buffer to base64
    const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Upload to Cloudinary
    const result = await uploadToCloudinary(fileStr, 'restora/menu-items');

    // Update menu item image
    menuItem.image = result.url;
    await menuItem.save();

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: result.url,
      menuItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle menu item availability
// @route   PATCH /api/menu/:id/availability
// @access  Private (Restaurant owners)
exports.toggleAvailability = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('restaurant');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    // Check ownership
    if (menuItem.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    menuItem.isAvailable = !menuItem.isAvailable;
    await menuItem.save();

    res.status(200).json({
      success: true,
      message: `Menu item ${menuItem.isAvailable ? 'enabled' : 'disabled'}`,
      menuItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate QR code for menu item
// @route   GET /api/menu/:id/qr
// @access  Private (Restaurant owners)
exports.generateMenuItemQR = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('restaurant');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    // Check ownership
    if (menuItem.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Generate QR code data - URL to the menu item
    const qrData = `${process.env.FRONTEND_URL || 'exp://192.168.1.1:8081'}/menu/${menuItem._id}`;

    // Update menu item with QR code data (URL)
    menuItem.qrCode = qrData;
    await menuItem.save();

    res.status(200).json({
      success: true,
      message: 'QR code generated successfully',
      qrCode: qrData,
      menuItem,
    });
  } catch (error) {
    next(error);
  }
};
