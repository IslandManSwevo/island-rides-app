import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { Island, UserPreferences } from '../../types';

export interface FilterSuggestion {
  id: string;
  label: string;
  type: 'vehicleType' | 'priceRange' | 'feature' | 'instant' | 'duration';
  value: any;
  reason: string;
  confidence: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  filters: Partial<SearchFilters>;
  popularity: number;
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
  features: number[];
  minConditionRating: number;
  verificationStatus: ('pending' | 'verified' | 'rejected' | 'expired')[];
  deliveryAvailable: boolean;
  airportPickup: boolean;
  instantBooking: boolean;
  sortBy: 'popularity' | 'price_low' | 'price_high' | 'rating' | 'newest' | 'condition';
}

interface IntelligentFilterComponentProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  searchHistory?: string[];
  userPreferences?: UserPreferences;
}

// Predefined filter presets based on common search patterns
const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'business',
    name: 'Business Trip',
    description: 'Professional, reliable vehicles',
    icon: 'briefcase',
    filters: {
      vehicleTypes: ['sedan', 'suv'],
      minConditionRating: 4,
      verificationStatus: ['verified'],
      instantBooking: true,
      sortBy: 'rating'
    },
    popularity: 85
  },
  {
    id: 'family',
    name: 'Family Vacation',
    description: 'Spacious, safe family vehicles',
    icon: 'people',
    filters: {
      vehicleTypes: ['suv', 'minivan'],
      minSeatingCapacity: 5,
      minConditionRating: 4,
      features: [1, 2, 3], // Safety features
      sortBy: 'rating'
    },
    popularity: 92
  },
  {
    id: 'budget',
    name: 'Budget Friendly',
    description: 'Affordable transportation',
    icon: 'cash',
    filters: {
      priceRange: [30, 80],
      sortBy: 'price_low',
      minConditionRating: 3
    },
    popularity: 78
  },
  {
    id: 'luxury',
    name: 'Luxury Experience',
    description: 'Premium vehicles and service',
    icon: 'diamond',
    filters: {
      vehicleTypes: ['luxury', 'convertible'],
      minConditionRating: 5,
      priceRange: [150, 500],
      verificationStatus: ['verified'],
      sortBy: 'rating'
    },
    popularity: 65
  },
  {
    id: 'adventure',
    name: 'Island Adventure',
    description: 'Rugged vehicles for exploration',
    icon: 'compass',
    filters: {
      vehicleTypes: ['suv', 'truck', 'jeep'],
      features: [4, 5], // 4WD, GPS
      minConditionRating: 4,
      sortBy: 'rating'
    },
    popularity: 73
  }
];

