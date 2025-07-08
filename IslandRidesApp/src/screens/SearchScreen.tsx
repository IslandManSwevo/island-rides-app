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
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { Button } from '../components/Button';
import { VehicleCard } from '../components/VehicleCard';
import { vehicleService } from '../services/vehicleService';
import { notificationService } from '../services/notificationService';
import { Island, VehicleRecommendation } from '../types';

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
  features: string[];
  sortBy: 'price_asc' | 'price_desc' | 'rating' | 'distance' | 'newest';
}

const VEHICLE_TYPES = [
  'Sedan',
  'SUV', 
  'Compact',
  'Luxury',
  'Convertible',
  'Truck',
  'Van'
];

const VEHICLE_FEATURES = [
  'Air Conditioning',
  'Bluetooth',
  'GPS Navigation',
  'Backup Camera',
  'USB Charging',
  'Automatic Transmission',
  'Manual Transmission',
  'Sunroof',
  'Leather Seats',
  'WiFi Hotspot'
];

const SORT_OPTIONS = [
  { key: 'price_asc', label: 'Price: Low to High', icon: 'arrow-up' },
  { key: 'price_desc', label: 'Price: High to Low', icon: 'arrow-down' },
  { key: 'rating', label: 'Highest Rated', icon: 'star' },
  { key: 'distance', label: 'Distance', icon: 'location' },
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
    features: [],
    sortBy: 'price_asc'
  });

  const [searchResults, setSearchResults] = useState<VehicleRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [showSortModal, setShowSortModal] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (island) {
      performSearch();
    }
  }, []);

  const performSearch = async () => {
    try {
      setLoading(true);
      setHasSearched(true);

      const searchParams = {
        island: filters.island as Island,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        priceRange: filters.priceRange,
        vehicleType: filters.vehicleTypes.length > 0 ? filters.vehicleTypes[0] : undefined
      };

      let results = await vehicleService.searchVehicles(searchParams);
      
      // Apply client-side filtering for features
      if (filters.features.length > 0) {
        results = results.filter(vehicle => 
          filters.features.every(feature => 
            // Mock feature checking - in real app, this would be in the API
            true // For now, assume all vehicles have requested features
          )
        );
      }

      // Apply sorting
      results = sortResults(results, filters.sortBy);
      
      setSearchResults(results);
      
      if (results.length === 0) {
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

  const sortResults = (results: VehicleRecommendation[], sortBy: string): VehicleRecommendation[] => {
    const sorted = [...results];
    
    switch (sortBy) {
      case 'price_asc':
        return sorted.sort((a, b) => a.pricePerDay - b.pricePerDay);
      case 'price_desc':
        return sorted.sort((a, b) => b.pricePerDay - a.pricePerDay);
      case 'rating':
        return sorted.sort((a, b) => b.scoreBreakdown.vehicleRating - a.scoreBreakdown.vehicleRating);
      case 'newest':
        return sorted.sort((a, b) => new Date(b.vehicle.createdAt).getTime() - new Date(a.vehicle.createdAt).getTime());
      default:
        return sorted;
    }
  };

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleVehicleType = (type: string) => {
    setFilters(prev => ({
      ...prev,
      vehicleTypes: prev.vehicleTypes.includes(type)
        ? prev.vehicleTypes.filter(t => t !== type)
        : [...prev.vehicleTypes, type]
    }));
  };

  const toggleFeature = (feature: string) => {
    setFilters(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const clearFilters = () => {
    setFilters({
      island: island || '',
      startDate: null,
      endDate: null,
      priceRange: [50, 300],
      vehicleTypes: [],
      features: [],
      sortBy: 'price_asc'
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
                onPress={() => toggleVehicleType(type)}
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

        {/* Features */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Features</Text>
          <View style={styles.optionsGrid}>
            {VEHICLE_FEATURES.map(feature => (
              <TouchableOpacity
                key={feature}
                style={[
                  styles.featureChip,
                  filters.features.includes(feature) && styles.featureChipSelected
                ]}
                onPress={() => toggleFeature(feature)}
              >
                <Text style={[
                  styles.featureChipText,
                  filters.features.includes(feature) && styles.featureChipTextSelected
                ]}>
                  {feature}
                </Text>
              </TouchableOpacity>
            ))}
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
            {(filters.vehicleTypes.length + filters.features.length) > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {filters.vehicleTypes.length + filters.features.length}
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
});
