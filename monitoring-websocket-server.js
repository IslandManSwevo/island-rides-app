const WebSocket = require('ws');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'monitoring-websocket' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

class MonitoringWebSocketServer {
  constructor(port = 3004) {
    this.port = port;
    this.wss = null;
    this.clients = new Map();
    this.alertHistory = [];
    this.maxAlertHistory = 100;
  }

  start() {
    this.wss = new WebSocket.Server({ 
      port: this.port,
      perMessageDeflate: false
    });

    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      const clientInfo = {
        id: clientId,
        connectedAt: Date.now(),
        ip: req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        subscriptions: new Set(['alerts', 'performance'])
      };

      this.clients.set(ws, clientInfo);
      logger.info(`Client connected: ${clientId} from ${clientInfo.ip}`);

      // Send connection acknowledgment and recent alerts
      this.sendToClient(ws, {
        type: 'connection_ack',
        clientId,
        timestamp: Date.now(),
        recentAlerts: this.alertHistory.slice(-10)
      });

      // Handle incoming messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(ws, data);
        } catch (error) {
          logger.error('Invalid message from client', { clientId, error: error.message });
          this.sendToClient(ws, {
            type: 'error',
            message: 'Invalid JSON message'
          });
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        logger.info(`Client disconnected: ${clientId}`);
        this.clients.delete(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error(`WebSocket error for client ${clientId}:`, error);
        this.clients.delete(ws);
      });
    });

    logger.info(`Monitoring WebSocket server started on port ${this.port}`);
    return this.wss;
  }

  handleClientMessage(ws, data) {
    const clientInfo = this.clients.get(ws);
    if (!clientInfo) return;

    switch (data.type) {
      case 'subscribe':
        this.handleSubscription(ws, data);
        break;
        
      case 'unsubscribe':
        this.handleUnsubscription(ws, data);
        break;
        
      case 'acknowledge_alert':
        this.handleAlertAcknowledgment(ws, data);
        break;
        
      case 'ping':
        this.sendToClient(ws, { type: 'pong', timestamp: Date.now() });
        break;
        
      default:
        logger.warn(`Unknown message type: ${data.type} from client ${clientInfo.id}`);
    }
  }

  handleSubscription(ws, data) {
    const clientInfo = this.clients.get(ws);
    const { channels } = data;
    
    if (Array.isArray(channels)) {
      channels.forEach(channel => {
        clientInfo.subscriptions.add(channel);
      });
      
      this.sendToClient(ws, {
        type: 'subscription_updated',
        subscriptions: Array.from(clientInfo.subscriptions)
      });
      
      logger.info(`Client ${clientInfo.id} subscribed to channels: ${channels.join(', ')}`);
    }
  }

  handleUnsubscription(ws, data) {
    const clientInfo = this.clients.get(ws);
    const { channels } = data;
    
    if (Array.isArray(channels)) {
      channels.forEach(channel => {
        clientInfo.subscriptions.delete(channel);
      });
      
      this.sendToClient(ws, {
        type: 'subscription_updated',
        subscriptions: Array.from(clientInfo.subscriptions)
      });
      
      logger.info(`Client ${clientInfo.id} unsubscribed from channels: ${channels.join(', ')}`);
    }
  }

  handleAlertAcknowledgment(ws, data) {
    const clientInfo = this.clients.get(ws);
    const { alertId } = data;
    
    // Update alert history
    const alert = this.alertHistory.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledgedBy = clientInfo.id;
      alert.acknowledgedAt = Date.now();
      
      // Notify all clients about the acknowledgment
      this.broadcastToSubscribers('alerts', {
        type: 'alert_acknowledged',
        alertId,
        acknowledgedBy: clientInfo.id,
        timestamp: Date.now()
      });
      
      logger.info(`Alert ${alertId} acknowledged by client ${clientInfo.id}`);
    }
  }

  // Method to broadcast performance alerts
  broadcastAlert(alert) {
    const alertData = {
      id: alert.id || this.generateAlertId(),
      type: 'performance_alert',
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      timestamp: alert.timestamp || Date.now(),
      source: alert.source,
      metadata: alert.metadata,
      acknowledged: false
    };

    // Store in history
    this.alertHistory.push(alertData);
    if (this.alertHistory.length > this.maxAlertHistory) {
      this.alertHistory.shift();
    }

    // Broadcast to subscribed clients
    this.broadcastToSubscribers('alerts', alertData);

    logger.info(`Alert broadcasted: ${alertData.title} (${alertData.severity})`);
  }

  // Method to broadcast performance metrics
  broadcastMetrics(metrics) {
    const metricsData = {
      type: 'performance_metrics',
      timestamp: Date.now(),
      metrics
    };

    this.broadcastToSubscribers('performance', metricsData);
  }

  // Method to broadcast system status updates
  broadcastSystemStatus(status) {
    const statusData = {
      type: 'system_status',
      timestamp: Date.now(),
      status
    };

    this.broadcastToSubscribers('system', statusData);
  }

  broadcastToSubscribers(channel, data) {
    let sentCount = 0;
    
    this.clients.forEach((clientInfo, ws) => {
      if (clientInfo.subscriptions.has(channel) && ws.readyState === WebSocket.OPEN) {
        this.sendToClient(ws, data);
        sentCount++;
      }
    });

    logger.debug(`Broadcasted ${data.type} to ${sentCount} clients on channel ${channel}`);
  }

  sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  // Get server statistics
  getStats() {
    const now = Date.now();
    const clientStats = Array.from(this.clients.values()).map(client => ({
      id: client.id,
      connectedAt: client.connectedAt,
      uptime: now - client.connectedAt,
      subscriptions: Array.from(client.subscriptions),
      ip: client.ip
    }));

    return {
      port: this.port,
      connectedClients: this.clients.size,
      totalAlertsReceived: this.alertHistory.length,
      uptime: now - this.startTime,
      clients: clientStats
    };
  }

  // REST API endpoints for integration
  createRESTEndpoints(app) {
    // WebSocket server stats
    app.get('/api/monitoring/websocket/stats', (req, res) => {
      res.json(this.getStats());
    });

    // Send test alert
    app.post('/api/monitoring/websocket/test-alert', (req, res) => {
      const { severity = 'info', message = 'Test alert' } = req.body;
      
      this.broadcastAlert({
        severity,
        title: 'Test Alert',
        message,
        source: 'WebSocket API',
        metadata: { test: true }
      });

      res.json({
        success: true,
        message: 'Test alert sent',
        connectedClients: this.clients.size
      });
    });

    // Get recent alerts
    app.get('/api/monitoring/websocket/alerts', (req, res) => {
      const limit = parseInt(req.query.limit) || 50;
      const alerts = this.alertHistory
        .slice(-limit)
        .sort((a, b) => b.timestamp - a.timestamp);

      res.json({
        alerts,
        total: this.alertHistory.length
      });
    });

    logger.info('WebSocket REST endpoints configured');
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      logger.info('Monitoring WebSocket server stopped');
    }
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const port = process.env.WEBSOCKET_PORT || 3004;
  const server = new MonitoringWebSocketServer(port);
  server.startTime = Date.now();
  
  server.start();

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down WebSocket server...');
    server.stop();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down WebSocket server...');
    server.stop();
    process.exit(0);
  });

  // Test alert simulation (for development)
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const severities = ['info', 'warning', 'critical'];
      const messages = [
        'High CPU usage detected',
        'Slow database query',
        'Memory usage approaching limit',
        'API response time elevated'
      ];
      
      server.broadcastAlert({
        severity: severities[Math.floor(Math.random() * severities.length)],
        title: 'Simulated Alert',
        message: messages[Math.floor(Math.random() * messages.length)],
        source: 'Development Simulator',
        metadata: { simulation: true }
      });
    }, 30000); // Every 30 seconds in development
  }
}

module.exports = MonitoringWebSocketServer;