// REMOVED: Redux-based useAuth hook replaced with AuthContext
// This file now redirects to the AuthContext-based useAuth hook
// Original Redux implementation moved to backup during auth cleanup

// Re-export the AuthContext useAuth hook for compatibility
export { useAuth } from '../../../context/AuthContext';

// Note: Any components using this import will now use AuthContext instead of Redux
// This maintains compatibility while using the single authentication system