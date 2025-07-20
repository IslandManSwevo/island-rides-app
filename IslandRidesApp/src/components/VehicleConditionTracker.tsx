import React, { useState, useCallback, useMemo } from 'react';
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

export const VehicleConditionTracker: React.FC<VehicleConditionTrackerProps> = React.memo(({ vehicleId }) => {
  const vehicleIdNumber = useMemo(() => parseInt(vehicleId), [vehicleId]);
  
  const { rating, isLoading: isRatingLoading, refresh: updateRating } = useConditionRating(vehicleId);
  const { records, addRecord, loading: isMaintenanceLoading } = useMaintenanceRecords(vehicleIdNumber);
  const { reports, addReport, loading: isDamageLoading } = useDamageReports(vehicleIdNumber);

  const [isMaintenanceModalVisible, setMaintenanceModalVisible] = useState(false);
  const [isDamageModalVisible, setDamageModalVisible] = useState(false);

  const handleSaveMaintenance = useCallback((formData: MaintenanceFormData) => {
    // Transform form data to match the expected VehicleMaintenance structure
    const maintenanceRecord: VehicleMaintenance = {
      ...formData,
      id: 0, // Will be assigned by the backend
      vehicleId: vehicleIdNumber,
      createdAt: new Date().toISOString()
    };
    addRecord(maintenanceRecord);
  }, [vehicleIdNumber, addRecord]);

  const handleSaveDamage = useCallback((report: DamageReportFormData) => {
    // Transform form data to match the expected VehicleDamageReport structure
    const damageReport = {
      ...report,
      vehicleId: vehicleIdNumber,
      reportedBy: 1, // This should be the current user ID
      createdAt: new Date().toISOString()
    };
    addReport(damageReport);
  }, [vehicleIdNumber, addReport]);

  const handleShowMaintenanceModal = useCallback(() => {
    setMaintenanceModalVisible(true);
  }, []);

  const handleHideMaintenanceModal = useCallback(() => {
    setMaintenanceModalVisible(false);
  }, []);

  const handleShowDamageModal = useCallback(() => {
    setDamageModalVisible(true);
  }, []);

  const handleHideDamageModal = useCallback(() => {
    setDamageModalVisible(false);
  }, []);

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
          onAddRecord={handleShowMaintenanceModal}
        />
        <DamageReportsSection
          reports={reports}
          onAddReport={handleShowDamageModal}
        />
      </ScrollView>

      <MaintenanceFormModal
        visible={isMaintenanceModalVisible}
        onClose={handleHideMaintenanceModal}
        onSave={handleSaveMaintenance}
      />

      <DamageReportModal
        visible={isDamageModalVisible}
        onClose={handleHideDamageModal}
        onSave={handleSaveDamage}
      />
    </View>
  );
});