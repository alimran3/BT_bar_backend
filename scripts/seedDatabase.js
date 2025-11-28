const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});

    console.log('Cleared existing data');

    // Create restaurant owner
    const restaurantOwner = await User.create({
      userType: 'restaurant',
      email: 'owner@restaurant.com',
      password: await bcrypt.hash('password123', 10),
      phone: '5551234567',
    });

    // Create restaurant
    const restaurant = await Restaurant.create({
      owner: restaurantOwner._id,
      name: 'The Gourmet Kitchen',
      description: 'Fine dining experience with exquisite cuisine',
      cuisineType: 'Italian',
      address: '123 Main Street, New York, NY 10001',
      location: {
        type: 'Point',
        coordinates: [-74.006, 40.7128],
      },
      phone: '5551234567',
      email: 'info@gourmetkitchen.com',
      seatingCapacity: 50,
      priceRange: 3,
      images: [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
      ],
    });

    // Update restaurant owner
    restaurantOwner.restaurant = restaurant._id;
    await restaurantOwner.save();

    // Create menu items
    const menuItems = [
      {
        restaurant: restaurant._id,
        name: 'Margherita Pizza',
        description: 'Classic Italian pizza with fresh mozzarella and basil',
        price: 15.99,
        category: 'Main Course',
        preparationTime: 20,
        isVegetarian: true,
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002',
      },
      {
        restaurant: restaurant._id,
        name: 'Spaghetti Carbonara',
        description: 'Creamy pasta with bacon and parmesan',
        price: 18.99,
        category: 'Main Course',
        preparationTime: 15,
        isVegetarian: false,
        image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3',
      },
      {
        restaurant: restaurant._id,
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with Caesar dressing',
        price: 12.99,
        category: 'Salads',
        preparationTime: 10,
        isVegetarian: true,
        image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1',
      },
      {
        restaurant: restaurant._id,
        name: 'Tiramisu',
        description: 'Classic Italian dessert with coffee and mascarpone',
        price: 8.99,
        category: 'Desserts',
        preparationTime: 5,
        isVegetarian: true,
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9',
      },
    ];

    await MenuItem.insertMany(menuItems);

    // Create customer
    const customer = await User.create({
      userType: 'customer',
      fullName: 'John Doe',
      email: 'customer@example.com',
      password: await bcrypt.hash('password123', 10),
      phone: '5559876543',
    });

    console.log('✅ Database seeded successfully!');
    console.log('\nTest Accounts:');
    console.log('Restaurant Owner:');
    console.log('  Email: owner@restaurant.com');
    console.log('  Password: password123');
    console.log('\nCustomer:');
    console.log('  Email: customer@example.com');
    console.log('  Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();