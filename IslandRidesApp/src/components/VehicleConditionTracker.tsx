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

interface VehicleConditionTrackerProps {
  vehicleId: string;
}

export const VehicleConditionTracker: React.FC<VehicleConditionTrackerProps> = ({ vehicleId }) => {
  const { rating, updateRating, isLoading: isRatingLoading } = useConditionRating(vehicleId);
  const { records, addRecord, isLoading: isMaintenanceLoading } = useMaintenanceRecords(vehicleId);
  const { reports, addReport, isLoading: isDamageLoading } = useDamageReports(vehicleId);

  const [isMaintenanceModalVisible, setMaintenanceModalVisible] = useState(false);
  const [isDamageModalVisible, setDamageModalVisible] = useState(false);

  const handleSaveMaintenance = (record: any) => {
    addRecord(record);
  };

  const handleSaveDamage = (report: any) => {
    addReport(report);
  };

  if (isRatingLoading || isMaintenanceLoading || isDamageLoading) {
    return <ActivityIndicator style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <ConditionRatingSection rating={rating} onUpdateRating={updateRating} />
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