import { Notification, NotificationType } from '../types';
import { BehaviorSubject } from 'rxjs';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiService } from './apiService';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Conditional imports to avoid Expo Go issues
let Notifications: any = null;
let Device: any = null;

if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
    
    // Configure notification handler only if not in Expo Go
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    console.warn('Notifications not available in Expo Go');
  }
}

class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  private defaultDuration = 5000;
  private notificationListener: any;
  private responseListener: any;

  get current() {
    return this.notifications.asObservable();
  }

  subscribe(callback: (notifications: Notification[]) => void) {
    return this.current.subscribe(callback);
  }

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

  dismiss(id: string) {
    const currentNotifications = this.notifications.value;
    this.notifications.next(
      currentNotifications.filter(notification => notification.id !== id)
    );
  }

  clear() {
    this.notifications.next([]);
  }

  async registerForPushNotifications() {
    try {
      // Check if we're in Expo Go
      const isExpoGo = Constants.appOwnership === 'expo';
      
      if (isExpoGo) {
        console.log('📱 Skipping push notification registration in Expo Go');
        return;
      }

      if (Platform.OS === 'web') {
        console.log('📱 Skipping push notification registration on web');
        return;
      }

      // Get permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        throw new Error('Permission not granted for push notifications');
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync();
      console.log('📱 Push token obtained:', tokenData.data);

      // Register token with backend
      await apiService.post('/api/notifications/register-token', {
        token: tokenData.data,
        platform: Platform.OS,
      });

      console.log('📱 Push token registered with backend');
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      throw error;
    }
  }

  setupNotificationListeners(navigation: any) {
    if (isExpoGo || !Notifications) {
      console.log('Notification listeners not available in Expo Go');
      return;
    }

    try {
      this.notificationListener = Notifications.addNotificationReceivedListener(
        (notification: any) => {
          console.log('Notification received:', notification);
          
          this.info(notification.request.content.title || '', {
            message: notification.request.content.body || '',
            duration: 5000
          });
        }
      );

      this.responseListener = Notifications.addNotificationResponseReceivedListener(
        (response: any) => {
          const data = response.notification.request.content.data;
          
          if (data?.screen) {
            switch (data.screen) {
              case 'BookingDetails':
                navigation.navigate('Profile');
                this.success('Booking details in your profile', {
                  duration: 3000
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
              default:
                if (data?.type === 'booking') {
                  navigation.navigate('Profile');
                }
                break;
            }
          }
        }
      );
    } catch (error) {
      console.warn('Failed to setup notification listeners:', error);
    }
  }

  removeListeners() {
    if (isExpoGo || !Notifications) return;
    
    try {
      if (this.notificationListener) {
        Notifications.removeNotificationSubscription(this.notificationListener);
      }
      if (this.responseListener) {
        Notifications.removeNotificationSubscription(this.responseListener);
      }
    } catch (error) {
      console.warn('Failed to remove notification listeners:', error);
    }
  }

  async scheduleLocalNotification(title: string, body: string, data: any, trigger: Date) {
    if (isExpoGo || !Notifications) {
      console.log('Local notifications not available in Expo Go');
      return;
    }

    try {
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
    } catch (error) {
      console.warn('Failed to schedule notification:', error);
    }
  }

  async cancelScheduledNotifications(identifier?: string) {
    if (isExpoGo || !Notifications) return;
    
    try {
      if (identifier) {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
    } catch (error) {
      console.warn('Failed to cancel notifications:', error);
    }
  }

  async getNotificationSettings() {
    if (isExpoGo || !Notifications) {
      return { status: 'undetermined' };
    }

    try {
      const settings = await Notifications.getPermissionsAsync();
      return settings;
    } catch (error) {
      console.warn('Failed to get notification settings:', error);
      return { status: 'undetermined' };
    }
  }

  async getNotificationPreferences() {
    try {
      const response: any = await apiService.get('/api/notifications/preferences');
      return response.preferences || {};
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return {};
    }
  }

  async updateNotificationPreferences(preferences: Record<string, boolean>) {
    try {
      await apiService.put('/api/notifications/preferences', { preferences });
      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
