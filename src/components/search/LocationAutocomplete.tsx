/**
 * Location Autocomplete Component
 * Provides location search with autocomplete suggestions and current location detection
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { sanitizeUserInput, SANITIZATION_PRESETS } from '../../middleware/inputSanitization';
import { geocodingService } from '../../services/geocodingService';
import { analyticsService } from '../../services/analyticsService';

export interface LocationSuggestion {
  id: string;
  name: string;
  description: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  type: 'current' | 'popular' | 'recent' | 'search';
}

interface LocationAutocompleteProps {
  value: string;
  onLocationSelect: (location: LocationSuggestion) => void;
  onTextChange: (text: string) => void;
  placeholder?: string;
  popularDestinations?: LocationSuggestion[];
  recentSearches?: LocationSuggestion[];
  disabled?: boolean;
  showCurrentLocation?: boolean;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = React.memo(({
  value,
  onLocationSelect,
  onTextChange,
  placeholder = "Where do you want to go?",
  popularDestinations = [],
  recentSearches = [],
  disabled = false,
  showCurrentLocation = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationSuggestion | null>(null);
  const inputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Real-time search suggestions from geocoding service
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationSuggestion[]>([]);

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    if (!showCurrentLocation) return;

    try {
      setIsLoadingLocation(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Please enable location access to use current location feature.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Use our geocoding service for reverse geocoding
      const geocodingResult = await geocodingService.reverseGeocode(
        location.coords.latitude,
        location.coords.longitude
      );

      if (geocodingResult) {
        const currentLoc: LocationSuggestion = {
          id: 'current-location',
          name: geocodingResult.name,
          description: geocodingResult.description,
          coordinates: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          type: 'current',
        };

        setCurrentLocation(currentLoc);

        // Track current location usage
        analyticsService.trackEvent('current_location_detected', {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          locationName: geocodingResult.name,
        });
      } else {
        // Fallback to basic current location
        const currentLoc: LocationSuggestion = {
          id: 'current-location',
          name: 'Current Location',
          description: `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`,
          coordinates: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          type: 'current',
        };

        setCurrentLocation(currentLoc);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Location Error', 'Unable to get your current location. Please try again.');
    } finally {
      setIsLoadingLocation(false);
    }
  }, [showCurrentLocation]);

  // Search for locations using real geocoding service
  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);

      // Sanitize search query
      const sanitizedQuery = sanitizeUserInput(query, SANITIZATION_PRESETS.searchQuery).sanitized;

      // Get results from geocoding service
      const geocodingResults = await geocodingService.searchLocations(sanitizedQuery);

      // Convert to LocationSuggestion format
      const locationSuggestions: LocationSuggestion[] = geocodingResults.map(result => ({
        id: result.id,
        name: result.name,
        description: result.description,
        coordinates: result.coordinates,
        type: 'search' as const,
      }));

      setSearchResults(locationSuggestions);
      setSuggestions(locationSuggestions);

      // Track search analytics
      analyticsService.trackEvent('location_search', {
        query: sanitizedQuery,
        resultCount: locationSuggestions.length,
      });

    } catch (error) {
      console.error('Location search error:', error);
      // Fallback to empty results
      setSearchResults([]);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle text input change with debounced API calls
  const handleTextChange = useCallback((text: string) => {
    onTextChange(text);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Show immediate feedback for short queries
    if (text.length < 2) {
      setSuggestions([]);
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Show loading state immediately
    setIsSearching(true);

    // Debounce API search calls (300ms)
    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(text);
    }, 300);
  }, [onTextChange, searchLocations]);

  // Handle location selection
  const handleLocationSelect = useCallback((location: LocationSuggestion) => {
    onLocationSelect(location);
    onTextChange(location.name);
    setIsExpanded(false);
    inputRef.current?.blur();
  }, [onLocationSelect, onTextChange]);

  // Handle input focus
  const handleFocus = useCallback(() => {
    setIsExpanded(true);
    if (!value) {
      // Show recent searches and popular destinations when focused with no input
      const combinedSuggestions = [
        ...(currentLocation ? [currentLocation] : []),
        ...recentSearches.slice(0, 3),
        ...popularDestinations.slice(0, 5),
      ];
      setSuggestions(combinedSuggestions);
    }
  }, [value, currentLocation, recentSearches, popularDestinations]);

  // Handle input blur
  const handleBlur = useCallback(() => {
    // Delay hiding suggestions to allow for selection
    setTimeout(() => setIsExpanded(false), 150);
  }, []);

  // Initialize current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const renderSuggestion = useCallback(({ item }: { item: LocationSuggestion }) => {
    const getIcon = () => {
      switch (item.type) {
        case 'current':
          return 'location';
        case 'popular':
          return 'star';
        case 'recent':
          return 'time';
        default:
          return 'location-outline';
      }
    };

    return (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleLocationSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.suggestionIcon}>
          <Ionicons name={getIcon()} size={20} color={colors.gray600} />
        </View>
        <View style={styles.suggestionContent}>
          <Text style={styles.suggestionName}>{item.name}</Text>
          <Text style={styles.suggestionDescription}>{item.description}</Text>
        </View>
        {item.type === 'current' && (
          <View style={styles.currentLocationBadge}>
            <Text style={styles.currentLocationText}>Current</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [handleLocationSelect]);

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, disabled && styles.inputDisabled]}>
        <Ionicons name="search" size={20} color={colors.gray500} style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.gray500}
          editable={!disabled}
          autoCorrect={false}
          autoCapitalize="words"
        />
        {showCurrentLocation && (
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={getCurrentLocation}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="locate" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        )}

        {isSearching && (
          <View style={styles.searchingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
      </View>

      {isExpanded && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            renderItem={renderSuggestion}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray300,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  inputDisabled: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray200,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
  },
  currentLocationButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    maxHeight: 300,
    zIndex: 1001,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  suggestionIcon: {
    marginRight: spacing.sm,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  suggestionDescription: {
    fontSize: 14,
    color: colors.gray600,
  },
  currentLocationBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  currentLocationText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '600',
  },
  searchingIndicator: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
});

export default LocationAutocomplete;
