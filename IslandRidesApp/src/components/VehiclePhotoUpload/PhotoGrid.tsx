import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { VehiclePhoto } from '../../types';
import { PhotoUpload } from './usePhotoUpload';

interface PhotoGridProps {
  photos: PhotoUpload[];
  serverPhotos: VehiclePhoto[];
  maxPhotos: number;
  onAddPhoto: () => void;
  onRemovePhoto: (id: string) => void;
  onRemoveServerPhoto: (id: number) => void;
  onSetPrimary: (id: string) => void;
  onSetServerPrimary: (id: number) => void;
  onEditType: (id: string) => void;
  onEditCaption: (id: string) => void;
  getPhotoTypeColor: (type: string) => string;
  getPhotoTypeIcon: (type: string) => any;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  serverPhotos,
  maxPhotos,
  onAddPhoto,
  onRemovePhoto,
  onRemoveServerPhoto,
  onSetPrimary,
  onSetServerPrimary,
  onEditType,
  onEditCaption,
  getPhotoTypeColor,
  getPhotoTypeIcon,
}) => {
  const renderPhoto = (photo: PhotoUpload) => (
    <View key={photo.id} style={styles.photoContainer}>
      <Image source={{ uri: photo.uri }} style={styles.photoImage} />
      
      <View style={[styles.typeBadge, { backgroundColor: getPhotoTypeColor(photo.type) }]}>
        <Ionicons name={getPhotoTypeIcon(photo.type)} size={12} color={colors.white} />
      </View>

      {photo.isPrimary && (
        <View style={styles.primaryBadge}>
          <Ionicons name="star" size={12} color="#F59E0B" />
        </View>
      )}

      {photo.isUploading && (
        <View style={styles.uploadOverlay}>
          <ActivityIndicator size="small" color={colors.white} />
          <Text style={styles.uploadText}>Uploading...</Text>
        </View>
      )}

      {photo.error && (
        <View style={styles.errorOverlay}>
          <Ionicons name="warning" size={16} color="#EF4444" />
        </View>
      )}

      <View style={styles.photoActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onEditType(photo.id)}>
          <Ionicons name="pricetag-outline" size={16} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => onEditCaption(photo.id)}>
          <Ionicons name="text-outline" size={16} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, photo.isPrimary && styles.actionButtonActive]}
          onPress={() => onSetPrimary(photo.id)}
        >
          <Ionicons name="star-outline" size={16} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => onRemovePhoto(photo.id)}
        >
          <Ionicons name="trash-outline" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderServerPhoto = (photo: VehiclePhoto) => (
    <View key={photo.id} style={styles.photoContainer}>
      <Image source={{ uri: photo.photoUrl }} style={styles.photoImage} />
      
      <View style={[styles.typeBadge, { backgroundColor: getPhotoTypeColor(photo.photoType) }]}>
        <Ionicons name={getPhotoTypeIcon(photo.photoType)} size={12} color={colors.white} />
      </View>

      {photo.isPrimary && (
        <View style={styles.primaryBadge}>
          <Ionicons name="star" size={12} color="#F59E0B" />
        </View>
      )}

      {photo.caption && (
        <View style={styles.captionOverlay}>
          <Text style={styles.captionText} numberOfLines={2}>
            {photo.caption}
          </Text>
        </View>
      )}

      <View style={styles.photoActions}>
        <TouchableOpacity
          style={[styles.actionButton, photo.isPrimary && styles.actionButtonActive]}
          onPress={() => onSetServerPrimary(photo.id)}
        >
          <Ionicons name="star-outline" size={16} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => onRemoveServerPhoto(photo.id)}
        >
          <Ionicons name="trash-outline" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.photosContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.photosGrid}>
        {serverPhotos.map(renderServerPhoto)}
        {photos.map(renderPhoto)}
        
        {(serverPhotos.length + photos.length) < maxPhotos && (
          <TouchableOpacity style={styles.addPhotoButton} onPress={onAddPhoto}>
            <Ionicons name="add" size={32} color={colors.primary} />
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  photosContainer: {
    flex: 1,
    padding: spacing.md,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoContainer: {
    width: '48%',
    aspectRatio: 16 / 9,
    position: 'relative',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.offWhite,
  },
  typeBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    ...typography.body,
    color: colors.white,
    marginTop: spacing.sm,
  },
  errorOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  photoActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: spacing.sm,
  },
  actionButton: {
    padding: spacing.xs,
  },
  actionButtonActive: {
    color: colors.primary,
  },
  removeButton: {
    color: colors.danger,
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: spacing.sm,
  },
  captionText: {
    ...typography.body,
    color: colors.white,
    fontSize: 12,
  },
  addPhotoButton: {
    width: '48%',
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    backgroundColor: colors.offWhite,
  },
  addPhotoText: {
    ...typography.body,
    color: colors.primary,
    marginTop: spacing.sm,
  },
});