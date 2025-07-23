#!/usr/bin/env node

/**
 * Island Rides App - Monitoring Setup Script
 * 
 * This script sets up comprehensive monitoring for both frontend and backend:
 * - Performance monitoring service
 * - API response time tracking
 * - Database query monitoring
 * - Real-time alerting system
 * - Monitoring dashboard
 */

const fs = require('fs').promises;
const path = require('path');

const MONITORING_CONFIG = {
  frontend: {
    performanceThresholds: {
      slowRender: 16,          // ms
      verySlowRender: 50,      // ms
      slowApi: 2000,           // ms
      highMemory: 150,         // MB
      criticalMemory: 200      // MB
    },
    alertChannels: [
      { type: 'console', enabled: true },
      { type: 'toast', enabled: true },
      { type: 'websocket', enabled: false }
    ]
  },
  backend: {
    performanceThresholds: {
      slowQuery: 100,          // ms
      verySlowQuery: 500,      // ms
      longRunningQuery: 5000,  // ms
      slowApi: 500,            // ms
      criticalApi: 2000        // ms
    },
    monitoring: {
      metricsRetention: '7d',
      reportingInterval: '5m',
      alertCooldown: '1m'
    }
  },
  logging: {
    level: 'info',
    maxFileSize: '5MB',
    maxFiles: 5,
    enableConsole: true
  }
};

class MonitoringSetup {
  constructor() {
    this.rootDir = __dirname;
    this.frontendDir = path.join(this.rootDir, 'IslandRidesApp');
    this.backendDir = path.join(this.rootDir, 'backend');
  }

  async setup() {
    console.log('🚀 Setting up comprehensive monitoring for Island Rides App...\n');
    
    try {
      await this.createDirectories();
      await this.setupBackendIntegration();
      await this.setupFrontendIntegration();
      await this.createConfigurationFiles();
      await this.updatePackageFiles();
      await this.generateDocumentation();
      
      console.log('\n✅ Monitoring setup completed successfully!');
      this.printNextSteps();
      
    } catch (error) {
      console.error('\n❌ Monitoring setup failed:', error.message);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    }
  }

  async createDirectories() {
    console.log('📁 Creating monitoring directories...');
    
    const directories = [
      path.join(this.backendDir, 'logs'),
      path.join(this.backendDir, 'monitoring'),
      path.join(this.frontendDir, 'src', 'components', 'monitoring'),
      path.join(this.frontendDir, 'src', 'services', 'monitoring')
    ];

    for (const dir of directories) {
      try {
        await fs.access(dir);
        console.log(`  ✓ Directory already exists: ${path.relative(this.rootDir, dir)}`);
      } catch {
        await fs.mkdir(dir, { recursive: true });
        console.log(`  ✓ Created directory: ${path.relative(this.rootDir, dir)}`);
      }
    }
  }

  async setupBackendIntegration() {
    console.log('\n🔧 Setting up backend monitoring integration...');
    
    // Create server integration snippet
    const serverIntegrationCode = `
// ==== MONITORING INTEGRATION ====
// Add this to your server.js file after the app initialization

const MonitoringIntegration = require('./monitoring-integration');

// Initialize monitoring
const monitoring = new MonitoringIntegration();

// Setup monitoring after app and db are ready
if (process.env.NODE_ENV !== 'test') {
  monitoring.initialize(app, db);
  console.log('📊 Monitoring system initialized');
}

// ==== END MONITORING INTEGRATION ====
`;

    await fs.writeFile(
      path.join(this.backendDir, 'monitoring-setup-snippet.js'),
      serverIntegrationCode.trim()
    );
    
    console.log('  ✓ Created backend integration snippet');
    console.log('  ℹ️  Add the content of monitoring-setup-snippet.js to your server.js');
  }

