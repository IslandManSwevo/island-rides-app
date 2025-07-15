import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { styles } from '../styles';
import { colors } from '../../../styles/Theme';
import { RevenueData } from '../../../types';

interface Props {
  revenueData: RevenueData | null;
}

const RevenueChart: React.FC<Props> = ({ revenueData }) => {
  if (!revenueData?.dailyData || revenueData.dailyData.length === 0) {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.noDataText}>No revenue data available</Text>
      </View>
    );
  }

  const maxRevenue = Math.max(...revenueData.dailyData.map(d => {
    const revenue = Number.isFinite(d.grossRevenue) ? d.grossRevenue : 0;
    return revenue;
  }));

  // Handle case where all revenue values are zero
  if (maxRevenue === 0) {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Revenue Trend</Text>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No revenue generated yet</Text>
          <Text style={styles.noDataSubtext}>Start accepting bookings to see your revenue trend</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Revenue Trend</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chart}>
          {revenueData.dailyData.slice(-14).map((data, index) => {
            const validRevenue = Number.isFinite(data.grossRevenue) ? data.grossRevenue : 0;
            const height = maxRevenue > 0 ? (validRevenue / maxRevenue) * 100 : 0;
            return (
              <View key={index} style={styles.chartBar}>
                <View style={styles.chartBarContainer}>
                  <View
                    style={[
                      styles.chartBarFill,
                      { height: `${height}%`, backgroundColor: colors.primary },
                    ]}
                  />
                </View>
                <Text style={styles.chartBarLabel}>
                  {new Date(data.date).getDate()}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default RevenueChart;