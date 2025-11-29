const mongoose = require('mongoose');
const QRCode = require('qrcode');
require('dotenv').config();

const Restaurant = require('../models/Restaurant');

const fixQRCode = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find all restaurants
    const restaurants = await Restaurant.find({});
    console.log(`Found ${restaurants.length} restaurants`);

    for (const restaurant of restaurants) {
      console.log(`\nProcessing restaurant: ${restaurant.name} (${restaurant._id})`);
      
      // Check if QR code exists and is valid
      if (restaurant.qrCode) {
        console.log(`  Existing QR code: ${restaurant.qrCode}`);
        
        // Check if QR code contains the correct restaurant ID
        if (restaurant.qrCode.includes(restaurant._id.toString())) {
          console.log('  ✓ QR code is valid');
          continue;
        } else {
          console.log('  ✗ QR code is invalid, regenerating...');
        }
      } else {
        console.log('  ✗ No QR code found, generating...');
      }
      
      // Generate new QR code with correct ID
      const newQRCode = `RESTORA-${restaurant._id}-${Date.now()}`;
      try {
        const newQRCodeImage = await QRCode.toDataURL(newQRCode);
        
        // Update restaurant with new QR code
        await Restaurant.findByIdAndUpdate(restaurant._id, {
          qrCode: newQRCode,
          qrCodeImage: newQRCodeImage
        });
        
        console.log(`  ✓ Updated QR code: ${newQRCode}`);
      } catch (error) {
        console.error(`  ❌ Error generating QR code for ${restaurant.name}:`, error.message);
      }
    }

    console.log('\n✅ QR code fix process completed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixQRCode();