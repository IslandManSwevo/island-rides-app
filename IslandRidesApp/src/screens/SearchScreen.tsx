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
import { Button } from '../components/Button';
import { VehicleCard } from '../components/VehicleCard';
import { vehicleService } from '../services/vehicleService';
import { notificationService } from '../services/notificationService';
import { vehicleFeatureService } from '../services/vehicleFeatureService';
import { Island, VehicleRecommendation, VehicleFeature, VehicleFeatureCategory } from '../types';

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

const VEHICLE_TYPES = [
  'sedan',
  'suv', 
  'truck',
  'van',
  'convertible',
  'coupe',
  'hatchback'
];

const FUEL_TYPES = [
  'gasoline',
  'diesel',
  'electric',
  'hybrid'
];

const TRANSMISSION_TYPES = [
  'automatic',
  'manual',
  'cvt'
];

const VERIFICATION_STATUS_OPTIONS = [
  { key: 'verified', label: 'Verified Only', icon: 'checkmark-circle' },
  { key: 'pending', label: 'Pending Verification', icon: 'time' },
  { key: 'rejected', label: 'Verification Failed', icon: 'close-circle' }
];

const SORT_OPTIONS = [
  { key: 'popularity', label: 'Most Popular', icon: 'trending-up' },
  { key: 'price_low', label: 'Price: Low to High', icon: 'arrow-up' },
  { key: 'price_high', label: 'Price: High to Low', icon: 'arrow-down' },
  { key: 'rating', label: 'Highest Rated', icon: 'star' },
  { key: 'condition', label: 'Best Condition', icon: 'shield-checkmark' },
  { key: 'newest', label: 'Newest First', icon: 'time' }
];

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

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
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
        {/* Date Selection */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Rental Dates</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker('start')}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={styles.dateButtonText}>{formatDate(filters.startDate)}</Text>
            </TouchableOpacity>
            <Text style={styles.dateArrow}>→</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker('end')}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={styles.dateButtonText}>{formatDate(filters.endDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Price Range */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>
            Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}/day
          </Text>
          <View style={styles.priceRangeContainer}>
            <Text style={styles.priceLabel}>${filters.priceRange[0]}</Text>
            <View style={styles.priceSliderContainer}>
              {/* Simple price adjustment buttons - in a real app, use a proper slider */}
              <TouchableOpacity
                style={styles.priceButton}
                onPress={() => updateFilter('priceRange', [Math.max(25, filters.priceRange[0] - 25), filters.priceRange[1]])}
              >
                <Ionicons name="remove" size={16} color={colors.primary} />
              </TouchableOpacity>
              <View style={styles.priceBar} />
              <TouchableOpacity
                style={styles.priceButton}
                onPress={() => updateFilter('priceRange', [filters.priceRange[0], Math.min(500, filters.priceRange[1] + 25)])}
              >
                <Ionicons name="add" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.priceLabel}>${filters.priceRange[1]}</Text>
          </View>
        </View>

        {/* Vehicle Types */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Vehicle Type</Text>
          <View style={styles.optionsGrid}>
            {VEHICLE_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionChip,
                  filters.vehicleTypes.includes(type) && styles.optionChipSelected
                ]}
                onPress={() => toggleArrayFilter('vehicleTypes', type)}
              >
                <Text style={[
                  styles.optionChipText,
                  filters.vehicleTypes.includes(type) && styles.optionChipTextSelected
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fuel Types */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Fuel Type</Text>
          <View style={styles.optionsGrid}>
            {FUEL_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionChip,
                  filters.fuelTypes.includes(type) && styles.optionChipSelected
                ]}
                onPress={() => toggleArrayFilter('fuelTypes', type)}
              >
                <Text style={[
                  styles.optionChipText,
                  filters.fuelTypes.includes(type) && styles.optionChipTextSelected
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Transmission Types */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Transmission Type</Text>
          <View style={styles.optionsGrid}>
            {TRANSMISSION_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionChip,
                  filters.transmissionTypes.includes(type) && styles.optionChipSelected
                ]}
                onPress={() => toggleArrayFilter('transmissionTypes', type)}
              >
                <Text style={[
                  styles.optionChipText,
                  filters.transmissionTypes.includes(type) && styles.optionChipTextSelected
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

                 {/* Seating Capacity */}
         <View style={styles.filterSection}>
           <Text style={styles.filterTitle}>
             Minimum Seating: {filters.minSeatingCapacity} passenger{filters.minSeatingCapacity !== 1 ? 's' : ''}
           </Text>
           <View style={styles.sliderContainer}>
             <TouchableOpacity
               style={styles.sliderButton}
               onPress={() => updateFilter('minSeatingCapacity', Math.max(1, filters.minSeatingCapacity - 1))}
             >
               <Ionicons name="remove" size={16} color={colors.primary} />
             </TouchableOpacity>
             <View style={styles.sliderTrack}>
               <View 
                 style={[styles.sliderProgress, { width: `${(filters.minSeatingCapacity - 1) * 14.28}%` }]} 
               />
             </View>
             <TouchableOpacity
               style={styles.sliderButton}
               onPress={() => updateFilter('minSeatingCapacity', Math.min(8, filters.minSeatingCapacity + 1))}
             >
               <Ionicons name="add" size={16} color={colors.primary} />
             </TouchableOpacity>
           </View>
         </View>

         {/* Condition Rating */}
         <View style={styles.filterSection}>
           <Text style={styles.filterTitle}>
             Minimum Condition Rating: {filters.minConditionRating} star{filters.minConditionRating !== 1 ? 's' : ''}
           </Text>
           <View style={styles.ratingContainer}>
             {[1, 2, 3, 4, 5].map(rating => (
               <TouchableOpacity
                 key={rating}
                 style={styles.starButton}
                 onPress={() => updateFilter('minConditionRating', rating)}
               >
                 <Ionicons
                   name={rating <= filters.minConditionRating ? 'star' : 'star-outline'}
                   size={24}
                   color={rating <= filters.minConditionRating ? '#F59E0B' : colors.lightGrey}
                 />
               </TouchableOpacity>
             ))}
           </View>
         </View>

         {/* Verification Status */}
         <View style={styles.filterSection}>
           <Text style={styles.filterTitle}>Verification Status</Text>
           <View style={styles.optionsGrid}>
             {VERIFICATION_STATUS_OPTIONS.map(option => (
               <TouchableOpacity
                 key={option.key}
                 style={[
                   styles.verificationChip,
                   filters.verificationStatus.includes(option.key) && styles.verificationChipSelected
                 ]}
                 onPress={() => toggleArrayFilter('verificationStatus', option.key)}
               >
                 <Ionicons 
                   name={option.icon as any} 
                   size={16} 
                   color={filters.verificationStatus.includes(option.key) ? colors.white : colors.primary} 
                 />
                 <Text style={[
                   styles.verificationChipText,
                   filters.verificationStatus.includes(option.key) && styles.verificationChipTextSelected
                 ]}>
                   {option.label}
                 </Text>
               </TouchableOpacity>
             ))}
           </View>
         </View>

         {/* Features */}
         {!loadingFeatures && availableFeatures.length > 0 && (
           <View style={styles.filterSection}>
             <Text style={styles.filterTitle}>
               Features ({filters.features.length} selected)
             </Text>
             <ScrollView 
               style={styles.featuresScrollView}
               showsVerticalScrollIndicator={false}
               nestedScrollEnabled
             >
               {featureCategories.map(category => {
                 const categoryFeatures = availableFeatures.filter(f => f.categoryId === category.id);
                 if (categoryFeatures.length === 0) return null;
                 
                 return (
                   <View key={category.id} style={styles.featureCategorySection}>
                     <Text style={styles.featureCategoryTitle}>{category.name}</Text>
                     <View style={styles.featuresGrid}>
                       {categoryFeatures.map(feature => (
                         <TouchableOpacity
                           key={feature.id}
                           style={[
                             styles.featureChip,
                             filters.features.includes(feature.id) && styles.featureChipSelected
                           ]}
                           onPress={() => toggleFeature(feature.id)}
                         >
                           <Text style={[
                             styles.featureChipText,
                             filters.features.includes(feature.id) && styles.featureChipTextSelected
                           ]}>
                             {feature.name}
                           </Text>
                           {feature.isPremium && (
                             <View style={styles.premiumBadge}>
                               <Text style={styles.premiumBadgeText}>★</Text>
                             </View>
                           )}
                         </TouchableOpacity>
                       ))}
                     </View>
                   </View>
                 );
               })}
             </ScrollView>
           </View>
         )}

         {/* Service Options */}
         <View style={styles.filterSection}>
           <Text style={styles.filterTitle}>Service Options</Text>
           <View style={styles.serviceOptionsContainer}>
             <TouchableOpacity
               style={[
                 styles.serviceOption,
                 filters.deliveryAvailable && styles.serviceOptionSelected
               ]}
               onPress={() => updateFilter('deliveryAvailable', !filters.deliveryAvailable)}
             >
               <Ionicons 
                 name="car-outline" 
                 size={20} 
                 color={filters.deliveryAvailable ? colors.white : colors.primary} 
               />
               <Text style={[
                 styles.serviceOptionText,
                 filters.deliveryAvailable && styles.serviceOptionTextSelected
               ]}>
                 Delivery Available
               </Text>
             </TouchableOpacity>
             
             <TouchableOpacity
               style={[
                 styles.serviceOption,
                 filters.airportPickup && styles.serviceOptionSelected
               ]}
               onPress={() => updateFilter('airportPickup', !filters.airportPickup)}
             >
               <Ionicons 
                 name="airplane-outline" 
                 size={20} 
                 color={filters.airportPickup ? colors.white : colors.primary} 
               />
               <Text style={[
                 styles.serviceOptionText,
                 filters.airportPickup && styles.serviceOptionTextSelected
               ]}>
                 Airport Pickup
               </Text>
             </TouchableOpacity>
           </View>
         </View>

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
                updateFilter('sortBy', option.key as any);
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    backgroundColor: '#F59E0B',
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
