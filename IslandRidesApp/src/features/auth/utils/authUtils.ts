import type { User } from '../types';

export const authUtils = {
  /**
   * Check if user has specific role
   */
  hasRole: (user: User | null, role: User['role']): boolean => {
    return user?.role === role;
  },

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole: (user: User | null, roles: User['role'][]): boolean => {
    return user ? roles.includes(user.role) : false;
  },

  /**
   * Check if user is admin
   */
  isAdmin: (user: User | null): boolean => {
    return authUtils.hasRole(user, 'admin');
  },

  /**
   * Check if user is owner
   */
  isOwner: (user: User | null): boolean => {
    return authUtils.hasRole(user, 'owner');
  },

  /**
   * Check if user is regular user
   */
  isRegularUser: (user: User | null): boolean => {
    return authUtils.hasRole(user, 'user');
  },

  /**
   * Check if user is verified
   */
  isVerified: (user: User | null): boolean => {
    return user?.isVerified ?? false;
  },

  /**
   * Get user display name
   */
  getDisplayName: (user: User | null): string => {
    if (!user) return 'Guest';
    return user.name || user.email.split('@')[0];
  },

  /**
   * Get user initials for avatar
   */
  getInitials: (user: User | null): string => {
    if (!user) return 'G';
    
    const name = user.name || user.email;
    const parts = name.split(' ');
    
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    
    return name.substring(0, 2).toUpperCase();
  },

  /**
   * Format user role for display
   */
  formatRole: (role: User['role']): string => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'owner':
        return 'Vehicle Owner';
      case 'user':
        return 'User';
      default:
        return 'Unknown';
    }
  },

  /**
   * Check if user can perform action
   */
  canPerformAction: (user: User | null, action: string): boolean => {
    if (!user) return false;

    const permissions = {
      admin: ['*'], // Admin can do everything
      owner: [
        'create_vehicle',
        'update_own_vehicle',
        'delete_own_vehicle',
        'view_own_bookings',
        'manage_own_bookings',
        'view_analytics',
      ],
      user: [
        'create_booking',
        'update_own_booking',
        'cancel_own_booking',
        'view_own_bookings',
        'add_favorite',
        'write_review',
      ],
    };

    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(action);
  },

  /**
   * Get user's profile completion percentage
   */
  getProfileCompletionPercentage: (user: User | null): number => {
    if (!user) return 0;

    const fields = [
      'name',
      'email',
      'profileImageUrl',
      'isVerified',
    ];

    const completedFields = fields.filter(field => {
      const value = user[field as keyof User];
      return value !== null && value !== undefined && value !== '';
    });

    return Math.round((completedFields.length / fields.length) * 100);
  },

  /**
   * Check if user account is complete
   */
  isAccountComplete: (user: User | null): boolean => {
    return authUtils.getProfileCompletionPercentage(user) >= 80;
  },

  /**
   * Get account age in days
   */
  getAccountAge: (user: User | null): number => {
    if (!user?.createdAt) return 0;
    
    const createdDate = new Date(user.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  },

  /**
   * Check if user is new (account created within last 7 days)
   */
  isNewUser: (user: User | null): boolean => {
    return authUtils.getAccountAge(user) <= 7;
  },
};