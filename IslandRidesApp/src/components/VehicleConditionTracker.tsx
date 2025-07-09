import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { VehicleMaintenance, VehicleDamageReport } from '../types';
import { vehicleFeatureService } from '../services/vehicleFeatureService';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

interface VehicleConditionTrackerProps {
  vehicleId: number;
  currentConditionRating?: number;
  onConditionUpdate?: (rating: number) => void;
}

interface MaintenanceForm {
  maintenanceType: string;
  description: string;
  cost?: number;
  serviceProvider?: string;
  scheduledDate?: Date;
  completedDate?: Date;
  mileageAtService?: number;
  notes?: string;
}

interface DamageReportForm {
  damageType: string;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  repairCost?: number;
  insuranceClaimNumber?: string;
  photos?: string[];
}

export const VehicleConditionTracker: React.FC<VehicleConditionTrackerProps> = ({
  vehicleId,
  currentConditionRating = 5,
  onConditionUpdate
}) => {
  const { currentUser } = useAuth();
  const [conditionRating, setConditionRating] = useState(currentConditionRating);
  const [maintenanceRecords, setMaintenanceRecords] = useState<VehicleMaintenance[]>([]);
  const [damageReports, setDamageReports] = useState<VehicleDamageReport[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'scheduled' | 'completed' | null>(null);
  
  // Form states
  const [maintenanceForm, setMaintenanceForm] = useState<MaintenanceForm>({
    maintenanceType: '',
    description: '',
    cost: undefined,
    serviceProvider: '',
    scheduledDate: undefined,
    completedDate: undefined,
    mileageAtService: undefined,
    notes: ''
  });
  
  const [damageForm, setDamageForm] = useState<DamageReportForm>({
    damageType: '',
    severity: 'minor',
    description: '',
    repairCost: undefined,
    insuranceClaimNumber: '',
    photos: []
  });

  const maintenanceTypes = [
    'Oil Change',
    'Tire Rotation',
    'Brake Service',
    'Engine Service',
    'Transmission Service',
    'Battery Replacement',
    'Air Filter',
    'Spark Plugs',
    'Coolant Service',
    'Belt Replacement',
    'General Inspection',
    'Other'
  ];

  const damageTypes = [
    'Scratch',
    'Dent',
    'Crack',
    'Broken Part',
    'Interior Damage',
    'Engine Issue',
    'Electrical Problem',
    'Accident Damage',
    'Weather Damage',
    'Wear and Tear',
    'Other'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [maintenance, damage] = await Promise.all([
        vehicleFeatureService.getVehicleMaintenance(vehicleId),
        vehicleFeatureService.getVehicleDamageReports(vehicleId)
      ]);
      setMaintenanceRecords(maintenance);
      setDamageReports(damage);
    } catch (error) {
      console.error('Failed to load vehicle data:', error);
      notificationService.error('Failed to load vehicle condition data');
    } finally {
      setLoading(false);
    }
  };

  const updateConditionRating = (rating: number) => {
    setConditionRating(rating);
    onConditionUpdate?.(rating);
  };

  const addMaintenanceRecord = async () => {
    if (!maintenanceForm.maintenanceType || !maintenanceForm.description) {
      Alert.alert('Missing Information', 'Please fill in the maintenance type and description.');
      return;
    }

    try {
      const record = await vehicleFeatureService.addMaintenanceRecord(vehicleId, {
        maintenanceType: maintenanceForm.maintenanceType,
        description: maintenanceForm.description,
        cost: maintenanceForm.cost,
        serviceProvider: maintenanceForm.serviceProvider,
        scheduledDate: maintenanceForm.scheduledDate?.toISOString(),
        completedDate: maintenanceForm.completedDate?.toISOString(),
        mileageAtService: maintenanceForm.mileageAtService,
        notes: maintenanceForm.notes
      });

      setMaintenanceRecords(prev => [record, ...prev]);
      setShowMaintenanceModal(false);
      resetMaintenanceForm();
      notificationService.success('Maintenance record added successfully');
    } catch (error) {
      console.error('Failed to add maintenance record:', error);
      notificationService.error('Failed to add maintenance record');
    }
  };

  const reportDamage = async () => {
    if (!damageForm.damageType || !damageForm.description) {
      Alert.alert('Missing Information', 'Please fill in the damage type and description.');
      return;
    }

    if (!currentUser) {
      Alert.alert('Authentication Error', 'You must be logged in to report damage.');
      return;
    }

    try {
      const report = await vehicleFeatureService.reportVehicleDamage(vehicleId, {
        damageType: damageForm.damageType,
        description: damageForm.description,
        severity: damageForm.severity,
        repairCost: damageForm.repairCost,
        photos: damageForm.photos,
        insuranceClaimNumber: damageForm.insuranceClaimNumber,
        reportedBy: currentUser.id
      });

      setDamageReports(prev => [report, ...prev]);
      setShowDamageModal(false);
      resetDamageForm();
      notificationService.success('Damage report submitted successfully');
    } catch (error) {
      console.error('Failed to report damage:', error);
      notificationService.error('Failed to submit damage report');
    }
  };

  const resetMaintenanceForm = () => {
    setMaintenanceForm({
      maintenanceType: '',
      description: '',
      cost: undefined,
      serviceProvider: '',
      scheduledDate: undefined,
      completedDate: undefined,
      mileageAtService: undefined,
      notes: ''
    });
  };

  const resetDamageForm = () => {
    setDamageForm({
      damageType: '',
      severity: 'minor',
      description: '',
      repairCost: undefined,
      insuranceClaimNumber: '',
      photos: []
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor': return '#10B981';
      case 'moderate': return '#F59E0B';
      case 'major': return '#EF4444';
      default: return colors.lightGrey;
    }
  };

  const renderRatingStars = () => {
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.sectionTitle}>Condition Rating</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity
              key={star}
              onPress={() => updateConditionRating(star)}
              style={styles.starButton}
            >
              <Ionicons
                name={star <= conditionRating ? 'star' : 'star-outline'}
                size={28}
                color={star <= conditionRating ? '#F59E0B' : colors.lightGrey}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingText}>
          {conditionRating}/5 - {conditionRating >= 5 ? 'Excellent' : 
                                 conditionRating >= 4 ? 'Very Good' : 
                                 conditionRating >= 3 ? 'Good' : 
                                 conditionRating >= 2 ? 'Fair' : 'Poor'}
        </Text>
      </View>
    );
  };

  const renderMaintenanceRecord = (record: VehicleMaintenance, index: number) => (
    <View key={record.id} style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordTitle}>{record.maintenanceType}</Text>
        <Text style={styles.recordDate}>
          {record.completedDate ? formatDate(record.completedDate) : 'Scheduled'}
        </Text>
      </View>
      
      <Text style={styles.recordDescription}>{record.description}</Text>
      
      {record.serviceProvider && (
        <Text style={styles.recordDetail}>Service Provider: {record.serviceProvider}</Text>
      )}
      
      {record.cost && (
        <Text style={styles.recordDetail}>Cost: ${record.cost}</Text>
      )}
      
      {record.mileageAtService && (
        <Text style={styles.recordDetail}>Mileage: {record.mileageAtService.toLocaleString()} miles</Text>
      )}
      
      {record.notes && (
        <Text style={styles.recordNotes}>{record.notes}</Text>
      )}
    </View>
  );

  const renderDamageReport = (report: VehicleDamageReport, index: number) => (
    <View key={report.id} style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordTitle}>{report.damageType}</Text>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(report.severity) }]}>
          <Text style={styles.severityText}>{report.severity.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.recordDescription}>{report.description}</Text>
      
      {report.repairCost && (
        <Text style={styles.recordDetail}>Repair Cost: ${report.repairCost}</Text>
      )}
      
      {report.insuranceClaimNumber && (
        <Text style={styles.recordDetail}>Insurance Claim: {report.insuranceClaimNumber}</Text>
      )}
      
      <Text style={styles.recordDate}>
        Reported: {formatDate(report.createdAt)}
      </Text>
      
      {report.resolvedAt && (
        <Text style={styles.recordDate}>
          Resolved: {formatDate(report.resolvedAt)}
        </Text>
      )}
    </View>
  );

  const renderMaintenanceModal = () => (
    <Modal visible={showMaintenanceModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Add Maintenance Record</Text>
            
            {/* Maintenance Type */}
            <Text style={styles.fieldLabel}>Maintenance Type *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
              {maintenanceTypes.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeChip,
                    maintenanceForm.maintenanceType === type && styles.typeChipSelected
                  ]}
                  onPress={() => setMaintenanceForm(prev => ({ ...prev, maintenanceType: type }))}
                >
                  <Text style={[
                    styles.typeChipText,
                    maintenanceForm.maintenanceType === type && styles.typeChipTextSelected
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Description */}
            <Text style={styles.fieldLabel}>Description *</Text>
            <TextInput
              style={styles.textInput}
              value={maintenanceForm.description}
              onChangeText={(text) => setMaintenanceForm(prev => ({ ...prev, description: text }))}
              placeholder="Describe the maintenance work..."
              multiline
            />
            
            {/* Service Provider */}
            <Text style={styles.fieldLabel}>Service Provider</Text>
            <TextInput
              style={styles.textInput}
              value={maintenanceForm.serviceProvider}
              onChangeText={(text) => setMaintenanceForm(prev => ({ ...prev, serviceProvider: text }))}
              placeholder="Name of service provider..."
            />
            
            {/* Cost */}
            <Text style={styles.fieldLabel}>Cost</Text>
            <TextInput
              style={styles.textInput}
              value={maintenanceForm.cost?.toString() || ''}
              onChangeText={(text) => setMaintenanceForm(prev => ({ 
                ...prev, 
                cost: text ? parseFloat(text) : undefined 
              }))}
              placeholder="0.00"
              keyboardType="numeric"
            />
            
            {/* Dates */}
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.fieldLabel}>Scheduled Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker('scheduled')}
                >
                  <Text style={styles.dateButtonText}>
                    {maintenanceForm.scheduledDate 
                      ? formatDate(maintenanceForm.scheduledDate.toISOString())
                      : 'Select Date'
                    }
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.dateField}>
                <Text style={styles.fieldLabel}>Completed Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker('completed')}
                >
                  <Text style={styles.dateButtonText}>
                    {maintenanceForm.completedDate 
                      ? formatDate(maintenanceForm.completedDate.toISOString())
                      : 'Select Date'
                    }
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Mileage */}
            <Text style={styles.fieldLabel}>Mileage at Service</Text>
            <TextInput
              style={styles.textInput}
              value={maintenanceForm.mileageAtService?.toString() || ''}
              onChangeText={(text) => setMaintenanceForm(prev => ({ 
                ...prev, 
                mileageAtService: text ? parseInt(text) : undefined 
              }))}
              placeholder="Current mileage..."
              keyboardType="numeric"
            />
            
            {/* Notes */}
            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              value={maintenanceForm.notes}
              onChangeText={(text) => setMaintenanceForm(prev => ({ ...prev, notes: text }))}
              placeholder="Additional notes..."
              multiline
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowMaintenanceModal(false);
                  resetMaintenanceForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={addMaintenanceRecord}
              >
                <Text style={styles.saveButtonText}>Add Record</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
      
      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={
            showDatePicker === 'scheduled' 
              ? maintenanceForm.scheduledDate || new Date()
              : maintenanceForm.completedDate || new Date()
          }
          mode="date"
          onChange={(event, date) => {
            setShowDatePicker(null);
            if (date) {
              setMaintenanceForm(prev => ({
                ...prev,
                [showDatePicker === 'scheduled' ? 'scheduledDate' : 'completedDate']: date
              }));
            }
          }}
        />
      )}
    </Modal>
  );

  const renderDamageModal = () => (
    <Modal visible={showDamageModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Report Damage</Text>
            
            {/* Damage Type */}
            <Text style={styles.fieldLabel}>Damage Type *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
              {damageTypes.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeChip,
                    damageForm.damageType === type && styles.typeChipSelected
                  ]}
                  onPress={() => setDamageForm(prev => ({ ...prev, damageType: type }))}
                >
                  <Text style={[
                    styles.typeChipText,
                    damageForm.damageType === type && styles.typeChipTextSelected
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Severity */}
            <Text style={styles.fieldLabel}>Severity *</Text>
            <View style={styles.severityContainer}>
              {(['minor', 'moderate', 'major'] as const).map(severity => (
                <TouchableOpacity
                  key={severity}
                  style={[
                    styles.severityChip,
                    { backgroundColor: getSeverityColor(severity) },
                    damageForm.severity === severity && styles.severityChipSelected
                  ]}
                  onPress={() => setDamageForm(prev => ({ ...prev, severity }))}
                >
                  <Text style={styles.severityChipText}>
                    {severity.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Description */}
            <Text style={styles.fieldLabel}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              value={damageForm.description}
              onChangeText={(text) => setDamageForm(prev => ({ ...prev, description: text }))}
              placeholder="Describe the damage in detail..."
              multiline
            />
            
            {/* Repair Cost */}
            <Text style={styles.fieldLabel}>Estimated Repair Cost</Text>
            <TextInput
              style={styles.textInput}
              value={damageForm.repairCost?.toString() || ''}
              onChangeText={(text) => setDamageForm(prev => ({ 
                ...prev, 
                repairCost: text ? parseFloat(text) : undefined 
              }))}
              placeholder="0.00"
              keyboardType="numeric"
            />
            
            {/* Insurance Claim */}
            <Text style={styles.fieldLabel}>Insurance Claim Number</Text>
            <TextInput
              style={styles.textInput}
              value={damageForm.insuranceClaimNumber}
              onChangeText={(text) => setDamageForm(prev => ({ ...prev, insuranceClaimNumber: text }))}
              placeholder="Insurance claim reference..."
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowDamageModal(false);
                  resetDamageForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={reportDamage}
              >
                <Text style={styles.saveButtonText}>Report Damage</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading condition data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Condition Rating */}
      {renderRatingStars()}
      
      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowMaintenanceModal(true)}
        >
          <Ionicons name="build-outline" size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>Add Maintenance</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.damageButton]}
          onPress={() => setShowDamageModal(true)}
        >
          <Ionicons name="warning-outline" size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>Report Damage</Text>
        </TouchableOpacity>
      </View>
      
      {/* Maintenance Records */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Maintenance Records ({maintenanceRecords.length})
        </Text>
        {maintenanceRecords.length === 0 ? (
          <Text style={styles.emptyText}>No maintenance records yet</Text>
        ) : (
          maintenanceRecords.map(renderMaintenanceRecord)
        )}
      </View>
      
      {/* Damage Reports */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Damage Reports ({damageReports.length})
        </Text>
        {damageReports.length === 0 ? (
          <Text style={styles.emptyText}>No damage reports</Text>
        ) : (
          damageReports.map(renderDamageReport)
        )}
      </View>
      
      {/* Modals */}
      {renderMaintenanceModal()}
      {renderDamageModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
    color: colors.lightGrey,
  },
  ratingContainer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  starButton: {
    padding: spacing.xs,
  },
  ratingText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.darkGrey,
  },
  sectionTitle: {
    ...typography.subheading,
    marginBottom: spacing.md,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  damageButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  section: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.lightGrey,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  recordCard: {
    backgroundColor: colors.offWhite,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recordTitle: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
  },
  recordDate: {
    ...typography.body,
    fontSize: 14,
    color: colors.lightGrey,
  },
  recordDescription: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  recordDetail: {
    ...typography.body,
    fontSize: 14,
    color: colors.darkGrey,
    marginBottom: 2,
  },
  recordNotes: {
    ...typography.body,
    fontSize: 14,
    color: colors.lightGrey,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  severityText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalTitle: {
    ...typography.heading1,
    fontSize: 20,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  fieldLabel: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    backgroundColor: colors.white,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    marginBottom: spacing.md,
  },
  typeChip: {
    backgroundColor: colors.offWhite,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  typeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    ...typography.body,
    fontSize: 14,
  },
  typeChipTextSelected: {
    color: colors.white,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateField: {
    flex: 1,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  dateButtonText: {
    ...typography.body,
    color: colors.darkGrey,
  },
  severityContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  severityChip: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    opacity: 0.7,
  },
  severityChipSelected: {
    opacity: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  severityChipText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.lightGrey,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.darkGrey,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
}); 