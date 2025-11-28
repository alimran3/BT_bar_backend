// Order Status Constants
exports.ORDER_STATUS = {
  PENDING: 'pending',
  RECEIVED: 'received',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// User Types
exports.USER_TYPES = {
  CUSTOMER: 'customer',
  RESTAURANT: 'restaurant',
};

// Reservation Status
exports.RESERVATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no-show',
};

// Table Status
exports.TABLE_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  MAINTENANCE: 'maintenance',
};

// Payment Methods
exports.PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  ONLINE: 'online',
};

// Payment Status
exports.PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

// Notification Types
exports.NOTIFICATION_TYPES = {
  ORDER: 'order',
  MESSAGE: 'message',
  REVIEW: 'review',
  PROMOTION: 'promotion',
  SYSTEM: 'system',
};

// Discount Types
exports.DISCOUNT_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
};

// Message Types
exports.MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
};

// File Upload Limits
exports.FILE_LIMITS = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGES_COUNT: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
};

// Rate Limiting
exports.RATE_LIMITS = {
  GENERAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000,
    MAX_REQUESTS: 5,
  },
  UPLOAD: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 20,
  },
};

// Email Templates
exports.EMAIL_SUBJECTS = {
  WELCOME: 'Welcome to Restora!',
  ORDER_CONFIRMATION: 'Order Confirmation - Restora',
  ORDER_UPDATE: 'Order Status Update - Restora',
  RESERVATION_CONFIRMATION: 'Reservation Confirmation - Restora',
  PASSWORD_RESET: 'Password Reset - Restora',
};

// Operating Hours
exports.DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// Analytics Periods
exports.ANALYTICS_PERIODS = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
};

// Cuisine Types
exports.CUISINE_TYPES = [
  'Italian',
  'Chinese',
  'Indian',
  'Mexican',
  'Japanese',
  'Thai',
  'American',
  'Mediterranean',
  'French',
  'Korean',
  'Vietnamese',
  'Middle Eastern',
  'Fusion',
  'Fast Food',
  'Cafe',
  'Bakery',
  'Desserts',
  'Vegan',
  'Vegetarian',
  'Seafood',
  'Steakhouse',
  'BBQ',
];

// Menu Categories
exports.MENU_CATEGORIES = [
  'Appetizers',
  'Main Course',
  'Desserts',
  'Beverages',
  'Salads',
  'Soups',
  'Sides',
  'Specials',
];

// Table Locations
exports.TABLE_LOCATIONS = {
  INDOOR: 'indoor',
  OUTDOOR: 'outdoor',
  PATIO: 'patio',
  BAR: 'bar',
};

// Success Messages
exports.SUCCESS_MESSAGES = {
  USER_CREATED: 'User registered successfully',
  USER_UPDATED: 'User updated successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  RESTAURANT_CREATED: 'Restaurant created successfully',
  RESTAURANT_UPDATED: 'Restaurant updated successfully',
  MENU_ITEM_CREATED: 'Menu item created successfully',
  MENU_ITEM_UPDATED: 'Menu item updated successfully',
  MENU_ITEM_DELETED: 'Menu item deleted successfully',
  ORDER_CREATED: 'Order placed successfully',
  ORDER_UPDATED: 'Order updated successfully',
  ORDER_CANCELLED: 'Order cancelled successfully',
  REVIEW_CREATED: 'Review submitted successfully',
  REVIEW_UPDATED: 'Review updated successfully',
  REVIEW_DELETED: 'Review deleted successfully',
  RESERVATION_CREATED: 'Reservation created successfully',
  RESERVATION_UPDATED: 'Reservation updated successfully',
  COUPON_CREATED: 'Coupon created successfully',
  TABLE_CREATED: 'Table created successfully',
};

// Error Messages
exports.ERROR_MESSAGES = {
  SERVER_ERROR: 'Internal server error',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Not authorized',
  VALIDATION_ERROR: 'Validation error',
  INVALID_CREDENTIALS: 'Invalid credentials',
  EMAIL_EXISTS: 'Email already exists',
  USER_NOT_FOUND: 'User not found',
  RESTAURANT_NOT_FOUND: 'Restaurant not found',
  ORDER_NOT_FOUND: 'Order not found',
  INVALID_TOKEN: 'Invalid or expired token',
  PERMISSION_DENIED: 'Permission denied',
};

// HTTP Status Codes
exports.STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  SERVER_ERROR: 500,
};

// Pagination Defaults
exports.PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// QR Code Settings
exports.QR_CODE_SETTINGS = {
  ERROR_CORRECTION_LEVEL: 'H',
  TYPE: 'png',
  QUALITY: 0.92,
  MARGIN: 1,
  WIDTH: 500,
  COLOR: {
    DARK: '#8B5CF6',
    LIGHT: '#FFFFFF',
  },
};

// Socket Events
exports.SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_RESTAURANT: 'join-restaurant',
  JOIN_ORDER: 'join-order',
  JOIN_USER: 'join-user',
  NEW_ORDER: 'new-order',
  ORDER_STATUS_UPDATED: 'order-status-updated',
  ORDER_CANCELLED: 'order-cancelled',
  NEW_MESSAGE: 'new-message',
  MESSAGE_READ: 'message-read',
};

// Regular Expressions
exports.REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[0-9]{10}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  URL: /^https?:\/\/.+/,
};

// Time Constants
exports.TIME = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
};

// Default Values
exports.DEFAULTS = {
  RESTAURANT_SEATING_CAPACITY: 50,
  RESTAURANT_PRICE_RANGE: 2,
  ORDER_PREPARATION_TIME: 30,
  REVIEW_MIN_LENGTH: 10,
  PROFILE_IMAGE_SIZE: 500,
  RESTAURANT_IMAGE_SIZE: 1000,
  MENU_ITEM_IMAGE_SIZE: 800,
};