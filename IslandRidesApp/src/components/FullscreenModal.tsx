import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    setCurrentIndex(startIndex);
  }, [startIndex]);

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
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <SafeAreaView style={styles.fullscreenContainer}>
        <View style={styles.fullscreenHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.fullscreenTitle}>
            {getPhotoTypeLabel(photos[currentIndex]?.photoType)}
          </Text>
          <Text style={styles.fullscreenCounter}>
            {currentIndex + 1} / {photos.length}
          </Text>
        </View>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          contentOffset={{ x: startIndex * screenWidth, y: 0 }}
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
    backgroundColor: '#000',
  },
  fullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  fullscreenTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fullscreenCounter: {
    color: '#fff',
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
  },
  fullscreenCaptionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});