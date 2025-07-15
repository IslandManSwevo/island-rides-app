import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { notificationService } from '../services/notificationService';
import { colors, typography, spacing, borderRadius } from '../styles/Theme';
import { RootStackParamList, ROUTES } from '../navigation/routes';

interface NotificationPreferences extends Record<string, boolean> {
  pushEnabled: boolean;
  bookingConfirmations: boolean;
  bookingReminders: boolean;
  reviewRequests: boolean;
  priceAlerts: boolean;
  newMessages: boolean;
  promotional: boolean;
}

type NotificationPreferencesScreenNavigationProp = StackNavigationProp<RootStackParamList, typeof ROUTES.NOTIFICATION_PREFERENCES>;

interface NotificationPreferencesScreenProps {
  navigation: NotificationPreferencesScreenNavigationProp;
}

// Type-safe icon mapping for notification preferences
const PREFERENCE_ICONS = {
  notifications: 'notifications' as const,
  checkmarkCircle: 'checkmark-circle' as const,
  time: 'time' as const,
  star: 'star' as const,
  trendingDown: 'trending-down' as const,
  chatbubble: 'chatbubble' as const,
  gift: 'gift' as const,
  informationCircle: 'information-circle' as const,
  send: 'send' as const,
} as const;

type PreferenceIconName = keyof typeof PREFERENCE_ICONS;

