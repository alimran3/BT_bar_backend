const Chat = require('../models/Chat');
const User = require('../models/User');

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