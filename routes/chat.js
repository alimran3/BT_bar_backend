const express = require('express');
const router = express.Router();
const {
  getChats,
  getChatById,
  sendMessage,
  markAsRead,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// Protected routes
router.get('/', protect, getChats);
router.get('/:id', protect, getChatById);
router.post('/:id/message', protect, sendMessage);
router.put('/:id/read', protect, markAsRead);

module.exports = router;