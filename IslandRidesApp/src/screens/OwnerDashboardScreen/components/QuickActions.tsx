import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { styles } from '../styles';
import { colors } from '../../../styles/Theme';
import { RootStackParamList } from '../../../navigation/routes';

type QuickActionsNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  navigation: QuickActionsNavigationProp;
}

const QuickActions: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => {
            try {
              navigation.navigate('VehiclePerformance');
            } catch (error) {
              console.error('Navigation error to VehiclePerformance:', error);
              Alert.alert('Navigation Error', 'Unable to open Vehicle Analytics. Please try again.');
            }
          }}
        >
          <Ionicons name="analytics-outline" size={24} color={colors.primary} />
          <Text style={styles.actionText}>Vehicle Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => {
            try {
              navigation.navigate('FinancialReports');
            } catch (error) {
              console.error('Navigation error to FinancialReports:', error);
              Alert.alert('Navigation Error', 'Unable to open Financial Reports. Please try again.');
            }
          }}
        >
          <Ionicons name="document-text-outline" size={24} color={colors.primary} />
          <Text style={styles.actionText}>Financial Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => {
            try {
              navigation.navigate('FleetManagement');
            } catch (error) {
              console.error('Navigation error to FleetManagement:', error);
              Alert.alert('Navigation Error', 'Unable to open Fleet Management. Please try again.');
            }
          }}
        >
          <Ionicons name="car-sport-outline" size={24} color={colors.primary} />
          <Text style={styles.actionText}>Fleet Management</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default QuickActions;