import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { colors } from '../../../styles/theme';

interface Props {
  navigation: any;
}

const QuickActions: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('VehiclePerformance')}
        >
          <Ionicons name="analytics-outline" size={24} color={colors.primary} />
          <Text style={styles.actionText}>Vehicle Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('FinancialReports')}
        >
          <Ionicons name="document-text-outline" size={24} color={colors.primary} />
          <Text style={styles.actionText}>Financial Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('FleetManagement')}
        >
          <Ionicons name="car-sport-outline" size={24} color={colors.primary} />
          <Text style={styles.actionText}>Fleet Management</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default QuickActions;