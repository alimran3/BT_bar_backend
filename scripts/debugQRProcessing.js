const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables first
const Restaurant = require('../models/Restaurant');

const debugQRProcessing = async () => {
  try {
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Loaded' : 'NOT FOUND');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Test the QR code lookup that's failing in the frontend
    const testQRCode = '692a60cff9c33fefce8ad3d7'; // The ID that's causing the 404
    
    console.log(`\n🔍 Testing QR code lookup for: ${testQRCode}`);
    
    // This simulates what happens in the getRestaurantByQRCode endpoint
    const restaurantByQR = await Restaurant.findOne({
      qrCode: testQRCode,
      isActive: true,
    });
    
    console.log(`Restaurant found by QR code: ${restaurantByQR ? restaurantByQR.name : 'NONE'}`);
    
    // Also test direct ID lookup (what happens in getRestaurantById)
    const restaurantById = await Restaurant.findById(testQRCode);
    console.log(`Restaurant found by ID: ${restaurantById ? restaurantById.name : 'NONE'}`);
    
    // Check if any restaurant has this as part of their QR code
    const restaurantPartialMatch = await Restaurant.findOne({
      qrCode: { $regex: testQRCode }
    });
    console.log(`Restaurant with partial QR code match: ${restaurantPartialMatch ? restaurantPartialMatch.name : 'NONE'}`);
    
    console.log('\n📋 All restaurants in database:');
    const allRestaurants = await Restaurant.find({});
    allRestaurants.forEach(rest => {
      console.log(`  - ${rest.name} (${rest._id})`);
      console.log(`    QR Code: ${rest.qrCode}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

debugQRProcessing();