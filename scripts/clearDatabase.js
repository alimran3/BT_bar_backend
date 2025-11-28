const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Chat = require('../models/Chat');
const Notification = require('../models/Notification');
const Coupon = require('../models/Coupon');
const Table = require('../models/Table');
const Reservation = require('../models/Reservation');

const clearDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Delete all data
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    await Order.deleteMany({});
    await Review.deleteMany({});
    await Chat.deleteMany({});
    await Notification.deleteMany({});
    await Coupon.deleteMany({});
    await Table.deleteMany({});
    await Reservation.deleteMany({});

    console.log('✅ Database cleared successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
};

clearDatabase();