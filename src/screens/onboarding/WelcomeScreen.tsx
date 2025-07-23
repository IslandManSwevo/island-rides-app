import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StandardButton } from '../../components/templates/StandardButton';
import { colors, spacing, typography } from '../../styles/theme';
import { ROUTES } from '../../navigation/routes';

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleGetStarted = () => {
    (navigation as any).navigate(ROUTES.ONBOARDING_ROLE_SELECTION);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../../assets/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome to KeyLo</Text>
          <Text style={styles.subtitle}>Your Island Transportation Solution</Text>
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🚗</Text>
            <Text style={styles.featureTitle}>Find Vehicles</Text>
            <Text style={styles.featureDescription}>
              Discover the perfect ride for your island adventure
            </Text>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🏝️</Text>
            <Text style={styles.featureTitle}>Island-Specific</Text>
            <Text style={styles.featureDescription}>
              Tailored for Caribbean island transportation needs
            </Text>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>💼</Text>
            <Text style={styles.featureTitle}>Host & Earn</Text>
            <Text style={styles.featureDescription}>
              Share your vehicle and earn extra income
            </Text>
          </View>
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
  logoContainer: {
    alignItems: 'center',
    marginTop: spacing.xl * 2,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  featuresContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  feature: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  featureIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  buttonContainer: {
    paddingBottom: spacing.xl,
  },
  getStartedButton: {
    marginTop: spacing.lg,
  },
});

export default WelcomeScreen;
