import React from 'react';
import { View, StyleSheet, SafeAreaView, Alert, ScrollView, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/AppHeader';
import { vehicleService } from '../services/vehicleService';
import { locationService } from '../services/LocationService';
import { useAuth } from '../context/AuthContext';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { Island, VehicleRecommendation } from '../types';
import { ROUTES, RootStackParamList } from '../navigation/routes';
import { islands, IslandOption } from '../constants/islands';
import { NavigationProp } from '@react-navigation/native';

interface IslandSelectionScreenProps {
  navigation: NavigationProp<RootStackParamList>;
}

const IslandSelectionScreen: React.FC<IslandSelectionScreenProps> = ({
  navigation
}) => {
  const { logout } = useAuth();
  // ✅ NO useEffect auth check - App.tsx guarantees we're authenticated

  const [isLoading, setIsLoading] = React.useState(false);
  const [recommendedIslands, setRecommendedIslands] = React.useState<Island[]>([]);
  const [detectedIsland, setDetectedIsland] = React.useState<Island | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = React.useState(false);

  // Load intelligent island recommendations on component mount
  React.useEffect(() => {
    const loadIntelligentRecommendations = async () => {
      try {
        // Get recommended islands based on user context
        const recommendations = await locationService.getRecommendedIslands();
        setRecommendedIslands(recommendations);

        // Try to detect current island
        const detected = await locationService.detectCurrentIsland();
        setDetectedIsland(detected);

        // Show location prompt if no previous interaction and location not detected
        const hasAsked = await locationService.hasAskedForLocationPermission();
        if (!hasAsked && !detected) {
          setShowLocationPrompt(true);
        }
      } catch (error) {
        console.error('Error loading intelligent recommendations:', error);
        // Fallback to default island order
        setRecommendedIslands(['Nassau', 'Freeport', 'Exuma']);
      }
    };

    loadIntelligentRecommendations();
  }, []);

  const handleLocationRequest = async () => {
    setShowLocationPrompt(false);
    try {
      const detected = await locationService.detectCurrentIsland();
      if (detected) {
        setDetectedIsland(detected);
        // Update recommendations with detected island first
        const updated = await locationService.getRecommendedIslands();
        setRecommendedIslands(updated);
      }
    } catch (error) {
      console.error('Error requesting location:', error);
    }
  };

  const handleLocationDecline = () => {
    setShowLocationPrompt(false);
  };

  const handleIslandSelect = async (island: string) => {
    console.log('🏝️ Island selected:', island);
    
    // Prevent multiple simultaneous requests
    if (isLoading) {
      console.log('⚠️ Navigation already in progress, ignoring duplicate request');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('🔄 Starting vehicle fetch for island:', island);
      
      // Save island preference for future recommendations
      await locationService.saveIslandPreference(island as Island);
      
      // Add timeout to prevent indefinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - please try again')), 10000)
      );
      
      const vehiclesPromise = vehicleService.getVehiclesByIsland(island as Island);
      const vehicles = await Promise.race([vehiclesPromise, timeoutPromise]) as VehicleRecommendation[];
      
      console.log('✅ Vehicles fetched successfully:', vehicles?.length || 0);
      
      // Ensure navigation happens on next tick to avoid race conditions
      setTimeout(() => {
        navigation.navigate('SearchResults', { island, vehicles });
      }, 0);
      
    } catch (error) {
      console.error('❌ Island selection failed:', error);
      
      // Handle session expiration by triggering logout
      if (error instanceof Error && (
        error.message.includes('Session expired') || 
        error.message.includes('Invalid token') || 
        error.message.includes('Unauthorized') ||
        error.message.includes('TOKEN_MISSING')
      )) {
        console.log('🚪 Session expired, triggering logout');
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [{ text: 'OK', onPress: logout }]
        );
      } else {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        Alert.alert(
          'Loading Error', 
          `Failed to load vehicles: ${errorMessage}. Please try again.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: () => handleIslandSelect(island) }
          ]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderIslandCard = (island: IslandOption) => (
    <TouchableOpacity
      key={island.id}
      style={[styles.islandCard, isLoading && styles.islandCardDisabled]}
      onPress={() => handleIslandSelect(island.id)}
      activeOpacity={isLoading ? 1 : 0.8}
      disabled={isLoading}
    >
      <View style={styles.islandHeader}>
        <Text style={styles.islandEmoji}>{island.emoji}</Text>
        <View style={styles.islandInfo}>
          <Text style={styles.islandName}>{island.name}</Text>
          <Text style={styles.islandDescription}>{island.description}</Text>
        </View>
        {isLoading ? (
          <View style={styles.loadingIndicator}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={24} color={colors.lightGrey} />
        )}
      </View>
      <View style={styles.featuresContainer}>
        {island.features.map((feature, index) => (
          <View key={index} style={styles.featureTag}>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        title="KeyLo" 
        navigation={navigation}
        showBackButton={false}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to KeyLo! 🔑</Text>
          <Text style={styles.welcomeSubtitle}>
            Choose your destination to find the perfect vehicle for your adventure
          </Text>
          {detectedIsland && (
            <View style={styles.detectedLocationContainer}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <Text style={styles.detectedLocationText}>
                Detected: {detectedIsland}
              </Text>
            </View>
          )}
        </View>

        {/* Location Permission Prompt */}
        {showLocationPrompt && (
          <View style={styles.locationPrompt}>
            <View style={styles.locationPromptContent}>
              <Ionicons name="location-outline" size={24} color={colors.primary} />
              <Text style={styles.locationPromptTitle}>Enable Smart Recommendations</Text>
              <Text style={styles.locationPromptText}>
                Allow location access to automatically show vehicles on your current island
              </Text>
              <View style={styles.locationPromptButtons}>
                <TouchableOpacity style={styles.locationAllowButton} onPress={handleLocationRequest}>
                  <Text style={styles.locationAllowText}>Allow Location</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.locationDeclineButton} onPress={handleLocationDecline}>
                  <Text style={styles.locationDeclineText}>Not Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate(ROUTES.FAVORITES)}
            >
              <Ionicons name="heart" size={24} color={colors.error} />
              <Text style={styles.quickActionText}>My Favorites</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate(ROUTES.PROFILE)}
            >
              <Ionicons name="person" size={24} color={colors.primary} />
              <Text style={styles.quickActionText}>My Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Islands Section */}
        <View style={styles.islandsSection}>
          <Text style={styles.sectionTitle}>Select Your Island</Text>
          <Text style={styles.sectionSubtitle}>
            {detectedIsland ? 'Recommendations based on your location' : 'Choose your destination'}
          </Text>
          {recommendedIslands.map(islandId => {
            const islandData = islands.find(island => island.id === islandId);
            return islandData ? renderIslandCard(islandData) : null;
          })}
        </View>

        {/* Test Section - Remove in production */}
        {__DEV__ && (
          <View style={styles.testSection}>
            <Text style={styles.sectionTitle}>Development Testing</Text>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => navigation.navigate('Chat', {
                context: { participantId: 2 },
                title: 'Test Chat'
              })}
            >
              <Ionicons name="chatbubbles" size={20} color={colors.white} />
              <Text style={styles.testButtonText}>Test Chat Feature</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default IslandSelectionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  welcomeSection: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: typography.heading1.fontSize,
    fontWeight: 'bold',
    color: colors.darkGrey,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: typography.body.fontSize,
    color: colors.lightGrey,
    textAlign: 'center',
    lineHeight: 22,
  },
  detectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight + '20',
    borderRadius: borderRadius.md,
  },
  detectedLocationText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  locationPrompt: {
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationPromptContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  locationPromptTitle: {
    fontSize: typography.heading4.fontSize,
    fontWeight: 'bold',
    color: colors.darkGrey,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  locationPromptText: {
    fontSize: typography.body.fontSize,
    color: colors.lightGrey,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  locationPromptButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  locationAllowButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  locationAllowText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: typography.body.fontSize,
  },
  locationDeclineButton: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationDeclineText: {
    color: colors.lightGrey,
    fontWeight: '600',
    fontSize: typography.body.fontSize,
  },
  quickActionsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.subheading.fontSize,
    fontWeight: 'bold',
    color: colors.darkGrey,
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.lightGrey,
    marginBottom: spacing.lg,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkGrey,
    marginTop: spacing.sm,
  },
  islandsSection: {
    marginBottom: spacing.xl,
  },
  islandCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  islandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  islandEmoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  islandInfo: {
    flex: 1,
  },
  islandName: {
    fontSize: typography.subheading.fontSize,
    fontWeight: 'bold',
    color: colors.darkGrey,
    marginBottom: spacing.xs,
  },
  islandDescription: {
    fontSize: 14,
    color: colors.lightGrey,
    lineHeight: 18,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureTag: {
    backgroundColor: colors.offWhite,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  featureText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  testSection: {
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.lightGrey,
  },
  testButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  testButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  islandCardDisabled: {
    opacity: 0.6,
  },
  loadingIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
});

