import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StandardButton } from '../../components/templates/StandardButton';
import { colors, spacing } from '../../styles/theme';
import { ROUTES } from '../../navigation/routes';

type UserRole = 'customer' | 'host' | 'owner';

interface RoleOption {
  id: UserRole;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  benefits: string[];
}

const roleOptions: RoleOption[] = [
  {
    id: 'customer',
    title: 'I want to rent vehicles',
    description: 'Find and book the perfect ride for your island adventure',
    icon: 'car-outline',
    benefits: [
      'Browse available vehicles',
      'Book instantly',
      'Island-specific options',
      'Secure payments'
    ]
  },
  {
    id: 'host',
    title: 'I want to share my vehicle',
    description: 'Earn extra income by sharing your vehicle with travelers',
    icon: 'key-outline',
    benefits: [
      'Earn passive income',
      'Set your own rates',
      'Flexible scheduling',
      'Insurance coverage'
    ]
  },
  {
    id: 'owner',
    title: 'I manage a fleet',
    description: 'Professional vehicle management and rental business',
    icon: 'business-outline',
    benefits: [
      'Fleet management tools',
      'Advanced analytics',
      'Bulk operations',
      'Business insights'
    ]
  }
];

export const RoleSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole) {
      (navigation as any).navigate(ROUTES.ONBOARDING_ISLAND_SELECTION, {
        selectedRole
      });
    }
  };

  const renderRoleOption = (option: RoleOption) => {
    const isSelected = selectedRole === option.id;
    
    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.roleOption,
          isSelected && styles.roleOptionSelected
        ]}
        onPress={() => handleRoleSelect(option.id)}
        accessibilityRole="button"
        accessibilityLabel={`Select ${option.title}`}
        accessibilityState={{ selected: isSelected }}
      >
        <View style={styles.roleHeader}>
          <View style={[
            styles.iconContainer,
            isSelected && styles.iconContainerSelected
          ]}>
            <Ionicons 
              name={option.icon} 
              size={32} 
              color={isSelected ? colors.white : colors.primary} 
            />
          </View>
          <View style={styles.roleInfo}>
            <Text style={[
              styles.roleTitle,
              isSelected && styles.roleTitleSelected
            ]}>
              {option.title}
            </Text>
            <Text style={[
              styles.roleDescription,
              isSelected && styles.roleDescriptionSelected
            ]}>
              {option.description}
            </Text>
          </View>
        </View>
        
        <View style={styles.benefitsList}>
          {option.benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <Ionicons 
                name="checkmark-circle" 
                size={16} 
                color={isSelected ? colors.primary : colors.success} 
              />
              <Text style={[
                styles.benefitText,
                isSelected && styles.benefitTextSelected
              ]}>
                {benefit}
              </Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>How will you use KeyLo?</Text>
          <Text style={styles.subtitle}>
            Choose your primary role to customize your experience
          </Text>
        </View>

        <View style={styles.rolesContainer}>
          {roleOptions.map(renderRoleOption)}
        </View>

        <View style={styles.buttonContainer}>
          <StandardButton
            title="Continue"
            onPress={handleContinue}
            variant="primary"
            size="large"
            disabled={!selectedRole}
            style={styles.continueButton}
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
  rolesContainer: {
    flex: 1,
    paddingVertical: spacing.md,
  },
  roleOption: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  roleOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconContainerSelected: {
    backgroundColor: colors.primary,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  roleTitleSelected: {
    color: colors.primary,
  },
  roleDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  roleDescriptionSelected: {
    color: colors.text,
  },
  benefitsList: {
    paddingLeft: spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  benefitText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  benefitTextSelected: {
    color: colors.text,
  },
  buttonContainer: {
    paddingBottom: spacing.xl,
  },
  continueButton: {
    marginTop: spacing.lg,
  },
});

export default RoleSelectionScreen;
