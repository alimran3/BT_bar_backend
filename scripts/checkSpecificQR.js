const mongoose = require('mongoose');
require('dotenv').config();

const Restaurant = require('../models/Restaurant');

const checkSpecificQR = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if there's a restaurant with the problematic ID
    const problematicId = '692a60cff9c33fefce8ad3d7';
    const restaurantById = await Restaurant.findById(problematicId);
    console.log(`Restaurant with ID ${problematicId}:`, restaurantById ? restaurantById.name : 'NOT FOUND');

    // Check if there's a restaurant with a QR code containing this ID
    const restaurantByQR = await Restaurant.findOne({ 
      qrCode: { $regex: problematicId } 
    });
    console.log(`Restaurant with QR containing ${problematicId}:`, restaurantByQR ? restaurantByQR.name : 'NOT FOUND');

    // Check all restaurants and their QR codes
    const restaurants = await Restaurant.find({});
    console.log('\nAll restaurants and their QR codes:');
    restaurants.forEach(restaurant => {
      console.log(`${restaurant.name} (${restaurant._id}): ${restaurant.qrCode}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkSpecificQR();