import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions } from 'react-native';
import PerformanceMonitoringService from '../../services/PerformanceMonitoringService';
import AlertingService from '../../services/AlertingService';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  severity?: 'good' | 'warning' | 'critical';
  subtitle?: string;
}

interface ChartDataPoint {
  timestamp: number;
  value: number;
  label?: string;
}

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  acknowledged: boolean;
  resolvedAt?: number;
}

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  timestamp: number;
  type: string;
}

interface PerformanceData {
  summary: {
    totalMetrics: number;
    criticalIssues: number;
    warnings: number;
    timeRange: {
      start: number;
      end: number;
    };
  };
  metrics: Record<string, PerformanceMetric[]>;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  unit = '', 
  trend, 
  severity = 'good', 
  subtitle 
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
      default: return '';
    }
  };

  const getSeverityColor = () => {
    switch (severity) {
      case 'good': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <View style={[styles.metricCard, { borderLeftColor: getSeverityColor() }]}>
      <Text style={styles.metricTitle}>{title}</Text>
      <View style={styles.metricValueContainer}>
        <Text style={styles.metricValue}>
          {typeof value === 'number' ? Math.round(value * 100) / 100 : value}
          <Text style={styles.metricUnit}>{unit}</Text>
        </Text>
        {trend && <Text style={styles.trendIcon}>{getTrendIcon()}</Text>}
      </View>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );
};

interface SimpleChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  showLabels?: boolean;
}

const SimpleChart: React.FC<SimpleChartProps> = ({ 
  data, 
  height = 120, 
  color = '#3b82f6',
  showLabels = false 
}) => {
  const { width } = Dimensions.get('window');
  const chartWidth = width - 40;
  
  if (data.length === 0) {
    return (
      <View style={[styles.chart, { height }]}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = height - ((point.value - minValue) / range) * height;
    return { x, y };
  });

  // Simple line chart using View elements (for a real app, you'd use a proper charting library)
  return (
    <View style={[styles.chart, { height }]}>
      <View style={styles.chartContainer}>
        {points.map((point, index) => (
          <View
            key={index}
            style={[
              styles.chartPoint,
              {
                left: point.x,
                top: point.y,
                backgroundColor: color
              }
            ]}
          />
        ))}
      </View>
      {showLabels && (
        <View style={styles.chartLabels}>
          <Text style={styles.chartLabel}>{minValue.toFixed(1)}</Text>
          <Text style={styles.chartLabel}>{maxValue.toFixed(1)}</Text>
        </View>
      )}
    </View>
  );
};

interface AlertListProps {
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
}

