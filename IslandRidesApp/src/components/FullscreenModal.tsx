import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { VehiclePhoto } from '../types';
import { colors } from '../styles/Theme';

interface FullscreenModalProps {
  photos: VehiclePhoto[];
  visible: boolean;
  startIndex: number;
  onClose: () => void;
  getPhotoTypeLabel: (photoType: string) => string;
}

export const FullscreenModal: React.FC<FullscreenModalProps> = ({ photos, visible, startIndex, onClose, getPhotoTypeLabel }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const { width: screenWidth } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setCurrentIndex(startIndex);
  }, [startIndex]);

  useEffect(() => {
    if (scrollViewRef.current && visible) {
      scrollViewRef.current.scrollTo({ x: startIndex * screenWidth, y: 0, animated: false });
    }
  }, [startIndex, screenWidth, visible]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setCurrentIndex(index);
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.black} />
      <SafeAreaView style={styles.fullscreenContainer}>
        <View style={styles.fullscreenHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.fullscreenTitle}>
            {photos && photos.length > 0 && photos[currentIndex] 
              ? getPhotoTypeLabel(photos[currentIndex].photoType) 
              : 'Photo'}
          </Text>
          <Text style={styles.fullscreenCounter}>
            {photos && photos.length > 0 ? `${currentIndex + 1} / ${photos.length}` : '0 / 0'}
          </Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
        >
          {photos.map((photo) => (
            <View key={photo.id} style={[styles.fullscreenPhotoContainer, { width: screenWidth }]}>
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
};

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    backgroundColor: colors.black,
  },
  fullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.overlay,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  fullscreenTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  fullscreenCounter: {
    color: colors.white,
    fontSize: 16,
  },
  fullscreenPhotoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenPhoto: {
    width: '100%',
    height: '100%',
  },
  fullscreenCaption: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: colors.overlay + 'B3',
    padding: 12,
    borderRadius: 8,
  },
  fullscreenCaptionText: {
    color: colors.white,
    fontSize: 16,
    textAlign: 'center',
  },
});