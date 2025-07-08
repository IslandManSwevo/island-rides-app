import { portManager } from '../config/environment';

export interface PortDetectionDebugInfo {
  availableServers: Array<{
    port: number;
    responseTime: number;
    endpoints: string[];
  }>;
  cacheStats: {
    cached: number;
    total: number;
  };
  detectionTime: number;
}

export class PortDetectionHelper {
  static async getDebugInfo(): Promise<PortDetectionDebugInfo> {
    const startTime = Date.now();
    
    // Clear cache for fresh detection
    portManager.clearCache();
    
    // Test common ports
    const testPorts = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 8000, 8001, 8080, 8081];
    const availableServers: Array<{
      port: number;
      responseTime: number;
      endpoints: string[];
    }> = [];
    
    for (const port of testPorts) {
      const endpoints = ['/api/health', '/health', '/api/status', '/status'];
      const workingEndpoints: string[] = [];
      let bestResponseTime = Infinity;
      
      for (const endpoint of endpoints) {
        try {
          const startTime = Date.now();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          
          const response = await fetch(`http://localhost:${port}${endpoint}`, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const responseTime = Date.now() - startTime;
            workingEndpoints.push(endpoint);
            bestResponseTime = Math.min(bestResponseTime, responseTime);
          }
        } catch (error) {
          // Endpoint not available
        }
      }
      
      if (workingEndpoints.length > 0) {
        availableServers.push({
          port,
          responseTime: bestResponseTime,
          endpoints: workingEndpoints
        });
      }
    }
    
    const detectionTime = Date.now() - startTime;
    const cacheStats = portManager.getDetectionStats();
    
    return {
      availableServers,
      cacheStats,
      detectionTime
    };
  }
  
  static async printDebugInfo(): Promise<void> {
    console.log('🔍 Port Detection Debug Information');
    console.log('==================================');
    
    const debugInfo = await this.getDebugInfo();
    
    console.log(`⏱️ Detection Time: ${debugInfo.detectionTime}ms`);
    console.log(`📊 Cache Stats: ${debugInfo.cacheStats.cached}/${debugInfo.cacheStats.total} cached`);
    console.log(`🎯 Available Servers: ${debugInfo.availableServers.length}`);
    
    if (debugInfo.availableServers.length > 0) {
      console.log('\n📋 Server Details:');
      debugInfo.availableServers.forEach((server, index) => {
        console.log(`  ${index + 1}. Port ${server.port} (${server.responseTime}ms)`);
        console.log(`     Endpoints: ${server.endpoints.join(', ')}`);
      });
      
      const fastest = debugInfo.availableServers.reduce((prev, current) => 
        prev.responseTime < current.responseTime ? prev : current
      );
      console.log(`\n🚀 Fastest Server: Port ${fastest.port} (${fastest.responseTime}ms)`);
    } else {
      console.log('❌ No servers detected');
    }
    
    console.log('\n💡 Recommendations:');
    if (debugInfo.availableServers.length === 0) {
      console.log('  - Start your backend server');
      console.log('  - Check if ports are not blocked by firewall');
      console.log('  - Try running: cd backend && npm start');
    } else if (debugInfo.availableServers.length > 1) {
      console.log('  - Multiple servers detected, fastest will be used');
      console.log('  - Consider setting EXPO_PUBLIC_API_PORT environment variable');
    } else {
      console.log('  - Single server detected, looks good!');
    }
  }
  
  static async testCurrentConfiguration(): Promise<boolean> {
    try {
      const { getEnvironmentConfig } = await import('../config/environment');
      const config = await getEnvironmentConfig();
      
      console.log('🧪 Testing Current Configuration');
      console.log('===============================');
      console.log(`API URL: ${config.API_BASE_URL}`);
      console.log(`WS URL: ${config.WS_URL}`);
      console.log(`Environment: ${config.ENVIRONMENT}`);
      console.log(`Debug: ${config.DEBUG}`);
      
      // Test API endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${config.API_BASE_URL}/api/health`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Server: Connected successfully');
        console.log(`   Status: ${data.status}`);
        console.log(`   Uptime: ${data.uptime}`);
        return true;
      } else {
        console.log('❌ API Server: Connection failed');
        console.log(`   Status: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log('❌ API Server: Connection error');
      console.log(`   Error: ${error}`);
      return false;
    }
  }
}

// Export helper functions for development use
export const debugPortDetection = PortDetectionHelper.printDebugInfo;
export const testConfiguration = PortDetectionHelper.testCurrentConfiguration; 