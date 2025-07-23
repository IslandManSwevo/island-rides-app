import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePerformanceMonitoring } from '../hooks/usePerformanceMonitoring';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { StandardButton } from '../components/templates/StandardButton';
import { VehicleCard } from '../components/VehicleCard';
import { vehicleService } from '../services/vehicleService';
import { notificationService } from '../services/notificationService';
import { vehicleFeatureService } from '../services/vehicleFeatureService';
import { useServices } from '../services/ServiceRegistry';
import { useFeatureFlag } from '../services/FeatureFlagService';
import { Island, VehicleRecommendation, VehicleFeature, VehicleFeatureCategory } from '../types';
import DateFilter from '../components/DateFilter';
import PriceRangeFilter from '../components/PriceRangeFilter';
import OptionFilter from '../components/OptionFilter';
import SeatingCapacityFilter from '../components/SeatingCapacityFilter';
import ConditionRatingFilter from '../components/ConditionRatingFilter';
import VerificationStatusFilter from '../components/VerificationStatusFilter';
import FeaturesFilter from '../components/FeaturesFilter';
import ServiceOptionsFilter from '../components/ServiceOptionsFilter';
import { VEHICLE_TYPES, FUEL_TYPES, TRANSMISSION_TYPES, VERIFICATION_STATUS_OPTIONS, SORT_OPTIONS } from '../constants/filters';
import { islands } from '../constants/islands';
import { RootStackParamList, ROUTES } from '../navigation/routes';
import { IntelligentFilterComponent } from '../components/search';

type SearchScreenNavigationProp = StackNavigationProp<RootStackParamList, typeof ROUTES.SEARCH>;
type SearchScreenRouteProp = RouteProp<RootStackParamList, typeof ROUTES.SEARCH>;

interface SearchScreenProps {
  navigation: SearchScreenNavigationProp;
  route: SearchScreenRouteProp;
}

interface SearchFilters {
  island: Island | '';
  startDate: Date | null;
  endDate: Date | null;
  priceRange: [number, number];
  vehicleTypes: string[];
  fuelTypes: string[];
  transmissionTypes: string[];
  minSeatingCapacity: number;
  features: number[]; // Feature IDs
  minConditionRating: number;
  verificationStatus: ('pending' | 'verified' | 'rejected' | 'expired')[];
  deliveryAvailable: boolean;
  airportPickup: boolean;
  instantBooking: boolean;
  sortBy: 'popularity' | 'price_low' | 'price_high' | 'rating' | 'newest' | 'condition';
}

