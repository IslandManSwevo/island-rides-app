import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notificationService } from '../services/notificationService';
import { Notification } from '../types';
import NotificationItem from './NotificationItem';

export const NotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    try {
      const subscription = notificationService.subscribe(setNotifications);
      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Failed to subscribe to notification service:', error);
    }
  }, []);

  return (
    <View
      style={[styles.container, { top: insets.top }]}
      accessible={true}
      accessibilityLiveRegion="polite"
    >
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={() => notificationService.dismiss(notification.id)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
    padding: 16,
  },
});

export default NotificationContainer;