const AlertList: React.FC<AlertListProps> = ({ alerts, onAcknowledge, onResolve }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <View style={styles.alertList}>
      {alerts.length === 0 ? (
        <Text style={styles.noAlertsText}>No active alerts</Text>
      ) : (
        alerts.map(alert => (
          <View key={alert.id} style={styles.alertItem}>
            <View style={[styles.alertIndicator, { backgroundColor: getSeverityColor(alert.severity) }]} />
            <View style={styles.alertContent}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertTime}>{getTimeAgo(alert.timestamp)}</Text>
              </View>
              <Text style={styles.alertMessage}>{alert.message}</Text>
              <View style={styles.alertActions}>
                {!alert.acknowledged && (
                  <Pressable 
                    style={styles.alertButton} 
                    onPress={() => onAcknowledge(alert.id)}
                  >
                    <Text style={styles.alertButtonText}>Acknowledge</Text>
                  </Pressable>
                )}
                {!alert.resolvedAt && (
                  <Pressable 
                    style={[styles.alertButton, styles.resolveButton]} 
                    onPress={() => onResolve(alert.id)}
                  >
                    <Text style={styles.alertButtonText}>Resolve</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
};

export const MonitoringDashboard: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertStats, setAlertStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'alerts'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const performanceService = PerformanceMonitoringService.getInstance();
  const alertingService = AlertingService.getInstance();

  useEffect(() => {
    loadData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setRefreshing(true);
      
      // Load performance data
      const report = performanceService.generateReport();
      setPerformanceData(report);
      
      // Load alerts
      const alertData = alertingService.getAlerts({ acknowledged: false });
      setAlerts(alertData.slice(0, 10)); // Show latest 10 alerts
      
      // Load alert stats
      const stats = alertingService.getAlertStats();
      setAlertStats(stats);
      
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    alertingService.acknowledgeAlert(alertId);
    loadData();
  };

  const handleResolveAlert = (alertId: string) => {
    alertingService.resolveAlert(alertId);
    loadData();
  };

  const renderOverview = () => {
    if (!performanceData || !alertStats) {
      return <Text style={styles.loadingText}>Loading...</Text>;
    }

    const renderMetrics = performanceData.metrics.render || [];
    const apiMetrics = performanceData.metrics.api || [];
    const memoryMetrics = performanceData.metrics.memory || [];

    const avgRenderTime = renderMetrics.length > 0 
      ? renderMetrics.reduce((sum: number, m: any) => sum + m.value, 0) / renderMetrics.length 
      : 0;

    const avgApiTime = apiMetrics.length > 0 
      ? apiMetrics.reduce((sum: number, m: any) => sum + m.value, 0) / apiMetrics.length 
      : 0;

    const avgMemoryUsage = memoryMetrics.length > 0 
      ? memoryMetrics.reduce((sum: number, m: any) => sum + m.value, 0) / memoryMetrics.length 
      : 0;

    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.sectionTitle}>System Overview</Text>
        
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Avg Render Time"
            value={avgRenderTime}
            unit="ms"
            severity={avgRenderTime > 16 ? 'critical' : avgRenderTime > 8 ? 'warning' : 'good'}
            subtitle="Target: <16ms"
          />
          
          <MetricCard
            title="Avg API Response"
            value={avgApiTime}
            unit="ms"
            severity={avgApiTime > 2000 ? 'critical' : avgApiTime > 1000 ? 'warning' : 'good'}
            subtitle="Target: <1000ms"
          />
          
          <MetricCard
            title="Memory Usage"
            value={avgMemoryUsage}
            unit="MB"
            severity={avgMemoryUsage > 200 ? 'critical' : avgMemoryUsage > 150 ? 'warning' : 'good'}
            subtitle="Available heap"
          />
          
          <MetricCard
            title="Active Alerts"
            value={alertStats.total - alertStats.acknowledged}
            severity={alertStats.critical > 0 ? 'critical' : alertStats.warning > 0 ? 'warning' : 'good'}
            subtitle={`${alertStats.critical} critical`}
          />
        </View>

        <Text style={styles.sectionTitle}>Recent Performance Trends</Text>
        
        {renderMetrics.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Render Performance</Text>
            <SimpleChart
              data={renderMetrics.slice(-20).map((m: any) => ({ timestamp: m.timestamp, value: m.value }))}
              color="#f59e0b"
              showLabels={true}
            />
          </View>
        )}

        {apiMetrics.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>API Response Times</Text>
            <SimpleChart
              data={apiMetrics.slice(-20).map((m: any) => ({ timestamp: m.timestamp, value: m.value }))}
              color="#3b82f6"
              showLabels={true}
            />
          </View>
        )}
      </ScrollView>
    );
  };

  const renderPerformance = () => {
    if (!performanceData) {
      return <Text style={styles.loadingText}>Loading...</Text>;
    }

    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Performance Details</Text>
        
        <View style={styles.detailSection}>
          <Text style={styles.detailTitle}>Summary</Text>
          <Text style={styles.detailText}>Total Metrics: {performanceData.summary.totalMetrics}</Text>
          <Text style={styles.detailText}>Critical Issues: {performanceData.summary.criticalIssues}</Text>
          <Text style={styles.detailText}>Warnings: {performanceData.summary.warnings}</Text>
          <Text style={styles.detailText}>
            Time Range: {new Date(performanceData.summary.timeRange.start).toLocaleTimeString()} - {new Date(performanceData.summary.timeRange.end).toLocaleTimeString()}
          </Text>
        </View>

        {Object.entries(performanceData.metrics).map(([type, metrics]: [string, PerformanceMetric[]]) => {
          if (metrics.length === 0) return null;
          
          return (
            <View key={type} style={styles.detailSection}>
              <Text style={styles.detailTitle}>{type.charAt(0).toUpperCase() + type.slice(1)} Metrics</Text>
              <Text style={styles.detailText}>Count: {metrics.length}</Text>
              <Text style={styles.detailText}>
                Avg: {Math.round((metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length) * 100) / 100}
              </Text>
              <Text style={styles.detailText}>
                Max: {Math.max(...metrics.map(m => m.value))}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderAlerts = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.alertsHeader}>
        <Text style={styles.sectionTitle}>Active Alerts</Text>
        <Pressable style={styles.refreshButton} onPress={loadData}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </Pressable>
      </View>
      
      {alertStats && (
        <View style={styles.alertStatsContainer}>
          <View style={styles.alertStat}>
            <Text style={styles.alertStatNumber}>{alertStats.critical}</Text>
            <Text style={styles.alertStatLabel}>Critical</Text>
          </View>
          <View style={styles.alertStat}>
            <Text style={styles.alertStatNumber}>{alertStats.warning}</Text>
            <Text style={styles.alertStatLabel}>Warning</Text>
          </View>
          <View style={styles.alertStat}>
            <Text style={styles.alertStatNumber}>{alertStats.info}</Text>
            <Text style={styles.alertStatLabel}>Info</Text>
          </View>
          <View style={styles.alertStat}>
            <Text style={styles.alertStatNumber}>{alertStats.acknowledged}</Text>
            <Text style={styles.alertStatLabel}>Acknowledged</Text>
          </View>
        </View>
      )}
      
      <AlertList
        alerts={alerts}
        onAcknowledge={handleAcknowledgeAlert}
        onResolve={handleResolveAlert}
      />
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'performance':
        return renderPerformance();
      case 'alerts':
        return renderAlerts();
      default:
        return renderOverview();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Performance Monitor</Text>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: alertStats?.critical > 0 ? '#ef4444' : '#10b981' }]} />
          <Text style={styles.statusText}>
            {alertStats?.critical > 0 ? 'Issues Detected' : 'System Healthy'}
          </Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'performance', label: 'Performance' },
          { key: 'alerts', label: 'Alerts' }
        ].map(tab => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 32,
  },
  metricCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    margin: 4,
    borderRadius: 8,
    borderLeftWidth: 4,
    minWidth: '45%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  metricTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  metricUnit: {
    fontSize: 14,
    color: '#6b7280',
  },
  trendIcon: {
    fontSize: 20,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  chartSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  chart: {
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    position: 'relative',
  },
  chartContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  chartPoint: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#9ca3af',
  },
  chartLabels: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  detailSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  alertStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  alertStat: {
    alignItems: 'center',
  },
  alertStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  alertStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  alertList: {
    flex: 1,
  },
  noAlertsText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#9ca3af',
  },
  alertItem: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  alertIndicator: {
    width: 4,
  },
  alertContent: {
    flex: 1,
    padding: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  alertTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  alertMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
  },
  alertButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  resolveButton: {
    backgroundColor: '#dcfce7',
  },
  alertButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
});

export default MonitoringDashboard;