export const NotificationPreferencesScreen: React.FC<NotificationPreferencesScreenProps> = ({ navigation }) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    pushEnabled: true,
    bookingConfirmations: true,
    bookingReminders: true,
    reviewRequests: true,
    priceAlerts: true,
    newMessages: true,
    promotional: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const savePreferences = useCallback(async () => {
    try {
      setSaving(true);
      const success = await notificationService.updateNotificationPreferences(preferences);
      
      if (success) {
        setHasChanges(false);
        notificationService.success('Notification preferences saved!', {
          duration: 3000
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      notificationService.error('Failed to save preferences', {
        duration: 4000,
        action: {
          label: 'Retry',
          handler: () => savePreferences()
        }
      });
    } finally {
      setSaving(false);
    }
  }, [preferences]);

  useEffect(() => {
    fetchPreferences();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => hasChanges ? (
        <TouchableOpacity onPress={() => savePreferences()} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.saveButton}>Save</Text>
          )}
        </TouchableOpacity>
      ) : null,
    });
  }, [hasChanges, saving, navigation, savePreferences]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await notificationService.getNotificationPreferences();
      if (prefs) {
        setPreferences(prefs);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      notificationService.error('Failed to load notification preferences', {
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const requestPermissions = async () => {
    Alert.alert(
      'Enable Push Notifications',
      'To receive important updates about your bookings and messages, please enable push notifications.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enable',
          onPress: async () => {
            try {
              await notificationService.registerForPushNotifications();
              updatePreference('pushEnabled', true);
              notificationService.success('Push notifications enabled!', {
                duration: 3000
              });
            } catch (error) {
              console.error('Failed to enable push notifications:', error);
              notificationService.error('Failed to enable push notifications', {
                duration: 4000
              });
            }
          }
        }
      ]
    );
  };

  const renderPreferenceItem = (
    key: keyof NotificationPreferences,
    title: string,
    description: string,
    iconName: PreferenceIconName,
    important: boolean = false
  ) => {
    const isEnabled = preferences[key];
    const iconKey = PREFERENCE_ICONS[iconName];
    
    return (
      <View style={[styles.preferenceItem, important && styles.importantItem]}>
        <View style={styles.preferenceHeader}>
          <Ionicons 
            name={iconKey} 
            size={24} 
            color={isEnabled ? colors.primary : colors.lightGrey} 
            style={styles.preferenceIcon}
          />
          <View style={styles.preferenceContent}>
            <Text style={[styles.preferenceTitle, important && styles.importantTitle]}>
              {title}
            </Text>
            <Text style={styles.preferenceDescription}>
              {description}
            </Text>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={(value) => {
              if (key === 'pushEnabled' && value && !isEnabled) {
                requestPermissions();
              } else {
                updatePreference(key, value);
              }
            }}
            trackColor={{ false: colors.lightGrey, true: `${colors.primary}40` }}
            thumbColor={isEnabled ? colors.primary : colors.white}
            disabled={key !== 'pushEnabled' && !preferences.pushEnabled}
          />
        </View>
        {key !== 'pushEnabled' && !preferences.pushEnabled && (
          <View style={styles.disabledNotice}>
            <Ionicons name={PREFERENCE_ICONS.informationCircle} size={16} color={colors.warning} />
            <Text style={styles.disabledText}>
              Enable push notifications to use this feature
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading notification preferences...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Notification Preferences</Text>
        <Text style={styles.subtitle}>
          Control when and how you receive notifications
        </Text>
      </View>

      {renderSection(
        'Push Notifications',
        renderPreferenceItem(
          'pushEnabled',
          'Enable Push Notifications',
          'Receive notifications on your device when the app is closed',
          'notifications',
          true
        )
      )}

      {renderSection(
        'Booking Notifications',
        <>
          {renderPreferenceItem(
            'bookingConfirmations',
            'Booking Confirmations',
            'Get notified when your booking is confirmed or modified',
            'checkmarkCircle'
          )}
          {renderPreferenceItem(
            'bookingReminders',
            'Booking Reminders',
            'Receive reminders before your rental starts',
            'time'
          )}
          {renderPreferenceItem(
            'reviewRequests',
            'Review Requests',
            'Get notified to leave reviews after completed rentals',
            'star'
          )}
        </>
      )}

      {renderSection(
        'Updates & Alerts',
        <>
          {renderPreferenceItem(
            'priceAlerts',
            'Price Alerts',
            'Get notified when prices drop on your favorite vehicles',
            'trendingDown'
          )}
          {renderPreferenceItem(
            'newMessages',
            'New Messages',
            'Receive notifications for new chat messages',
            'chatbubble'
          )}
        </>
      )}

      {renderSection(
        'Marketing',
        renderPreferenceItem(
          'promotional',
          'Promotional Offers',
          'Receive notifications about special deals and offers',
          'gift'
        )
      )}

      <View style={styles.footer}>
        <View style={styles.infoBox}>
          <Ionicons name={PREFERENCE_ICONS.informationCircle} size={20} color={colors.info} />
          <Text style={styles.infoText}>
            You can change these settings at any time. Important booking and safety notifications will always be sent.
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => {
            notificationService.info('Test notification', {
              message: 'This is a test notification to check your settings!',
              duration: 4000
            });
          }}
        >
          <Ionicons name={PREFERENCE_ICONS.send} size={16} color={colors.primary} style={styles.buttonIcon} />
          <Text style={styles.testButtonText}>Send Test Notification</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    ...typography.heading1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.lightGrey,
    fontSize: 14,
  },
  saveButton: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.subheading,
    marginBottom: spacing.md,
    marginHorizontal: spacing.lg,
  },
  sectionContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  preferenceItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  importantItem: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  preferenceIcon: {
    marginRight: spacing.md,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceTitle: {
    ...typography.subheading,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  importantTitle: {
    color: colors.primary,
  },
  preferenceDescription: {
    ...typography.body,
    color: colors.lightGrey,
    fontSize: 14,
    lineHeight: 18,
  },
  disabledNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  disabledText: {
    ...typography.body,
    color: colors.warning,
    fontSize: 12,
    marginLeft: spacing.sm,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  infoText: {
    ...typography.body,
    color: colors.darkGrey,
    fontSize: 14,
    flex: 1,
    marginLeft: spacing.sm,
    lineHeight: 20,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  testButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
  },
  loadingText: {
    ...typography.body,
    color: colors.lightGrey,
    marginTop: spacing.md,
  },
});