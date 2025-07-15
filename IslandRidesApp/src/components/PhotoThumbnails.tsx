import React from 'react';
import { View, ScrollView, TouchableOpacity, Image, Text, StyleSheet } from 'react-native';
import { VehiclePhoto } from '../types';
import { colors } from '../styles/Theme';

interface PhotoThumbnailsProps {
  photos: VehiclePhoto[];
  currentIndex: number;
  onPress: (index: number) => void;
}

export const PhotoThumbnails: React.FC<PhotoThumbnailsProps> = ({ photos, currentIndex, onPress }) => {
  return (
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
          onPress={() => onPress(index)}
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
};

const styles = StyleSheet.create({
  thumbnailContainer: {
    marginTop: 8,
  },
  thumbnailContent: {
    paddingHorizontal: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  activeThumbnail: {
    borderColor: colors.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailPrimaryIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.overlay,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  thumbnailPrimaryText: {
    color: colors.star,
    fontSize: 10,
    fontWeight: 'bold',
  },
});