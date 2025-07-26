import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles/theme';
import { StandardErrorBoundary } from '../components/errors/StandardErrorBoundary';

interface DamageReport {
  id: string;
  vehicleId: string;
  type: 'damage' | 'maintenance' | 'inspection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: string;
  photos: string[];
  reportedBy: string;
  reportedAt: string;
  status: 'open' | 'in_progress' | 'resolved';
  estimatedCost?: number;
}

interface VehicleConditionTrackerScreenProps {
  navigation: NavigationProp<any>;
  route: {
    params: {
      vehicleId: number;
    };
  };
}

export const VehicleConditionTrackerScreen: React.FC<VehicleConditionTrackerScreenProps> = ({
  navigation,
  route
}) => {
  const { vehicleId } = route.params;

  const [damageReports, setDamageReports] = useState<DamageReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'damage' | 'maintenance'>('overview');
  const [showReportModal, setShowReportModal] = useState(false);
  const [newReport, setNewReport] = useState({
    type: 'damage' as 'damage' | 'maintenance' | 'inspection',
    severity: 'low' as 'low' | 'medium' | 'high' | 'critical',
    title: '',
    description: '',
    location: '',
  });

  useEffect(() => {
    loadVehicleConditionData();
  }, [vehicleId]);

  const loadVehicleConditionData = async () => {
    try {
      setIsLoading(true);

      // Mock data - replace with actual API calls
      const mockReports: DamageReport[] = [
        {
          id: '1',
          vehicleId: vehicleId.toString(),
          type: 'damage',
          severity: 'medium',
          title: 'Scratch on rear bumper',
          description: 'Minor scratch on the rear bumper, likely from parking',
          location: 'Rear bumper - driver side',
          photos: [],
          reportedBy: 'John Doe',
          reportedAt: '2024-01-15T10:30:00Z',
          status: 'open',
          estimatedCost: 150,
        },
        {
          id: '2',
          vehicleId: vehicleId.toString(),
          type: 'maintenance',
          severity: 'high',
          title: 'Oil change due',
          description: 'Vehicle is due for routine oil change',
          location: 'Engine',
          photos: [],
          reportedBy: 'System',
          reportedAt: '2024-01-10T08:00:00Z',
          status: 'in_progress',
          estimatedCost: 75,
        },
      ];

      setDamageReports(mockReports);
    } catch (error) {
      console.error('Failed to load vehicle condition data:', error);
      Alert.alert('Error', 'Failed to load vehicle condition data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReport = async () => {
    try {
      if (!newReport.title.trim() || !newReport.description.trim()) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const report: DamageReport = {
        id: Date.now().toString(),
        vehicleId: vehicleId.toString(),
        type: newReport.type,
        severity: newReport.severity,
        title: newReport.title,
        description: newReport.description,
        location: newReport.location,
        photos: [],
        reportedBy: 'Current User',
        reportedAt: new Date().toISOString(),
        status: 'open',
      };

      setDamageReports(prev => [report, ...prev]);
      setShowReportModal(false);
      setNewReport({
        type: 'damage',
        severity: 'low',
        title: '',
        description: '',
        location: '',
      });

      Alert.alert('Success', 'Report created successfully');
    } catch (error) {
      console.error('Failed to create report:', error);
      Alert.alert('Error', 'Failed to create report');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#FF4444';
      case 'high': return '#FF8800';
      case 'medium': return '#FFAA00';
      case 'low': return '#00AA00';
      default: return colors.textSecondary;
    }
  };

  const renderOverview = () => {
    // Ensure damageReports is always an array
    const safeDamageReports = Array.isArray(damageReports) ? damageReports : [];

    return (
      <View style={styles.overviewContainer}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{safeDamageReports.filter(r => r.status === 'open').length}</Text>
            <Text style={styles.statLabel}>Open Issues</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{safeDamageReports.filter(r => r.status === 'in_progress').length}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{safeDamageReports.filter(r => r.status === 'resolved').length}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Reports</Text>
        {safeDamageReports.slice(0, 3).map(report => (
        <View key={report.id} style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>{report.title}</Text>
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(report.severity) }]}>
              <Text style={styles.severityText}>{report.severity.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.reportDescription}>{report.description}</Text>
          <Text style={styles.reportDate}>
            {new Date(report.reportedAt).toLocaleDateString()}
          </Text>
        </View>
      ))}
      </View>
    );
  };

  const renderReportModal = () => (
    <Modal
      visible={showReportModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowReportModal(false)}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>New Report</Text>
          <TouchableOpacity onPress={handleCreateReport}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Type</Text>
            <View style={styles.segmentedControl}>
              {['damage', 'maintenance', 'inspection'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.segmentButton,
                    newReport.type === type && styles.segmentButtonActive
                  ]}
                  onPress={() => setNewReport(prev => ({ ...prev, type: type as any }))}
                >
                  <Text style={[
                    styles.segmentText,
                    newReport.type === type && styles.segmentTextActive
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Severity</Text>
            <View style={styles.segmentedControl}>
              {['low', 'medium', 'high', 'critical'].map(severity => (
                <TouchableOpacity
                  key={severity}
                  style={[
                    styles.segmentButton,
                    newReport.severity === severity && styles.segmentButtonActive
                  ]}
                  onPress={() => setNewReport(prev => ({ ...prev, severity: severity as any }))}
                >
                  <Text style={[
                    styles.segmentText,
                    newReport.severity === severity && styles.segmentTextActive
                  ]}>
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              value={newReport.title}
              onChangeText={(text) => setNewReport(prev => ({ ...prev, title: text }))}
              placeholder="Brief description of the issue"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newReport.description}
              onChangeText={(text) => setNewReport(prev => ({ ...prev, description: text }))}
              placeholder="Detailed description of the issue"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.textInput}
              value={newReport.location}
              onChangeText={(text) => setNewReport(prev => ({ ...prev, location: text }))}
              placeholder="Where on the vehicle (e.g., front bumper, interior)"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading vehicle condition data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <StandardErrorBoundary context="VehicleConditionTracker">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Vehicle Condition</Text>
          <TouchableOpacity onPress={() => setShowReportModal(true)}>
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          {['overview', 'damage', 'maintenance'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab as any)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.content}>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'damage' && (
            <View>
              {/* Ensure damageReports is an array before calling filter and map */}
              {Array.isArray(damageReports) ? damageReports.filter(r => r.type === 'damage').map(report => (
                <View key={report.id} style={styles.reportCard}>
                  <View style={styles.reportHeader}>
                    <Text style={styles.reportTitle}>{report.title}</Text>
                    <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(report.severity) }]}>
                      <Text style={styles.severityText}>{report.severity.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.reportDescription}>{report.description}</Text>
                  <Text style={styles.reportDate}>
                    {new Date(report.reportedAt).toLocaleDateString()}
                  </Text>
                </View>
              )) : null}
            </View>
          )}
          {activeTab === 'maintenance' && (
            <View>
              {/* Ensure damageReports is an array before calling filter and map */}
              {Array.isArray(damageReports) ? damageReports.filter(r => r.type === 'maintenance').map(report => (
                <View key={report.id} style={styles.reportCard}>
                  <View style={styles.reportHeader}>
                    <Text style={styles.reportTitle}>{report.title}</Text>
                    <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(report.severity) }]}>
                      <Text style={styles.severityText}>{report.severity.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.reportDescription}>{report.description}</Text>
                  <Text style={styles.reportDate}>
                    {new Date(report.reportedAt).toLocaleDateString()}
                  </Text>
                </View>
              )) : null}
            </View>
          )}
        </ScrollView>

        {renderReportModal()}
      </SafeAreaView>
    </StandardErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  overviewContainer: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.md,
  },
  reportCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: colors.surface,
  },
  reportDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  reportDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top' as const,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: 8,
    padding: 2,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.surface,
    fontWeight: '600' as const,
  },
});

export default VehicleConditionTrackerScreen;
