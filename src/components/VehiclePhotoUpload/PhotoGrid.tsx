import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { VehiclePhoto } from '../../types';
import { PhotoUpload } from './usePhotoUpload';

interface PhotoGridProps {
  photos: PhotoUpload[];
  serverPhotos: VehiclePhoto[];
  maxPhotos: number;
  handlers: {
    onAddPhoto: () => void;
    onRemovePhoto: (id: string) => void;
    onRemoveServerPhoto: (id: number) => void;
    onSetPrimary: (id: string) => void;
    onSetServerPrimary: (id: number) => void;
    onEditType: (id: string) => void;
    onEditCaption: (id: string) => void;
  };
  utilities: {
    getPhotoTypeColor: (type: string) => string;
    getPhotoTypeIcon: (type: string) => any;
  };
}

interface PhotoGridItem {
  id: string | number;
  isLocal: boolean;
  data: PhotoUpload | VehiclePhoto | null;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  serverPhotos,
  maxPhotos,
  handlers,
  utilities,
}) => {
  const {
    onAddPhoto,
    onRemovePhoto,
    onRemoveServerPhoto,
    onSetPrimary,
    onSetServerPrimary,
    onEditType,
    onEditCaption,
  } = handlers;
  
  const { getPhotoTypeColor, getPhotoTypeIcon } = utilities;

  // Combine server photos and local photos into a single array with isLocal flag
  const combinedData = useMemo(() => {
    const serverItems: PhotoGridItem[] = serverPhotos.map(photo => ({
      id: `server_${photo.id}`,
      isLocal: false,
      data: photo,
    }));
    
    const localItems: PhotoGridItem[] = photos.map(photo => ({
      id: `local_${photo.id}`,
      isLocal: true,
      data: photo,
    }));
    
    const allItems = [...serverItems, ...localItems];
    
    // Add "add photo" button if under limit
    if (allItems.length < maxPhotos) {
      allItems.push({
        id: 'add_photo_button',
        isLocal: false,
        data: null, // Special case for add button
      });
    }
    
    return allItems;
  }, [serverPhotos, photos, maxPhotos]);
  const renderPhotoItem = (
    photo: PhotoUpload | VehiclePhoto,
    config: {
      imageUri: string;
      photoType: string;
      showEditActions?: boolean;
      showCaption?: boolean;
      caption?: string;
      isUploading?: boolean;
      hasError?: boolean;
      onSetPrimary: (id: string | number) => void;
      onRemove: (id: string | number) => void;
      onEditType?: (id: string) => void;
      onEditCaption?: (id: string) => void;
    }
  ) => (
    <View key={photo.id} style={styles.photoContainer}>
      <Image source={{ uri: config.imageUri }} style={styles.photoImage} />
      
      <View style={[styles.typeBadge, { backgroundColor: getPhotoTypeColor(config.photoType) }]}>
        <Ionicons name={getPhotoTypeIcon(config.photoType)} size={12} color={colors.white} />
      </View>

      {photo.isPrimary && (
        <View style={styles.primaryBadge}>
          <Ionicons name="star" size={12} color={colors.star} />
        </View>
      )}

      {config.isUploading && (
        <View style={styles.uploadOverlay}>
          <ActivityIndicator size="small" color={colors.white} />
          <Text style={styles.uploadText}>Uploading...</Text>
        </View>
      )}

      {config.hasError && (
        <View style={styles.errorOverlay}>
          <Ionicons name="warning" size={16} color={colors.error} />
        </View>
      )}

      {config.showCaption && config.caption && (
        <View style={styles.captionOverlay}>
          <Text style={styles.captionText} numberOfLines={2}>
            {config.caption}
          </Text>
        </View>
      )}

      <View style={styles.photoActions}>
        {config.showEditActions && config.onEditType && (
          <TouchableOpacity style={styles.actionButton} onPress={() => config.onEditType!(String(photo.id))}>
            <Ionicons name="pricetag-outline" size={16} color={colors.white} />
          </TouchableOpacity>
        )}

        {config.showEditActions && config.onEditCaption && (
          <TouchableOpacity style={styles.actionButton} onPress={() => config.onEditCaption!(String(photo.id))}>
            <Ionicons name="text-outline" size={16} color={colors.white} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, photo.isPrimary && styles.actionButtonActive]}
          onPress={() => config.onSetPrimary(photo.id)}
        >
          <Ionicons name="star-outline" size={16} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => config.onRemove(photo.id)}
        >
          <Ionicons name="trash-outline" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: PhotoGridItem }) => {
    // Handle add photo button
    if (item.id === 'add_photo_button') {
      return (
        <TouchableOpacity style={styles.addPhotoButton} onPress={onAddPhoto}>
          <Ionicons name="add" size={32} color={colors.primary} />
          <Text style={styles.addPhotoText}>Add Photo</Text>
        </TouchableOpacity>
      );
    }

    const photo = item.data;
    
    if (item.isLocal) {
      // Render local photo
      const localPhoto = photo as PhotoUpload;
      return renderPhotoItem(localPhoto, {
        imageUri: localPhoto.uri,
        photoType: localPhoto.type,
        showEditActions: true,
        isUploading: localPhoto.isUploading,
        hasError: !!localPhoto.error,
        onSetPrimary: (id) => onSetPrimary(id as string),
        onRemove: (id) => onRemovePhoto(id as string),
        onEditType: onEditType,
        onEditCaption: onEditCaption,
      });
    } else {
      // Render server photo
      const serverPhoto = photo as VehiclePhoto;
      return renderPhotoItem(serverPhoto, {
        imageUri: serverPhoto.photoUrl,
        photoType: serverPhoto.photoType,
        showCaption: true,
        caption: serverPhoto.caption,
        onSetPrimary: (id) => onSetServerPrimary(id as number),
        onRemove: (id) => onRemoveServerPhoto(id as number),
      });
    }
  };

  const keyExtractor = (item: PhotoGridItem) => String(item.id);

  const getItemLayout = (_: any, index: number) => {
    const itemWidth = '48%'; // This matches the photoContainer width
    const itemHeight = 120; // Approximate height based on aspect ratio 16:9
    const gap = 8; // spacing.sm
    
    return {
      length: itemHeight,
      offset: Math.floor(index / 2) * (itemHeight + gap),
      index,
    };
  };

  return (
    <FlatList
      data={combinedData}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.photosContainer}
      showsVerticalScrollIndicator={false}
      getItemLayout={getItemLayout}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  );
};

const styles = StyleSheet.create({
  photosContainer: {
    paddingHorizontal: spacing.sm,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
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
    backgroundColor: colors.overlay,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
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
    backgroundColor: colors.overlay,
  },
  photoActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.overlay + '66',
    paddingVertical: spacing.sm,
  },
  actionButton: {
    padding: spacing.xs,
  },
  actionButtonActive: {
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  removeButton: {
    backgroundColor: colors.error,
    borderRadius: 4,
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.overlay,
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