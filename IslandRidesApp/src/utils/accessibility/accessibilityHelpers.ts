import { AccessibilityInfo, Platform } from 'react-native';

export const accessibilityHelpers = {
  /**
   * Check if screen reader is enabled
   */
  isScreenReaderEnabled: async (): Promise<boolean> => {
    try {
      return await AccessibilityInfo.isScreenReaderEnabled();
    } catch (error) {
      console.warn('Failed to check screen reader status:', error);
      return false;
    }
  },

  /**
   * Check if reduce motion is enabled
   */
  isReduceMotionEnabled: async (): Promise<boolean> => {
    try {
      return await AccessibilityInfo.isReduceMotionEnabled();
    } catch (error) {
      console.warn('Failed to check reduce motion status:', error);
      return false;
    }
  },

  /**
   * Check if reduce transparency is enabled (iOS only)
   */
  isReduceTransparencyEnabled: async (): Promise<boolean> => {
    if (Platform.OS !== 'ios') return false;
    
    try {
      return await AccessibilityInfo.isReduceTransparencyEnabled();
    } catch (error) {
      console.warn('Failed to check reduce transparency status:', error);
      return false;
    }
  },

  /**
   * Announce message to screen reader
   */
  announceForAccessibility: (message: string): void => {
    AccessibilityInfo.announceForAccessibility(message);
  },

  /**
   * Set accessibility focus to element
   */
  setAccessibilityFocus: (reactTag: number): void => {
    AccessibilityInfo.setAccessibilityFocus(reactTag);
  },

  /**
   * Generate accessibility label for buttons
   */
  generateButtonLabel: (
    title: string,
    state?: {
      disabled?: boolean;
      loading?: boolean;
      selected?: boolean;
    }
  ): string => {
    let label = title;
    
    if (state?.loading) {
      label += ', Loading';
    }
    
    if (state?.disabled) {
      label += ', Disabled';
    }
    
    if (state?.selected) {
      label += ', Selected';
    }
    
    return label;
  },

  /**
   * Generate accessibility hint for actions
   */
  generateActionHint: (action: string, context?: string): string => {
    const baseHint = `Double tap to ${action}`;
    return context ? `${baseHint} ${context}` : baseHint;
  },

  /**
   * Generate accessibility label for form fields
   */
  generateFormFieldLabel: (
    label: string,
    options?: {
      required?: boolean;
      error?: boolean;
      value?: string;
      placeholder?: string;
    }
  ): string => {
    let accessibilityLabel = label;
    
    if (options?.required) {
      accessibilityLabel += ', Required';
    }
    
    if (options?.error) {
      accessibilityLabel += ', Invalid';
    }
    
    if (options?.value) {
      accessibilityLabel += `, Current value: ${options.value}`;
    } else if (options?.placeholder) {
      accessibilityLabel += `, Placeholder: ${options.placeholder}`;
    }
    
    return accessibilityLabel;
  },

  /**
   * Generate accessibility label for lists
   */
  generateListItemLabel: (
    item: string,
    position: number,
    total: number,
    additionalInfo?: string
  ): string => {
    let label = `${item}, ${position} of ${total}`;
    
    if (additionalInfo) {
      label += `, ${additionalInfo}`;
    }
    
    return label;
  },

  /**
   * Generate accessibility label for progress indicators
   */
  generateProgressLabel: (
    current: number,
    total: number,
    description?: string
  ): string => {
    const percentage = Math.round((current / total) * 100);
    let label = `Progress: ${percentage}%`;
    
    if (description) {
      label = `${description}: ${label}`;
    }
    
    return label;
  },

  /**
   * Generate accessibility state for toggleable elements
   */
  generateToggleState: (isToggled: boolean) => ({
    checked: isToggled,
    selected: isToggled,
  }),

  /**
   * Generate accessibility state for expandable elements
   */
  generateExpandableState: (isExpanded: boolean) => ({
    expanded: isExpanded,
  }),

  /**
   * Format currency for screen readers
   */
  formatCurrencyForAccessibility: (amount: number, currency: string = 'USD'): string => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    });
    
    return formatter.format(amount).replace('$', 'dollars ');
  },

  /**
   * Format date for screen readers
   */
  formatDateForAccessibility: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  /**
   * Format time for screen readers
   */
  formatTimeForAccessibility: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  },

  /**
   * Create accessible navigation instructions
   */
  createNavigationInstructions: (
    currentScreen: string,
    totalScreens?: number,
    previousScreen?: string,
    nextScreen?: string
  ): string => {
    let instructions = `Current screen: ${currentScreen}`;
    
    if (totalScreens) {
      instructions += ` of ${totalScreens}`;
    }
    
    if (previousScreen) {
      instructions += `. Swipe right to go back to ${previousScreen}`;
    }
    
    if (nextScreen) {
      instructions += `. Swipe left to go to ${nextScreen}`;
    }
    
    return instructions;
  },

  /**
   * Create accessible error messages
   */
  createAccessibleErrorMessage: (
    fieldName: string,
    errorMessage: string
  ): string => {
    return `${fieldName} has an error: ${errorMessage}`;
  },

  /**
   * Create accessible success messages
   */
  createAccessibleSuccessMessage: (action: string): string => {
    return `Success: ${action} completed`;
  },

  /**
   * Validate accessibility props
   */
  validateAccessibilityProps: (props: {
    accessibilityLabel?: string;
    accessibilityHint?: string;
    accessibilityRole?: string;
    accessibilityState?: object;
  }): string[] => {
    const issues: string[] = [];
    
    if (!props.accessibilityLabel) {
      issues.push('Missing accessibilityLabel');
    }
    
    if (props.accessibilityLabel && props.accessibilityLabel.length > 100) {
      issues.push('accessibilityLabel is too long (should be under 100 characters)');
    }
    
    if (props.accessibilityHint && props.accessibilityHint.length > 200) {
      issues.push('accessibilityHint is too long (should be under 200 characters)');
    }
    
    return issues;
  },
};