import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

interface Props {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  subtitle?: string;
}

const MetricCard: React.FC<Props> = ({ title, value, icon, color, subtitle }) => {
  const accessibilityLabel = `${title}: ${value}${subtitle ? `, ${subtitle}` : ''}`;
  
  return (
    <View 
      style={[styles.metricCard, { borderLeftColor: color }]}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="summary"
    >
      <View style={styles.metricHeader}>
        <Text style={styles.metricTitle} accessibilityElementsHidden={true}>{title}</Text>
        <Ionicons name={icon} size={20} color={color} accessibilityElementsHidden={true} />
      </View>
      <Text style={styles.metricValue} accessibilityElementsHidden={true}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle} accessibilityElementsHidden={true}>{subtitle}</Text>}
    </View>
  );
};

export default MetricCard;