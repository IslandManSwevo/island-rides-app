// REMOVED: Redux-based useAuth hook replaced with UnifiedAuthContext
// This file now redirects to the UnifiedAuthContext-based useUnifiedAuth hook
// Original Redux implementation moved to backup during auth cleanup

// Re-export the UnifiedAuthContext useUnifiedAuth hook for compatibility
export { useUnifiedAuth as useAuth } from '../../../context/UnifiedAuthContext';

// Note: Any components using this import will now use UnifiedAuthContext instead of Redux
// This maintains compatibility while using the unified authentication system