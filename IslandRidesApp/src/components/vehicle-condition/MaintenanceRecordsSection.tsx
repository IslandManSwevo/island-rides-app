import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { VehicleMaintenance } from '../../types';
import { styles } from './styles';
import { formatDate, formatCurrency, formatNumber } from '../../utils/formatters';

interface Props {
  records: VehicleMaintenance[];
  onAddRecord: () => void;
}

export const MaintenanceRecordsSection: React.FC<Props> = ({ records, onAddRecord }) => {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Maintenance History</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddRecord}>
          <Text style={styles.addButtonText}>+ Add Record</Text>
        </TouchableOpacity>
      </View>
      {records.length === 0 ? (
        <Text style={styles.emptyText}>No maintenance records found.</Text>
      ) : (
        records.map(record => (
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
              <Text style={styles.recordDetail}>
                Cost: {formatCurrency(record.cost)}
              </Text>
            )}            {record.mileageAtService && (
              <Text style={styles.recordDetail}>Mileage: {formatNumber(record.mileageAtService)} miles</Text>
            )}
            {record.notes && (
              <Text style={styles.recordNotes}>{record.notes}</Text>
            )}
          </View>
        ))
      )}
    </View>
  );
};