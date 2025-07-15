import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { VehicleDamageReport } from '../../types';
import { styles } from './styles';
import { colors } from '../../styles/Theme';

interface Props {
  reports: VehicleDamageReport[];
  onAddReport: () => void;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'minor': return colors.verified;
    case 'moderate': return colors.warning;
    case 'major': return colors.error;
    default: return colors.lightGrey;
  }
};

export const DamageReportsSection: React.FC<Props> = ({ reports, onAddReport }) => {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Damage Reports</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddReport}>
          <Text style={styles.addButtonText}>+ Add Report</Text>
        </TouchableOpacity>
      </View>
      {reports.length === 0 ? (
        <Text style={styles.emptyText}>No damage reports found.</Text>
      ) : (
        reports.map(report => (
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
        ))
      )}
    </View>
  );
};