  async setupFrontendIntegration() {
    console.log('\n🎨 Setting up frontend monitoring integration...');
    
    // Create App.tsx integration snippet
    const appIntegrationCode = `
// ==== MONITORING INTEGRATION ====
// Add these imports at the top of your App.tsx

import PerformanceMonitoringService from './src/services/PerformanceMonitoringService';
import AlertingService from './src/services/AlertingService';
import { useMonitoring } from './src/hooks/useMonitoring';

// Initialize monitoring services
const performanceService = PerformanceMonitoringService.getInstance();
const alertingService = AlertingService.getInstance();

// Enable monitoring in development
if (__DEV__) {
  performanceService.setEnabled(true);
  alertingService.setEnabled(true);
  
  // Setup toast alert handler
  if (typeof window !== 'undefined') {
    window.addEventListener('performanceAlert', (event) => {
      const { alert, config } = event.detail;
      
      // Integrate with your toast/notification system here
      console.warn(\`🚨 Performance Alert: \${alert.title}\`, alert);
      
      // Example: If using react-native-toast-message
      // Toast.show({
      //   type: config.type === 'critical' ? 'error' : 'warning',
      //   text1: alert.title,
      //   text2: alert.message,
      //   visibilityTime: config.duration
      // });
    });
  }
}

// ==== END MONITORING INTEGRATION ====
`;

    await fs.writeFile(
      path.join(this.frontendDir, 'monitoring-app-integration.tsx'),
      appIntegrationCode.trim()
    );
    
    // Create example screen with monitoring
    const screenExampleCode = `
// Example: SearchScreen.tsx with monitoring integration

import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useScreenMonitoring } from '../hooks/useMonitoring';

export const SearchScreen = () => {
  const { 
    markScreenLoaded, 
    trackUserInteraction, 
    trackApiCall,
    trackCustomMetric 
  } = useScreenMonitoring('SearchScreen');

  useEffect(() => {
    // Mark screen as loaded after initial setup
    const timer = setTimeout(() => {
      markScreenLoaded();
    }, 100);

    return () => clearTimeout(timer);
  }, [markScreenLoaded]);

  const handleSearch = async (query) => {
    // Track user interaction
    trackUserInteraction('search', Date.now());
    
    try {
      // Track API call with automatic performance monitoring
      const results = await trackApiCall(
        '/api/vehicles/search',
        () => fetch(\`/api/vehicles/search?q=\${query}\`).then(res => res.json())
      );
      
      // Track custom metric
      trackCustomMetric('search_results_count', results.length);
      
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  };

  return (
    <View>
      <Text>Search Screen with Performance Monitoring</Text>
      {/* Your existing screen content */}
    </View>
  );
};
`;

    await fs.writeFile(
      path.join(this.frontendDir, 'monitoring-screen-example.tsx'),
      screenExampleCode.trim()
    );
    
    console.log('  ✓ Created frontend integration examples');
  }

  async createConfigurationFiles() {
    console.log('\n⚙️  Creating configuration files...');
    
    // Environment configuration
    const envConfig = `
# ==== MONITORING CONFIGURATION ====
# Add these to your .env file

# Enable/disable monitoring
MONITORING_ENABLED=true

# Monitoring thresholds
MONITORING_SLOW_QUERY_MS=100
MONITORING_SLOW_API_MS=500
MONITORING_MEMORY_WARNING_MB=150
MONITORING_MEMORY_CRITICAL_MB=200

# Alerting configuration
MONITORING_WEBHOOK_URL=
MONITORING_SLACK_WEBHOOK=
MONITORING_EMAIL_ALERTS=false

# Monitoring retention
MONITORING_METRICS_RETENTION_DAYS=7
MONITORING_LOGS_RETENTION_DAYS=30

# WebSocket server for real-time alerts
WEBSOCKET_PORT=3004

# ==== END MONITORING CONFIGURATION ====
`;

    await fs.writeFile(
      path.join(this.rootDir, '.env.monitoring.example'),
      envConfig.trim()
    );
    
    // Monitoring configuration JSON
    await fs.writeFile(
      path.join(this.rootDir, 'monitoring-config.json'),
      JSON.stringify(MONITORING_CONFIG, null, 2)
    );
    
    console.log('  ✓ Created monitoring configuration files');
  }

