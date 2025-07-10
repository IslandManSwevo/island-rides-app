import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from 'react-native';
import { VehiclePhoto } from '../types';
import { colors } from '../styles/theme';
import { PhotoIndicators } from './PhotoIndicators';
import { PhotoThumbnails } from './PhotoThumbnails';
import { FullscreenModal } from './FullscreenModal';

interface VehiclePhotoGalleryProps {
  photos: VehiclePhoto[];
  style?: any;
  height?: number;
  showIndicators?: boolean;
  showThumbnails?: boolean;
  enableFullscreen?: boolean;
  onPhotoPress?: (photo: VehiclePhoto, index: number) => void;
}

// Photo type color mapping using theme colors
const PHOTO_TYPE_COLORS = {
  exterior: colors.info,      // '#3498DB' - blue for exterior
  interior: colors.success,   // '#2ECC71' - green for interior  
  engine: colors.warning,     // '#F1C40F' - yellow for engine
  dashboard: colors.secondary,    // purple for dashboard
  trunk: colors.error,        // '#E74C3C' - red for trunk
  default: colors.lightGrey,  // '#6C757D' - grey for default
} as const;

export const VehiclePhotoGallery: React.FC<VehiclePhotoGalleryProps> = ({
  photos,
  style,
  height = 250,
  showIndicators = true,
  showThumbnails = false,
  enableFullscreen = true,
  onPhotoPress,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Get screen width dynamically within component
  const { width: screenWidth } = useWindowDimensions();

  if (!photos || photos.length === 0) {
    return (
      <View style={[styles.container, { height }, style]}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No Photos Available</Text>
        </View>
      </View>
    );
  }

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / screenWidth);
    setCurrentIndex(index);
  };

  const openFullscreen = (index: number) => {
    if (enableFullscreen) {
      setFullscreenIndex(index);
      setFullscreenVisible(true);
    }
    onPhotoPress?.(photos[index], index);
  };

  const scrollToPhoto = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * screenWidth,
      animated: true,
    });
    setCurrentIndex(index);
  };

  const getPhotoTypeLabel = (photoType: string) => {
    switch (photoType) {
      case 'exterior': return 'Exterior';
      case 'interior': return 'Interior';
      case 'engine': return 'Engine';
      case 'dashboard': return 'Dashboard';
      case 'trunk': return 'Trunk';
      default: return 'Other';
    }
  };

  const getPhotoTypeColor = (photoType: string) => {
    return PHOTO_TYPE_COLORS[photoType as keyof typeof PHOTO_TYPE_COLORS] || PHOTO_TYPE_COLORS.default;
  };

  return (
    <View>
      <View style={[styles.container, { height }, style]}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={styles.scrollView}
        >
          {photos.map((photo, index) => (
            <TouchableOpacity
              key={photo.id}
              style={[styles.photoContainer, { width: screenWidth }]}
              onPress={() => openFullscreen(index)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: photo.photoUrl }}
                style={styles.photo}
                resizeMode="cover"
              />
              
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: getPhotoTypeColor(photo.photoType) }
                ]}
              >
                <Text style={styles.typeBadgeText}>
                  {getPhotoTypeLabel(photo.photoType)}
                </Text>
              </View>

              {photo.isPrimary && (
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>★</Text>
                </View>
              )}

              {photo.caption && (
                <View style={styles.captionOverlay}>
                  <Text style={styles.captionText} numberOfLines={2}>
                    {photo.caption}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {showIndicators && photos.length > 1 && (
          <PhotoIndicators
            count={photos.length}
            currentIndex={currentIndex}
            onPress={scrollToPhoto}
          />
        )}

        {photos.length > 1 && (
          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>
              {currentIndex + 1} / {photos.length}
            </Text>
          </View>
        )}
      </View>

      {showThumbnails && (
        <PhotoThumbnails
          photos={photos}
          currentIndex={currentIndex}
          onPress={scrollToPhoto}
        />
      )}

      {enableFullscreen && (
        <FullscreenModal
          photos={photos}
          visible={fullscreenVisible}
          startIndex={fullscreenIndex}
          onClose={() => setFullscreenVisible(false)}
          getPhotoTypeLabel={getPhotoTypeLabel}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: colors.sectionBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  photoContainer: {
    flex: 1,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightBorder,
  },
  placeholderText: {
    fontSize: 16,
    color: colors.grey,
    fontWeight: '500',
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  primaryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.star,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBadgeText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.overlay + 'B3',
    padding: 12,
  },
  captionText: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 18,
  },
  counterContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.overlay,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});