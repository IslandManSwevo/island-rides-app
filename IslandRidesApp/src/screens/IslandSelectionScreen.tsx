import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { Island } from '../types';

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

export const IslandSelectionScreen: React.FC<IslandSelectionScreenProps> = ({ navigation }) => {
  const handleIslandSelect = (island: Island) => {
    navigation.navigate('SearchResults', { island });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏝️ Choose Your Island</Text>
        <Text style={styles.subtitle}>Select where you'd like to explore</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {islands.map((island) => (
          <TouchableOpacity
            key={island.id}
            style={styles.islandCard}
            onPress={() => handleIslandSelect(island.id)}
          >
            <View style={styles.cardContent}>
              <Text style={styles.islandEmoji}>{island.emoji}</Text>
              <View style={styles.islandInfo}>
                <Text style={styles.islandName}>{island.name}</Text>
                <Text style={styles.islandDescription}>{island.description}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
  },
  title: {
    ...typography.heading1,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  islandCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    fontSize: 18,
    fontWeight: '600',
    color: colors.darkGrey,
    marginBottom: spacing.xs,
  },
  islandDescription: {
    ...typography.body,
    fontSize: 14,
  },
  arrow: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '600',
  },
});
