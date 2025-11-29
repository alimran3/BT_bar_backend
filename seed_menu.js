const mongoose = require('mongoose');
require('dotenv').config();
const MenuItem = require('./models/MenuItem');

const seedMenu = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const restaurantId = '69291a19ce6dd73b6cec2234';

    const menuItems = [
      {
        restaurant: restaurantId,
        name: 'Classic Bruschetta',
        description: 'Toasted bread topped with fresh tomatoes, basil, garlic, and olive oil.',
        price: 8.99,
        category: 'Appetizers',
        preparationTime: 10,
        isVegetarian: true,
        calories: 250,
        spicyLevel: 0,
        image: 'https://images.unsplash.com/photo-1572695157369-a0eac271ad61?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
      },
      {
        restaurant: restaurantId,
        name: 'Spaghetti Carbonara',
        description: 'Traditional Roman pasta with eggs, cheese, pancetta, and black pepper.',
        price: 16.50,
        category: 'Main Course',
        preparationTime: 20,
        calories: 850,
        spicyLevel: 1,
        image: 'https://images.unsplash.com/photo-1612874742237-98280d20748b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
      },
      {
        restaurant: restaurantId,
        name: 'Margherita Pizza',
        description: 'Classic pizza with tomato sauce, fresh mozzarella, and basil.',
        price: 14.00,
        category: 'Main Course',
        preparationTime: 25,
        isVegetarian: true,
        calories: 700,
        spicyLevel: 0,
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
      },
      {
        restaurant: restaurantId,
        name: 'Tiramisu',
        description: 'Coffee-flavoured Italian dessert. Ladyfingers dipped in coffee, layered with a whipped mixture of eggs, sugar, and mascarpone cheese, flavoured with cocoa.',
        price: 7.99,
        category: 'Desserts',
        preparationTime: 10,
        isVegetarian: true,
        calories: 450,
        spicyLevel: 0,
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
      },
      {
        restaurant: restaurantId,
        name: 'Italian Soda',
        description: 'Refreshing soda with choice of fruit syrup and cream.',
        price: 4.50,
        category: 'Beverages',
        preparationTime: 5,
        isVegetarian: true,
        isVegan: true,
        calories: 150,
        spicyLevel: 0,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
      }
    ];

    console.log(`Adding ${menuItems.length} menu items...`);
    await MenuItem.insertMany(menuItems);
    console.log('✅ Menu items added successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedMenu();
