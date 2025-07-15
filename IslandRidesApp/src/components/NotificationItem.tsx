import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Notification } from '../types';
import { colors, borderRadius, elevationStyles } from '../styles/Theme';

interface NotificationItemProps {
  notification: Notification;
  onDismiss: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onDismiss,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(notification.duration || 5000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        onDismiss();
      }
    });

    return () => {
      animation.stop();
    };
  }, [notification.duration, onDismiss]);

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.info;
      default:
        return colors.info;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor() },
        { opacity: fadeAnim },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.message}>{notification.message}</Text>
      </View>
      {notification.closable && (
        <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 12,
    borderRadius: borderRadius.sm,
    ...elevationStyles[3],
  },
  content: {
    flex: 1,
  },
  message: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default NotificationItem;
