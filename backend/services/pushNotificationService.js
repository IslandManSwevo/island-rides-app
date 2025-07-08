const { Expo } = require('expo-server-sdk');
const db = require('../db');

class PushNotificationService {
  constructor() {
    this.expo = new Expo();
  }

  async registerPushToken(userId, token, platform, deviceId) {
    try {
      if (!Expo.isExpoPushToken(token)) {
        throw new Error('Invalid push token');
      }

      await db.query(
        `INSERT INTO push_tokens (user_id, token, platform, device_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, token) 
         DO UPDATE SET last_used = NOW(), device_id = $4`,
        [userId, token, platform, deviceId]
      );

      return { success: true };
    } catch (error) {
      console.error('Error registering push token:', error);
      throw error;
    }
  }

  async getUserTokens(userId) {
    const result = await db.query(
      'SELECT token FROM push_tokens WHERE user_id = $1',
      [userId]
    );
    return result.rows.map(row => row.token);
  }

  async checkPreferences(userId, notificationType) {
    const result = await db.query(
      `SELECT * FROM notification_preferences WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      await db.query(
        'INSERT INTO notification_preferences (user_id) VALUES ($1)',
        [userId]
      );
      return true;
    }

    const prefs = result.rows[0];
    return prefs.push_enabled && prefs[notificationType] !== false;
  }

  async sendToUser(userId, notification) {
    try {
      const canSend = await this.checkPreferences(userId, notification.type);
      if (!canSend) return { sent: false, reason: 'User preferences' };

      const tokens = await this.getUserTokens(userId);
      if (tokens.length === 0) return { sent: false, reason: 'No tokens' };

      const messages = tokens.map(token => ({
        to: token,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        priority: notification.priority || 'default',
        badge: notification.badge
      }));

      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending notification chunk:', error);
        }
      }

      await this.saveNotificationHistory(userId, notification);
      this.handleReceipts(tickets);

      return { sent: true, tickets };
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  async saveNotificationHistory(userId, notification) {
    await db.query(
      `INSERT INTO notification_history (user_id, type, title, body, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, notification.type, notification.title, notification.body, notification.data || {}]
    );
  }

  async handleReceipts(tickets) {
    setTimeout(async () => {
      const receiptIds = tickets
        .filter(ticket => ticket.status === 'ok')
        .map(ticket => ticket.id);

      const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);

      for (const chunk of receiptIdChunks) {
        try {
          const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);
          
          for (const receiptId in receipts) {
            const receipt = receipts[receiptId];
            if (receipt.status === 'error') {
              console.error(`Error sending notification: ${receipt.message}`);
            }
          }
        } catch (error) {
          console.error('Error fetching receipts:', error);
        }
      }
    }, 30000);
  }

  async sendBookingConfirmation(booking) {
    const notification = {
      type: 'booking_confirmations',
      title: '✅ Booking Confirmed!',
      body: `Your ${booking.vehicle.make} ${booking.vehicle.model} rental is confirmed for ${new Date(booking.start_date).toLocaleDateString()}`,
      data: {
        type: 'booking',
        bookingId: booking.id,
        screen: 'BookingDetails'
      },
      priority: 'high'
    };

    return this.sendToUser(booking.user_id, notification);
  }

  async sendBookingReminder(booking) {
    const notification = {
      type: 'booking_reminders',
      title: '🚗 Rental Reminder',
      body: `Your ${booking.vehicle.make} ${booking.vehicle.model} rental starts tomorrow!`,
      data: {
        type: 'reminder',
        bookingId: booking.id,
        screen: 'BookingDetails'
      },
      priority: 'high'
    };

    return this.sendToUser(booking.user_id, notification);
  }

  async sendNewMessage(userId, message, senderName) {
    const notification = {
      type: 'new_messages',
      title: `💬 ${senderName}`,
      body: message.text.substring(0, 100),
      data: {
        type: 'message',
        conversationId: message.conversation_id,
        screen: 'Chat'
      },
      badge: 1
    };

    return this.sendToUser(userId, notification);
  }

  async sendPriceAlert(userId, vehicle, oldPrice, newPrice) {
    const notification = {
      type: 'price_alerts',
      title: '💰 Price Drop Alert!',
      body: `${vehicle.make} ${vehicle.model} is now $${newPrice}/day (was $${oldPrice})`,
      data: {
        type: 'price_alert',
        vehicleId: vehicle.id,
        screen: 'VehicleDetail'
      }
    };

    return this.sendToUser(userId, notification);
  }
}

module.exports = new PushNotificationService(); 