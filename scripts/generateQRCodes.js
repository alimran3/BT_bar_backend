const mongoose = require('mongoose');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Restaurant = require('../models/Restaurant');

const generateQRCodes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    const restaurants = await Restaurant.find({});

    const qrCodesDir = path.join(__dirname, '../qr-codes');
    if (!fs.existsSync(qrCodesDir)) {
      fs.mkdirSync(qrCodesDir);
    }

    for (const restaurant of restaurants) {
      const qrCodePath = path.join(qrCodesDir, `${restaurant._id}.png`);

      await QRCode.toFile(qrCodePath, restaurant.qrCode, {
        errorCorrectionLevel: 'H',
        type: 'png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#8B5CF6',
          light: '#FFFFFF',
        },
        width: 500,
      });

      console.log(`✅ QR Code generated for ${restaurant.name}`);
    }

    console.log(`\n✅ All QR codes generated in ${qrCodesDir}`);
    process.exit(0);
  } catch (error) {
    console.error('Error generating QR codes:', error);
    process.exit(1);
  }
};

generateQRCodes();