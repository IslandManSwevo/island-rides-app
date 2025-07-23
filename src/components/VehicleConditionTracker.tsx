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
import { useAuth } from '../context/AuthContext';
import { loggingService } from '../services/LoggingService';

// Custom hook for managing modal states
const useModalState = () => {
  const [isMaintenanceModalVisible, setMaintenanceModalVisible] = useState(false);
  const [isDamageModalVisible, setDamageModalVisible] = useState(false);

  const showMaintenanceModal = useCallback(() => {
    setMaintenanceModalVisible(true);
  }, []);

  const hideMaintenanceModal = useCallback(() => {
    setMaintenanceModalVisible(false);
  }, []);

  const showDamageModal = useCallback(() => {
    setDamageModalVisible(true);
  }, []);

  const hideDamageModal = useCallback(() => {
    setDamageModalVisible(false);
  }, []);

  return {
    isMaintenanceModalVisible,
    isDamageModalVisible,
    showMaintenanceModal,
    hideMaintenanceModal,
    showDamageModal,
    hideDamageModal,
  };
};

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
  const { currentUser } = useAuth();
  
  const { rating, isLoading: isRatingLoading, refresh: updateRating } = useConditionRating(vehicleId);
  const { records, addRecord, loading: isMaintenanceLoading } = useMaintenanceRecords(vehicleIdNumber);
  const { reports, addReport, loading: isDamageLoading } = useDamageReports(vehicleIdNumber);

  // Use custom hook for modal state management
  const {
    isMaintenanceModalVisible,
    isDamageModalVisible,
    showMaintenanceModal,
    hideMaintenanceModal,
    showDamageModal,
    hideDamageModal,
  } = useModalState();

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
    // Ensure user is authenticated before creating damage report
    if (!currentUser?.id) {
      loggingService.error('Cannot create damage report: User not authenticated', undefined, { vehicleId: vehicleIdNumber });
      return;
    }

    // Transform form data to match the expected VehicleDamageReport structure
    const damageReport = {
      ...report,
      vehicleId: vehicleIdNumber,
      reportedBy: currentUser.id,
      createdAt: new Date().toISOString()
    };
    addReport(damageReport);
  }, [vehicleIdNumber, addReport, currentUser]);

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
          onAddRecord={showMaintenanceModal}
        />
        <DamageReportsSection
          reports={reports}
          onAddReport={showDamageModal}
        />
      </ScrollView>

      <MaintenanceFormModal
        visible={isMaintenanceModalVisible}
        onClose={hideMaintenanceModal}
        onSave={handleSaveMaintenance}
      />

      <DamageReportModal
        visible={isDamageModalVisible}
        onClose={hideDamageModal}
        onSave={handleSaveDamage}
      />
    </View>
  );
});