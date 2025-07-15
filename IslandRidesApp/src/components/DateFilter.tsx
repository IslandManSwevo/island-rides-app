import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/Theme';

interface DateFilterProps {
  startDate: Date | null;
  endDate: Date | null;
  onShowDatePicker: (type: 'start' | 'end') => void;
  formatDate: (date: Date | null) => string;
}

const DateFilter: React.FC<DateFilterProps> = ({ startDate, endDate, onShowDatePicker, formatDate }) => {
  // Validate dates and provide safe fallbacks
  const safeStartDate = startDate instanceof Date && !isNaN(startDate.getTime()) ? startDate : null;
  const safeEndDate = endDate instanceof Date && !isNaN(endDate.getTime()) ? endDate : null;

  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>Rental Dates</Text>
      <View style={styles.dateRow}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => onShowDatePicker('start')}
          accessibilityLabel="Select start date"
        >
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={styles.dateButtonText}>{formatDate(safeStartDate)}</Text>
        </TouchableOpacity>
        <Text style={styles.dateArrow}>→</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => onShowDatePicker('end')}
          accessibilityLabel="Select end date"
        >
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={styles.dateButtonText}>{formatDate(safeEndDate)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
    color: colors.dark,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  dateButtonText: {
    marginLeft: spacing.sm,
    fontSize: 16,
    color: colors.dark,
  },
  dateArrow: {
    fontSize: 18,
    color: colors.grey,
  },
});

export default DateFilter;