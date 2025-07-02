import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../components/Button';
import { StorageService } from '../utils/storage';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { Island, User } from '../types';

interface IslandSelectionScreenProps {
  navigation: any;
}

interface IslandOption {
  id: Island;
  name: string;
  description: string;
  emoji: string;
}

const islands: IslandOption[] = [
  {
    id: 'Nassau',
    name: 'New Providence (Nassau)',
    description: 'Capital city with beaches, resorts, and cultural attractions',
    emoji: '🏙️',
  },
  {
    id: 'Freeport',
    name: 'Grand Bahama (Freeport)',
    description: 'Duty-free shopping, pristine beaches, and water sports',
    emoji: '🏖️',
  },
  {
    id: 'Exuma',
    name: 'Exuma',
    description: 'Swimming pigs, iguanas, and crystal-clear waters',
    emoji: '🐷',
  },
];

const getIslandImageUrl = (islandName: string): string => {
  const imageMap: { [key: string]: string } = {
    'Nassau': 'https://placehold.co/400x200/00B8D4/FFFFFF?text=Nassau+Paradise',
    'Freeport': 'https://placehold.co/400x200/0097A7/FFFFFF?text=Freeport+Beach',
    'Exuma': 'https://placehold.co/400x200/00ACC1/FFFFFF?text=Exuma+Waters',
  };
  return imageMap[islandName] || 'https://placehold.co/400x200/00B8D4/FFFFFF?text=Island+Paradise';
};

export const IslandSelectionScreen: React.FC<IslandSelectionScreenProps> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await StorageService.getUser();
      setUser(userData);
    };
    loadUser();
  }, []);

  const handleIslandSelect = (island: Island) => {
    navigation.navigate('Search', { island });
  };

  return (
    <LinearGradient
      colors={[colors.primary, colors.gradientLight]}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>🏝️ Choose Your Island</Text>
        <Text style={styles.subtitle}>Select where you'd like to explore</Text>
      </View>

      {user?.role === 'owner' && (
        <View style={styles.ownerSection}>
          <Button
            title="+ List Your Car"
            onPress={() => navigation.navigate('ListVehicle')}
            variant="secondary"
          />
        </View>
      )}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {islands.map((island) => (
          <TouchableOpacity
            key={island.id}
            style={styles.islandCard}
            onPress={() => handleIslandSelect(island.id)}
          >
            <ImageBackground
              source={{ uri: getIslandImageUrl(island.id) }}
              style={styles.imageBackground}
              imageStyle={styles.backgroundImage}
            >
              <View style={styles.overlay}>
                <View style={styles.cardContent}>
                  <Text style={styles.islandEmoji}>{island.emoji}</Text>
                  <View style={styles.islandInfo}>
                    <Text style={styles.islandName}>{island.name}</Text>
                    <Text style={styles.islandDescription}>{island.description}</Text>
                  </View>
                  <Text style={styles.arrow}>→</Text>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  ownerSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.heading1,
    textAlign: 'center',
    marginBottom: spacing.sm,
    color: colors.white,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  islandCard: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  imageBackground: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
  },
  backgroundImage: {
    borderRadius: borderRadius.lg,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  islandEmoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  islandInfo: {
    flex: 1,
  },
  islandName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  islandDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.white,
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  arrow: {
    fontSize: 24,
    color: colors.white,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
