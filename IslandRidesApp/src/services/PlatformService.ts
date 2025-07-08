import { Platform } from 'react-native';
import { BaseService } from './base/BaseService';
import Constants from 'expo-constants';

export interface PlatformConfig {
  keyboardBehavior: 'padding' | 'height';
  keyboardOffset: number;
  bottomOffset: number;
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
  isExpoGo: boolean;
  hasKeyboardController: boolean;
}

class PlatformService extends BaseService {
  private config!: PlatformConfig;

  constructor() {
    super();
  }

  protected async onInit(): Promise<void> {
    this.config = this.initializeConfig();
  }

  private initializeConfig(): PlatformConfig {
    const isExpoGo = Constants.appOwnership === 'expo';
    
    return {
      keyboardBehavior: Platform.OS === 'ios' ? 'padding' : 'height',
      keyboardOffset: Platform.OS === 'ios' ? 0 : 20,
      bottomOffset: Platform.OS === 'ios' ? 34 : 0,
      isIOS: Platform.OS === 'ios',
      isAndroid: Platform.OS === 'android',
      isWeb: Platform.OS === 'web',
      isExpoGo,
      hasKeyboardController: !isExpoGo, // Keyboard controller only works in development builds
    };
  }

  getConfig(): PlatformConfig {
    return this.config;
  }

  select<T>(config: {
    ios?: T;
    android?: T;
    web?: T;
    expo?: T;
    default?: T;
  }): T {
    if (this.config.isExpoGo && config.expo !== undefined) {
      return config.expo;
    }
    
    if (this.config.isIOS && config.ios !== undefined) {
      return config.ios;
    }
    
    if (this.config.isAndroid && config.android !== undefined) {
      return config.android;
    }
    
    if (this.config.isWeb && config.web !== undefined) {
      return config.web;
    }
    
    if (config.default !== undefined) {
      return config.default;
    }
    
    throw new Error('No platform configuration found');
  }

  // Safe keyboard handling that works in Expo Go
  getSafeKeyboardConfig() {
    return {
      behavior: this.config.keyboardBehavior,
      keyboardVerticalOffset: this.config.keyboardOffset,
      enabled: true,
    };
  }

  // Get platform-specific styles
  getPlatformStyles() {
    return {
      statusBarHeight: this.config.isIOS ? 44 : 24,
      headerHeight: this.config.isIOS ? 44 : 56,
      tabBarHeight: this.config.isIOS ? 83 : 56,
      bottomSafeArea: this.config.bottomOffset,
    };
  }

  // Check if a feature is available in current environment
  isFeatureAvailable(feature: 'pushNotifications' | 'keyboard' | 'camera' | 'location'): boolean {
    switch (feature) {
      case 'pushNotifications':
        return !this.config.isExpoGo && !this.config.isWeb;
      case 'keyboard':
        return this.config.hasKeyboardController;
      case 'camera':
        return !this.config.isWeb;
      case 'location':
        return true; // Basic location works everywhere
      default:
        return true;
    }
  }
}

export const platformService = PlatformService.getInstance<PlatformService>();