  async updatePackageFiles() {
    console.log('\n📦 Updating package.json files...');
    
    // Backend package.json additions
    const backendDependencies = {
      "node-cron": "^3.0.2"
    };
    
    const backendScripts = {
      "monitoring:health": "curl http://localhost:3003/health",
      "monitoring:metrics": "curl http://localhost:3003/api/monitoring/performance",
      "monitoring:dashboard": "curl http://localhost:3003/api/monitoring/dashboard"
    };
    
    // Frontend package.json additions (if using additional charting libraries)
    const frontendDependencies = {
      // Add charting library if needed
      // "react-native-svg": "^12.4.0",
      // "victory-native": "^36.0.0"
    };

    console.log('  ✓ Package.json updates prepared');
    console.log('  ℹ️  Consider adding the suggested dependencies and scripts');
  }

  async generateDocumentation() {
    console.log('\n📚 Generating monitoring documentation...');
    
    const documentation = `
# Island Rides App - Monitoring System

## Overview

This monitoring system provides comprehensive performance tracking and alerting for the Island Rides application, including:

- **Frontend Performance Monitoring**: Render times, API calls, memory usage, navigation performance
- **Backend Performance Tracking**: API response times, database queries, system metrics
- **Real-time Alerting**: Configurable alerts for performance bottlenecks
- **Monitoring Dashboard**: Visual interface for performance metrics and alerts

## Architecture

### Frontend Components
- \`PerformanceMonitoringService\`: Core performance tracking
- \`AlertingService\`: Real-time alerting system
- \`MonitoringDashboard\`: Visual monitoring interface
- \`useMonitoring\` hooks: Easy integration for components

### Backend Components
- \`PerformanceMiddleware\`: API performance tracking
- \`DatabaseMonitoringService\`: Database query monitoring
- \`MonitoringIntegration\`: Unified monitoring setup

## Quick Start

### 1. Backend Integration

Add to your \`server.js\`:

\`\`\`javascript
const MonitoringIntegration = require('./monitoring-integration');
const monitoring = new MonitoringIntegration();

// After app and db initialization
monitoring.initialize(app, db);
\`\`\`

### 2. Frontend Integration

Add to your main \`App.tsx\`:

\`\`\`typescript
import PerformanceMonitoringService from './src/services/PerformanceMonitoringService';
import AlertingService from './src/services/AlertingService';

// Initialize monitoring
const performanceService = PerformanceMonitoringService.getInstance();
const alertingService = AlertingService.getInstance();

if (__DEV__) {
  performanceService.setEnabled(true);
  alertingService.setEnabled(true);
}
\`\`\`

### 3. Component Monitoring

Use monitoring hooks in your components:

\`\`\`typescript
import { useScreenMonitoring } from '../hooks/useMonitoring';

export const MyScreen = () => {
  const { markScreenLoaded, trackApiCall, trackUserInteraction } = useScreenMonitoring('MyScreen');
  
  // Mark screen loaded
  useEffect(() => {
    markScreenLoaded();
  }, []);
  
  // Track API calls
  const fetchData = async () => {
    return await trackApiCall('/api/data', () => apiService.getData());
  };
  
  // Track user interactions
  const handleUserAction = () => {
    trackUserInteraction('button_click');
  };
  
  // ... rest of component
};
\`\`\`

## Monitoring Endpoints

### Performance Metrics
- \`GET /api/monitoring/metrics\` - Raw performance metrics
- \`GET /api/monitoring/performance\` - Performance report
- \`GET /api/monitoring/dashboard\` - Dashboard data

### Database Monitoring
- \`GET /api/monitoring/database\` - Database metrics
- \`GET /api/monitoring/database/report\` - Database performance report
- \`GET /api/monitoring/database/slow-queries\` - Slow query analysis

### Health Checks
- \`GET /health\` - Basic health check
- \`GET /health/detailed\` - Detailed system health
- \`GET /api/monitoring/alerts\` - Active alerts

## Configuration

### Performance Thresholds

| Metric | Warning | Critical | Description |
|--------|---------|----------|-------------|
| Render Time | 16ms | 50ms | Component render duration |
| API Response | 1000ms | 2000ms | API call duration |
| Memory Usage | 150MB | 200MB | Heap memory consumption |
| Database Query | 100ms | 500ms | SQL query execution time |

### Alert Channels

- **Console**: Development logging
- **Toast**: In-app notifications
- **WebSocket**: Real-time alerts
- **Webhook**: External system integration

## Troubleshooting

### Common Issues

1. **High Memory Usage**: Check for memory leaks in components
2. **Slow Renders**: Optimize component re-renders, use React.memo
3. **Slow API Calls**: Review API endpoint performance and caching
4. **Database Performance**: Analyze slow queries and add indexes

### Debug Commands

\`\`\`bash
# Check system health
curl http://localhost:3003/health/detailed

# View performance metrics
curl http://localhost:3003/api/monitoring/performance

# Check database performance
curl http://localhost:3003/api/monitoring/database/report

# View active alerts
curl http://localhost:3003/api/monitoring/alerts
\`\`\`

## Best Practices

1. **Use monitoring hooks** in all screen components
2. **Track critical user journeys** with custom metrics
3. **Set up alerting webhooks** for production environments
4. **Regularly review performance reports** to identify trends
5. **Monitor memory usage** to prevent app crashes

## Production Considerations

- Enable monitoring selectively (avoid performance overhead)
- Configure appropriate log retention policies
- Set up external alerting (Slack, email, PagerDuty)
- Monitor disk space for log files
- Consider using APM tools for advanced monitoring

## Support

For issues or questions about the monitoring system:
1. Check the troubleshooting section above
2. Review monitoring logs in \`backend/logs/\`
3. Use debug endpoints to inspect system state
4. Consider enabling verbose logging temporarily

---

Generated on: ${new Date().toISOString()}
`;

    await fs.writeFile(
      path.join(this.rootDir, 'MONITORING.md'),
      documentation.trim()
    );
    
    console.log('  ✓ Generated comprehensive monitoring documentation');
  }

