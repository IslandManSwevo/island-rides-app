import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { styles } from '../styles';
import { colors } from '../../../styles/theme';
import { RevenueData } from '../types';

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

  const maxRevenue = Math.max(...revenueData.dailyData.map(d => d.grossRevenue));

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Revenue Trend</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chart}>
          {revenueData.dailyData.slice(-14).map((data, index) => {
            const height = maxRevenue > 0 ? (data.grossRevenue / maxRevenue) * 100 : 0;
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