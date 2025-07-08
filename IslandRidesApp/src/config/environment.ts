import { Platform } from 'react-native';
import Constants from 'expo-constants';

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
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private readonly DETECTION_TIMEOUT = 3000; // 3 seconds
  private readonly COMMON_PORTS = [3003, 3000, 3001, 3005, 3006, 3007, 3008, 8000, 8001, 8080, 8081];
  private readonly HEALTH_ENDPOINTS = ['/api/health', '/health', '/api/status', '/status'];

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
    return timeDiff < this.CACHE_DURATION;
  }

  private async checkSinglePort(port: number): Promise<PortDetectionResult> {
    // Check cache first
    if (this.isResultCached(port)) {
      return this.detectionCache.get(port)!;
    }

    const startTime = Date.now();
    let bestResult: PortDetectionResult = {
      port,
      available: false,
      responseTime: Infinity,
      lastChecked: new Date()
    };

    // Try multiple health endpoints
    for (const endpoint of this.HEALTH_ENDPOINTS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.DETECTION_TIMEOUT);

        const response = await fetch(`http://localhost:${port}${endpoint}`, {
          signal: controller.signal,
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        if (response.ok) {
          bestResult = {
            port,
            available: true,
            responseTime,
            lastChecked: new Date()
          };
          break; // Found a working endpoint, stop trying others
        }
      } catch (error) {
        // Continue to next endpoint
      }
    }

    // Cache the result
    this.detectionCache.set(port, bestResult);
    return bestResult;
  }

  async detectAvailableServer(): Promise<{ port: number; url: string } | null> {
    const startTime = Date.now();
    
    // Check environment variable first
    const envPort = process.env.EXPO_PUBLIC_API_PORT;
    if (envPort) {
      const port = parseInt(envPort);
      const result = await this.checkSinglePort(port);
      if (result.available) {
        console.log(`✅ Using environment-specified port ${port} (${result.responseTime}ms)`);
        return { port, url: `http://localhost:${port}` };
      }
    }

    // Try to read runtime config from most common port first
    try {
      const result = await this.checkSinglePort(3003);
      if (result.available) {
                 try {
           const controller = new AbortController();
           const timeoutId = setTimeout(() => controller.abort(), 2000);
           
           const response = await fetch('http://localhost:3003/api/port-status', {
             signal: controller.signal,
             headers: { 'Accept': 'application/json' }
           });
           
           clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            const actualPort = data.currentPort || 3003;
            
            if (actualPort !== 3003) {
              const actualResult = await this.checkSinglePort(actualPort);
              if (actualResult.available) {
                console.log(`✅ Server redirected to port ${actualPort} (${actualResult.responseTime}ms)`);
                return { port: actualPort, url: `http://localhost:${actualPort}` };
              }
            }
          }
        } catch (error) {
          // Port-status endpoint not available, but server is running
        }
        
        console.log(`✅ Server found on default port 3003 (${result.responseTime}ms)`);
        return { port: 3003, url: 'http://localhost:3003' };
      }
    } catch (error) {
      // Continue with port scanning
    }

    // Parallel port detection for speed
    console.log('🔍 Scanning for available API server...');
    const detectionPromises = this.COMMON_PORTS.map(port => this.checkSinglePort(port));
    
    try {
      const results = await Promise.allSettled(detectionPromises);
      const availableServers = results
        .map((result, index) => {
          if (result.status === 'fulfilled' && result.value.available) {
            return result.value;
          }
          return null;
        })
        .filter(result => result !== null)
        .sort((a, b) => a!.responseTime - b!.responseTime); // Sort by response time

      if (availableServers.length > 0) {
        const fastest = availableServers[0]!;
        const totalTime = Date.now() - startTime;
        console.log(`✅ Auto-detected API server on port ${fastest.port} (${fastest.responseTime}ms, total scan: ${totalTime}ms)`);
        
        if (availableServers.length > 1) {
          console.log(`ℹ️ Other available servers: ${availableServers.slice(1).map(s => `${s!.port}(${s!.responseTime}ms)`).join(', ')}`);
        }
        
        return { port: fastest.port, url: `http://localhost:${fastest.port}` };
      }
    } catch (error) {
      console.error('❌ Port detection failed:', error);
    }

    const totalTime = Date.now() - startTime;
    console.warn(`⚠️ No API server found after ${totalTime}ms scan. Using fallback port 3003`);
    return { port: 3003, url: 'http://localhost:3003' };
  }

  async getWebSocketPort(): Promise<number> {
    // Check if WebSocket server is running on dedicated port
    const wsPort = parseInt(process.env.EXPO_PUBLIC_WS_PORT || '3004');
    const result = await this.checkSinglePort(wsPort);
    
    if (result.available) {
      console.log(`✅ WebSocket server found on port ${wsPort}`);
      return wsPort;
    }

    // Fallback to common WebSocket ports
    const wsPorts = [3004, 3001, 3002, 8080, 8081];
    for (const port of wsPorts) {
      const result = await this.checkSinglePort(port);
      if (result.available) {
        console.log(`✅ WebSocket server found on fallback port ${port}`);
        return port;
      }
    }

    console.warn('⚠️ No WebSocket server found, using default port 3004');
    return 3004;
  }

  clearCache(): void {
    this.detectionCache.clear();
  }

  getDetectionStats(): { cached: number; total: number } {
    return {
      cached: this.detectionCache.size,
      total: this.COMMON_PORTS.length
    };
  }
}

