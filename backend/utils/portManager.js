const net = require('net');
const fs = require('fs');
const path = require('path');

/**
 * Smart Port Management System
 * Handles port detection, conflict resolution, and server startup
 */

class PortManager {
  constructor() {
    this.currentPort = null;
    this.preferredPorts = [3003, 3004, 3005, 3006, 3007];
    this.maxRetries = 5;
    this.retryDelay = 1000; // 1 second
    this.configFile = path.join(__dirname, '..', 'runtime-config.json');
  }

  /**
   * Check if a port is available
   */
  async isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => {
          resolve(true);
        });
        server.close();
      });
      
      server.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Find the first available port from preferred list
   */
  async findAvailablePort() {
    for (const port of this.preferredPorts) {
      const available = await this.isPortAvailable(port);
      if (available) {
        console.log(`✅ Found available port: ${port}`);
        return port;
      } else {
        console.log(`❌ Port ${port} is busy`);
      }
    }
    
    // If no preferred ports are available, try random ports
    for (let i = 0; i < 10; i++) {
      const randomPort = 3000 + Math.floor(Math.random() * 1000);
      const available = await this.isPortAvailable(randomPort);
      if (available) {
        console.log(`✅ Found random available port: ${randomPort}`);
        return randomPort;
      }
    }
    
    throw new Error('No available ports found');
  }

  /**
   * Get current port status
   */
  getPortStatus() {
    return {
      currentPort: this.currentPort,
      preferredPorts: this.preferredPorts,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Update runtime configuration file
   */
  updateRuntimeConfig(port) {
    try {
      const config = {
        port,
        startTime: new Date().toISOString(),
        processId: process.pid,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
      };
      
      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
      console.log(`📝 Runtime config updated: ${this.configFile}`);
    } catch (error) {
      console.warn('⚠️ Failed to update runtime config:', error.message);
    }
  }

  /**
   * Start additional services (WebSocket, monitoring, etc.)
   */
  startAdditionalServices() {
    try {
      // WebSocket port (current port + 1)
      const wsPort = this.currentPort + 1;
      process.env.WEBSOCKET_PORT = wsPort.toString();
      console.log(`🔌 WebSocket will use port: ${wsPort}`);
      
      // Monitoring port (current port + 2)
      const monitoringPort = this.currentPort + 2;
      process.env.MONITORING_PORT = monitoringPort.toString();
      console.log(`📊 Monitoring will use port: ${monitoringPort}`);
      
    } catch (error) {
      console.warn('⚠️ Failed to configure additional services:', error.message);
    }
  }

  /**
   * Start server with automatic port retry
   */
  async startServerWithRetry(server) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${this.maxRetries} to start server...`);
        
        const port = await this.findAvailablePort();
        
        return new Promise((resolve, reject) => {
          const serverInstance = server.listen(port, (err) => {
            if (err) {
              reject(err);
            } else {
              this.currentPort = port;
              process.env.CURRENT_SERVER_PORT = port.toString();
              
              console.log(`🚀 Server successfully started on port ${port}`);
              console.log(`📡 Socket.io ready on ws://localhost:${port}`);
              console.log(`🔗 API Health: http://localhost:${port}/api/health`);
              console.log(`📊 Port Status: http://localhost:${port}/api/port-status`);
              
              this.startAdditionalServices();
              this.updateRuntimeConfig(port);
              
              resolve({ port, server: serverInstance });
            }
          });
          
          serverInstance.on('error', (error) => {
            reject(error);
          });
        });
        
      } catch (error) {
        lastError = error;
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.maxRetries) {
          console.log(`⏳ Waiting ${this.retryDelay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }
    
    throw new Error(`Failed to start server after ${this.maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      // Clean up runtime config
      if (fs.existsSync(this.configFile)) {
        fs.unlinkSync(this.configFile);
        console.log('🧹 Runtime config cleaned up');
      }
    } catch (error) {
      console.warn('⚠️ Error during shutdown:', error.message);
    }
  }

  /**
   * Get server info for health checks
   */
  getServerInfo() {
    return {
      port: this.currentPort,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const portManager = new PortManager();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('📤 Received SIGTERM, shutting down gracefully...');
  portManager.shutdown();
});

process.on('SIGINT', () => {
  console.log('📤 Received SIGINT, shutting down gracefully...');
  portManager.shutdown();
  process.exit(0);
});

module.exports = portManager;
