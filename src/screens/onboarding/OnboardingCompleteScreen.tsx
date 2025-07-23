import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StandardButton } from '../../components/templates/StandardButton';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing } from '../../styles/theme';

export const OnboardingCompleteScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { updateUserProfile } = useAuth();
  
  const { selectedRole, selectedIsland, permissions } = route.params as any;

  useEffect(() => {
    // Update user profile with onboarding selections
    const updateProfile = async () => {
      try {
        await updateUserProfile({
          role: selectedRole,
          preferredIsland: selectedIsland,
          onboardingCompleted: true,
          permissions: permissions || {}
        });
      } catch (error) {
        console.error('Error updating user profile:', error);
      }
    };

    updateProfile();
  }, [selectedRole, selectedIsland, permissions, updateUserProfile]);

  const handleGetStarted = () => {
    // Navigate to the appropriate main app based on role
    if (selectedRole === 'host' || selectedRole === 'owner') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'HostApp' as never }],
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'CustomerApp' as never }],
      });
    }
  };

  const getRoleDisplayInfo = () => {
    switch (selectedRole) {
      case 'host':
        return {
          title: 'Ready to Host!',
          description: 'Start earning by sharing your vehicle with travelers',
          icon: 'key' as const,
          color: colors.success,
        };
      case 'owner':
        return {
          title: 'Fleet Management Ready!',
          description: 'Manage your vehicle fleet with powerful business tools',
          icon: 'business' as const,
          color: colors.primary,
        };
      default:
        return {
          title: 'Ready to Explore!',
          description: 'Find the perfect vehicle for your island adventure',
          icon: 'car' as const,
          color: colors.info,
        };
    }
  };

  const roleInfo = getRoleDisplayInfo();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: roleInfo.color }]}>
            <Ionicons name="checkmark" size={48} color={colors.white} />
          </View>
          
          <Text style={styles.title}>{roleInfo.title}</Text>
          <Text style={styles.description}>{roleInfo.description}</Text>
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Your Setup</Text>
          
          <View style={styles.summaryItem}>
            <Ionicons name={roleInfo.icon} size={20} color={colors.primary} />
            <Text style={styles.summaryLabel}>Role:</Text>
            <Text style={styles.summaryValue}>
              {selectedRole === 'host' ? 'Vehicle Host' : 
               selectedRole === 'owner' ? 'Fleet Owner' : 'Customer'}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <Text style={styles.summaryLabel}>Island:</Text>
            <Text style={styles.summaryValue}>{selectedIsland}</Text>
          </View>
          
          {permissions?.location && (
            <View style={styles.summaryItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.summaryLabel}>Location:</Text>
              <Text style={styles.summaryValue}>Enabled</Text>
            </View>
          )}
          
          {permissions?.notifications && (
            <View style={styles.summaryItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.summaryLabel}>Notifications:</Text>
              <Text style={styles.summaryValue}>Enabled</Text>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <StandardButton
            title="Get Started"
            onPress={handleGetStarted}
            variant="primary"
            size="large"
            style={styles.getStartedButton}
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
    justifyContent: 'space-between',
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl * 2,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  summaryContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginVertical: spacing.xl,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  buttonContainer: {
    paddingBottom: spacing.xl,
  },
  getStartedButton: {
    marginTop: spacing.lg,
  },
});

export default OnboardingCompleteScreen;