const portManager = PortDetectionManager.getInstance();

const getEnvVars = async (env = process.env.NODE_ENV): Promise<EnvironmentConfig> => {
  let apiBaseUrl: string;
  let wsUrl: string;

  if (env === 'production') {
    apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.islandrides.com';
    wsUrl = process.env.EXPO_PUBLIC_WS_URL || 'wss://api.islandrides.com';
  } else if (env === 'staging') {
    apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://staging-api.islandrides.com';
    wsUrl = process.env.EXPO_PUBLIC_WS_URL || 'wss://staging-api.islandrides.com';
  } else {
    // Development environment
    const serverDetection = await portManager.detectAvailableServer();
    apiBaseUrl = serverDetection?.url || 'http://localhost:3003';
    
    const wsPort = await portManager.getWebSocketPort();
    wsUrl = `ws://localhost:${wsPort}`;
  }

  const config: EnvironmentConfig = {
    API_BASE_URL: apiBaseUrl,
    API_TIMEOUT: env === 'production' ? 10000 : env === 'staging' ? 8000 : 5000,
    WS_URL: wsUrl,
    ENVIRONMENT: env as 'development' | 'staging' | 'production',
    DEBUG: env !== 'production',
    IS_EXPO_GO: Constants.appOwnership === 'expo'
  };

  if (env === 'development') {
    const stats = portManager.getDetectionStats();
    console.log(`📊 Port Detection Stats: ${stats.cached}/${stats.total} cached results`);
  }

  return config;
};

// Create a cached promise for environment config
let envConfigPromise: Promise<EnvironmentConfig> | null = null;
let configCache: EnvironmentConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minute

export const getEnvironmentConfig = async (forceRefresh: boolean = false): Promise<EnvironmentConfig> => {
  const now = Date.now();
  
  // Return cached config if still valid
  if (!forceRefresh && configCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return configCache;
  }

  // Clear cache if forcing refresh
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
    
    // Return fallback config
    const fallbackConfig: EnvironmentConfig = {
      API_BASE_URL: 'http://localhost:3003',
      API_TIMEOUT: 5000,
      WS_URL: 'ws://localhost:3004',
      ENVIRONMENT: 'development',
      DEBUG: true,
      IS_EXPO_GO: Constants.appOwnership === 'expo'
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
