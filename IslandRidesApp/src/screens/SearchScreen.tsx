import React, { useState, useEffect } from 'react';
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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import Button from '../components/Button';
import { VehicleCard } from '../components/VehicleCard';
import { vehicleService } from '../services/vehicleService';
import { notificationService } from '../services/notificationService';
import { vehicleFeatureService } from '../services/vehicleFeatureService';
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

interface SearchScreenProps {
  navigation: any;
  route: any;
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
  verificationStatus: string[];
  deliveryAvailable: boolean;
  airportPickup: boolean;
  sortBy: 'popularity' | 'price_low' | 'price_high' | 'rating' | 'newest' | 'condition';
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ navigation, route }) => {
  const { island } = route.params || {};
  
  const [filters, setFilters] = useState<SearchFilters>({
    island: island || '',
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
    sortBy: 'popularity'
  });

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

  useEffect(() => {
    loadAvailableFeatures();
    if (island) {
      performSearch();
    }
  }, []);

  const loadAvailableFeatures = async () => {
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
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      setHasSearched(true);

      const searchParams = {
        location: filters.island,
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
    } catch (error: any) {
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
  };

  const updateFilter = <K extends keyof any>(key: K, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: 'vehicleTypes' | 'fuelTypes' | 'transmissionTypes' | 'verificationStatus', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const toggleFeature = (featureId: number) => {
    setFilters(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(id => id !== featureId)
        : [...prev.features, featureId]
    }));
  };

  const clearFilters = () => {
    setFilters({
      island: island || '',
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
      sortBy: 'popularity'
    });
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined, type: 'start' | 'end') => {
    setShowDatePicker(null);
    if (selectedDate) {
      updateFilter(type === 'start' ? 'startDate' : 'endDate', selectedDate);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select Date';
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const renderFilterSection = () => (
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
          onUpdateFilter={updateFilter}
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
          onUpdateFilter={updateFilter}
        />
        <ConditionRatingFilter
          minConditionRating={filters.minConditionRating}
          onUpdateFilter={updateFilter}
        />
        <VerificationStatusFilter
          verificationStatus={filters.verificationStatus}
          onToggleFilter={(key, value) => toggleArrayFilter(key, value)}
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
          onUpdateFilter={updateFilter}
        />

        {/* Filter Actions */}
        <View style={styles.filterActions}>
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
          <Button
            title="Apply Filters"
            onPress={() => {
              setShowFilters(false);
              performSearch();
            }}
          />
        </View>
      </ScrollView>
    </View>
  );

  const renderSearchResults = () => {
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
      />
    );
  };

  const renderSortModal = () => (
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
                updateFilter('sortBy', option.key);
                setShowSortModal(false);
                if (hasSearched) performSearch();
              }}
            >
              <Ionicons 
                name={option.icon as any} 
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
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <Text style={styles.title}>Search Vehicles</Text>
        {island && (
          <Text style={styles.subtitle}>{island}</Text>
        )}
        
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

      {/* Sort Modal */}
      {renderSortModal()}
    </View>
  );
};

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
