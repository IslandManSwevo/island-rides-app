import { loggingService } from './LoggingService';

interface AlertData {
  type: string;
  value?: number;
  statusCode?: number;
  componentName?: string;
  endpoint?: string;
  fromScreen?: string;
  toScreen?: string;
  name?: string;
  source?: string;
  [key: string]: unknown;
}

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: 'performance' | 'error' | 'system' | 'custom';
  title: string;
  message: string;
  timestamp: number;
  source: string;
  metadata: Record<string, unknown>;
  acknowledged: boolean;
  resolvedAt?: number;
}

interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  condition: (data: AlertData) => boolean;
  severity: 'critical' | 'warning' | 'info';
  type: 'performance' | 'error' | 'system' | 'custom';
  cooldown: number; // milliseconds
  channels: AlertChannel[];
  metadata?: Record<string, unknown>;
}

interface AlertChannel {
  type: 'console' | 'toast' | 'websocket' | 'webhook' | 'email';
  config: Record<string, unknown>;
}

interface AlertStats {
  total: number;
  critical: number;
  warning: number;
  info: number;
  acknowledged: number;
  resolved: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
}

export class AlertingService {
  private static instance: AlertingService;
  private alerts: Map<string, Alert> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private cooldowns: Map<string, number> = new Map();
  private logger: typeof loggingService;
  private maxAlerts: number = 1000;
  private websocket: WebSocket | null = null;
  private isEnabled: boolean = true;

  private constructor() {
    this.logger = loggingService;
    this.initializeDefaultRules();
    this.setupWebSocket();
  }

  static getInstance(): AlertingService {
    if (!AlertingService.instance) {
      AlertingService.instance = new AlertingService();
    }
    return AlertingService.instance;
  }

  private initializeDefaultRules(): void {
    // Performance alert rules
    this.addRule({
      id: 'slow_render',
      name: 'Slow Render Detection',
      enabled: true,
      condition: (data) => data.type === 'render' && (data.value ?? 0) > 16,
      severity: 'warning',
      type: 'performance',
      cooldown: 5000,
      channels: [
        { type: 'console', config: {} },
        { type: 'toast', config: { duration: 5000 } }
      ]
    });

    this.addRule({
      id: 'very_slow_render',
      name: 'Very Slow Render Detection',
      enabled: true,
      condition: (data) => data.type === 'render' && (data.value ?? 0) > 50,
      severity: 'critical',
      type: 'performance',
      cooldown: 3000,
      channels: [
        { type: 'console', config: {} },
        { type: 'toast', config: { duration: 10000 } },
        { type: 'websocket', config: {} }
      ]
    });

    this.addRule({
      id: 'api_error',
      name: 'API Error Detection',
      enabled: true,
      condition: (data) => data.type === 'api' && (data.statusCode ?? 0) >= 500,
      severity: 'critical',
      type: 'error',
      cooldown: 10000,
      channels: [
        { type: 'console', config: {} },
        { type: 'toast', config: { duration: 8000 } },
        { type: 'websocket', config: {} }
      ]
    });

    this.addRule({
      id: 'slow_api',
      name: 'Slow API Response',
      enabled: true,
      condition: (data) => data.type === 'api' && (data.value ?? 0) > 2000,
      severity: 'warning',
      type: 'performance',
      cooldown: 30000,
      channels: [
        { type: 'console', config: {} },
        { type: 'toast', config: { duration: 6000 } }
      ]
    });

    this.addRule({
      id: 'memory_high',
      name: 'High Memory Usage',
      enabled: true,
      condition: (data) => data.type === 'memory' && (data.value ?? 0) > 150,
      severity: 'warning',
      type: 'system',
      cooldown: 60000,
      channels: [
        { type: 'console', config: {} }
      ]
    });

    this.addRule({
      id: 'memory_critical',
      name: 'Critical Memory Usage',
      enabled: true,
      condition: (data) => data.type === 'memory' && (data.value ?? 0) > 200,
      severity: 'critical',
      type: 'system',
      cooldown: 30000,
      channels: [
        { type: 'console', config: {} },
        { type: 'toast', config: { duration: 10000 } },
        { type: 'websocket', config: {} }
      ]
    });
  }

