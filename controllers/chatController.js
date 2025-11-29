const Chat = require('../models/Chat');
const User = require('../models/User');
const Order = require('../models/Order');
const mongoose = require('mongoose');

// @desc    Create a chat for an order
// @route   POST /api/chat/order/:orderId
// @access  Private (Restaurant owners and customers)
exports.createOrderChat = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    
    // Validate order ID format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }
    
    // Find the order
    const order = await Order.findById(orderId)
      .populate('customer', 'fullName')
      .populate('restaurant', 'name');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    
    // Check if user is either the customer or restaurant owner
    const isCustomer = req.user._id.toString() === order.customer._id.toString();
    
    // For restaurant owner check, we need to compare with the restaurant ID properly
    let isRestaurantOwner = false;
    if (req.user.userType === 'restaurant' && req.user.restaurant) {
      // Get the restaurant ID from the order (could be populated object or ObjectId)
      const orderRestaurantId = order.restaurant._id ? order.restaurant._id.toString() : order.restaurant.toString();
      // Get the restaurant ID from the user
      const userRestaurantId = req.user.restaurant.toString();
      
      isRestaurantOwner = userRestaurantId === orderRestaurantId;
    }
    
    if (!isCustomer && !isRestaurantOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create chat for this order',
      });
    }
    
    // Determine the other participant
    let otherParticipantId;
    if (isCustomer) {
      // Customer is creating chat, so restaurant owner is the other participant
      otherParticipantId = order.restaurant._id ? order.restaurant._id : order.restaurant;
    } else {
      // Restaurant owner is creating chat, so customer is the other participant
      otherParticipantId = order.customer._id;
    }
    
    // Check if chat already exists for this order
    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, otherParticipantId] }
    });
    
    if (chat) {
      // Chat already exists, return it
      try {
        await chat.populate('participants', 'fullName profileImage userType');
        await chat.populate('restaurant', 'name images');
        await chat.populate('messages.sender', 'fullName profileImage');
      } catch (populateError) {
        return res.status(500).json({
          success: false,
          message: 'Error populating chat data',
          error: populateError.message
        });
      }
      
      return res.status(200).json({
        success: true,
        chat,
      });
    }
    
    // Create new chat
    chat = new Chat({
      participants: [req.user._id, otherParticipantId],
      restaurant: order.restaurant._id ? order.restaurant._id : order.restaurant,
    });
    
    await chat.save();
    
    // Populate the chat
    try {
      await chat.populate('participants', 'fullName profileImage userType');
      await chat.populate('restaurant', 'name images');
      await chat.populate('messages.sender', 'fullName profileImage');
    } catch (populateError) {
      return res.status(500).json({
        success: false,
        message: 'Error populating new chat data',
        error: populateError.message
      });
    }
    
    res.status(201).json({
      success: true,
      chat,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user chats
// @route   GET /api/chat
// @access  Private
exports.getChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
    })
      .populate('participants', 'fullName profileImage userType')
      .populate('restaurant', 'name images')
      .sort('-lastMessageAt');

    res.status(200).json({
      success: true,
      count: chats.length,
      chats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get chat by ID
// @route   GET /api/chat/:id
// @access  Private
exports.getChatById = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('participants', 'fullName profileImage userType')
      .populate('restaurant', 'name images')
      .populate('messages.sender', 'fullName profileImage');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(
      (p) => p._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    res.status(200).json({
      success: true,
      chat,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send message
// @route   POST /api/chat/:id/message
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { message, messageType = 'text', fileUrl } = req.body;

    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const newMessage = {
      sender: req.user._id,
      message,
      messageType,
      fileUrl,
      createdAt: new Date(),
    };

    chat.messages.push(newMessage);
    chat.lastMessage = message;
    chat.lastMessageAt = new Date();

    // Update unread count for other participants
    chat.participants.forEach((participantId) => {
      if (participantId.toString() !== req.user._id.toString()) {
        const currentCount = chat.unreadCount.get(participantId.toString()) || 0;
        chat.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });

    await chat.save();

    // Emit socket event
    const io = req.app.get('io');
    chat.participants.forEach((participantId) => {
      if (participantId.toString() !== req.user._id.toString()) {
        io.to(`user-${participantId}`).emit('new-message', {
          chatId: chat._id,
          message: newMessage,
        });
      }
    });

    res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      chat,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark messages as read
// @route   PUT /api/chat/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Mark all messages as read for this user
    chat.messages.forEach((msg) => {
      if (
        msg.sender.toString() !== req.user._id.toString() &&
        !msg.isRead
      ) {
        msg.isRead = true;
        msg.readAt = new Date();
      }
    });

    // Reset unread count for this user
    chat.unreadCount.set(req.user._id.toString(), 0);

    await chat.save();

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      chat,
    });
  } catch (error) {
    next(error);
  }
};