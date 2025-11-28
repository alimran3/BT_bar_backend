const { Expo } = require('expo-server-sdk');

const expo = new Expo();

// Send push notification
exports.sendPushNotification = async (pushToken, title, body, data = {}) => {
  try {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      return;
    }

    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
    };

    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];

    for (let chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }

    return tickets;
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

// Send multiple notifications
exports.sendBulkPushNotifications = async (messages) => {
  try {
    const validMessages = messages.filter((msg) =>
      Expo.isExpoPushToken(msg.to)
    );

    const chunks = expo.chunkPushNotifications(validMessages);
    const tickets = [];

    for (let chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending bulk notifications:', error);
      }
    }

    return tickets;
  } catch (error) {
    console.error('Error in bulk notifications:', error);
  }
};

// Send order update notification
exports.sendOrderUpdateNotification = async (user, orderNumber, status) => {
  if (!user.pushToken) return;

  const statusMessages = {
    received: 'Your order has been received',
    preparing: 'Your order is being prepared',
    ready: 'Your order is ready!',
    served: 'Your order has been served',
    completed: 'Your order is complete',
  };

  await this.sendPushNotification(
    user.pushToken,
    'Order Update',
    `${statusMessages[status]} - Order #${orderNumber}`,
    { type: 'order', orderNumber, status }
  );
};