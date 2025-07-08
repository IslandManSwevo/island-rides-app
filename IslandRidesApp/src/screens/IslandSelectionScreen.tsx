import React from 'react';
import { View, StyleSheet, SafeAreaView, Alert, ScrollView, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/AppHeader';
import { vehicleService } from '../services/vehicleService';
import { useAuth } from '../context/AuthContext';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { Island } from '../types';
import { ROUTES } from '../navigation/routes';

interface IslandOption {
  id: Island;
  name: string;
  description: string;
  emoji: string;
  features: string[];
}

const islands: IslandOption[] = [
  {
    id: 'Nassau',
    name: 'New Providence (Nassau)',
    description: 'Capital city with beaches, resorts, and cultural attractions',
    emoji: '🏙️',
    features: ['City Life', 'Beaches', 'Shopping', 'Nightlife']
  },
  {
    id: 'Freeport',
    name: 'Grand Bahama (Freeport)', 
    description: 'Duty-free shopping, pristine beaches, and water sports',
    emoji: '🏖️',
    features: ['Duty-Free Shopping', 'Water Sports', 'Beaches', 'Resorts']
  },
  {
    id: 'Exuma',
    name: 'Exuma',
    description: 'Swimming pigs, iguanas, and crystal-clear waters',
    emoji: '🐷',
    features: ['Swimming Pigs', 'Nature', 'Adventures', 'Secluded Beaches']
  },
];

interface IslandSelectionScreenProps {
  navigation: any;
}

const IslandSelectionScreen: React.FC<IslandSelectionScreenProps> = ({
  navigation
}) => {
  const { logout } = useAuth();
  // ✅ NO useEffect auth check - App.tsx guarantees we're authenticated

  const handleIslandSelect = async (island: string) => {
    console.log('🏝️ Island selected:', island);
    
    try {
      const vehicles = await vehicleService.getVehiclesByIsland(island as Island);
      navigation.navigate('SearchResults', { island, vehicles });
    } catch (error) {
      console.error('🏝️ Island selection failed:', error);
      
      // Handle session expiration by triggering logout
      if (error instanceof Error && (
        error.message.includes('Session expired') || 
        error.message.includes('Invalid token') || 
        error.message.includes('Unauthorized')
      )) {
        console.log('🚪 Session expired, triggering logout');
        Alert.alert(
          'Session Expired',
          error.message,
          [{ text: 'OK', onPress: logout }]
        );
      } else {
        Alert.alert('Error', `Failed to load vehicles: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
      }
    }
  };

  const renderIslandCard = (island: IslandOption) => (
    <TouchableOpacity
      key={island.id}
      style={styles.islandCard}
      onPress={() => handleIslandSelect(island.id)}
      activeOpacity={0.8}
    >
      <View style={styles.islandHeader}>
        <Text style={styles.islandEmoji}>{island.emoji}</Text>
        <View style={styles.islandInfo}>
          <Text style={styles.islandName}>{island.name}</Text>
          <Text style={styles.islandDescription}>{island.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.lightGrey} />
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
        title="Island Rides" 
        navigation={navigation}
        showBackButton={false}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to Island Rides! 🏝️</Text>
          <Text style={styles.welcomeSubtitle}>
            Choose your destination to find the perfect vehicle for your adventure
          </Text>
        </View>

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
          {islands.map(renderIslandCard)}
        </View>

        {/* Test Section - Remove in production */}
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
  quickActionsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.subheading.fontSize,
    fontWeight: 'bold',
    color: colors.darkGrey,
    marginBottom: spacing.md,
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
    shadowColor: '#000',
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
    shadowColor: '#000',
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
});

