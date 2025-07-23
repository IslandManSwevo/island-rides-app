# KeyLo App - Comprehensive Monitoring System Setup

## 🎉 Setup Complete!

Your comprehensive automated monitoring system for the KeyLo app has been successfully created. This monitoring system will help you track performance metrics, identify bottlenecks, and get real-time alerts about issues during the loading investigation.

## 📊 What's Included

### 1. Frontend Performance Monitoring
- **Location**: `IslandRidesApp/src/services/PerformanceMonitoringService.ts`
- **Features**:
  - Component render time tracking
  - API response time monitoring  
  - Memory usage tracking
  - Navigation performance
  - Custom metrics support
  - Real-time alerting integration

### 2. API Response Time Tracking
- **Location**: `backend/middleware/performanceMiddleware.js`
- **Features**:
  - Automatic API endpoint monitoring
  - Response time analysis
  - Error rate tracking
  - Memory usage per request
  - System resource monitoring
  - Performance reports

### 3. Database Query Monitoring
- **Location**: `backend/middleware/databaseMonitoring.js`
- **Features**:
  - SQL query execution time tracking
  - Slow query detection
  - Long-running query alerts
  - Memory usage analysis
  - Connection pool monitoring
  - Query performance reports

### 4. Real-time Alerting System
- **Location**: `IslandRidesApp/src/services/AlertingService.ts`
- **Features**:
  - Configurable alert thresholds
  - Multiple alert channels (console, toast, websocket)
  - Alert acknowledgment system
  - Severity-based routing
  - Cooldown mechanisms
  - Alert history tracking

### 5. Monitoring Dashboard
- **Location**: `IslandRidesApp/src/components/monitoring/MonitoringDashboard.tsx`
- **Features**:
  - Visual performance metrics display
  - Real-time system status
  - Alert management interface
  - Performance trend charts
  - System health overview
  - Interactive controls

### 6. Monitoring Hooks
- **Location**: `IslandRidesApp/src/hooks/useMonitoring.ts`
- **Features**:
  - Easy component integration
  - Screen-level monitoring
  - API call tracking utilities
  - Custom metric recording
  - Operation timing helpers

### 7. WebSocket Real-time Server
- **Location**: `monitoring-websocket-server.js`
- **Features**:
  - Real-time alert broadcasting
  - Client subscription management
  - Alert acknowledgment handling
  - Performance metrics streaming
  - Connection statistics

## 🚀 Quick Start Guide

### Step 1: Backend Integration

Add this code to your `backend/server.js` file:

```javascript
// Add after your existing imports
const MonitoringIntegration = require('./monitoring-integration');

// Add after app and db initialization
if (process.env.NODE_ENV !== 'test') {
  const monitoring = new MonitoringIntegration();
  monitoring.initialize(app, db);
  console.log('📊 Monitoring system initialized');
}
```

### Step 2: Frontend Integration

Add this to your `IslandRidesApp/App.tsx`:

```typescript
// Add imports
import PerformanceMonitoringService from './src/services/PerformanceMonitoringService';
import AlertingService from './src/services/AlertingService';

// Initialize monitoring (add before your main App component)
const performanceService = PerformanceMonitoringService.getInstance();
const alertingService = AlertingService.getInstance();

if (__DEV__) {
  performanceService.setEnabled(true);
  alertingService.setEnabled(true);
  
  // Setup toast alert handler
  if (typeof window !== 'undefined') {
    window.addEventListener('performanceAlert', (event) => {
      const { alert, config } = event.detail;
      console.warn(`🚨 Performance Alert: ${alert.title}`, alert);
      
      // Integrate with your toast system here
      // Example: Toast.show({ type: 'warning', text1: alert.title, text2: alert.message });
    });
  }
}
```

### Step 3: Component Monitoring

Use monitoring hooks in your screens:

```typescript
import { useScreenMonitoring } from '../hooks/useMonitoring';

export const SearchScreen = () => {
  const { 
    markScreenLoaded, 
    trackUserInteraction, 
    trackApiCall 
  } = useScreenMonitoring('SearchScreen');

  useEffect(() => {
    markScreenLoaded();
  }, []);

  const handleSearch = async (query) => {
    trackUserInteraction('search');
    
    const results = await trackApiCall(
      '/api/vehicles/search',
      () => fetch(`/api/vehicles/search?q=${query}`).then(res => res.json())
    );
    
    return results;
  };

  // ... rest of component
};
```

### Step 4: Start WebSocket Server

```bash
# In a separate terminal
node monitoring-websocket-server.js
```

### Step 5: Add Monitoring Dashboard

Import and use the dashboard component:

```typescript
import MonitoringDashboard from '../components/monitoring/MonitoringDashboard';

// Use in your admin or debug screen
<MonitoringDashboard />
```

## 📋 Available Endpoints

### Performance Monitoring
- `GET /api/monitoring/metrics` - Raw performance metrics
- `GET /api/monitoring/performance` - Performance report
- `GET /api/monitoring/dashboard` - Complete dashboard data

