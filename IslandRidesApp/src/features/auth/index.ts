// Authentication feature exports
export * from './components';
export * from './hooks';
export * from './types';
export * from './utils';

// Note: Redux auth exports removed - using AuthContext for authentication
// The following exports are no longer available:
// - loginUser, registerUser, logoutUser (use AuthContext methods instead)
// - selectAuth, selectUser, selectIsAuthenticated, etc. (use useAuth hook)
// - clearAuthError, updateUser (handled by AuthContext)

// For authentication functionality, use:
// import { useAuth } from '../context/AuthContext';
// const { login, register, logout, isAuthenticated, currentUser } = useAuth();