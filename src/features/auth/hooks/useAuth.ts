import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  loginUser,
  registerUser,
  logoutUser,
  verifyEmail,
  resetPassword,
  selectAuth,
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  clearError,
} from '../../../store/slices/authSlice';
import type { LoginCredentials, RegisterData } from '../types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const auth = useAppSelector(selectAuth);
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  // Actions
  const login = useCallback(async (credentials: LoginCredentials) => {
    const result = await dispatch(loginUser(credentials));
    return result;
  }, [dispatch]);

  const register = useCallback(async (userData: RegisterData) => {
    const result = await dispatch(registerUser(userData));
    return result;
  }, [dispatch]);

  const logout = useCallback(async () => {
    const result = await dispatch(logoutUser());
    return result;
  }, [dispatch]);

  const verify = useCallback(async (code: string) => {
    const result = await dispatch(verifyEmail(code));
    return result;
  }, [dispatch]);

  const requestPasswordReset = useCallback(async (email: string) => {
    const result = await dispatch(resetPassword(email));
    return result;
  }, [dispatch]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // State
    auth,
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    login,
    register,
    logout,
    verify,
    requestPasswordReset,
    clearAuthError,
  };
};