import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VehicleCard } from '../components/VehicleCard';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { Vehicle } from '../types';

interface FavoriteVehicle extends Vehicle {
  favoriteId: number;
  notes?: string;
  priceDropped?: boolean;
  previousPrice?: number;
}

interface FavoritesScreenProps {
  navigation: any;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ navigation }) => {
  const [favorites, setFavorites] = useState<FavoriteVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState<number[]>([]);
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response: any = await apiService.get('/favorites');
      setFavorites(response.favorites || []);
    } catch (error: any) {
      console.error('Error fetching favorites:', error);
      if (error?.response?.status !== 401) {
        notificationService.error('Failed to load favorites', {
          duration: 4000,
          action: {
            label: 'Retry',
            handler: () => fetchFavorites()
          }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  };

  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    setSelectedVehicles([]);
  };

  const toggleVehicleSelection = (vehicleId: number) => {
    if (selectedVehicles.includes(vehicleId)) {
      setSelectedVehicles(selectedVehicles.filter(id => id !== vehicleId));
    } else if (selectedVehicles.length < 3) {
      setSelectedVehicles([...selectedVehicles, vehicleId]);
    } else {
      notificationService.warning('You can compare up to 3 vehicles only', {
        duration: 3000
      });
    }
  };

  const compareVehicles = () => {
    if (selectedVehicles.length < 2) {
      notificationService.warning('Select at least 2 vehicles to compare', {
        duration: 3000
      });
      return;
    }

    // Navigate to comparison screen (if implemented)
    navigation.navigate('CompareVehicles', { vehicleIds: selectedVehicles });
  };

  const handleVehiclePress = (vehicle: FavoriteVehicle) => {
    if (compareMode) {
      toggleVehicleSelection(vehicle.id);
    } else {
      navigation.navigate('VehicleDetail', { vehicle });
    }
  };

  const handleFavoriteToggle = (vehicleId: number, isFavorited: boolean) => {
    if (!isFavorited) {
      // Remove from local state when unfavorited
      setFavorites(prev => prev.filter(fav => fav.id !== vehicleId));
    }
  };

  const renderVehicleItem = ({ item }: { item: FavoriteVehicle }) => (
    <View style={styles.vehicleContainer}>
      {item.priceDropped && (
        <View style={styles.priceDropBanner}>
          <Ionicons name="trending-down" size={16} color={colors.white} />
          <Text style={styles.priceDropText}>
            Price dropped from ${item.previousPrice} to ${item.dailyRate}!
          </Text>
        </View>
      )}
      <TouchableOpacity
        onPress={() => handleVehiclePress(item)}
        style={[
          styles.vehicleCardContainer,
          selectedVehicles.includes(item.id) && styles.selectedVehicle
        ]}
        activeOpacity={0.7}
      >
        <VehicleCard
          vehicle={item}
          onPress={() => handleVehiclePress(item)}
        />
        {compareMode && (
          <View style={styles.selectionIndicator}>
            <View style={[
              styles.checkbox,
              selectedVehicles.includes(item.id) && styles.checkedBox
            ]}>
              {selectedVehicles.includes(item.id) && (
                <Ionicons name="checkmark" size={16} color={colors.white} />
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" size={64} color={colors.lightGrey} />
      <Text style={styles.emptyTitle}>No favorites yet</Text>
      <Text style={styles.emptyText}>
        Start exploring and save vehicles you love by tapping the heart icon!
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => navigation.navigate('IslandSelection')}
      >
        <Ionicons name="search" size={20} color={colors.white} style={styles.buttonIcon} />
        <Text style={styles.exploreButtonText}>Explore Vehicles</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.title}>My Favorites</Text>
        {favorites.length > 0 && (
          <Text style={styles.subtitle}>{favorites.length} vehicle{favorites.length !== 1 ? 's' : ''}</Text>
        )}
      </View>
      {favorites.length > 1 && (
        <TouchableOpacity onPress={toggleCompareMode} style={styles.compareButton}>
          <Ionicons 
            name={compareMode ? "close" : "git-compare"} 
            size={20} 
            color={compareMode ? colors.error : colors.primary}
            style={styles.buttonIcon}
          />
          <Text style={[
            styles.compareButtonText,
            compareMode && styles.cancelButtonText
          ]}>
            {compareMode ? 'Cancel' : 'Compare'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCompareBar = () => {
    if (!compareMode) return null;

    return (
      <View style={styles.compareBar}>
        <View style={styles.compareInfo}>
          <Text style={styles.compareText}>
            Select up to 3 vehicles ({selectedVehicles.length}/3)
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.compareActionButton,
            selectedVehicles.length < 2 && styles.compareActionButtonDisabled
          ]}
          onPress={compareVehicles}
          disabled={selectedVehicles.length < 2}
        >
          <Ionicons name="analytics" size={16} color={colors.white} style={styles.buttonIcon} />
          <Text style={styles.compareActionText}>Compare ({selectedVehicles.length})</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your favorites...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderCompareBar()}
      
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.favoriteId?.toString() || item.id.toString()}
        renderItem={renderVehicleItem}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContainer,
          favorites.length === 0 && styles.emptyContainer
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...typography.heading1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.lightGrey,
    fontSize: 14,
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  compareButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButtonText: {
    color: colors.error,
  },
  compareBar: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  compareInfo: {
    flex: 1,
  },
  compareText: {
    color: colors.white,
    fontWeight: '500',
  },
  compareActionButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  compareActionButtonDisabled: {
    opacity: 0.5,
  },
  compareActionText: {
    color: colors.white,
    fontWeight: '600',
  },
  listContainer: {
    padding: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  vehicleContainer: {
    marginBottom: spacing.md,
  },
  vehicleCardContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  selectedVehicle: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  priceDropBanner: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  priceDropText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 12,
    marginLeft: spacing.xs,
  },
  selectionIndicator: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    zIndex: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 2,
    borderColor: colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.heading1,
    fontSize: 22,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    color: colors.lightGrey,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  exploreButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exploreButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
  },
  loadingText: {
    ...typography.body,
    color: colors.lightGrey,
    marginTop: spacing.md,
  },
}); 