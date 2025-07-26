import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { notificationService } from '../services/notificationService';
import { GluestackButton, GluestackInput } from '../components/templates';
import { useUnifiedAuth } from '../context/UnifiedAuthContext';
import { colors, typography, spacing } from '../styles/theme';
import { RootStackParamList, ROUTES } from '../navigation/routes';
import { validateLoginCredentials, sanitizeFormData } from '../utils/validation';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, typeof ROUTES.LOGIN>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login, isLoading } = useUnifiedAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = useState<string | null>(null);

  const validateForm = () => {
    // Sanitize form data before validation
    const sanitizedData = sanitizeFormData({ email, password });

    // Use the shared validation utility
    const validation = validateLoginCredentials({
      email: sanitizedData.email,
      password: sanitizedData.password,
    });

    setFormErrors(validation.errors);
    return validation.isValid;
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    const isValid = validateForm();
    if (!isValid) return;

    // Clear any previous errors
    setAuthError(null);

    try {
      await login({ email: email.trim(), password });
      notificationService.success('Login successful!', { duration: 3000 });
      // UnifiedAuthContext will automatically handle navigation via App.tsx
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please check your credentials.';
      setAuthError(errorMessage);
      notificationService.error(errorMessage, { duration: 5000 });
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>🏝️ Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
        
        {authError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{authError}</Text>
          </View>
        )}
        
        <View style={styles.form}>
          <GluestackInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={formErrors.email}
            leftIcon="mail"
            size="md"
            required
            accessibilityLabel="Email address"
            accessibilityHint="Enter your registered email address"
          />
          
          <GluestackInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            error={formErrors.password}
            leftIcon="lock-closed"
            size="md"
            required
            accessibilityLabel="Password"
            accessibilityHint="Enter your account password"
          />
          
          <GluestackButton
            title="Login"
            onPress={handleLogin}
            variant="solid"
            action="primary"
            icon="log-in"
            size="lg"
            loading={isLoading}
            fullWidth
            accessibilityLabel="Login to your account"
            accessibilityHint="Logs you into your KeyLo account"
          />
          
          <GluestackButton
            title="Don't have an account? Sign up"
            onPress={() => navigation.navigate('Registration')}
            variant="outline"
            action="secondary"
            icon="person-add"
            size="md"
            fullWidth
            accessibilityLabel="Create new account"
            accessibilityHint="Navigate to registration screen to create a new account"
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.heading1,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  errorContainer: {
    backgroundColor: colors.error + '20',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    fontSize: 14,
  },
  form: {
    gap: spacing.md,
  },
});
