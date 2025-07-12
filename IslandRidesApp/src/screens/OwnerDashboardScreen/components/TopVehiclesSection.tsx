import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles';
import { RevenueData } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';

interface Props {
  revenueData: RevenueData | null;
}

const TopVehiclesSection: React.FC<Props> = ({ revenueData }) => {
  if (!revenueData?.vehicleBreakdown || revenueData.vehicleBreakdown.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Top Performing Vehicles</Text>
      {revenueData.vehicleBreakdown.slice(0, 3).map((vehicle, index) => (
        <View key={vehicle.id} style={styles.vehicleCard}>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleName}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </Text>
            <Text style={styles.vehicleStats}>
              {vehicle.bookings} bookings • {(() => {
                try {
                  return formatCurrency(vehicle.grossRevenue);
                } catch (error) {
                  return '$0.00';
                }
              })()}
            </Text>
          </View>
          <View style={styles.vehicleRank}>
            <Text style={styles.rankNumber}>#{index + 1}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default TopVehiclesSection;