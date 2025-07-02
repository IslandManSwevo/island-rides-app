import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AuthService } from '../services/authService';
import { colors, typography, spacing } from '../styles/theme';

interface RegistrationScreenProps {
  navigation: any;
}

export const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
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
    
    const passwordValidation = AuthService.validatePassword(formData.password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.message || 'Invalid password';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegistration = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await AuthService.register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: 'customer',
      });
      navigation.navigate('IslandSelection');
    } catch (error) {
      Alert.alert('Registration Failed', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🏝️ Join Island Rides</Text>
        <Text style={styles.subtitle}>Create your account to get started</Text>
        
        <View style={styles.form}>
          <Input
            label="First Name"
            value={formData.firstName}
            onChangeText={(value) => updateFormData('firstName', value)}
            placeholder="Enter your first name"
            autoCapitalize="words"
            error={errors.firstName}
          />
          
          <Input
            label="Last Name"
            value={formData.lastName}
            onChangeText={(value) => updateFormData('lastName', value)}
            placeholder="Enter your last name"
            autoCapitalize="words"
            error={errors.lastName}
          />
          
          <Input
            label="Email"
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          
          <Input
            label="Password"
            value={formData.password}
            onChangeText={(value) => updateFormData('password', value)}
            placeholder="Create a secure password"
            secureTextEntry
            error={errors.password}
          />
          
          <Button
            title="Create Account"
            onPress={handleRegistration}
            loading={loading}
          />
          
          <Button
            title="Already have an account? Sign in"
            onPress={() => navigation.navigate('Login')}
            variant="secondary"
          />
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
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
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
  form: {
    gap: spacing.md,
  },
});