  printNextSteps() {
    console.log('\n📋 Next Steps:');
    console.log('');
    console.log('1. 🔧 Backend Integration:');
    console.log('   - Add the code from `backend/monitoring-setup-snippet.js` to your `server.js`');
    console.log('   - Ensure logs directory has write permissions');
    console.log('');
    console.log('2. 🎨 Frontend Integration:');
    console.log('   - Add the code from `IslandRidesApp/monitoring-app-integration.tsx` to your `App.tsx`');
    console.log('   - Update components using the examples provided');
    console.log('');
    console.log('3. ⚙️  Configuration:');
    console.log('   - Copy `.env.monitoring.example` settings to your `.env` file');
    console.log('   - Adjust thresholds in `monitoring-config.json` as needed');
    console.log('');
    console.log('4. 🧪 Testing:');
    console.log('   - Start your application and visit the monitoring endpoints');
    console.log('   - Test alerts by triggering slow operations');
    console.log('   - Check health endpoints: `curl http://localhost:3003/health`');
    console.log('');
    console.log('5. 📊 Dashboard:');
    console.log('   - Import and use the MonitoringDashboard component in your admin panel');
    console.log('   - Set up WebSocket server for real-time alerts');
    console.log('');
    console.log('6. 🚨 Production Setup:');
    console.log('   - Configure webhook URLs for external alerting');
    console.log('   - Set up log rotation and retention policies');
    console.log('   - Monitor disk space and system resources');
    console.log('');
    console.log('📚 Documentation: See MONITORING.md for detailed usage instructions');
    console.log('');
    console.log('🎉 Happy monitoring! Your app performance issues will be caught early.');
  }
}

// Run the setup
if (require.main === module) {
  const setup = new MonitoringSetup();
  setup.setup().catch(console.error);
}

module.exports = MonitoringSetup;