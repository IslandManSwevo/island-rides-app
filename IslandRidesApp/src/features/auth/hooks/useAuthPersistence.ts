// REMOVED: Redux-based useAuthPersistence hook replaced with AuthContext
// AuthContext now handles all authentication persistence automatically
// Original Redux implementation moved to backup during auth cleanup

// This hook is no longer needed as AuthContext handles:
// - Token persistence and restoration on app startup
// - Automatic token refresh
// - Auth state management

export const useAuthPersistence = () => {
  // Return empty object for compatibility
  // AuthContext handles all persistence automatically
  return {
    initializeAuth: () => {
      console.warn('useAuthPersistence.initializeAuth() is deprecated - AuthContext handles this automatically');
    },
  };
};