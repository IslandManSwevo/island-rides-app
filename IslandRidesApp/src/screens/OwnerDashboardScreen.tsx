import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { styles } from './OwnerDashboardScreen/styles';
import { DashboardOverview, RevenueData, Goal, NewGoal } from '../types';
import DashboardMetrics from './OwnerDashboardScreen/components/DashboardMetrics';
import RevenueChart from './OwnerDashboardScreen/components/RevenueChart';
import GoalsSection from './OwnerDashboardScreen/components/GoalsSection';
import TopVehiclesSection from './OwnerDashboardScreen/components/TopVehiclesSection';
import QuickActions from './OwnerDashboardScreen/components/QuickActions';
import GoalModal from './OwnerDashboardScreen/components/GoalModal';

interface DashboardData {
  overview: DashboardOverview;
  revenue: RevenueData;
  goals?: Goal[];
}

const isDashboardData = (data: unknown): data is DashboardData => {
  const anyData = data as any;
  return Boolean(
    data &&
    typeof anyData.overview === 'object' &&
    anyData.overview !== null &&
    typeof anyData.revenue === 'object' &&
    anyData.revenue !== null &&
    (!anyData.goals || Array.isArray(anyData.goals))
  );
};

const timeframeOptions = [
  { label: '7 Days', value: '7' },
  { label: '30 Days', value: '30' },
  { label: '90 Days', value: '90' },
  { label: '1 Year', value: '365' },
];

import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, ROUTES } from '../navigation/routes';

type OwnerDashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, typeof ROUTES.OWNER_DASHBOARD>;

interface OwnerDashboardScreenProps {
  navigation: OwnerDashboardScreenNavigationProp;
}

export const OwnerDashboardScreen = ({ navigation }: OwnerDashboardScreenProps) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('30');
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const response: { success: boolean; data: unknown } = await apiService.get(`/owner/dashboard?timeframe=${timeframe}`);
        if (response.success && isDashboardData(response.data)) {
          setOverview(response.data.overview);
          setRevenueData(response.data.revenue);
          setGoals(response.data.goals || []);
        } else {
          throw new Error('Failed to load dashboard data or data format is incorrect');
        }
      } catch (error) {
        console.error('Dashboard error:', error);
        notificationService.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [timeframe]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response: { success: boolean; data: unknown } = await apiService.get(`/owner/dashboard?timeframe=${timeframe}`);
      if (response.success && isDashboardData(response.data)) {
        setOverview(response.data.overview);
        setRevenueData(response.data.revenue);
        setGoals(response.data.goals || []);
      } else {
        throw new Error('Failed to load dashboard data or data format is incorrect');
      }
    } catch (error) {
      console.error('Dashboard error:', error);
      notificationService.error('Failed to load dashboard data');
    }
    setRefreshing(false);
  }, [timeframe]);

  const handleCreateGoal = async (newGoal: NewGoal) => {
    try {
      const goalData = {
        goal_type: newGoal.goalType,
        target_value: parseFloat(newGoal.targetValue),
        target_period: newGoal.targetPeriod,
      };

      const response = await apiService.post('/owner/goals', goalData);

      if ((response as { success: boolean; data: Goal }).success) {
        setGoals([...goals, (response as { data: Goal }).data]);
        setShowGoalModal(false);
        notificationService.success('Goal created successfully');
      } else {
        throw new Error('Failed to create goal');
      }
    } catch (error) {
      console.error('Create goal error:', error);
      notificationService.error('Failed to create goal');
    }
  };

  if (loading && !overview) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Owner Dashboard" navigation={navigation} />

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.timeframeSelector}>
          {timeframeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.timeframeOption,
                timeframe === option.value && styles.timeframeOptionActive,
              ]}
              onPress={() => setTimeframe(option.value)}
            >
              <Text
                style={[
                  styles.timeframeOptionText,
                  timeframe === option.value && styles.timeframeOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {overview && <DashboardMetrics overview={overview} />}

        <RevenueChart revenueData={revenueData} />

        <GoalsSection goals={goals} onAddGoal={() => setShowGoalModal(true)} />

        <TopVehiclesSection revenueData={revenueData} />

        <QuickActions navigation={navigation} />
      </ScrollView>

      <GoalModal
        visible={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onCreate={handleCreateGoal}
      />
    </SafeAreaView>
  );
};