  private setupWebSocket(): void {
    // Set up WebSocket connection for real-time alerts
    if (typeof window !== 'undefined' && window.WebSocket) {
      try {
        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3004';
        this.websocket = new WebSocket(wsUrl);
        
        this.websocket.onopen = () => {
          this.logger.info('AlertingService WebSocket connected');
        };

        this.websocket.onerror = (error) => {
          this.logger.warn('AlertingService WebSocket error', { error });
        };

        this.websocket.onclose = () => {
          this.logger.info('AlertingService WebSocket disconnected');
          // Attempt to reconnect after 5 seconds
          setTimeout(() => {
            if (this.isEnabled) {
              this.setupWebSocket();
            }
          }, 5000);
        };
      } catch (error) {
        this.logger.warn('Failed to setup WebSocket for alerting', { error });
      }
    }
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled && this.websocket) {
      this.websocket.close();
      this.websocket = null;
    } else if (enabled && !this.websocket) {
      this.setupWebSocket();
    }
  }

  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    this.logger.debug(`Alert rule added: ${rule.name}`);
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    this.logger.debug(`Alert rule removed: ${ruleId}`);
  }

  updateRule(ruleId: string, updates: Partial<AlertRule>): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.rules.set(ruleId, { ...rule, ...updates });
      this.logger.debug(`Alert rule updated: ${ruleId}`);
    }
  }

  enableRule(ruleId: string): void {
    this.updateRule(ruleId, { enabled: true });
  }

  disableRule(ruleId: string): void {
    this.updateRule(ruleId, { enabled: false });
  }

  checkRules(data: AlertData): void {
    if (!this.isEnabled) return;

    this.rules.forEach((rule) => {
      if (!rule.enabled) return;

      try {
        if (rule.condition(data)) {
          this.triggerAlert(rule, data);
        }
      } catch (error) {
        this.logger.warn(`Error evaluating alert rule ${rule.id}`, { error, data });
      }
    });
  }

  private triggerAlert(rule: AlertRule, data: AlertData): void {
    const cooldownKey = `${rule.id}_${JSON.stringify(data).substring(0, 100)}`;
    const now = Date.now();
    
    // Check cooldown
    const lastTriggered = this.cooldowns.get(cooldownKey);
    if (lastTriggered && now - lastTriggered < rule.cooldown) {
      return;
    }

    this.cooldowns.set(cooldownKey, now);

    const alert: Alert = {
      id: this.generateAlertId(),
      severity: rule.severity,
      type: rule.type,
      title: rule.name,
      message: this.generateAlertMessage(rule, data),
      timestamp: now,
      source: (data.source as string) || 'Unknown',
      metadata: {
        rule: rule.id,
        originalData: data,
        ...rule.metadata
      },
      acknowledged: false
    };

    this.storeAlert(alert);
    this.sendAlert(alert, rule.channels);
  }

  private generateAlertMessage(rule: AlertRule, data: AlertData): string {
    switch (rule.type) {
      case 'performance':
        if (data.type === 'render') {
          return `Slow render detected: ${data.componentName || 'Component'} took ${Math.round(data.value || 0)}ms to render`;
        } else if (data.type === 'api') {
          return `Slow API response: ${data.endpoint || 'Unknown endpoint'} took ${Math.round(data.value || 0)}ms`;
        } else if (data.type === 'navigation') {
          return `Slow navigation: ${data.fromScreen} to ${data.toScreen} took ${Math.round(data.value || 0)}ms`;
        }
        return `Performance issue detected: ${data.name || 'Unknown'} - ${Math.round(data.value || 0)}`;
      
      case 'error':
        if (data.type === 'api') {
          return `API error: ${data.endpoint || 'Unknown endpoint'} returned ${data.statusCode}`;
        }
        return `Error detected: ${data.message || 'Unknown error'}`;
      
      case 'system':
        if (data.type === 'memory') {
          return `High memory usage detected: ${Math.round(data.value || 0)}MB`;
        }
        return `System issue detected: ${data.name || 'Unknown'}`;
      
      default:
        return `Alert triggered: ${rule.name}`;
    }
  }

  private storeAlert(alert: Alert): void {
    this.alerts.set(alert.id, alert);

    // Limit the number of stored alerts
    if (this.alerts.size > this.maxAlerts) {
      const oldestAlertId = Array.from(this.alerts.keys())[0];
      this.alerts.delete(oldestAlertId);
    }

    this.logger.info(`Alert triggered: ${alert.title}`, {
      id: alert.id,
      severity: alert.severity,
      type: alert.type,
      message: alert.message
    });
  }

  private sendAlert(alert: Alert, channels: AlertChannel[]): void {
    channels.forEach((channel) => {
      try {
        switch (channel.type) {
          case 'console':
            this.sendConsoleAlert(alert, channel.config);
            break;
          case 'toast':
            this.sendToastAlert(alert, channel.config);
            break;
          case 'websocket':
            this.sendWebSocketAlert(alert, channel.config);
            break;
          case 'webhook':
            this.sendWebhookAlert(alert, channel.config);
            break;
          default:
            this.logger.warn(`Unknown alert channel type: ${channel.type}`);
        }
      } catch (error) {
        this.logger.warn(`Failed to send alert via ${channel.type}`, { error, alert });
      }
    });
  }

  private sendConsoleAlert(alert: Alert, config: any): void {
    const logLevel = alert.severity === 'critical' ? 'error' : 
                   alert.severity === 'warning' ? 'warn' : 'info';
    
    console[logLevel](`🚨 ${alert.severity.toUpperCase()}: ${alert.title}`, {
      message: alert.message,
      timestamp: new Date(alert.timestamp).toISOString(),
      source: alert.source,
      metadata: alert.metadata
    });
  }

  private sendToastAlert(alert: Alert, config: any): void {
    if (typeof window !== 'undefined') {
      // Create a custom event for toast notifications
      const toastEvent = new CustomEvent('performanceAlert', {
        detail: {
          alert,
          config: {
            duration: config.duration || 5000,
            type: alert.severity
          }
        }
      });
      
      window.dispatchEvent(toastEvent);
    }
  }

  private sendWebSocketAlert(alert: Alert, config: any): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'performance_alert',
        alert,
        config
      }));
    }
  }

  private sendWebhookAlert(alert: Alert, config: any): void {
    if (!config.url) return;

    const payload = {
      alert,
      timestamp: Date.now(),
      service: 'island-rides-app'
    };

    fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify(payload)
    }).catch((error) => {
      this.logger.warn('Failed to send webhook alert', { error, url: config.url });
    });
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.logger.info(`Alert acknowledged: ${alert.title}`);
    }
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolvedAt = Date.now();
      alert.acknowledged = true;
      this.logger.info(`Alert resolved: ${alert.title}`);
    }
  }

  getAlerts(filters?: {
    severity?: 'critical' | 'warning' | 'info';
    type?: 'performance' | 'error' | 'system' | 'custom';
    acknowledged?: boolean;
    resolved?: boolean;
    since?: number;
  }): Alert[] {
    let alerts = Array.from(this.alerts.values());

    if (filters) {
      if (filters.severity) {
        alerts = alerts.filter(alert => alert.severity === filters.severity);
      }
      if (filters.type) {
        alerts = alerts.filter(alert => alert.type === filters.type);
      }
      if (filters.acknowledged !== undefined) {
        alerts = alerts.filter(alert => alert.acknowledged === filters.acknowledged);
      }
      if (filters.resolved !== undefined) {
        alerts = alerts.filter(alert => 
          filters.resolved ? alert.resolvedAt !== undefined : alert.resolvedAt === undefined
        );
      }
      if (filters.since !== undefined) {
        alerts = alerts.filter(alert => alert.timestamp >= filters.since!);
      }
    }

    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  getAlertStats(since?: number): AlertStats {
    const startTime = since || Date.now() - 86400000; // 24 hours by default
    const alerts = this.getAlerts({ since: startTime });

    const stats: AlertStats = {
      total: alerts.length,
      critical: 0,
      warning: 0,
      info: 0,
      acknowledged: 0,
      resolved: 0,
      byType: {},
      bySource: {}
    };

    alerts.forEach(alert => {
      // Count by severity
      stats[alert.severity]++;

      // Count acknowledged and resolved
      if (alert.acknowledged) stats.acknowledged++;
      if (alert.resolvedAt) stats.resolved++;

      // Count by type
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;

      // Count by source
      stats.bySource[alert.source] = (stats.bySource[alert.source] || 0) + 1;
    });

    return stats;
  }

  clearAlerts(olderThan?: number): number {
    const cutoffTime = olderThan || Date.now() - 604800000; // 7 days by default
    let clearedCount = 0;

    this.alerts.forEach((alert, id) => {
      if (alert.timestamp < cutoffTime && alert.acknowledged) {
        this.alerts.delete(id);
        clearedCount++;
      }
    });

    this.logger.info(`Cleared ${clearedCount} old alerts`);
    return clearedCount;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Integration methods for external services
  registerWebhook(url: string, headers?: Record<string, string>): void {
    // Add webhook channel to all critical rules
    this.rules.forEach((rule) => {
      if (rule.severity === 'critical') {
        rule.channels.push({
          type: 'webhook',
          config: { url, headers }
        });
      }
    });
  }

  // Test method for development
  testAlert(severity: 'critical' | 'warning' | 'info' = 'info'): void {
    this.checkRules({
      type: 'custom',
      name: 'Test Alert',
      value: severity === 'critical' ? 100 : severity === 'warning' ? 50 : 10,
      source: 'AlertingService.test'
    });
  }
}

export default AlertingService;