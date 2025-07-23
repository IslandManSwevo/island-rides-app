import { AccessibilityInfo } from 'react-native';
import { NavigationState, Route } from '@react-navigation/native';

interface NavigationAccessibilityConfig {
  announceScreenChanges: boolean;
  announceRouteChanges: boolean;
  focusOnScreenChange: boolean;
  customAnnouncements: Record<string, string>;
}

class NavigationAccessibility {
  private config: NavigationAccessibilityConfig;
  private previousRoute: string | null = null;
  private isScreenReaderEnabled = false;

  constructor(config: Partial<NavigationAccessibilityConfig> = {}) {
    this.config = {
      announceScreenChanges: true,
      announceRouteChanges: true,
      focusOnScreenChange: true,
      customAnnouncements: {},
      ...config,
    };

    this.initializeAccessibility();
  }

  /**
   * Initialize accessibility features
   */
  private async initializeAccessibility(): Promise<void> {
    try {
      // Check if screen reader is enabled
      this.isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      
      // Listen for screen reader state changes
      AccessibilityInfo.addEventListener('screenReaderChanged', (isEnabled) => {
        this.isScreenReaderEnabled = isEnabled;
        console.log('🔊 Screen reader state changed:', isEnabled);
      });

      console.log('🔊 Navigation accessibility initialized. Screen reader:', this.isScreenReaderEnabled);
    } catch (error) {
      console.warn('🔊 Failed to initialize navigation accessibility:', error);
    }
  }

  /**
   * Handle navigation state changes for accessibility
   */
  onNavigationStateChange = (state: NavigationState | undefined): void => {
    if (!state || !this.isScreenReaderEnabled) {
      return;
    }

    const currentRoute = this.getCurrentRouteName(state);
    
    if (currentRoute && currentRoute !== this.previousRoute) {
      this.handleRouteChange(this.previousRoute, currentRoute);
      this.previousRoute = currentRoute;
    }
  };

  /**
   * Handle route changes
   */
  private handleRouteChange(previousRoute: string | null, currentRoute: string): void {
    if (this.config.announceRouteChanges) {
      this.announceRouteChange(previousRoute, currentRoute);
    }

    if (this.config.focusOnScreenChange) {
      this.focusOnNewScreen();
    }
  }

  /**
   * Announce route changes to screen readers
   */
  private announceRouteChange(previousRoute: string | null, currentRoute: string): void {
    const customAnnouncement = this.config.customAnnouncements[currentRoute];
    
    if (customAnnouncement) {
      this.announceToScreenReader(customAnnouncement);
    } else {
      const screenName = this.formatScreenName(currentRoute);
      const announcement = previousRoute 
        ? `Navigated to ${screenName}` 
        : `Opened ${screenName}`;
      
      this.announceToScreenReader(announcement);
    }
  }

  /**
   * Focus on the new screen for accessibility
   */
  private focusOnNewScreen(): void {
    // Add a small delay to ensure the screen is rendered
    setTimeout(() => {
      AccessibilityInfo.setAccessibilityFocus(0); // Focus on the first element
    }, 100);
  }

  /**
   * Announce text to screen reader
   */
  announceToScreenReader = (text: string): void => {
    if (this.isScreenReaderEnabled) {
      AccessibilityInfo.announceForAccessibility(text);
      console.log('🔊 Announced:', text);
    }
  };

  /**
   * Get current route name from navigation state
   */
  private getCurrentRouteName(state: NavigationState): string | null {
    const route = state.routes[state.index];
    
    if (route.state) {
      // Handle nested navigators
      return this.getCurrentRouteName(route.state as NavigationState);
    }
    
    return route.name;
  }

  /**
   * Format screen name for announcements
   */
  private formatScreenName(routeName: string): string {
    // Convert camelCase and PascalCase to readable format
    return routeName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Add custom announcement for a route
   */
  addCustomAnnouncement = (routeName: string, announcement: string): void => {
    this.config.customAnnouncements[routeName] = announcement;
  };

  /**
   * Remove custom announcement for a route
   */
  removeCustomAnnouncement = (routeName: string): void => {
    delete this.config.customAnnouncements[routeName];
  };

  /**
   * Update accessibility configuration
   */
  updateConfig = (newConfig: Partial<NavigationAccessibilityConfig>): void => {
    this.config = { ...this.config, ...newConfig };
  };

  /**
   * Get current accessibility state
   */
  getAccessibilityState = () => ({
    isScreenReaderEnabled: this.isScreenReaderEnabled,
    config: this.config,
    previousRoute: this.previousRoute,
  });

  /**
   * Cleanup accessibility listeners
   */
  cleanup = (): void => {
    // Note: In newer React Native versions, listeners are automatically cleaned up
    // or use subscription.remove() if you have a subscription reference
  };
}

// Create singleton instance
export const navigationAccessibility = new NavigationAccessibility({
  announceScreenChanges: true,
  announceRouteChanges: true,
  focusOnScreenChange: true,
  customAnnouncements: {
    // Add custom announcements for specific screens
    'Search': 'Vehicle search screen opened. Use the search form to find vehicles.',
    'VehicleDetail': 'Vehicle details screen opened. Swipe to explore vehicle information.',
    'Checkout': 'Checkout screen opened. Review your booking details.',
    'Profile': 'Profile screen opened. Manage your account settings.',
    'HostDashboard': 'Host dashboard opened. View your hosting overview.',
    'FleetManagement': 'Fleet management screen opened. Manage your vehicles.',
  },
});

// Export utilities
export const announceToScreenReader = navigationAccessibility.announceToScreenReader;
export const addCustomAnnouncement = navigationAccessibility.addCustomAnnouncement;
export const onNavigationStateChange = navigationAccessibility.onNavigationStateChange;

export default navigationAccessibility;
