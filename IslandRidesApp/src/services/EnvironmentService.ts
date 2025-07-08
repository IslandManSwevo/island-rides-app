import { BaseService } from './base/BaseService';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

interface Environment {
  api: {
    baseUrl: string;
    timeout: number;
    version: string;
  };
  auth: {
    tokenExpiry: string;
    refreshThreshold: number;
  };
  features: {
    enableChat: boolean;
    enablePushNotifications: boolean;
    enableAnalytics: boolean;
  };
}

const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3003';
  }
  
  // For mobile development, try to get the host from Expo
  const manifest = Constants.expoConfig;
  const debuggerHost = manifest?.hostUri?.split(':').shift();
  
  if (debuggerHost && __DEV__) {
    return `http://${debuggerHost}:3003`;
  }
  
  // Fallback for development
  return 'http://localhost:3003';
};

const development: Environment = {
  api: {
    baseUrl: getApiBaseUrl(),
    timeout: 10000,
    version: 'v1'
  },
  auth: {
    tokenExpiry: '24h',
    refreshThreshold: 1800 // 30 minutes in seconds
  },
  features: {
    enableChat: true,
    enablePushNotifications: Constants.appOwnership !== 'expo', // Disable in Expo Go
    enableAnalytics: false
  }
};

const production: Environment = {
  api: {
    baseUrl: 'https://api.islandrides.com',
    timeout: 30000,
    version: 'v1'
  },
  auth: {
    tokenExpiry: '24h',
    refreshThreshold: 1800
  },
  features: {
    enableChat: true,
    enablePushNotifications: true,
    enableAnalytics: true
  }
};

const staging: Environment = {
  ...production,
  api: {
    ...production.api,
    baseUrl: 'https://staging-api.islandrides.com'
  },
  features: {
    ...production.features,
    enableAnalytics: false
  }
};

class EnvironmentService extends BaseService {
  private config!: Environment;

  constructor() {
    super();
  }

  protected async onInit(): Promise<void> {
    this.config = this.initializeConfig();
  }

  private initializeConfig(): Environment {
    if (__DEV__) {
      return development;
    }

    // Check for staging environment
    if (process.env.ENVIRONMENT === 'staging') {
      return staging;
    }

    return production;
  }

  getConfig(): Environment {
    return this.config;
  }

  get apiConfig() {
    return this.config.api;
  }

  get authConfig() {
    return this.config.auth;
  }

  get featureFlags() {
    return this.config.features;
  }
}

export const environmentService = EnvironmentService.getInstance<EnvironmentService>();
