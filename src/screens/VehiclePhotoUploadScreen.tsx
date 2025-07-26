import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/theme';
import { StandardErrorBoundary } from '../components/errors/StandardErrorBoundary';

interface VehiclePhoto {
  id: string;
  vehicleId: string;
  category: 'exterior' | 'interior' | 'engine' | 'damage' | 'other';
  uri: string;
  caption?: string;
  uploadedAt: string;
  isMain?: boolean;
}

interface VehiclePhotoUploadScreenProps {
  navigation: NavigationProp<any>;
  route: {
    params: {
      vehicleId: number;
    };
  };
}

const { width } = Dimensions.get('window');
const photoSize = (width - spacing.lg * 3) / 2;

export const VehiclePhotoUploadScreen: React.FC<VehiclePhotoUploadScreenProps> = ({
  navigation,
  route
}) => {
  const { vehicleId } = route.params;

  const [photos, setPhotos] = useState<VehiclePhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'exterior' | 'interior' | 'engine' | 'damage' | 'other'>('all');
  const [isUploading, setIsUploading] = useState(false);

  const categories = [
    { key: 'all', label: 'All Photos', icon: 'images' },
    { key: 'exterior', label: 'Exterior', icon: 'car' },
    { key: 'interior', label: 'Interior', icon: 'car-seat' },
    { key: 'engine', label: 'Engine', icon: 'settings' },
    { key: 'damage', label: 'Damage', icon: 'warning' },
    { key: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
  ];

  useEffect(() => {
    loadVehiclePhotos();
  }, [vehicleId]);

  const loadVehiclePhotos = async () => {
    try {
      setIsLoading(true);

      // Mock data - replace with actual API calls
      const mockPhotos: VehiclePhoto[] = [
        {
          id: '1',
          vehicleId: vehicleId.toString(),
          category: 'exterior',
          uri: 'https://via.placeholder.com/300x200/007AFF/FFFFFF?text=Front+View',
          caption: 'Front view of the vehicle',
          uploadedAt: '2024-01-15T10:30:00Z',
          isMain: true,
        },
        {
          id: '2',
          vehicleId: vehicleId.toString(),
          category: 'exterior',
          uri: 'https://via.placeholder.com/300x200/007AFF/FFFFFF?text=Side+View',
          caption: 'Side view of the vehicle',
          uploadedAt: '2024-01-15T10:35:00Z',
        },
        {
          id: '3',
          vehicleId: vehicleId.toString(),
          category: 'interior',
          uri: 'https://via.placeholder.com/300x200/007AFF/FFFFFF?text=Dashboard',
          caption: 'Dashboard and controls',
          uploadedAt: '2024-01-15T10:40:00Z',
        },
        {
          id: '4',
          vehicleId: vehicleId.toString(),
          category: 'interior',
          uri: 'https://via.placeholder.com/300x200/007AFF/FFFFFF?text=Seats',
          caption: 'Interior seating',
          uploadedAt: '2024-01-15T10:45:00Z',
        },
      ];

      setPhotos(mockPhotos);
    } catch (error) {
      console.error('Failed to load vehicle photos:', error);
      Alert.alert('Error', 'Failed to load vehicle photos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakePhoto = async (category: 'exterior' | 'interior' | 'engine' | 'damage' | 'other') => {
    try {
      setIsUploading(true);

      // Mock photo capture - replace with actual camera integration
      Alert.alert(
        'Photo Capture',
        `Would you like to take a photo for ${category}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Camera',
            onPress: () => simulatePhotoCapture(category, 'camera')
          },
          {
            text: 'Gallery',
            onPress: () => simulatePhotoCapture(category, 'gallery')
          },
        ]
      );
    } catch (error) {
      console.error('Failed to capture photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setIsUploading(false);
    }
  };

  const simulatePhotoCapture = async (category: 'exterior' | 'interior' | 'engine' | 'damage' | 'other', source: 'camera' | 'gallery') => {
    // Simulate photo upload
    const newPhoto: VehiclePhoto = {
      id: Date.now().toString(),
      vehicleId: vehicleId.toString(),
      category,
      uri: `https://via.placeholder.com/300x200/007AFF/FFFFFF?text=${category}+${source}`,
      caption: `New ${category} photo from ${source}`,
      uploadedAt: new Date().toISOString(),
    };

    setPhotos(prev => [newPhoto, ...prev]);
    Alert.alert('Success', 'Photo uploaded successfully');
  };

  const filteredPhotos = selectedCategory === 'all'
    ? photos
    : photos.filter(photo => photo.category === selectedCategory);

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPhotos(prev => prev.filter(photo => photo.id !== photoId));
          }
        },
      ]
    );
  };

  const handleSetMainPhoto = (photoId: string) => {
    setPhotos(prev => prev.map(photo => ({
      ...photo,
      isMain: photo.id === photoId
    })));
    Alert.alert('Success', 'Main photo updated');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading photos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <StandardErrorBoundary context="VehiclePhotoUpload">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Vehicle Photos</Text>
          <TouchableOpacity onPress={() => handleTakePhoto('exterior')}>
            <Ionicons name="camera" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
          {categories.map(category => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryButton,
                selectedCategory === category.key && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category.key as any)}
            >
              <Ionicons
                name={category.icon as any}
                size={20}
                color={selectedCategory === category.key ? colors.surface : colors.textSecondary}
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === category.key && styles.categoryTextActive
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Quick Upload</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.slice(1).map(category => (
              <TouchableOpacity
                key={category.key}
                style={styles.uploadButton}
                onPress={() => handleTakePhoto(category.key as any)}
                disabled={isUploading}
              >
                <Ionicons name={category.icon as any} size={24} color={colors.primary} />
                <Text style={styles.uploadButtonText}>{category.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView style={styles.photosContainer}>
          <View style={styles.photosGrid}>
            {filteredPhotos.map(photo => (
              <View key={photo.id} style={styles.photoCard}>
                <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                {photo.isMain && (
                  <View style={styles.mainBadge}>
                    <Text style={styles.mainBadgeText}>MAIN</Text>
                  </View>
                )}
                <View style={styles.photoOverlay}>
                  <TouchableOpacity
                    style={styles.photoAction}
                    onPress={() => handleSetMainPhoto(photo.id)}
                  >
                    <Ionicons name="star" size={16} color={colors.surface} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.photoAction}
                    onPress={() => handleDeletePhoto(photo.id)}
                  >
                    <Ionicons name="trash" size={16} color={colors.surface} />
                  </TouchableOpacity>
                </View>
                <View style={styles.photoInfo}>
                  <Text style={styles.photoCategory}>{photo.category.toUpperCase()}</Text>
                  {photo.caption && (
                    <Text style={styles.photoCaption} numberOfLines={2}>
                      {photo.caption}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {filteredPhotos.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="camera-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>
                No photos in this category yet
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => handleTakePhoto('exterior')}
              >
                <Text style={styles.emptyStateButtonText}>Take First Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </StandardErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  categoryContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: 20,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  categoryTextActive: {
    color: colors.surface,
    fontWeight: '600' as const,
  },
  uploadSection: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.md,
  },
  uploadButton: {
    alignItems: 'center',
    padding: spacing.md,
    marginRight: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 80,
  },
  uploadButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center' as const,
  },
  photosContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoCard: {
    width: photoSize,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoImage: {
    width: '100%',
    height: photoSize * 0.75,
    backgroundColor: colors.border,
  },
  mainBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  mainBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: colors.surface,
  },
  photoOverlay: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
  },
  photoAction: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: spacing.sm,
    borderRadius: 4,
    marginLeft: spacing.xs,
  },
  photoInfo: {
    padding: spacing.sm,
  },
  photoCategory: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  photoCaption: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    textAlign: 'center' as const,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.surface,
  },
});

export default VehiclePhotoUploadScreen;
