import React, { useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useMaintenanceRecords } from './vehicle-condition/useMaintenanceRecords';
import { useDamageReports } from './vehicle-condition/useDamageReports';
import { useConditionRating } from './vehicle-condition/useConditionRating';
import { ConditionRatingSection } from './vehicle-condition/ConditionRatingSection';
import { MaintenanceRecordsSection } from './vehicle-condition/MaintenanceRecordsSection';
import { DamageReportsSection } from './vehicle-condition/DamageReportsSection';
import { MaintenanceFormModal } from './vehicle-condition/MaintenanceFormModal';
import { DamageReportModal } from './vehicle-condition/DamageReportModal';
import { styles } from './vehicle-condition/styles';
import { VehicleMaintenance } from '../types';

// Form data interface for maintenance records (without auto-generated fields)
interface MaintenanceFormData {
  maintenanceType: string;
  description: string;
  cost?: number;
  serviceProvider?: string;
}

// Form data interface for damage reports
interface DamageReportFormData {
  damageType: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
  repairCost?: number;
}

interface VehicleConditionTrackerProps {
  vehicleId: string;
}

export const VehicleConditionTracker: React.FC<VehicleConditionTrackerProps> = ({ vehicleId }) => {
  const { rating, isLoading: isRatingLoading, refresh: updateRating } = useConditionRating(vehicleId);
  const { records, addRecord, loading: isMaintenanceLoading } = useMaintenanceRecords(parseInt(vehicleId));
  const { reports, addReport, loading: isDamageLoading } = useDamageReports(parseInt(vehicleId));

  const [isMaintenanceModalVisible, setMaintenanceModalVisible] = useState(false);
  const [isDamageModalVisible, setDamageModalVisible] = useState(false);

  const handleSaveMaintenance = (formData: MaintenanceFormData) => {
    // Transform form data to match the expected VehicleMaintenance structure
    const maintenanceRecord: VehicleMaintenance = {
      ...formData,
      id: 0, // Will be assigned by the backend
      vehicleId: parseInt(vehicleId),
      createdAt: new Date().toISOString()
    };
    addRecord(maintenanceRecord);
  };

  const handleSaveDamage = (report: DamageReportFormData) => {
    // Transform form data to match the expected VehicleDamageReport structure
    const damageReport = {
      ...report,
      vehicleId: parseInt(vehicleId),
      reportedBy: 1, // This should be the current user ID
      createdAt: new Date().toISOString()
    };
    addReport(damageReport);
  };

  if (isRatingLoading || isMaintenanceLoading || isDamageLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <ConditionRatingSection rating={rating ?? 0} onUpdateRating={updateRating} />
        <MaintenanceRecordsSection
          records={records}
          onAddRecord={() => setMaintenanceModalVisible(true)}
        />
        <DamageReportsSection
          reports={reports}
          onAddReport={() => setDamageModalVisible(true)}
        />
      </ScrollView>

      <MaintenanceFormModal
        visible={isMaintenanceModalVisible}
        onClose={() => setMaintenanceModalVisible(false)}
        onSave={handleSaveMaintenance}
      />

      <DamageReportModal
        visible={isDamageModalVisible}
        onClose={() => setDamageModalVisible(false)}
        onSave={handleSaveDamage}
      />
    </View>
  );
};