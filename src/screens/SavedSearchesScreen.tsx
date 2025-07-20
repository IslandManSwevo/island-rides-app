import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { RootStackParamList, ROUTES } from '../navigation/routes';
import { SavedSearchComponent } from '../components/search/SavedSearchComponent';
import { 
  SavedSearch, 
  SearchAlert,
  searchNotificationService 
} from '../services/searchNotificationService';
import { SearchFilters } from '../types';

type SavedSearchesScreenNavigationProp = StackNavigationProp<RootStackParamList, typeof ROUTES.SAVED_SEARCHES>;
type SavedSearchesScreenRouteProp = RouteProp<RootStackParamList, typeof ROUTES.SAVED_SEARCHES>;

interface SavedSearchesScreenProps {
  navigation: SavedSearchesScreenNavigationProp;
  route: SavedSearchesScreenRouteProp;
}

export const SavedSearchesScreen: React.FC<SavedSearchesScreenProps> = ({ navigation, route }) => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchAlerts, setSearchAlerts] = useState<SearchAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSavedSearchModal, setShowSavedSearchModal] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [searches, alerts, stats] = await Promise.all([
        searchNotificationService.getSavedSearches(),
        searchNotificationService.getSearchAlerts(),
        searchNotificationService.getSearchStatistics()
      ]);
      
      setSavedSearches(searches);
      setSearchAlerts(alerts);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLoadSearch = (filters: SearchFilters) => {
    navigation.navigate(ROUTES.SEARCH, { filters });
  };

  const handleRunSearch = async (search: SavedSearch) => {
    try {
      await searchNotificationService.checkForMatches(search);
      navigation.navigate(ROUTES.SEARCH, { filters: search.filters });
    } catch (error) {
      console.error('Failed to run search:', error);
      Alert.alert('Error', 'Failed to run search. Please try again.');
    }
  };

  const handleDeleteSearch = async (searchId: string) => {
    Alert.alert(
      'Delete Saved Search',
      'Are you sure you want to delete this saved search?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await searchNotificationService.deleteSavedSearch(searchId);
              await loadData();
            } catch (error) {
              console.error('Failed to delete search:', error);
              Alert.alert('Error', 'Failed to delete search. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleToggleActive = async (searchId: string) => {
    try {
      await searchNotificationService.toggleSearchActive(searchId);
      await loadData();
    } catch (error) {
      console.error('Failed to toggle search active state:', error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilterSummary = (filters: SearchFilters) => {
    const parts = [];
    if (filters.island) parts.push(filters.island);
    if (filters.vehicleTypes.length > 0) parts.push(filters.vehicleTypes.join(', '));
    if (filters.priceRange) parts.push(`$${filters.priceRange[0]}-$${filters.priceRange[1]}`);
    return parts.join(' • ');
  };

  const renderStatisticsCard = () => {
    if (!statistics) return null;

    return (
      <View style={styles.statisticsCard}>
        <Text style={styles.statisticsTitle}>Your Search Activity</Text>
        <View style={styles.statisticsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statistics.totalSavedSearches}</Text>
            <Text style={styles.statLabel}>Total Searches</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statistics.activeSavedSearches}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statistics.unreadAlerts}</Text>
            <Text style={styles.statLabel}>New Alerts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{Math.round(statistics.averageMatchCount)}</Text>
            <Text style={styles.statLabel}>Avg Matches</Text>
          </View>
        </View>
        {statistics.mostActiveSearch && (
          <View style={styles.topSearchContainer}>
            <Text style={styles.topSearchLabel}>Most Active Search:</Text>
            <Text style={styles.topSearchName}>{statistics.mostActiveSearch.name}</Text>
            <Text style={styles.topSearchMatches}>
              {statistics.mostActiveSearch.matchCount} matches
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderSearchItem = ({ item }: { item: SavedSearch }) => (
    <View style={styles.searchItem}>
      <View style={styles.searchHeader}>
        <View style={styles.searchTitleContainer}>
          <Text style={styles.searchTitle}>{item.name}</Text>
          <Text style={styles.searchSummary}>{getFilterSummary(item.filters)}</Text>
        </View>
        <View style={styles.searchActions}>
          <TouchableOpacity
            style={[styles.actionButton, item.isActive && styles.activeButton]}
            onPress={() => handleToggleActive(item.id)}
          >
            <Ionicons 
              name={item.isActive ? 'notifications' : 'notifications-off'} 
              size={16} 
              color={item.isActive ? colors.white : colors.lightGrey} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteSearch(item.id)}
          >
            <Ionicons name="trash" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.searchStats}>
        <View style={styles.statItemSmall}>
          <Ionicons name="car" size={16} color={colors.primary} />
          <Text style={styles.statValueSmall}>{item.matchCount} matches</Text>
        </View>
        <View style={styles.statItemSmall}>
          <Ionicons name="time" size={16} color={colors.textSecondary} />
          <Text style={styles.statValueSmall}>{formatDate(item.lastChecked)}</Text>
        </View>
        <View style={styles.statItemSmall}>
          <Ionicons name="repeat" size={16} color={colors.textSecondary} />
          <Text style={styles.statValueSmall}>{item.notificationFrequency}</Text>
        </View>
      </View>

      <View style={styles.searchActionButtons}>
        <TouchableOpacity
          style={styles.runSearchButton}
          onPress={() => handleRunSearch(item)}
        >
          <Ionicons name="search" size={16} color={colors.primary} />
          <Text style={styles.runSearchButtonText}>Run Search</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.loadSearchButton}
          onPress={() => handleLoadSearch(item.filters)}
        >
          <Ionicons name="download" size={16} color={colors.white} />
          <Text style={styles.loadSearchButtonText}>Load Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecentAlert = ({ item }: { item: SearchAlert }) => (
    <View style={[styles.alertItem, !item.isRead && styles.unreadAlert]}>
      <View style={styles.alertIcon}>
        <Ionicons 
          name={
            item.alertType === 'new_vehicle' ? 'car' :
            item.alertType === 'price_drop' ? 'trending-down' :
            item.alertType === 'availability' ? 'flash' :
            'star'
          }
          size={16}
          color={colors.primary}
        />
      </View>
      <View style={styles.alertContent}>
        <Text style={styles.alertMessage} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.alertTime}>{formatDate(item.createdAt)}</Text>
      </View>
    </View>
  );

  const unreadAlertsCount = searchAlerts.filter(a => !a.isRead).length;
  const recentAlerts = searchAlerts.slice(0, 3);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading saved searches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Searches</Text>
        <TouchableOpacity onPress={() => setShowSavedSearchModal(true)}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        ListHeaderComponent={
          <View>
            {renderStatisticsCard()}
            
            {/* Recent Alerts Section */}
            {recentAlerts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Alerts</Text>
                  {unreadAlertsCount > 0 && (
                    <View style={styles.alertsBadge}>
                      <Text style={styles.alertsBadgeText}>{unreadAlertsCount}</Text>
                    </View>
                  )}
                  <TouchableOpacity onPress={() => setShowSavedSearchModal(true)}>
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.alertsList}>
                  {recentAlerts.map((alert) => (
                    <View key={alert.id}>
                      {renderRecentAlert({ item: alert })}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Saved Searches Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your Saved Searches</Text>
                <TouchableOpacity onPress={() => setShowSavedSearchModal(true)}>
                  <Text style={styles.manageText}>Manage</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        }
        data={savedSearches}
        renderItem={renderSearchItem}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={64} color={colors.lightGrey} />
            <Text style={styles.emptyStateTitle}>No Saved Searches</Text>
            <Text style={styles.emptyStateText}>
              Save your searches to get notifications when new vehicles match your criteria
            </Text>
            <TouchableOpacity
              style={styles.createSearchButton}
              onPress={() => navigation.navigate(ROUTES.SEARCH)}
            >
              <Ionicons name="search" size={16} color={colors.white} />
              <Text style={styles.createSearchButtonText}>Start Searching</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <SavedSearchComponent
        visible={showSavedSearchModal}
        onClose={() => setShowSavedSearchModal(false)}
        onLoadSearch={handleLoadSearch}
        currentFilters={route.params?.filters}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.heading2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  contentContainer: {
    padding: spacing.md,
  },
  statisticsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statisticsTitle: {
    ...typography.subheading,
    marginBottom: spacing.md,
  },
  statisticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    ...typography.heading2,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  topSearchContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  topSearchLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  topSearchName: {
    ...typography.body,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  topSearchMatches: {
    ...typography.caption,
    color: colors.primary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.subheading,
  },
  alertsBadge: {
    backgroundColor: colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  alertsBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  seeAllText: {
    ...typography.body,
    color: colors.primary,
    marginLeft: 'auto',
  },
  manageText: {
    ...typography.body,
    color: colors.primary,
  },
  alertsList: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  unreadAlert: {
    backgroundColor: colors.primaryLight + '10',
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  alertTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  searchItem: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  searchTitleContainer: {
    flex: 1,
  },
  searchTitle: {
    ...typography.subheading,
    marginBottom: spacing.xs,
  },
  searchSummary: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  searchActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.offWhite,
  },
  activeButton: {
    backgroundColor: colors.primary,
  },
  searchStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statItemSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statValueSmall: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  searchActionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  runSearchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
  },
  runSearchButtonText: {
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  loadSearchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
  },
  loadSearchButtonText: {
    color: colors.white,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateTitle: {
    ...typography.heading3,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  createSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  createSearchButtonText: {
    color: colors.white,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});