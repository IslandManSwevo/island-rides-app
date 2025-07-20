// Authentication feature exports
export * from './components';
export * from './hooks';
export * from './types';
export * from './utils';

// Re-export relevant store items
export {
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
  clearError as clearAuthError,
  updateUser,
} from '../../store/slices/authSlice';