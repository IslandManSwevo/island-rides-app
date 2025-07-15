import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { colors } from '../../../styles/Theme';
import { Goal } from '../../../types';
import { formatCurrency, formatPercentage } from '../../../utils/formatters';
import { goalTypes } from '../../../constants/goalTypes';

interface Props {
  goals: Goal[];
  onAddGoal: () => void;
}

const getGoalTypeLabel = (type: string) => {
  const goal = goalTypes.find(g => g.value === type);
  return goal?.label || type;
};

const GoalsSection: React.FC<Props> = ({ goals, onAddGoal }) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Goals & Targets</Text>
        <TouchableOpacity onPress={onAddGoal}>
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {goals.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={48} color={colors.lightGrey} />
          <Text style={styles.emptyStateText}>No goals set</Text>
          <TouchableOpacity
            style={styles.createGoalButton}
            onPress={onAddGoal}
          >
            <Text style={styles.createGoalButtonText}>Set Your First Goal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        goals.map((goal) => (
          <View key={goal.id} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalType}>{getGoalTypeLabel(goal.goalType)}</Text>
              <Text style={styles.goalProgress}>
                {formatPercentage(goal.progressPercentage)}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(goal.progressPercentage, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.goalTarget}>
              Target: {goal.goalType === 'monthly_revenue' ? formatCurrency(goal.targetValue) : goal.targetValue}
            </Text>
          </View>
        ))
      )}
    </View>
  );
};

export default GoalsSection;