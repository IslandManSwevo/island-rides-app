import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { ENV_CONFIG_CACHE_DURATION_MS, PORT_DETECTION_CACHE_DURATION_MS } from './constants';

const PORT_CONFIG = {
  DETECTION_TIMEOUT: 1000, // Reduced to 1 second for faster fallback
  COMMON_API_PORTS: [3003, 3000, 3001, 3005, 3006, 3007, 3008, 8000, 8001, 8080, 8081],
  COMMON_WS_PORTS: [3004, 3001, 3002, 8080, 8081],
  HEALTH_ENDPOINTS: ['/api/health', '/health', '/api/status', '/status'],
  DEFAULT_API_PORT: 3003,
  DEFAULT_WS_PORT: 3004,
  PORT_STATUS_TIMEOUT: 1000, // Reduced timeout
  MAX_CONCURRENT_CHECKS: 3, // Limit concurrent port checks
};

const API_TIMEOUT_CONFIG = {
  production: 10000,
  staging: 8000,
  development: 5000,
};


/**
 * Fetches a JSON resource with a specified timeout.
 * Ensures that the timeout is cleared in all circumstances.
 * @param url The URL to fetch.
 * @param timeout The timeout in milliseconds.
 * @returns The parsed JSON data or null if an error occurs.
 */
async function fetchWithTimeout<T>(url: string, timeout: number): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json() as T;
  } catch (error) {
    // This will catch fetch errors and abort errors
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

interface EnvironmentConfig {
  API_BASE_URL: string;
  API_TIMEOUT: number;
  WS_URL: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
  DEBUG: boolean;
  IS_EXPO_GO: boolean;
}

interface PortDetectionResult {
  port: number;
  available: boolean;
  responseTime: number;
  lastChecked: Date;
}

class PortDetectionManager {
  private static instance: PortDetectionManager;
  private detectionCache: Map<number, PortDetectionResult> = new Map();
  private readonly DETECTION_TIMEOUT = PORT_CONFIG.DETECTION_TIMEOUT;
  private readonly COMMON_PORTS = PORT_CONFIG.COMMON_API_PORTS;
  private readonly HEALTH_ENDPOINTS = PORT_CONFIG.HEALTH_ENDPOINTS;

  static getInstance(): PortDetectionManager {
    if (!PortDetectionManager.instance) {
      PortDetectionManager.instance = new PortDetectionManager();
    }
    return PortDetectionManager.instance;
  }

  private isResultCached(port: number): boolean {
    const cached = this.detectionCache.get(port);
    if (!cached) return false;
    
    const now = new Date();
    const timeDiff = now.getTime() - cached.lastChecked.getTime();
    return timeDiff < PORT_DETECTION_CACHE_DURATION_MS;
  }

  private async checkSinglePort(port: number): Promise<PortDetectionResult> {
    if (this.isResultCached(port)) {
      return this.detectionCache.get(port)!;
    }

    const startTime = Date.now();
    let bestResult: PortDetectionResult = {
      port,
      available: false,
      responseTime: Infinity,
      lastChecked: new Date(),
    };

    for (const endpoint of this.HEALTH_ENDPOINTS) {
      const data = await fetchWithTimeout(`http://localhost:${port}${endpoint}`, this.DETECTION_TIMEOUT);
      if (data) {
        bestResult = {
          port,
          available: true,
          responseTime: Date.now() - startTime,
          lastChecked: new Date(),
        };
        break; 
      }
    }

    this.detectionCache.set(port, bestResult);
    return bestResult;
  }

  async detectAvailableServer(): Promise<{ port: number; url: string } | null> {
    const startTime = Date.now();
    
    // Quick check for environment-specified port
    const envPort = process.env.EXPO_PUBLIC_API_PORT;
    if (envPort) {
      const port = parseInt(envPort);
      const result = await this.checkSinglePort(port);
      if (result.available) {
        console.log(`✅ Using environment-specified port ${port} (${result.responseTime}ms)`);
        return { port, url: `http://localhost:${port}` };
      }
    }

    // Quick check for default port
    const result3003 = await this.checkSinglePort(PORT_CONFIG.DEFAULT_API_PORT);
    if (result3003.available) {
      console.log(`✅ Server found on default port ${PORT_CONFIG.DEFAULT_API_PORT} (${result3003.responseTime}ms)`);
      return { port: PORT_CONFIG.DEFAULT_API_PORT, url: `http://localhost:${PORT_CONFIG.DEFAULT_API_PORT}` };
    }

    // Limited concurrent scanning with timeout
    console.log('🔍 Quick scan for available API server...');
    const priorityPorts = this.COMMON_PORTS.slice(0, PORT_CONFIG.MAX_CONCURRENT_CHECKS);
    
    try {
      const detectionPromises = priorityPorts.map(port => this.checkSinglePort(port));
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Port detection timeout')), 2000)
      );
      
      const results = await Promise.race([
        Promise.allSettled(detectionPromises),
        timeoutPromise
      ]);
      
      const availableServers = (results as PromiseSettledResult<PortDetectionResult>[])
        .map(result => (result.status === 'fulfilled' && result.value.available) ? result.value : null)
        .filter((r): r is PortDetectionResult => r !== null)
        .sort((a, b) => a.responseTime - b.responseTime);

      if (availableServers.length > 0) {
        const fastest = availableServers[0];
        const totalTime = Date.now() - startTime;
        console.log(`✅ Auto-detected API server on port ${fastest.port} (${fastest.responseTime}ms, total scan: ${totalTime}ms)`);
        return { port: fastest.port, url: `http://localhost:${fastest.port}` };
      }
    } catch (error) {
      console.warn('⚠️ Port detection timed out, using fallback');
    }

    const totalTime = Date.now() - startTime;
    console.warn(`⚠️ No API server found after ${totalTime}ms scan. Using fallback port ${PORT_CONFIG.DEFAULT_API_PORT}`);
    return { port: PORT_CONFIG.DEFAULT_API_PORT, url: `http://localhost:${PORT_CONFIG.DEFAULT_API_PORT}` };
  }

  async getWebSocketPort(): Promise<number> {
    const wsPort = parseInt(process.env.EXPO_PUBLIC_WS_PORT || String(PORT_CONFIG.DEFAULT_WS_PORT));
    
    // Quick check with timeout
    try {
      const timeoutPromise = new Promise<PortDetectionResult>((_, reject) => 
        setTimeout(() => reject(new Error('WebSocket detection timeout')), 1000)
      );
      
      const result = await Promise.race([
        this.checkSinglePort(wsPort),
        timeoutPromise
      ]);
      
      if (result.available) {
        console.log(`✅ WebSocket server found on port ${wsPort}`);
        return wsPort;
      }
    } catch (error) {
      console.warn(`⚠️ WebSocket detection timed out, using default port ${PORT_CONFIG.DEFAULT_WS_PORT}`);
    }

    return PORT_CONFIG.DEFAULT_WS_PORT;
  }

  clearCache(): void {
    this.detectionCache.clear();
  }

  getDetectionStats(): { cached: number; total: number } {
    return {
      cached: this.detectionCache.size,
      total: this.COMMON_PORTS.length,
    };
  }
}

