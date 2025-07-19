import { useState, useCallback } from 'react';
import type { LoginFormErrors, RegisterFormErrors, LoginCredentials, RegisterData } from '../types';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation - at least 8 characters, one uppercase, one lowercase, one number
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

export const useAuthValidation = () => {
  const [loginErrors, setLoginErrors] = useState<LoginFormErrors>({});
  const [registerErrors, setRegisterErrors] = useState<RegisterFormErrors>({});

  const validateEmail = useCallback((email: string): string | undefined => {
    if (!email) {
      return 'Email is required';
    }
    if (!EMAIL_REGEX.test(email)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  }, []);

  const validatePassword = useCallback((password: string): string | undefined => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!PASSWORD_REGEX.test(password)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    return undefined;
  }, []);

  const validateName = useCallback((name: string): string | undefined => {
    if (!name) {
      return 'Name is required';
    }
    if (name.length < 2) {
      return 'Name must be at least 2 characters long';
    }
    if (name.length > 50) {
      return 'Name must be less than 50 characters long';
    }
    return undefined;
  }, []);

  const validateConfirmPassword = useCallback((password: string, confirmPassword: string): string | undefined => {
    if (!confirmPassword) {
      return 'Please confirm your password';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return undefined;
  }, []);

  const validateLoginForm = useCallback((credentials: LoginCredentials): LoginFormErrors => {
    const errors: LoginFormErrors = {};

    const emailError = validateEmail(credentials.email);
    if (emailError) errors.email = emailError;

    if (!credentials.password) {
      errors.password = 'Password is required';
    }

    setLoginErrors(errors);
    return errors;
  }, [validateEmail]);

  const validateRegisterForm = useCallback((userData: RegisterData): RegisterFormErrors => {
    const errors: RegisterFormErrors = {};

    const nameError = validateName(userData.name);
    if (nameError) errors.name = nameError;

    const emailError = validateEmail(userData.email);
    if (emailError) errors.email = emailError;

    const passwordError = validatePassword(userData.password);
    if (passwordError) errors.password = passwordError;

    const confirmPasswordError = validateConfirmPassword(userData.password, userData.confirmPassword);
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

    if (!userData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setRegisterErrors(errors);
    return errors;
  }, [validateName, validateEmail, validatePassword, validateConfirmPassword]);

  const clearLoginErrors = useCallback(() => {
    setLoginErrors({});
  }, []);

  const clearRegisterErrors = useCallback(() => {
    setRegisterErrors({});
  }, []);

  const isLoginFormValid = useCallback((credentials: LoginCredentials): boolean => {
    const errors = validateLoginForm(credentials);
    return Object.keys(errors).length === 0;
  }, [validateLoginForm]);

  const isRegisterFormValid = useCallback((userData: RegisterData): boolean => {
    const errors = validateRegisterForm(userData);
    return Object.keys(errors).length === 0;
  }, [validateRegisterForm]);

  return {
    // Validation functions
    validateEmail,
    validatePassword,
    validateName,
    validateConfirmPassword,
    validateLoginForm,
    validateRegisterForm,
    
    // Form validation state
    loginErrors,
    registerErrors,
    
    // Validation helpers
    isLoginFormValid,
    isRegisterFormValid,
    
    // Clear errors
    clearLoginErrors,
    clearRegisterErrors,
  };
};