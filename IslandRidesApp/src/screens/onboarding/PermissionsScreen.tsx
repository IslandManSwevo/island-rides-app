import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { StandardButton } from '../../components/templates/StandardButton';
import { colors, spacing } from '../../styles/theme';
import { ROUTES } from '../../navigation/routes';

interface PermissionItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  required: boolean;
  granted: boolean;
}

export const PermissionsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedRole, selectedIsland } = route.params as any;

  const [permissions, setPermissions] = useState<PermissionItem[]>([
    {
      id: 'location',
      title: 'Location Access',
      description: 'Find vehicles near you and enable location-based features',
      icon: 'location-outline',
      required: true,
      granted: false,
    },
    {
      id: 'notifications',
      title: 'Push Notifications',
      description: 'Get updates about bookings, messages, and important alerts',
      icon: 'notifications-outline',
      required: false,
      granted: false,
    },
  ]);

  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const handleRequestPermissions = async () => {
    setIsRequestingPermissions(true);

    try {
      // Request location permission
      const locationGranted = await requestLocationPermission();
      
      // Request notification permission
      const notificationGranted = await requestNotificationPermission();

      // Update permissions state
      setPermissions(prev => prev.map(permission => {
        if (permission.id === 'location') {
          return { ...permission, granted: locationGranted };
        }
        if (permission.id === 'notifications') {
          return { ...permission, granted: notificationGranted };
        }
        return permission;
      }));

      // Check if required permissions are granted
      const requiredPermissionsGranted = locationGranted;

      if (!requiredPermissionsGranted) {
        Alert.alert(
          'Permission Required',
          'Location access is required for KeyLo to work properly. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert(
        'Permission Error',
        'There was an error requesting permissions. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRequestingPermissions(false);
    }
  };

  const handleContinue = () => {
    const requiredPermissionsGranted = permissions
      .filter(p => p.required)
      .every(p => p.granted);

    if (!requiredPermissionsGranted) {
      Alert.alert(
        'Required Permissions',
        'Please grant the required permissions to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

    (navigation as any).navigate(ROUTES.ONBOARDING_COMPLETE, {
      selectedRole,
      selectedIsland,
      permissions: permissions.reduce((acc, p) => ({ ...acc, [p.id]: p.granted }), {})
    });
  };

  const handleSkip = () => {
    (navigation as any).navigate(ROUTES.ONBOARDING_COMPLETE, {
      selectedRole,
      selectedIsland,
      permissions: {}
    });
  };

  const renderPermissionItem = (permission: PermissionItem) => {
    return (
      <View key={permission.id} style={styles.permissionItem}>
        <View style={styles.permissionHeader}>
          <View style={[
            styles.iconContainer,
            permission.granted && styles.iconContainerGranted
          ]}>
            <Ionicons 
              name={permission.granted ? 'checkmark' : permission.icon} 
              size={24} 
              color={permission.granted ? colors.white : colors.primary} 
            />
          </View>
          <View style={styles.permissionInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.permissionTitle}>{permission.title}</Text>
              {permission.required && (
                <Text style={styles.requiredLabel}>Required</Text>
              )}
            </View>
            <Text style={styles.permissionDescription}>
              {permission.description}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const allRequiredPermissionsGranted = permissions
    .filter(p => p.required)
    .every(p => p.granted);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>App Permissions</Text>
          <Text style={styles.subtitle}>
            KeyLo needs a few permissions to provide the best experience
          </Text>
        </View>

        <View style={styles.permissionsContainer}>
          {permissions.map(renderPermissionItem)}
        </View>

        <View style={styles.buttonContainer}>
          <StandardButton
            title={isRequestingPermissions ? "Requesting..." : "Grant Permissions"}
            onPress={handleRequestPermissions}
            variant="primary"
            size="large"
            disabled={isRequestingPermissions}
            style={styles.requestButton}
          />
          
          {allRequiredPermissionsGranted && (
            <StandardButton
              title="Continue"
              onPress={handleContinue}
              variant="primary"
              size="large"
              style={styles.continueButton}
            />
          )}
          
          <StandardButton
            title="Skip for now"
            onPress={handleSkip}
            variant="secondary"
            size="large"
            style={styles.skipButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionsContainer: {
    flex: 1,
    paddingVertical: spacing.lg,
  },
  permissionItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconContainerGranted: {
    backgroundColor: colors.success,
  },
  permissionInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  requiredLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.warning,
    backgroundColor: colors.warning + '20', // Add transparency to create light variant
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  permissionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingBottom: spacing.xl,
  },
  requestButton: {
    marginBottom: spacing.md,
  },
  continueButton: {
    marginBottom: spacing.md,
  },
  skipButton: {
    marginTop: spacing.sm,
  },
});

export default PermissionsScreen;
