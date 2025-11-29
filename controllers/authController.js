const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const { uploadToCloudinary } = require('../config/cloudinary');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { userType, email, password, phone, ...otherData } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Create user
    const userData = {
      userType,
      email,
      password,
      phone,
      ...otherData,
    };

    const user = await User.create(userData);

    // If restaurant owner, create restaurant
    if (userType === 'restaurant') {
      const restaurantData = {
        owner: user._id,
        name: req.body.restaurantName,
        description: req.body.description,
        cuisineType: req.body.cuisineType,
        address: req.body.address,
        location: {
          type: 'Point',
          coordinates: req.body.coordinates || [0, 0],
        },
        phone: phone,
        email: email,
        seatingCapacity: req.body.seatingCapacity,
        images: req.body.images || [],
        priceRange: req.body.priceRange || 2,
      };

      const restaurant = await Restaurant.create(restaurantData);
      user.restaurant = restaurant._id;
      await user.save();
    }

    // Generate token
    const token = user.generateAuthToken();

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt with email:', email);

    // Find user and include password
    const user = await User.findOne({ email })
      .select('+password')
      .populate('restaurant');
      
    console.log('User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('User data:', {
        id: user._id,
        userType: user.userType,
        hasRestaurant: !!user.restaurant,
        restaurantId: user.restaurant?._id
      });
    }

    if (!user) {
      console.log('Login failed: User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isPasswordMatch = await user.comparePassword(password);
    console.log('Password match:', isPasswordMatch);
    
    if (!isPasswordMatch) {
      console.log('Login failed: Invalid password');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('Login failed: Account deactivated');
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Generate token
    const token = user.generateAuthToken();
    console.log('Token generated successfully');

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    console.log('GetMe called with user ID:', req.user._id);
    const user = await User.findById(req.user._id).populate('restaurant');
    
    console.log('GetMe user data:', {
      id: user._id,
      userType: user.userType,
      hasRestaurant: !!user.restaurant,
      restaurantId: user.restaurant?._id,
      restaurantData: user.restaurant
    });
    
    // If user is a restaurant owner but doesn't have restaurant data, try to find it
    if (user.userType === 'restaurant' && !user.restaurant) {
      console.log('Restaurant owner missing restaurant data, searching for restaurant...');
      const restaurant = await Restaurant.findOne({ owner: user._id });
      if (restaurant) {
        console.log('Found restaurant for owner:', restaurant._id);
        user.restaurant = restaurant._id;
        await user.save();
        // Re-populate with the found restaurant
        await user.populate('restaurant');
      } else {
        console.log('No restaurant found for owner');
      }
    }
    
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('GetMe error:', error);
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'fullName',
      'phone',
      'addresses',
      'dietaryPreferences',
      'allergies',
      'profileImage',
    ];

    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload profile image
// @route   POST /api/auth/upload-profile-image
// @access  Private
exports.uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image',
      });
    }

    // Convert buffer to base64
    const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Upload to Cloudinary
    const result = await uploadToCloudinary(fileStr, 'restora/profiles');

    // Update user profile image
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: result.url },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      imageUrl: result.url,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save push token
// @route   POST /api/auth/push-token
// @access  Private
exports.savePushToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    await User.findByIdAndUpdate(req.user._id, { pushToken: token });

    res.status(200).json({
      success: true,
      message: 'Push token saved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set expire time (10 minutes)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    
    await user.save({ validateBeforeSave: false });
    
    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/auth/reset-password/${resetToken}`;
    
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;
    
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password reset token',
        text: message,
      });
      
      res.status(200).json({
        success: true,
        message: 'Email sent',
      });
    } catch (err) {
      console.log(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      
      await user.save({ validateBeforeSave: false });
      
      return res.status(500).json({
        success: false,
        message: 'Email could not be sent',
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};