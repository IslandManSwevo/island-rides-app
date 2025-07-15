import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Button from '../components/Button';
import { notificationService } from '../services/notificationService';
import { Input } from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { colors, typography, spacing } from '../styles/Theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, ROUTES } from '../navigation/routes';

type RegistrationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Registration'>;

interface RegistrationScreenProps {
  navigation: RegistrationScreenNavigationProp;
  defaultRole?: 'customer' | 'owner';
}

export const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ navigation, defaultRole = 'customer' }) => {
  const { register, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof formErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    // Clear any previous errors
    clearError();

    try {
      await register(
        formData.email.trim(),
        formData.password,
        formData.firstName.trim(),
        formData.lastName.trim(),
        defaultRole
      );
      notificationService.success('Welcome to Island Rides!', {
        title: 'Registration Successful',
        duration: 3000
      });
      // AuthContext will automatically handle navigation via App.tsx
    } catch (error) {
      notificationService.error(error instanceof Error ? error.message : 'An error occurred', {
        title: 'Registration Failed',
        duration: 5000
      });
    }
  };

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>🏝️ Join Island Rides</Text>
          <Text style={styles.subtitle}>Create your account to get started</Text>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          <View style={styles.form}>
            <Input
              label="First Name"
              value={formData.firstName}
              onChangeText={(value) => updateFormData('firstName', value)}
              placeholder="Enter your first name"
              autoCapitalize="words"
              error={formErrors.firstName}
            />
            
            <Input
              label="Last Name"
              value={formData.lastName}
              onChangeText={(value) => updateFormData('lastName', value)}
              placeholder="Enter your last name"
              autoCapitalize="words"
              error={formErrors.lastName}
            />
            
            <Input
              label="Email"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={formErrors.email}
            />
            
            <Input
              label="Password"
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              placeholder="Enter your password"
              secureTextEntry
              error={formErrors.password}
            />
            
            <Input
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData('confirmPassword', value)}
              placeholder="Confirm your password"
              secureTextEntry
              error={formErrors.confirmPassword}
            />
            
            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={isLoading}
            />
            
            <Button
              title="Already have an account? Sign in"
              onPress={() => navigation.navigate(ROUTES.LOGIN)}
              variant="secondary"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
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
