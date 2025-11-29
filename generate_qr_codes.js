const mongoose = require('mongoose');
require('dotenv').config();
const Restaurant = require('./models/Restaurant');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const generateQRCodes = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const restaurants = await Restaurant.find({});
    console.log(`\nFound ${restaurants.length} restaurants\n`);

    // Create qr_codes directory if it doesn't exist
    const qrDir = path.join(__dirname, 'qr_codes');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir);
    }

    for (const restaurant of restaurants) {
      const restaurantId = restaurant._id.toString();
      const fileName = `${restaurant.name.replace(/[^a-z0-9]/gi, '_')}_QR.png`;
      const filePath = path.join(qrDir, fileName);

      // Generate QR code with just the restaurant ID
      await QRCode.toFile(filePath, restaurantId, {
        width: 500,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ Restaurant: ${restaurant.name}`);
      console.log(`   ID: ${restaurantId}`);
      console.log(`   QR Code saved to: ${filePath}`);
      console.log(`   Scan this QR code to view this restaurant's menu!`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    console.log(`\n✅ All QR codes generated in: ${qrDir}`);
    console.log('\n📱 INSTRUCTIONS:');
    console.log('   1. Open the qr_codes folder');
    console.log('   2. Print or display the QR code for the restaurant you want');
    console.log('   3. Scan it with your app');
    console.log('   4. You will see ONLY that specific restaurant\'s menu items!\n');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

generateQRCodes();
