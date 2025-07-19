import { Platform } from 'react-native';

// WCAG 2.1 compliance levels
export type WCAGLevel = 'A' | 'AA' | 'AAA';

// Accessibility configuration
export const accessibilityConfig = {
  // Color contrast ratios (WCAG 2.1)
  contrastRatios: {
    normal: {
      A: 3,
      AA: 4.5,
      AAA: 7,
    },
    large: {
      A: 3,
      AA: 3,
      AAA: 4.5,
    },
  },

  // Minimum touch target sizes (iOS HIG / Material Design)
  touchTargets: {
    minimum: Platform.OS === 'ios' ? 44 : 48,
    recommended: Platform.OS === 'ios' ? 48 : 56,
    spacing: 8,
  },

  // Text size configurations
  textSizes: {
    minimum: 12,
    normal: 16,
    large: 18,
    extraLarge: 20,
  },

  // Animation preferences
  animations: {
    defaultDuration: 300,
    reducedDuration: 150,
    disableWhenReduceMotion: true,
  },

  // Focus management
  focus: {
    highlightColor: '#007AFF',
    highlightWidth: 2,
    borderRadius: 4,
  },

  // Screen reader settings
  screenReader: {
    announcementDelay: 500,
    sequenceInterval: 1000,
    maxLabelLength: 100,
    maxHintLength: 200,
  },

  // Common accessibility roles
  roles: {
    button: 'button',
    link: 'link',
    text: 'text',
    image: 'image',
    header: 'header',
    navigation: 'navigation',
    search: 'search',
    list: 'list',
    listItem: 'listitem',
    tab: 'tab',
    tabList: 'tablist',
    checkbox: 'checkbox',
    radio: 'radio',
    switch: 'switch',
    slider: 'slider',
    progressBar: 'progressbar',
    alert: 'alert',
    dialog: 'dialog',
    menu: 'menu',
    menuItem: 'menuitem',
  },

  // Common accessibility states
  states: {
    disabled: { disabled: true },
    enabled: { disabled: false },
    selected: { selected: true },
    unselected: { selected: false },
    checked: { checked: true },
    unchecked: { checked: false },
    expanded: { expanded: true },
    collapsed: { expanded: false },
    busy: { busy: true },
    idle: { busy: false },
  },

  // Platform-specific configurations
  platform: {
    ios: {
      supportsDynamicType: true,
      supportsVoiceOver: true,
      supportsReduceMotion: true,
      supportsReduceTransparency: true,
      supportsBoldText: true,
      supportsButtonShapes: true,
    },
    android: {
      supportsFontScale: true,
      supportsTalkBack: true,
      supportsReduceMotion: true,
      supportsHighContrast: true,
      supportsRemoveAnimations: true,
    },
  },

  // Validation rules
  validation: {
    requireAccessibilityLabel: true,
    requireAccessibilityRole: true,
    validateContrastRatio: true,
    validateTouchTargetSize: true,
    wcagLevel: 'AA' as WCAGLevel,
  },

  // Testing configurations
  testing: {
    enableAutomatedTests: __DEV__,
    logAccessibilityIssues: __DEV__,
    highlightIssues: __DEV__,
    testCoverage: {
      screenReader: true,
      keyboard: true,
      colorContrast: true,
      touchTargets: true,
      focusManagement: true,
    },
  },

  // Helper functions
  helpers: {
    /**
     * Get minimum contrast ratio for current WCAG level
     */
    getMinimumContrastRatio: (isLargeText: boolean = false): number => {
      const level = accessibilityConfig.validation.wcagLevel;
      return isLargeText 
        ? accessibilityConfig.contrastRatios.large[level]
        : accessibilityConfig.contrastRatios.normal[level];
    },

    /**
     * Get minimum touch target size for current platform
     */
    getMinimumTouchTargetSize: (): number => {
      return accessibilityConfig.touchTargets.minimum;
    },

    /**
     * Get recommended touch target size for current platform
     */
    getRecommendedTouchTargetSize: (): number => {
      return accessibilityConfig.touchTargets.recommended;
    },

    /**
     * Check if platform supports specific accessibility feature
     */
    supportsFeature: (feature: string): boolean => {
      const platformConfig = Platform.OS === 'ios' 
        ? accessibilityConfig.platform.ios 
        : accessibilityConfig.platform.android;
      
      return platformConfig[feature as keyof typeof platformConfig] || false;
    },

    /**
     * Get animation duration based on reduce motion preference
     */
    getAnimationDuration: (reduceMotionEnabled: boolean = false): number => {
      if (reduceMotionEnabled && accessibilityConfig.animations.disableWhenReduceMotion) {
        return accessibilityConfig.animations.reducedDuration;
      }
      return accessibilityConfig.animations.defaultDuration;
    },

    /**
     * Validate accessibility label length
     */
    isValidLabelLength: (label: string): boolean => {
      return label.length <= accessibilityConfig.screenReader.maxLabelLength;
    },

    /**
     * Validate accessibility hint length
     */
    isValidHintLength: (hint: string): boolean => {
      return hint.length <= accessibilityConfig.screenReader.maxHintLength;
    },
  },
};