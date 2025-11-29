const mongoose = require('mongoose');
require('dotenv').config();
const Restaurant = require('./models/Restaurant');
const User = require('./models/User');

const seedRestaurant = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find a user to be the owner
    let owner = await User.findOne({ role: 'restaurant_owner' });
    if (!owner) {
      owner = await User.findOne({});
    }
    
    if (!owner) {
      console.log('No users found. Creating a test user...');
      owner = await User.create({
        fullName: 'Test Owner',
        email: 'owner@test.com',
        password: 'password123',
        role: 'restaurant_owner',
        phone: '1234567890'
      });
      console.log('Created test user:', owner._id);
    }

    const targetId = '69291a19ce6dd73b6cec2234';
    
    // Check if restaurant already exists
    const existing = await Restaurant.findById(targetId);
    if (existing) {
      console.log('Restaurant already exists with this ID.');
      process.exit(0);
    }

    console.log(`Creating restaurant with ID: ${targetId}`);
    const restaurant = await Restaurant.create({
      _id: targetId,
      name: 'Restored Restaurant',
      description: 'This restaurant was restored to fix the QR code error.',
      cuisineType: 'Italian',
      address: '123 Test St',
      location: {
        type: 'Point',
        coordinates: [0, 0],
        address: '123 Test St'
      },
      phone: '123-456-7890',
      email: 'restored@restaurant.com',
      seatingCapacity: 50,
      owner: owner._id,
      isActive: true,
      rating: 4.5,
      priceRange: 2,
      operatingHours: {
        Monday: { isOpen: true, open: '09:00', close: '22:00' },
        Tuesday: { isOpen: true, open: '09:00', close: '22:00' },
        Wednesday: { isOpen: true, open: '09:00', close: '22:00' },
        Thursday: { isOpen: true, open: '09:00', close: '22:00' },
        Friday: { isOpen: true, open: '09:00', close: '23:00' },
        Saturday: { isOpen: true, open: '09:00', close: '23:00' },
        Sunday: { isOpen: true, open: '10:00', close: '22:00' }
      },
      qrCode: `RESTORA-${targetId}-${Date.now()}`
    });

    console.log('✅ Restaurant created successfully!');
    console.log(`ID: ${restaurant._id}`);
    console.log(`Name: ${restaurant.name}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedRestaurant();
