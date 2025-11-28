const express = require('express');
const router = express.Router();
const {
  searchRestaurants,
  searchMenuItems,
  globalSearch,
  getSuggestions,
} = require('../controllers/searchController');

// Public routes
router.get('/restaurants', searchRestaurants);
router.get('/menu-items', searchMenuItems);
router.get('/global', globalSearch);
router.get('/suggestions', getSuggestions);

module.exports = router;