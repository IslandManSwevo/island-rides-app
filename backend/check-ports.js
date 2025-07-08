#!/usr/bin/env node

const net = require('net');

class PortChecker {
  constructor() {
    this.ports = [3001, 3002, 3003, 3004, 3005, 3006, 3007, 8000, 8001, 19006, 19001];
  }

  async checkPort(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, '127.0.0.1', () => {
        server.once('close', () => resolve({ port, available: true }));
        server.close();
      });
      
      server.on('error', () => resolve({ port, available: false }));
    });
  }

  async checkAllPorts() {
    console.log('🔍 Checking port availability...\n');
    
    const results = await Promise.all(
      this.ports.map(port => this.checkPort(port))
    );
    
    const available = results.filter(r => r.available);
    const busy = results.filter(r => !r.available);
    
    console.log('✅ Available ports:');
    available.forEach(({ port }) => console.log(`  - ${port}`));
    
    console.log('\n❌ Busy ports:');
    busy.forEach(({ port }) => console.log(`  - ${port}`));
    
    console.log('\n📊 Port assignments:');
    console.log('  - 3001: MCP Server');
    console.log('  - 3002: Gemini Bridge');  
    console.log('  - 3003: Main API Server (preferred)');
    console.log('  - 3004: WebSocket Server');
    console.log('  - 19006: Expo Metro Bundler');
    console.log('  - 19001: Expo DevTools');
    
    if (available.length === 0) {
      console.log('\n⚠️ No ports available! Consider:');
      console.log('  1. Stopping unused services');
      console.log('  2. Using different port ranges');
      console.log('  3. Restarting your development environment');
    }
    
    return { available: available.map(r => r.port), busy: busy.map(r => r.port) };
  }
}

if (require.main === module) {
  const checker = new PortChecker();
  checker.checkAllPorts().catch(console.error);
}

module.exports = PortChecker; 