const portManager = PortDetectionManager.getInstance();

const getEnvVars = async (env = process.env.NODE_ENV): Promise<EnvironmentConfig> => {
  console.log('🔧 Starting environment configuration...');
  let apiBaseUrl: string;
  let wsUrl: string;

  if (env === 'production') {
    apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.islandrides.com';
    wsUrl = process.env.EXPO_PUBLIC_WS_URL || 'wss://api.islandrides.com';
    console.log('🚀 Using production environment');
  } else if (env === 'staging') {
    apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://staging-api.islandrides.com';
    wsUrl = process.env.EXPO_PUBLIC_WS_URL || 'wss://staging-api.islandrides.com';
    console.log('🧪 Using staging environment');
  } else {
    console.log('🛠️ Using development environment, detecting servers...');
    const serverDetection = await portManager.detectAvailableServer();
    apiBaseUrl = serverDetection?.url || 'http://localhost:3003';
    
    const wsPort = await portManager.getWebSocketPort();
    wsUrl = `ws://localhost:${wsPort}`;
    console.log(`📡 API: ${apiBaseUrl}, WebSocket: ${wsUrl}`);
  }

  const config: EnvironmentConfig = {
    API_BASE_URL: apiBaseUrl,
    API_TIMEOUT: API_TIMEOUT_CONFIG[env as keyof typeof API_TIMEOUT_CONFIG] || API_TIMEOUT_CONFIG.development,
    WS_URL: wsUrl,
    ENVIRONMENT: env as 'development' | 'staging' | 'production',
    DEBUG: env !== 'production',
    IS_EXPO_GO: Constants.appOwnership === 'expo',
  };

  if (env === 'development') {
    const stats = portManager.getDetectionStats();
    console.log(`📊 Port Detection Stats: ${stats.cached}/${stats.total} cached results`);
  }

  return config;
};

let envConfigPromise: Promise<EnvironmentConfig> | null = null;
let configCache: EnvironmentConfig | null = null;
let cacheTimestamp: number = 0;

export const getEnvironmentConfig = async (forceRefresh: boolean = false): Promise<EnvironmentConfig> => {
  const now = Date.now();
  
  if (!forceRefresh && configCache && (now - cacheTimestamp) < ENV_CONFIG_CACHE_DURATION_MS) {
    return configCache;
  }

  if (forceRefresh) {
    envConfigPromise = null;
    portManager.clearCache();
  }

  if (!envConfigPromise) {
    envConfigPromise = getEnvVars();
  }

  try {
    const config = await envConfigPromise;
    configCache = config;
    cacheTimestamp = now;
    return config;
  } catch (error) {
    console.error('❌ Failed to get environment config:', error);
    
    const fallbackConfig: EnvironmentConfig = {
      API_BASE_URL: `http://localhost:${PORT_CONFIG.DEFAULT_API_PORT}`,
      API_TIMEOUT: API_TIMEOUT_CONFIG.development,
      WS_URL: `ws://localhost:${PORT_CONFIG.DEFAULT_WS_PORT}`,
      ENVIRONMENT: 'development',
      DEBUG: true,
      IS_EXPO_GO: Constants.appOwnership === 'expo',
    };
    
    configCache = fallbackConfig;
    cacheTimestamp = now;
    return fallbackConfig;
  }
};

// For backward compatibility
export const { API_BASE_URL = 'http://localhost:3003' } = Constants.expoConfig?.extra || {};
export default getEnvironmentConfig;

// Export the port manager for advanced use cases
export { portManager };
