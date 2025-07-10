import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import * as yup from 'yup';
import { notificationService } from '../services/notificationService';
import Button from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { colors, typography, spacing } from '../styles/theme';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

  const loginSchema = yup.object().shape({
    email: yup.string().email('Please enter a valid email').required('Email is required'),
    password: yup.string().required('Password is required'),
  });

  const validateForm = async () => {
    try {
      await loginSchema.validate({ email, password }, { abortEarly: false });
      setFormErrors({});
      return true;
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const errors = err.inner.reduce((acc, current) => {
          return { ...acc, [current.path!]: current.message };
        }, {});
        setFormErrors(errors);
      }
      return false;
    }
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    const isValid = await validateForm();
    if (!isValid) return;

    // Clear any previous errors
    clearError();

    try {
      await login(email.trim(), password);
      notificationService.success('Login successful!', { duration: 3000 });
      // AuthContext will automatically handle navigation via App.tsx
    } catch (error) {
      notificationService.error(error instanceof Error ? error.message : 'An error occurred', { duration: 5000 });
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
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={formErrors.email}
          />
          
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            error={formErrors.password}
          />
          
          <Button
            title="Login"
            onPress={handleLogin}
            loading={isLoading}
          />
          
          <Button
            title="Don't have an account? Sign up"
            onPress={() => navigation.navigate('Registration')}
            variant="secondary"
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
