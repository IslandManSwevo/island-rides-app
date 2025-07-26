/**
 * RoleBasedDashboardScreen - Unified dashboard that adapts based on user role
 * Part of Initiative 5: Role-Based UI Components (Week 2)
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RoleBasedView, useRoleBasedFeatures } from '../components/RoleBasedView';
import { useIsland } from '../contexts/IslandContext';
import { colors, spacing, typography } from '../styles/theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/routes';

type DashboardNavigationProp = StackNavigationProp<RootStackParamList>;

interface DashboardScreenProps {
  navigation: DashboardNavigationProp;
}

export const RoleBasedDashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { currentIsland, islandInfo } = useIsland();
  const { userRole, features, userTier } = useRoleBasedFeatures();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Island Context Header */}
        <View style={styles.islandHeader}>
          <Text style={styles.islandTitle}>
            Welcome to {islandInfo.displayName}
          </Text>
          <Text style={styles.islandSubtitle}>
            {islandInfo.region} • {userRole?.toUpperCase()}
          </Text>
        </View>

        {/* Role-Based Dashboard Content */}
        <RoleBasedView
          customer={<CustomerDashboard navigation={navigation} />}
          host={<HostDashboard navigation={navigation} />}
          owner={<OwnerDashboard navigation={navigation} />}
          admin={<AdminDashboard navigation={navigation} />}
          showRoleIndicator={true}
          fallback={<GuestDashboard navigation={navigation} />}
        />

        {/* Common Features Section */}
        <View style={styles.commonSection}>
          <Text style={styles.sectionTitle}>Available Features</Text>
          <FeaturesList features={features} navigation={navigation} />
        </View>
      </ScrollView>
    </View>
  );
};

// Customer Dashboard Component
const CustomerDashboard: React.FC<{ navigation: DashboardNavigationProp }> = ({ navigation }) => {
  const { currentIsland } = useIsland();

  return (
    <View style={styles.dashboardSection}>
      <Text style={styles.dashboardTitle}>Find Your Perfect Ride</Text>
      
      <View style={styles.quickActions}>
        <DashboardCard
          title="Search Vehicles"
          description={`Find available vehicles on ${currentIsland}`}
          onPress={() => navigation.navigate('Search', undefined)}
          color={colors.primary}
        />

        <DashboardCard
          title="My Bookings"
          description="View and manage your rentals"
          onPress={() => navigation.navigate('MyBookings')}
          color={colors.secondary}
        />

        <DashboardCard
          title="Favorites"
          description="Your saved vehicles"
          onPress={() => navigation.navigate('Favorites')}
          color={colors.accent}
        />
      </View>
    </View>
  );
};

// Host Dashboard Component
const HostDashboard: React.FC<{ navigation: DashboardNavigationProp }> = ({ navigation }) => {
  return (
    <View style={styles.dashboardSection}>
      <Text style={styles.dashboardTitle}>Host Dashboard</Text>
      
      <View style={styles.quickActions}>
        <DashboardCard
          title="Manage Vehicles"
          description="Add, edit, and manage your fleet"
          onPress={() => navigation.navigate('FleetManagement')}
          color={colors.primary}
        />
        
        <DashboardCard
          title="Bookings"
          description="View incoming reservations"
          onPress={() => navigation.navigate('MyBookings')}
          color={colors.secondary}
        />
        
        <DashboardCard
          title="Host Storefront"
          description="Customize your listing page"
          onPress={() => navigation.navigate('HostStorefront', { hostId: 1 })}
          color={colors.accent}
        />
      </View>
    </View>
  );
};

// Owner Dashboard Component
const OwnerDashboard: React.FC<{ navigation: DashboardNavigationProp }> = ({ navigation }) => {
  return (
    <View style={styles.dashboardSection}>
      <Text style={styles.dashboardTitle}>Business Owner Portal</Text>
      
      <View style={styles.quickActions}>
        <DashboardCard
          title="Fleet Analytics"
          description="Performance metrics and insights"
          onPress={() => navigation.navigate('VehiclePerformance')}
          color={colors.primary}
        />
        
        <DashboardCard
          title="Financial Reports"
          description="Revenue and earnings overview"
          onPress={() => navigation.navigate('FinancialReports')}
          color={colors.secondary}
        />
        
        <DashboardCard
          title="Fleet Management"
          description="Advanced fleet operations"
          onPress={() => navigation.navigate('FleetManagement')}
          color={colors.accent}
        />
        
        <DashboardCard
          title="Document Management"
          description="Vehicle documents and compliance"
          onPress={() => navigation.navigate('VehicleDocumentManagement', { vehicleId: 1 })}
          color={colors.info}
        />
      </View>
    </View>
  );
};