export const SearchScreen: React.FC<SearchScreenProps> = React.memo(({ navigation, route }) => {
  const { getMetrics, resetMetrics } = usePerformanceMonitoring('SearchScreen', {
    slowRenderThreshold: 16,
    enableLogging: __DEV__,
    trackMemory: true,
  });
  const { island } = (route.params as any) || {};
  
  const [filters, setFilters] = useState<SearchFilters>({
    island: island || 'Freeport', // Default to Grand Bahama (Freeport) as per Story 1.2
    startDate: null,
    endDate: null,
    priceRange: [50, 300],
    vehicleTypes: [],
    fuelTypes: [],
    transmissionTypes: [],
    minSeatingCapacity: 1,
    features: [],
    minConditionRating: 1,
    verificationStatus: [],
    deliveryAvailable: false,
    airportPickup: false,
    instantBooking: false,
    sortBy: 'popularity'
  });

  const [showAllIslands, setShowAllIslands] = useState(false);
  const [showIslandSelector, setShowIslandSelector] = useState(false);

  const [searchResults, setSearchResults] = useState<VehicleRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [showSortModal, setShowSortModal] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Feature-related state
  const [availableFeatures, setAvailableFeatures] = useState<VehicleFeature[]>([]);
  const [featureCategories, setFeatureCategories] = useState<VehicleFeatureCategory[]>([]);
  const [loadingFeatures, setLoadingFeatures] = useState(false);

  const loadAvailableFeatures = useCallback(async () => {
    try {
      setLoadingFeatures(true);
      const [featuresResponse, categories] = await Promise.all([
        vehicleFeatureService.getVehicleFeatures(),
        vehicleFeatureService.getFeatureCategories()
      ]);
      setAvailableFeatures(featuresResponse.features);
      setFeatureCategories(categories);
    } catch (error) {
      console.error('Failed to load features:', error);
      notificationService.error('Failed to load vehicle features');
    } finally {
      setLoadingFeatures(false);
    }
  }, []);

  useEffect(() => {
    const loadPersistedFilters = async () => {
      try {
        const saved = await AsyncStorage.getItem('searchFilters');
        if (saved) {
          const parsedFilters = JSON.parse(saved);
          // Validate that parsed data has expected structure
          if (parsedFilters && typeof parsedFilters === 'object') {
            setFilters(parsedFilters);
          } else {
            throw new Error('Invalid filter data format');
          }
        }
      } catch (error) {
        console.error('Failed to load filters', error);
        let errorMessage = 'Failed to load your saved search preferences. Using default settings.';
        
        if (error instanceof SyntaxError) {
          errorMessage = 'Your saved search preferences are corrupted. Using default settings.';
        } else if (error instanceof Error && error.message.includes('Invalid filter data')) {
          errorMessage = 'Your saved search preferences have an invalid format. Using default settings.';
        }
        
        Alert.alert(
          'Settings Load Error',
          errorMessage,
          [{ text: 'OK' }]
        );
      }
    };
    loadPersistedFilters();
  }, []);

  useEffect(() => {
    const saveFilters = async () => {
      try {
        await AsyncStorage.setItem('searchFilters', JSON.stringify(filters));
      } catch (error) {
        console.error('Failed to save filters', error);
        
        // Provide specific error messages based on error type
        let message = 'Failed to save search preferences';
        
        if (error instanceof Error) {
          if (error.message.includes('storage quota')) {
            message = 'Storage full - cannot save search preferences';
          } else if (error.message.includes('permission')) {
            message = 'Permission denied - cannot save search preferences';
          }
        }
        
        // Show a less intrusive notification for save errors to avoid overwhelming the user
        notificationService.warning(message, {
          duration: 3000
        });
      }
    };
    saveFilters();
  }, [filters]);

  const performSearch = useCallback(async () => {
    try {
      setLoading(true);
      setHasSearched(true);

      const searchParams = {
        location: showAllIslands ? undefined : filters.island, // Only filter by island if not showing all
        vehicleType: filters.vehicleTypes.length > 0 ? filters.vehicleTypes.join(',') : undefined,
        fuelType: filters.fuelTypes.length > 0 ? filters.fuelTypes.join(',') : undefined,
        transmissionType: filters.transmissionTypes.length > 0 ? filters.transmissionTypes.join(',') : undefined,
        seatingCapacity: filters.minSeatingCapacity > 1 ? filters.minSeatingCapacity : undefined,
        minPrice: filters.priceRange[0],
        maxPrice: filters.priceRange[1],
        features: filters.features.length > 0 ? filters.features.join(',') : undefined,
        conditionRating: filters.minConditionRating > 1 ? filters.minConditionRating : undefined,
        verificationStatus: filters.verificationStatus.length > 0 ? filters.verificationStatus.join(',') : undefined,
        deliveryAvailable: filters.deliveryAvailable ? 'true' : undefined,
        airportPickup: filters.airportPickup ? 'true' : undefined,
        instantBooking: filters.instantBooking ? 'true' : undefined,
        sortBy: filters.sortBy,
        page: 1,
        limit: 50
      };

      // Remove undefined values
      Object.keys(searchParams).forEach(key => 
        searchParams[key as keyof typeof searchParams] === undefined && delete searchParams[key as keyof typeof searchParams]
      );

      const response = await vehicleService.searchVehicles(searchParams);
      setSearchResults(response);
      
      if (response.length === 0) {
        notificationService.info('No vehicles found matching your criteria', {
          duration: 4000
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      notificationService.error('Failed to search vehicles', {
        duration: 4000,
        action: {
          label: 'Retry',
          handler: () => performSearch()
        }
      });
    } finally {
      setLoading(false);
    }
  }, [showAllIslands, filters]);

  useEffect(() => {
    loadAvailableFeatures();
    if (island) {
      performSearch();
    }
  }, [loadAvailableFeatures, performSearch, island]);

  const updateFilter = useCallback(<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleArrayFilter = useCallback((key: string, value: string) => {
    setFilters(prev => {
      const currentValue = prev[key as keyof SearchFilters];
      
      // Type guard to ensure currentValue is an array
      if (!Array.isArray(currentValue)) {
        console.warn(`Expected array for filter key "${key}", but got:`, typeof currentValue);
        return prev; // Return unchanged state if not an array
      }
      
      const currentArray = currentValue as string[];
      return {
        ...prev,
        [key]: currentArray.includes(value)
          ? currentArray.filter(item => item !== value)
          : [...currentArray, value]
      };
    });
  }, []);

  const toggleFeature = useCallback((featureId: number) => {
    setFilters(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(id => id !== featureId)
        : [...prev.features, featureId]
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      island: island || 'Freeport', // Default to Grand Bahama (Freeport)
      startDate: null,
      endDate: null,
      priceRange: [50, 300],
      vehicleTypes: [],
      fuelTypes: [],
      transmissionTypes: [],
      minSeatingCapacity: 1,
      features: [],
      minConditionRating: 1,
      verificationStatus: [],
      deliveryAvailable: false,
      airportPickup: false,
      instantBooking: false,
      sortBy: 'popularity'
    });
    setShowAllIslands(false);
  }, [island]);

  const handleDateChange = useCallback((event: DateTimePickerEvent, selectedDate: Date | undefined, type: 'start' | 'end') => {
    setShowDatePicker(null);
    if (selectedDate) {
      updateFilter(type === 'start' ? 'startDate' : 'endDate', selectedDate);
    }
  }, [updateFilter]);

  const formatDate = useCallback((date: Date | null) => {
    if (!date) return 'Select Date';
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }, []);

  const renderFilterSection = useCallback(() => (
    <View style={styles.filtersContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <DateFilter
          startDate={filters.startDate}
          endDate={filters.endDate}
          onShowDatePicker={setShowDatePicker}
          formatDate={formatDate}
        />
        <PriceRangeFilter
          priceRange={filters.priceRange}
          onUpdateFilter={updateFilter as any}
        />
        <OptionFilter
          title="Vehicle Type"
          options={VEHICLE_TYPES}
          selectedOptions={filters.vehicleTypes}
          onToggleOption={(type) => toggleArrayFilter('vehicleTypes', type)}
        />
        <OptionFilter
          title="Fuel Type"
          options={FUEL_TYPES}
          selectedOptions={filters.fuelTypes}
          onToggleOption={(type) => toggleArrayFilter('fuelTypes', type)}
        />
        <OptionFilter
          title="Transmission Type"
          options={TRANSMISSION_TYPES}
          selectedOptions={filters.transmissionTypes}
          onToggleOption={(type) => toggleArrayFilter('transmissionTypes', type)}
        />
        <SeatingCapacityFilter
          minSeatingCapacity={filters.minSeatingCapacity}
          onUpdateFilter={updateFilter as any}
        />
        <ConditionRatingFilter
          minConditionRating={filters.minConditionRating}
          onUpdateFilter={updateFilter as any}
        />
        <VerificationStatusFilter
          verificationStatus={filters.verificationStatus}
          onToggleFilter={(key, value) => toggleArrayFilter(key, value as "rejected" | "pending" | "verified" | "expired")}
          filterKey="verificationStatus"
        />
        <FeaturesFilter
          features={filters.features}
          availableFeatures={availableFeatures}
          featureCategories={featureCategories}
          loadingFeatures={loadingFeatures}
          onToggleFeature={toggleFeature}
        />
        <ServiceOptionsFilter
          deliveryAvailable={filters.deliveryAvailable}
          airportPickup={filters.airportPickup}
          onUpdateFilter={updateFilter as any}
        />

        {/* Filter Actions */}
        <View style={styles.filterActions}>
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
          <StandardButton
            title="Apply Filters"
            onPress={() => {
              setShowFilters(false);
              performSearch();
            }}
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  ), [filters, availableFeatures, featureCategories, loadingFeatures, toggleArrayFilter, toggleFeature, clearFilters, performSearch, formatDate, updateFilter]);

  const renderSearchResults = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Searching vehicles...</Text>
        </View>
      );
    }

    if (!hasSearched) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={64} color={colors.lightGrey} />
          <Text style={styles.emptyStateTitle}>Ready to Find Your Ride?</Text>
          <Text style={styles.emptyStateText}>
            Use the search button to find available vehicles in your area
          </Text>
        </View>
      );
    }

    if (searchResults.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="car-outline" size={64} color={colors.lightGrey} />
          <Text style={styles.emptyStateTitle}>No Vehicles Found</Text>
          <Text style={styles.emptyStateText}>
            Try adjusting your filters or search criteria
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={clearFilters}>
            <Text style={styles.retryButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VehicleCard
            vehicle={item.vehicle}
            onPress={() => navigation.navigate('VehicleDetail', { vehicle: item.vehicle })}
          />
        )}
        contentContainerStyle={styles.resultsContainer}
        showsVerticalScrollIndicator={false}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={8}
        windowSize={10}
        getItemLayout={(data, index) => ({
          length: 280, // Approximate VehicleCard height
          offset: 280 * index,
          index,
        })}
      />
    );
  }, [loading, hasSearched, searchResults, clearFilters, navigation]);

  const renderIslandSelectorModal = useCallback(() => (
    <Modal
      visible={showIslandSelector}
      transparent
      animationType="slide"
      onRequestClose={() => setShowIslandSelector(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.islandModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Island</Text>
            <TouchableOpacity onPress={() => setShowIslandSelector(false)}>
              <Ionicons name="close" size={24} color={colors.darkGrey} />
            </TouchableOpacity>
          </View>
          
          {islands.map(island => (
            <TouchableOpacity
              key={island.id}
              style={[
                styles.islandOption,
                filters.island === island.id && styles.islandOptionSelected
              ]}
              onPress={() => {
                updateFilter('island', island.id);
                setShowAllIslands(false); // Reset "show all" when selecting specific island
                setShowIslandSelector(false);
                if (hasSearched) performSearch();
              }}
            >
              <Text style={styles.islandEmoji}>{island.emoji}</Text>
              <View style={styles.islandDetails}>
                <Text style={[
                  styles.islandOptionText,
                  filters.island === island.id && styles.islandOptionTextSelected
                ]}>
                  {island.name}
                </Text>
                <Text style={styles.islandDescription}>{island.description}</Text>
                <View style={styles.islandFeatures}>
                  {island.features.slice(0, 2).map((feature, index) => (
                    <Text key={index} style={styles.islandFeature}>{feature}</Text>
                  ))}
                </View>
              </View>
              {filters.island === island.id && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  ), [showIslandSelector, filters.island, islands, updateFilter, hasSearched, performSearch]);

  const renderSortModal = useCallback(() => (
    <Modal
      visible={showSortModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSortModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sortModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort Results</Text>
            <TouchableOpacity onPress={() => setShowSortModal(false)}>
              <Ionicons name="close" size={24} color={colors.darkGrey} />
            </TouchableOpacity>
          </View>
          
          {SORT_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortOption,
                filters.sortBy === option.key && styles.sortOptionSelected
              ]}
              onPress={() => {
                updateFilter('sortBy', option.key as SearchFilters['sortBy']);
                setShowSortModal(false);
                if (hasSearched) performSearch();
              }}
            >
              <Ionicons 
                name={option.icon} 
                size={20} 
                color={filters.sortBy === option.key ? colors.primary : colors.lightGrey} 
              />
              <Text style={[
                styles.sortOptionText,
                filters.sortBy === option.key && styles.sortOptionTextSelected
              ]}>
                {option.label}
              </Text>
              {filters.sortBy === option.key && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  ), [showSortModal, filters.sortBy, updateFilter, hasSearched, performSearch]);

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <Text style={styles.title}>Search Vehicles</Text>
        
        {/* Intelligent Filter Component */}
        <IntelligentFilterComponent
          filters={filters}
          onFiltersChange={setFilters}
          searchHistory={[]}
          userPreferences={{}}
        />
        
        {/* Island Selector - Prominent as per Story 1.2 */}
        <View style={styles.islandSelectorContainer}>
          <TouchableOpacity
            style={styles.islandSelector}
            onPress={() => setShowIslandSelector(true)}
          >
            <View style={styles.islandSelectorContent}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <View style={styles.islandInfo}>
                <Text style={styles.islandLabel}>Island</Text>
                <Text style={styles.islandValue}>
                  {showAllIslands ? 'All Islands' : islands.find(i => i.id === filters.island)?.name || filters.island}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={16} color={colors.lightGrey} />
            </View>
          </TouchableOpacity>
          
          {/* View All Islands Toggle */}
          <TouchableOpacity
            style={[
              styles.toggleButton,
              showAllIslands && styles.toggleButtonActive
            ]}
            onPress={() => {
              setShowAllIslands(!showAllIslands);
              if (hasSearched) performSearch();
            }}
          >
            <Ionicons 
              name={showAllIslands ? "globe" : "location-outline"} 
              size={16} 
              color={showAllIslands ? colors.white : colors.primary} 
            />
            <Text style={[
              styles.toggleButtonText,
              showAllIslands && styles.toggleButtonTextActive
            ]}>
              {showAllIslands ? 'All' : 'Filter'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchActions}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options-outline" size={20} color={colors.primary} />
            <Text style={styles.filterButtonText}>Filters</Text>
            {(filters.vehicleTypes.length + filters.fuelTypes.length + filters.transmissionTypes.length + filters.verificationStatus.length) > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {filters.vehicleTypes.length + filters.fuelTypes.length + filters.transmissionTypes.length + filters.verificationStatus.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {hasSearched && (
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setShowSortModal(true)}
            >
              <Ionicons name="swap-vertical-outline" size={20} color={colors.primary} />
              <Text style={styles.sortButtonText}>Sort</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.searchButton}
            onPress={performSearch}
            disabled={loading}
          >
            <Ionicons name="search" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {showFilters ? renderFilterSection() : renderSearchResults()}
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={
            showDatePicker === 'start' 
              ? filters.startDate || new Date() 
              : filters.endDate || new Date()
          }
          mode="date"
          minimumDate={new Date()}
          onChange={(event, date) => handleDateChange(event, date, showDatePicker)}
        />
      )}

      {/* Island Selector Modal */}
      {renderIslandSelectorModal()}
      
      {/* Sort Modal */}
      {renderSortModal()}
    </View>
  );
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  searchHeader: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  title: {
    ...typography.heading1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.lightGrey,
    marginBottom: spacing.md,
  },
  islandSelectorContainer: {
    marginBottom: spacing.md,
  },
  islandSelector: {
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    marginBottom: spacing.sm,
  },
  islandSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  islandInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  islandLabel: {
    ...typography.caption,
    color: colors.lightGrey,
    marginBottom: 2,
  },
  islandValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.darkGrey,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    alignSelf: 'flex-start',
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleButtonText: {
    ...typography.caption,
    marginLeft: spacing.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  toggleButtonTextActive: {
    color: colors.white,
  },
  searchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    flex: 1,
    position: 'relative',
  },
  filterButtonText: {
    ...typography.body,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  sortButtonText: {
    ...typography.body,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
  },
  mainContent: {
    flex: 1,
  },
  filtersContainer: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.lg,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterTitle: {
    ...typography.subheading,
    marginBottom: spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  dateButtonText: {
    ...typography.body,
    marginLeft: spacing.sm,
  },
  dateArrow: {
    ...typography.body,
    marginHorizontal: spacing.md,
    color: colors.lightGrey,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    ...typography.body,
    fontWeight: '600',
    minWidth: 60,
  },
  priceSliderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  priceButton: {
    backgroundColor: colors.offWhite,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  priceBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.primary,
    marginHorizontal: spacing.sm,
    borderRadius: 2,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionChip: {
    backgroundColor: colors.offWhite,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  optionChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionChipText: {
    ...typography.body,
    fontSize: 14,
  },
  optionChipTextSelected: {
    color: colors.white,
  },
  featureChip: {
    backgroundColor: colors.offWhite,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  featureChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  featureChipText: {
    ...typography.body,
    fontSize: 13,
  },
  featureChipTextSelected: {
    color: colors.white,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.offWhite,
  },
  clearButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  clearButtonText: {
    ...typography.body,
    color: colors.lightGrey,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
    color: colors.lightGrey,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateTitle: {
    ...typography.heading1,
    fontSize: 24,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    ...typography.body,
    color: colors.lightGrey,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  retryButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  resultsContainer: {
    padding: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  islandModal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  islandOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  islandOptionSelected: {
    backgroundColor: colors.offWhite,
  },
  islandEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  islandDetails: {
    flex: 1,
  },
  islandOptionText: {
    ...typography.subheading,
    marginBottom: spacing.xs,
  },
  islandOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  islandDescription: {
    ...typography.caption,
    color: colors.lightGrey,
    marginBottom: spacing.xs,
  },
  islandFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  islandFeature: {
    ...typography.caption,
    color: colors.primary,
    backgroundColor: colors.offWhite,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    fontSize: 10,
  },
  sortModal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  modalTitle: {
    ...typography.subheading,
    fontSize: 18,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  sortOptionSelected: {
    backgroundColor: colors.offWhite,
  },
  sortOptionText: {
    ...typography.body,
    marginLeft: spacing.md,
    flex: 1,
  },
  sortOptionTextSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
  // New slider styles
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderButton: {
    backgroundColor: colors.offWhite,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.lightGrey,
    marginHorizontal: spacing.md,
    borderRadius: 2,
  },
  sliderProgress: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  // Rating styles
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  starButton: {
    padding: spacing.xs,
  },
  // Verification chip styles
  verificationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    gap: spacing.xs,
  },
  verificationChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  verificationChipText: {
    ...typography.body,
    fontSize: 14,
  },
  verificationChipTextSelected: {
    color: colors.white,
  },
  // Features styles
  featuresScrollView: {
    maxHeight: 200,
  },
  featureCategorySection: {
    marginBottom: spacing.md,
  },
  featureCategoryTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
    color: colors.darkGrey,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.warning,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Service options styles
  serviceOptionsContainer: {
    gap: spacing.sm,
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    gap: spacing.sm,
  },
  serviceOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  serviceOptionText: {
    ...typography.body,
    fontSize: 14,
  },
  serviceOptionTextSelected: {
    color: colors.white,
  },
});

export default SearchScreen;
