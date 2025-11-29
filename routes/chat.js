const express = require('express');
const router = express.Router();
const {
  getChats,
  getChatById,
  sendMessage,
  markAsRead,
  createOrderChat,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

console.log('🔄 Chat routes loaded');

// Protected routes
router.get('/', protect, getChats);
console.log('🔄 Registered GET / route');
router.post('/order/:orderId', protect, createOrderChat);
console.log('🔄 Registered POST /order/:orderId route');
router.get('/:id', protect, getChatById);
console.log('🔄 Registered GET /:id route');
router.post('/:id/message', protect, sendMessage);
console.log('🔄 Registered POST /:id/message route');
router.put('/:id/read', protect, markAsRead);
console.log('🔄 Registered PUT /:id/read route');

module.exports = router;