// Admin Dashboard Component
const AdminDashboard: React.FC<{ navigation: DashboardNavigationProp }> = ({ navigation }) => {
  return (
    <View style={styles.dashboardSection}>
      <Text style={styles.dashboardTitle}>Administrator Panel</Text>
      
      <View style={styles.quickActions}>
        <DashboardCard
          title="User Management"
          description="Manage all system users"
          onPress={() => {/* TODO: Navigate to user management */}}
          color={colors.primary}
        />
        
        <DashboardCard
          title="System Analytics"
          description="Platform-wide metrics"
          onPress={() => navigation.navigate('VehiclePerformance')}
          color={colors.secondary}
        />
        
        <DashboardCard
          title="Content Moderation"
          description="Review reports and content"
          onPress={() => {/* TODO: Navigate to moderation */}}
          color={colors.warning}
        />
        
        <DashboardCard
          title="System Settings"
          description="Configure platform settings"
          onPress={() => {/* TODO: Navigate to settings */}}
          color={colors.info}
        />
      </View>
    </View>
  );
};

// Guest Dashboard Component
const GuestDashboard: React.FC<{ navigation: DashboardNavigationProp }> = ({ navigation }) => {
  return (
    <View style={styles.dashboardSection}>
      <Text style={styles.dashboardTitle}>Welcome to Island Rides</Text>
      
      <View style={styles.quickActions}>
        <DashboardCard
          title="Sign In"
          description="Access your account"
          onPress={() => navigation.navigate('Login')}
          color={colors.primary}
        />
        
        <DashboardCard
          title="Create Account"
          description="Join our community"
          onPress={() => navigation.navigate('Registration')}
          color={colors.secondary}
        />
        
        <DashboardCard
          title="Browse Vehicles"
          description="Explore available rentals"
          onPress={() => navigation.navigate('Search')}
          color={colors.accent}
        />
      </View>
    </View>
  );
};

// Features List Component
const FeaturesList: React.FC<{ 
  features: any; 
  navigation: DashboardNavigationProp;
}> = ({ features, navigation }) => {
  const featureItems = [
    { key: 'canRentVehicles', label: 'Rent Vehicles', route: 'Search' },
    { key: 'canListVehicles', label: 'List Vehicles', route: 'FleetManagement' },
    { key: 'canViewAnalytics', label: 'View Analytics', route: 'VehiclePerformance' },
    { key: 'canManageUsers', label: 'Manage Users', route: null },
  ];

  const availableFeatures = featureItems.filter(item => features[item.key]);

  return (
    <View style={styles.featuresList}>
      {availableFeatures.map((feature, index) => (
        <View key={feature.key} style={styles.featureItem}>
          <Text style={styles.featureText}>✓ {feature.label}</Text>
        </View>
      ))}
    </View>
  );
};

// Dashboard Card Component
interface DashboardCardProps {
  title: string;
  description: string;
  onPress: () => void;
  color: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, 
  description, 
  onPress, 
  color 
}) => {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Text style={styles.cardTitle} onPress={onPress}>
        {title}
      </Text>
      <Text style={styles.cardDescription}>
        {description}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  islandHeader: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  islandTitle: {
    fontSize: typography.heading1.fontSize,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  islandSubtitle: {
    fontSize: typography.body.fontSize,
    color: colors.white,
    opacity: 0.9,
  },
  dashboardSection: {
    padding: spacing.lg,
  },
  dashboardTitle: {
    fontSize: typography.heading2.fontSize,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  quickActions: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: typography.heading3.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    fontSize: typography.body.fontSize,
    color: colors.lightGrey,
  },
  commonSection: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: typography.heading3.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  featuresList: {
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: typography.body.fontSize,
    color: colors.success,
    fontWeight: '500',
  },
});

export default RoleBasedDashboardScreen;