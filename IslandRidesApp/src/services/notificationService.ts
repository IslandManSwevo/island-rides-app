import { Notification, NotificationType } from '../types';
import { BehaviorSubject } from 'rxjs';
import { nanoid } from 'nanoid';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiService } from './apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  private defaultDuration = 5000; // 5 seconds
  private notificationListener: any;
  private responseListener: any;

  // Get current notifications
  get current() {
    return this.notifications.asObservable();
  }

  // Subscribe to notifications
  subscribe(callback: (notifications: Notification[]) => void) {
    return this.current.subscribe(callback);
  }

  // Show a notification
  show(notification: Omit<Notification, 'id'>) {
    const id = Date.now().toString();
    const newNotification: Notification = {
      id,
      duration: this.defaultDuration,
      closable: true,
      ...notification,
    };

    const currentNotifications = this.notifications.value;
    this.notifications.next([...currentNotifications, newNotification]);

    if (!newNotification.persistent && newNotification.duration) {
      setTimeout(() => {
        this.dismiss(id);
      }, newNotification.duration);
    }
  }

  // Helper methods for different notification types
  success(message: string, options: Partial<Notification> = {}) {
    this.show({ type: 'success', message, ...options });
  }

  error(message: string, options: Partial<Notification> = {}) {
    this.show({ type: 'error', message, ...options });
  }

  warning(message: string, options: Partial<Notification> = {}) {
    this.show({ type: 'warning', message, ...options });
  }

  info(message: string, options: Partial<Notification> = {}) {
    this.show({ type: 'info', message, ...options });
  }

  // Dismiss a specific notification
  dismiss(id: string) {
    const currentNotifications = this.notifications.value;
    this.notifications.next(
      currentNotifications.filter(notification => notification.id !== id)
    );
  }

  // Clear all notifications
  clear() {
    this.notifications.next([]);
  }

  async registerForPushNotifications() {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId
      });

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      await apiService.post('/notifications/register-token', {
        token: token.data,
        platform: Platform.OS,
        deviceId: Device.modelId
      });

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  setupNotificationListeners(navigation: any) {
    // Handle notifications received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('Notification received:', notification);
        
        // Show in-app notification
        this.info(notification.request.content.title || '', {
          message: notification.request.content.body || '',
          duration: 5000
        });
      }
    );

    // Handle notification clicks
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response: any) => {
        const data = response.notification.request.content.data;
        
        // Navigate based on notification type
        if (data?.screen) {
          switch (data.screen) {
            case 'BookingDetails':
              navigation.navigate('BookingDetails', { 
                bookingId: data.bookingId 
              });
              break;
            case 'Chat':
              navigation.navigate('Chat', { 
                conversationId: data.conversationId 
              });
              break;
            case 'VehicleDetail':
              navigation.navigate('VehicleDetail', { 
                vehicleId: data.vehicleId 
              });
              break;
            case 'WriteReview':
              navigation.navigate('WriteReview', { 
                bookingId: data.bookingId 
              });
              break;
          }
        }
      }
    );
  }

  removeListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // Schedule local notifications
  async scheduleLocalNotification(title: string, body: string, data: any, trigger: Date) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
      },
    });
  }

  // Cancel scheduled notifications
  async cancelScheduledNotifications(identifier?: string) {
    if (identifier) {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  }

  // Get notification settings
  async getNotificationSettings() {
    const settings = await Notifications.getPermissionsAsync();
    return settings;
  }

  // Get notification preferences from backend
  async getNotificationPreferences() {
    try {
      const response: any = await apiService.get('/notifications/preferences');
      return response.preferences;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences: Record<string, boolean>) {
    try {
      await apiService.put('/notifications/preferences', preferences);
      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
