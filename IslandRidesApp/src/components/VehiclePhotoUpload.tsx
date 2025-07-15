import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors, typography, spacing } from '../styles/Theme';
import { VehiclePhoto } from '../types';
import { photoTypeOptions, PhotoType } from '../constants/photoTypes';
import { usePhotoUpload } from './VehiclePhotoUpload/usePhotoUpload';
import { PhotoGrid } from './VehiclePhotoUpload/PhotoGrid';
import { PhotoTypeModal } from './VehiclePhotoUpload/PhotoTypeModal';
import { PhotoCaptionModal } from './VehiclePhotoUpload/PhotoCaptionModal';
import { PhotoUploadProgress } from './VehiclePhotoUpload/PhotoUploadProgress';

interface VehiclePhotoUploadProps {
  vehicleId: number;
  existingPhotos?: VehiclePhoto[];
  onPhotosUpdated?: (photos: VehiclePhoto[]) => void;
  maxPhotos?: number;
  allowedTypes?: PhotoType[];
}

export const VehiclePhotoUpload: React.FC<VehiclePhotoUploadProps> = ({
  vehicleId,
  existingPhotos = [],
  onPhotosUpdated,
  maxPhotos = 10,
  allowedTypes = ['exterior', 'interior', 'engine', 'dashboard', 'trunk', 'other']
}) => {
  const {
    photos,
    serverPhotos,
    uploading,
    pickImage,
    takePhoto,
    removePhoto,
    removeServerPhoto,
    setPhotoType,
    setPhotoCaption,
    setPrimaryPhoto,
    setServerPrimaryPhoto,
    uploadAllPhotos,
  } = usePhotoUpload({ vehicleId, existingPhotos, onPhotosUpdated, maxPhotos });

  const [showTypeModal, setShowTypeModal] = useState(false);
  const [selectedPhotoForType, setSelectedPhotoForType] = useState<string | null>(null);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [selectedPhotoForCaption, setSelectedPhotoForCaption] = useState<string | null>(null);

  const showPhotoOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleEditType = (photoId: string) => {
    setSelectedPhotoForType(photoId);
    setShowTypeModal(true);
  };

  const handleSelectType = (type: PhotoType) => {
    if (selectedPhotoForType) {
      setPhotoType(selectedPhotoForType, type);
    }
    setShowTypeModal(false);
    setSelectedPhotoForType(null);
  };

  const handleEditCaption = (photoId: string) => {
    setSelectedPhotoForCaption(photoId);
    setShowCaptionModal(true);
  };

  const handleSaveCaption = (caption: string) => {
    if (selectedPhotoForCaption) {
      setPhotoCaption(selectedPhotoForCaption, caption);
    }
    setShowCaptionModal(false);
    setSelectedPhotoForCaption(null);
  };

  const getPhotoTypeColor = (type: string) => {
    return photoTypeOptions.find(option => option.key === type)?.color || colors.grey;
  };

  const getPhotoTypeIcon = (type: string) => {
    return photoTypeOptions.find(option => option.key === type)?.icon || 'image-outline';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vehicle Photos</Text>
        <Text style={styles.subtitle}>
          {serverPhotos.length + photos.length} / {maxPhotos} photos
        </Text>
      </View>

      <PhotoGrid
        photos={photos}
        serverPhotos={serverPhotos}
        maxPhotos={maxPhotos}
        handlers={{
          onAddPhoto: showPhotoOptions,
          onRemovePhoto: removePhoto,
          onRemoveServerPhoto: removeServerPhoto,
          onSetPrimary: setPrimaryPhoto,
          onSetServerPrimary: setServerPrimaryPhoto,
          onEditType: handleEditType,
          onEditCaption: handleEditCaption,
        }}
        utilities={{
          getPhotoTypeColor,
          getPhotoTypeIcon,
        }}
      />

      <PhotoUploadProgress
        uploading={uploading}
        photoCount={photos.length}
        onUpload={uploadAllPhotos}
      />

      <PhotoTypeModal
        visible={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        onSelectType={handleSelectType}
        allowedTypes={allowedTypes}
      />

      <PhotoCaptionModal
        visible={showCaptionModal}
        initialCaption={photos.find(p => p.id === selectedPhotoForCaption)?.caption || ''}
        onClose={() => setShowCaptionModal(false)}
        onSave={handleSaveCaption}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  title: {
    ...typography.heading1,
    fontSize: 20,
  },
  subtitle: {
    ...typography.body,
    color: colors.lightGrey,
  },
});