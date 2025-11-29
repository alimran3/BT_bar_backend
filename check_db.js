const mongoose = require('mongoose');
require('dotenv').config();
const Restaurant = require('./models/Restaurant');
const MenuItem = require('./models/MenuItem');

const checkRestaurants = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const restaurants = await Restaurant.find({});
    console.log(`Total restaurants found: ${restaurants.length}`);

    for (const r of restaurants) {
      const menuCount = await MenuItem.countDocuments({ restaurant: r._id });
      console.log(`\n--------------------------------------------------`);
      console.log(`Restaurant: ${r.name}`);
      console.log(`ID: ${r._id}`);
      console.log(`QR Code: ${r.qrCode}`);
      console.log(`Menu Items: ${menuCount}`);
      
      if (menuCount > 0) {
        const items = await MenuItem.find({ restaurant: r._id }).limit(3);
        console.log('Sample Items:', items.map(i => i.name).join(', '));
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkRestaurants();
