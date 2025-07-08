import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { VehiclePhoto } from '../types';

interface VehiclePhotoGalleryProps {
  photos: VehiclePhoto[];
  style?: any;
  height?: number;
  showIndicators?: boolean;
  showThumbnails?: boolean;
  enableFullscreen?: boolean;
  onPhotoPress?: (photo: VehiclePhoto, index: number) => void;
}

const { width: screenWidth } = Dimensions.get('window');

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

  if (!photos || photos.length === 0) {
    return (
      <View style={[styles.container, { height }, style]}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No Photos Available</Text>
        </View>
      </View>
    );
  }

  const handleScroll = (event: any) => {
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
    switch (photoType) {
      case 'exterior': return '#3B82F6';
      case 'interior': return '#10B981';
      case 'engine': return '#F59E0B';
      case 'dashboard': return '#8B5CF6';
      case 'trunk': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderMainGallery = () => (
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
            style={styles.photoContainer}
            onPress={() => openFullscreen(index)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: photo.photoUrl }}
              style={styles.photo}
              resizeMode="cover"
            />
            
            {/* Photo type badge */}
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

            {/* Primary photo indicator */}
            {photo.isPrimary && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryBadgeText}>★</Text>
              </View>
            )}

            {/* Caption overlay */}
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

      {/* Photo indicators */}
      {showIndicators && photos.length > 1 && (
        <View style={styles.indicatorContainer}>
          {photos.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.indicator,
                index === currentIndex && styles.activeIndicator,
              ]}
              onPress={() => scrollToPhoto(index)}
            />
          ))}
        </View>
      )}

      {/* Photo counter */}
      {photos.length > 1 && (
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {photos.length}
          </Text>
        </View>
      )}
    </View>
  );

  const renderThumbnails = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.thumbnailContainer}
      contentContainerStyle={styles.thumbnailContent}
    >
      {photos.map((photo, index) => (
        <TouchableOpacity
          key={photo.id}
          style={[
            styles.thumbnail,
            index === currentIndex && styles.activeThumbnail,
          ]}
          onPress={() => scrollToPhoto(index)}
        >
          <Image
            source={{ uri: photo.photoUrl }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
          {photo.isPrimary && (
            <View style={styles.thumbnailPrimaryIndicator}>
              <Text style={styles.thumbnailPrimaryText}>★</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderFullscreenModal = () => (
    <Modal
      visible={fullscreenVisible}
      transparent={false}
      animationType="fade"
      onRequestClose={() => setFullscreenVisible(false)}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <SafeAreaView style={styles.fullscreenContainer}>
        <View style={styles.fullscreenHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setFullscreenVisible(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.fullscreenTitle}>
            {getPhotoTypeLabel(photos[fullscreenIndex]?.photoType)}
          </Text>
          <Text style={styles.fullscreenCounter}>
            {fullscreenIndex + 1} / {photos.length}
          </Text>
        </View>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x / screenWidth
            );
            setFullscreenIndex(index);
          }}
          contentOffset={{ x: fullscreenIndex * screenWidth, y: 0 }}
        >
          {photos.map((photo) => (
            <View key={photo.id} style={styles.fullscreenPhotoContainer}>
              <Image
                source={{ uri: photo.photoUrl }}
                style={styles.fullscreenPhoto}
                resizeMode="contain"
              />
              {photo.caption && (
                <View style={styles.fullscreenCaption}>
                  <Text style={styles.fullscreenCaptionText}>
                    {photo.caption}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <View>
      {renderMainGallery()}
      {showThumbnails && renderThumbnails()}
      {renderFullscreenModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  photoContainer: {
    width: screenWidth,
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
    backgroundColor: '#e5e5e5',
  },
  placeholderText: {
    fontSize: 16,
    color: '#6b7280',
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
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  primaryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  captionText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#fff',
    width: 24,
  },
  counterContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  thumbnailContainer: {
    marginTop: 12,
    height: 60,
  },
  thumbnailContent: {
    paddingHorizontal: 16,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: '#00b4d8',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailPrimaryIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailPrimaryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fullscreenTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  fullscreenCounter: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    minWidth: 44,
    textAlign: 'right',
  },
  fullscreenPhotoContainer: {
    width: screenWidth,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenPhoto: {
    width: screenWidth,
    height: '100%',
  },
  fullscreenCaption: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
  },
  fullscreenCaptionText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
}); 