export const IntelligentFilterComponent: React.FC<IntelligentFilterComponentProps> = ({
  filters,
  onFiltersChange,
  searchHistory = [],
  userPreferences = {}
}) => {
  const [suggestions, setSuggestions] = useState<FilterSuggestion[]>([]);
  const [showPresets, setShowPresets] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    generateSmartSuggestions();
  }, [filters, searchHistory, userPreferences]);

  const generateSmartSuggestions = () => {
    const newSuggestions: FilterSuggestion[] = [];

    // Suggest instant booking for quick trips
    if (!filters.instantBooking && isShortTripDuration()) {
      newSuggestions.push({
        id: 'instant-booking',
        label: 'Enable Instant Booking',
        type: 'instant',
        value: true,
        reason: 'For quick trips, instant booking saves time',
        confidence: 0.8
      });
    }

    // Suggest verified hosts for first-time users
    if (!userPreferences.hasBookings && !filters.verificationStatus.includes('verified')) {
      newSuggestions.push({
        id: 'verified-hosts',
        label: 'Verified Hosts Only',
        type: 'feature',
        value: ['verified'],
        reason: 'Verified hosts provide extra peace of mind',
        confidence: 0.9
      });
    }

    // Suggest budget-friendly options if searching expensive range
    if (filters.priceRange[0] > 150) {
      newSuggestions.push({
        id: 'budget-option',
        label: 'Include Budget Options',
        type: 'priceRange',
        value: [50, filters.priceRange[1]],
        reason: 'See more affordable alternatives',
        confidence: 0.6
      });
    }

    // Suggest popular vehicle types based on island
    if (filters.island === 'Nassau' && !filters.vehicleTypes.includes('sedan')) {
      newSuggestions.push({
        id: 'city-vehicle',
        label: 'Add City Cars',
        type: 'vehicleType',
        value: 'sedan',
        reason: 'Sedans are popular for Nassau city driving',
        confidence: 0.7
      });
    }

    // Suggest SUVs for family trips (based on seating capacity)
    if (filters.minSeatingCapacity >= 5 && !filters.vehicleTypes.includes('suv')) {
      newSuggestions.push({
        id: 'family-suv',
        label: 'Include SUVs',
        type: 'vehicleType',
        value: 'suv',
        reason: 'SUVs offer more space for families',
        confidence: 0.85
      });
    }

    // Filter out already applied suggestions
    const filteredSuggestions = newSuggestions.filter(
      s => !appliedSuggestions.has(s.id)
    );

    setSuggestions(filteredSuggestions.slice(0, 3)); // Limit to 3 suggestions
  };

  const isShortTripDuration = (): boolean => {
    if (!filters.startDate || !filters.endDate) return false;
    const diffTime = filters.endDate.getTime() - filters.startDate.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    return diffDays <= 2;
  };

  const applySuggestion = (suggestion: FilterSuggestion) => {
    let updatedFilters = { ...filters };

    switch (suggestion.type) {
      case 'instant':
        updatedFilters.instantBooking = suggestion.value;
        break;
      case 'priceRange':
        updatedFilters.priceRange = suggestion.value;
        break;
      case 'vehicleType':
        if (!updatedFilters.vehicleTypes.includes(suggestion.value)) {
          updatedFilters.vehicleTypes = [...updatedFilters.vehicleTypes, suggestion.value];
        }
        break;
      case 'feature':
        if (suggestion.id === 'verified-hosts') {
          updatedFilters.verificationStatus = suggestion.value;
        }
        break;
    }

    onFiltersChange(updatedFilters);
    setAppliedSuggestions(prev => new Set([...prev, suggestion.id]));
  };

  const applyPreset = (preset: FilterPreset) => {
    const updatedFilters = { ...filters, ...preset.filters };
    onFiltersChange(updatedFilters);
    setShowPresets(false);
  };

  const getPresetsByPopularity = () => {
    return FILTER_PRESETS.sort((a, b) => b.popularity - a.popularity);
  };

  return (
    <View style={styles.container}>
      {/* Filter Presets */}
      <View style={styles.presetsSection}>
        <TouchableOpacity
          style={styles.presetsButton}
          onPress={() => setShowPresets(true)}
        >
          <Ionicons name="options" size={20} color={colors.primary} />
          <Text style={styles.presetsButtonText}>Quick Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsSection}>
          <Text style={styles.sectionTitle}>💡 Smart Suggestions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.id}
                style={styles.suggestionCard}
                onPress={() => applySuggestion(suggestion)}
              >
                <Text style={styles.suggestionLabel}>{suggestion.label}</Text>
                <Text style={styles.suggestionReason}>{suggestion.reason}</Text>
                <View style={styles.confidenceIndicator}>
                  <View 
                    style={[
                      styles.confidenceBar,
                      { width: `${suggestion.confidence * 100}%` }
                    ]} 
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Presets Modal */}
      <Modal visible={showPresets} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Quick Filter Presets</Text>
            <TouchableOpacity onPress={() => setShowPresets(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.presetsList}>
            {getPresetsByPopularity().map((preset) => (
              <TouchableOpacity
                key={preset.id}
                style={styles.presetCard}
                onPress={() => applyPreset(preset)}
              >
                <View style={styles.presetIcon}>
                  <Ionicons name={preset.icon as any} size={24} color={colors.primary} />
                </View>
                <View style={styles.presetInfo}>
                  <Text style={styles.presetName}>{preset.name}</Text>
                  <Text style={styles.presetDescription}>{preset.description}</Text>
                  <View style={styles.popularityIndicator}>
                    <Ionicons name="trending-up" size={12} color={colors.success} />
                    <Text style={styles.popularityText}>{preset.popularity}% popular</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  presetsSection: {
    marginBottom: spacing.md,
  },
  presetsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  presetsButtonText: {
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  suggestionsSection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  suggestionCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    width: 200,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionLabel: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  suggestionReason: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  confidenceIndicator: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  confidenceBar: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 2,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.heading3.fontSize,
    fontWeight: 'bold',
    color: colors.text,
  },
  presetsList: {
    flex: 1,
    padding: spacing.lg,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  presetIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  presetDescription: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  popularityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  popularityText: {
    fontSize: typography.caption.fontSize,
    color: colors.success,
    marginLeft: spacing.xs,
  },
});