### Database Monitoring
- `GET /api/monitoring/database` - Database metrics
- `GET /api/monitoring/database/report` - Database performance report
- `GET /api/monitoring/database/slow-queries` - Slow query analysis

### Health Checks
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system health

### WebSocket Monitoring
- `GET /api/monitoring/websocket/stats` - WebSocket server statistics
- `POST /api/monitoring/websocket/test-alert` - Send test alert

## 🔧 Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Enable/disable monitoring
MONITORING_ENABLED=true

# Performance thresholds
MONITORING_SLOW_QUERY_MS=100
MONITORING_SLOW_API_MS=500
MONITORING_MEMORY_WARNING_MB=150

# WebSocket server
WEBSOCKET_PORT=3004

# Alert webhooks (optional)
MONITORING_WEBHOOK_URL=
MONITORING_SLACK_WEBHOOK=
```

### Monitoring Thresholds

| Metric | Warning | Critical | Description |
|--------|---------|----------|-------------|
| Render Time | 16ms | 50ms | Component render duration |
| API Response | 1000ms | 2000ms | API call duration |
| Memory Usage | 150MB | 200MB | Heap memory consumption |
| Database Query | 100ms | 500ms | SQL query execution time |

## 🧪 Testing the System

1. **Start your application** with the monitoring integration
2. **Test health endpoint**: `curl http://localhost:3003/health`
3. **View performance metrics**: `curl http://localhost:3003/api/monitoring/performance`
4. **Trigger test alert**: `curl -X POST http://localhost:3003/api/monitoring/websocket/test-alert`
5. **Check WebSocket connection** on port 3004

## 🚨 Alert Types

### Critical Alerts
- Very slow renders (>50ms)
- API errors (500+ status codes)
- Critical memory usage (>200MB)
- Very slow database queries (>500ms)

### Warning Alerts
- Slow renders (>16ms)
- Slow API responses (>1s)
- High memory usage (>150MB)
- Slow database queries (>100ms)

### Info Alerts
- Custom metric thresholds
- System status changes
- Debug information

## 🔍 Troubleshooting Loading Issues

With this monitoring system, you can now:

1. **Identify slow components** - Check render time metrics
2. **Find slow API calls** - Monitor response times by endpoint
3. **Detect database bottlenecks** - Analyze slow queries
4. **Track memory leaks** - Monitor memory usage trends
5. **Get real-time alerts** - Immediate notification of issues

### Debug Commands

```bash
# Check overall system health
curl http://localhost:3003/health/detailed

# View performance summary
curl http://localhost:3003/api/monitoring/performance | jq

# Check database performance
curl http://localhost:3003/api/monitoring/database/report | jq

# View slowest queries
curl http://localhost:3003/api/monitoring/database/slow-queries | jq

# Get dashboard data
curl http://localhost:3003/api/monitoring/dashboard | jq
```

## 📈 Performance Optimization Tips

Based on monitoring data, you can:

1. **Optimize slow renders** - Use React.memo, reduce re-renders
2. **Improve API performance** - Add caching, optimize queries
3. **Fix memory leaks** - Monitor memory trends, fix listeners
4. **Optimize database** - Add indexes for slow queries
5. **Reduce bundle size** - Monitor load times, code split

## 🛡️ Production Considerations

- Set appropriate log retention policies
- Configure external alerting (Slack, email)
- Monitor disk space for log files
- Use environment variables for configuration
- Consider performance overhead of monitoring

## 📚 Files Created

1. **Frontend Services**:
   - `IslandRidesApp/src/services/PerformanceMonitoringService.ts`
   - `IslandRidesApp/src/services/AlertingService.ts`

2. **Backend Middleware**:
   - `backend/middleware/performanceMiddleware.js`
   - `backend/middleware/databaseMonitoring.js`
   - `backend/monitoring-integration.js`

3. **Frontend Components**:
   - `IslandRidesApp/src/components/monitoring/MonitoringDashboard.tsx`
   - `IslandRidesApp/src/hooks/useMonitoring.ts`

4. **WebSocket Server**:
   - `monitoring-websocket-server.js`

5. **Setup & Documentation**:
   - `setup-monitoring.js`
   - This monitoring setup document

## 🎯 Next Steps

1. **Integrate the code** following the Quick Start guide above
2. **Test the endpoints** to ensure everything works
3. **Start monitoring** your app's performance during load testing
4. **Set up alerts** for your specific thresholds
5. **Use the dashboard** to visualize performance trends

## 💡 Tips for Loading Issue Investigation

With this monitoring system active:

- Watch for **slow render alerts** during page loads
- Monitor **API response times** for data fetching bottlenecks  
- Check **database query performance** for data access issues
- Track **memory usage patterns** during heavy operations
- Use **custom metrics** to measure specific loading operations

Your KeyLo app now has comprehensive monitoring that will help you quickly identify and resolve any loading performance issues! 🚀

---

**Happy Monitoring!** 📊✨

For questions or issues, check the monitoring logs and use the debug endpoints to inspect system state.