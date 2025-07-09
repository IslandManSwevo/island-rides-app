import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { VehiclePhoto } from '../types';
import { vehicleFeatureService } from '../services/vehicleFeatureService';
import { notificationService } from '../services/notificationService';

interface VehiclePhotoUploadProps {
  vehicleId: number;
  existingPhotos?: VehiclePhoto[];
  onPhotosUpdated?: (photos: VehiclePhoto[]) => void;
  maxPhotos?: number;
  allowedTypes?: ('exterior' | 'interior' | 'engine' | 'dashboard' | 'trunk' | 'other')[];
}

interface PhotoUpload {
  id: string;
  uri: string;
  type: 'exterior' | 'interior' | 'engine' | 'dashboard' | 'trunk' | 'other';
  caption: string;
  isPrimary: boolean;
  isUploading: boolean;
  uploadProgress: number;
  error?: string;
}

export const VehiclePhotoUpload: React.FC<VehiclePhotoUploadProps> = ({
  vehicleId,
  existingPhotos = [],
  onPhotosUpdated,
  maxPhotos = 10,
  allowedTypes = ['exterior', 'interior', 'engine', 'dashboard', 'trunk', 'other']
}) => {
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [serverPhotos, setServerPhotos] = useState<VehiclePhoto[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [selectedPhotoForType, setSelectedPhotoForType] = useState<string | null>(null);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [selectedPhotoForCaption, setSelectedPhotoForCaption] = useState<string | null>(null);
  const [tempCaption, setTempCaption] = useState('');

  const photoTypeOptions = [
    { key: 'exterior', label: 'Exterior', icon: 'car-outline', color: '#3B82F6' },
    { key: 'interior', label: 'Interior', icon: 'car-seat', color: '#10B981' },
    { key: 'engine', label: 'Engine', icon: 'hardware-chip-outline', color: '#F59E0B' },
    { key: 'dashboard', label: 'Dashboard', icon: 'speedometer-outline', color: '#8B5CF6' },
    { key: 'trunk', label: 'Trunk', icon: 'cube-outline', color: '#EF4444' },
    { key: 'other', label: 'Other', icon: 'image-outline', color: '#6B7280' }
  ].filter(option => allowedTypes.includes(option.key as any));

  useEffect(() => {
    requestPermissions();
    loadExistingPhotos();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll permissions to upload photos.',
        [{ text: 'OK' }]
      );
    }
  };

  const loadExistingPhotos = async () => {
    try {
      const vehiclePhotos = await vehicleFeatureService.getVehiclePhotos(vehicleId);
      setServerPhotos(vehiclePhotos);
      onPhotosUpdated?.(vehiclePhotos);
    } catch (error) {
      console.error('Failed to load existing photos:', error);
    }
  };

  const generatePhotoId = () => `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const pickImage = async () => {
    if (photos.length + serverPhotos.length >= maxPhotos) {
      Alert.alert('Maximum Photos', `You can only upload up to ${maxPhotos} photos.`);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await processAndAddPhoto(asset.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      notificationService.error('Failed to pick image');
    }
  };

  const takePhoto = async () => {
    if (photos.length + serverPhotos.length >= maxPhotos) {
      Alert.alert('Maximum Photos', `You can only upload up to ${maxPhotos} photos.`);
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await processAndAddPhoto(asset.uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      notificationService.error('Failed to take photo');
    }
  };

  const processAndAddPhoto = async (uri: string) => {
    try {
      // Compress and resize image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }], // Resize to max width of 1200px
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      const photoId = generatePhotoId();
      const newPhoto: PhotoUpload = {
        id: photoId,
        uri: manipulatedImage.uri,
        type: 'exterior', // Default type
        caption: '',
        isPrimary: serverPhotos.length === 0 && photos.length === 0, // First photo is primary
        isUploading: false,
        uploadProgress: 0,
      };

      setPhotos(prev => [...prev, newPhoto]);
    } catch (error) {
      console.error('Error processing image:', error);
      notificationService.error('Failed to process image');
    }
  };

  const removePhoto = (photoId: string) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPhotos(prev => prev.filter(p => p.id !== photoId));
          }
        }
      ]
    );
  };

  const removeServerPhoto = async (photoId: number) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await vehicleFeatureService.deleteVehiclePhoto(vehicleId, photoId);
              setServerPhotos(prev => prev.filter(p => p.id !== photoId));
              notificationService.success('Photo removed successfully');
              await loadExistingPhotos();
            } catch (error) {
              console.error('Failed to remove photo:', error);
              notificationService.error('Failed to remove photo');
            }
          }
        }
      ]
    );
  };

  const setPhotoType = (photoId: string, type: 'exterior' | 'interior' | 'engine' | 'dashboard' | 'trunk' | 'other') => {
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, type } : p));
    setShowTypeModal(false);
    setSelectedPhotoForType(null);
  };

  const setPhotoCaption = (photoId: string, caption: string) => {
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, caption } : p));
    setShowCaptionModal(false);
    setSelectedPhotoForCaption(null);
    setTempCaption('');
  };

  const setPrimaryPhoto = (photoId: string) => {
    setPhotos(prev => prev.map(p => ({ ...p, isPrimary: p.id === photoId })));
  };

  const setServerPrimaryPhoto = async (photoId: number) => {
    try {
      await vehicleFeatureService.setPrimaryPhoto(vehicleId, photoId);
      await loadExistingPhotos();
      notificationService.success('Primary photo updated');
    } catch (error) {
      console.error('Failed to set primary photo:', error);
      notificationService.error('Failed to update primary photo');
    }
  };

  const uploadAllPhotos = async () => {
    if (photos.length === 0) {
      notificationService.info('No new photos to upload');
      return;
    }

    setUploading(true);

    try {
      for (const photo of photos) {
        await uploadSinglePhoto(photo);
      }

      setPhotos([]);
      await loadExistingPhotos();
      notificationService.success(`Successfully uploaded ${photos.length} photo${photos.length !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Upload failed:', error);
      notificationService.error('Failed to upload some photos');
    } finally {
      setUploading(false);
    }
  };

  const uploadSinglePhoto = async (photo: PhotoUpload) => {
    try {
      // Update upload status
      setPhotos(prev => prev.map(p => 
        p.id === photo.id ? { ...p, isUploading: true, uploadProgress: 0 } : p
      ));

      // Create FormData
      const formData = new FormData();
      formData.append('photo', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: `vehicle_${vehicleId}_${photo.id}.jpg`,
      } as any);
      formData.append('photoType', photo.type);
      formData.append('caption', photo.caption);
      formData.append('isPrimary', photo.isPrimary.toString());

      // Upload photo
      await vehicleFeatureService.uploadVehiclePhoto(vehicleId, formData);

      // Update upload status
      setPhotos(prev => prev.map(p => 
        p.id === photo.id ? { ...p, isUploading: false, uploadProgress: 100 } : p
      ));
    } catch (error) {
      setPhotos(prev => prev.map(p => 
        p.id === photo.id ? { ...p, isUploading: false, error: 'Upload failed' } : p
      ));
      throw error;
    }
  };

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

  const getPhotoTypeColor = (type: string) => {
    return photoTypeOptions.find(option => option.key === type)?.color || '#6B7280';
  };

  const getPhotoTypeIcon = (type: string) => {
    return photoTypeOptions.find(option => option.key === type)?.icon || 'image-outline';
  };

  const renderPhoto = (photo: PhotoUpload, index: number) => (
    <View key={photo.id} style={styles.photoContainer}>
      <Image source={{ uri: photo.uri }} style={styles.photoImage} />
      
      {/* Photo type badge */}
      <View style={[styles.typeBadge, { backgroundColor: getPhotoTypeColor(photo.type) }]}>
        <Ionicons name={getPhotoTypeIcon(photo.type) as any} size={12} color={colors.white} />
      </View>

      {/* Primary badge */}
      {photo.isPrimary && (
        <View style={styles.primaryBadge}>
          <Ionicons name="star" size={12} color="#F59E0B" />
        </View>
      )}

      {/* Upload progress */}
      {photo.isUploading && (
        <View style={styles.uploadOverlay}>
          <ActivityIndicator size="small" color={colors.white} />
          <Text style={styles.uploadText}>Uploading...</Text>
        </View>
      )}

      {/* Error indicator */}
      {photo.error && (
        <View style={styles.errorOverlay}>
          <Ionicons name="warning" size={16} color="#EF4444" />
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.photoActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setSelectedPhotoForType(photo.id);
            setShowTypeModal(true);
          }}
        >
          <Ionicons name="pricetag-outline" size={16} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setSelectedPhotoForCaption(photo.id);
            setTempCaption(photo.caption);
            setShowCaptionModal(true);
          }}
        >
          <Ionicons name="text-outline" size={16} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, photo.isPrimary && styles.actionButtonActive]}
          onPress={() => setPrimaryPhoto(photo.id)}
        >
          <Ionicons name="star-outline" size={16} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => removePhoto(photo.id)}
        >
          <Ionicons name="trash-outline" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderServerPhoto = (photo: VehiclePhoto, index: number) => (
    <View key={photo.id} style={styles.photoContainer}>
      <Image source={{ uri: photo.photoUrl }} style={styles.photoImage} />
      
      {/* Photo type badge */}
      <View style={[styles.typeBadge, { backgroundColor: getPhotoTypeColor(photo.photoType) }]}>
        <Ionicons name={getPhotoTypeIcon(photo.photoType) as any} size={12} color={colors.white} />
      </View>

      {/* Primary badge */}
      {photo.isPrimary && (
        <View style={styles.primaryBadge}>
          <Ionicons name="star" size={12} color="#F59E0B" />
        </View>
      )}

      {/* Caption */}
      {photo.caption && (
        <View style={styles.captionOverlay}>
          <Text style={styles.captionText} numberOfLines={2}>
            {photo.caption}
          </Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.photoActions}>
        <TouchableOpacity
          style={[styles.actionButton, photo.isPrimary && styles.actionButtonActive]}
          onPress={() => setServerPrimaryPhoto(photo.id)}
        >
          <Ionicons name="star-outline" size={16} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => removeServerPhoto(photo.id)}
        >
          <Ionicons name="trash-outline" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vehicle Photos</Text>
        <Text style={styles.subtitle}>
          {serverPhotos.length + photos.length} / {maxPhotos} photos
        </Text>
      </View>

      {/* Photo Grid */}
      <ScrollView style={styles.photosContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.photosGrid}>
          {/* Existing server photos */}
          {serverPhotos.map(renderServerPhoto)}
          
          {/* New photos to upload */}
          {photos.map(renderPhoto)}
          
          {/* Add photo button */}
          {(serverPhotos.length + photos.length) < maxPhotos && (
            <TouchableOpacity style={styles.addPhotoButton} onPress={showPhotoOptions}>
              <Ionicons name="add" size={32} color={colors.primary} />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Upload Button */}
      {photos.length > 0 && (
        <View style={styles.uploadSection}>
          <TouchableOpacity
            style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
            onPress={uploadAllPhotos}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="cloud-upload-outline" size={20} color={colors.white} />
            )}
            <Text style={styles.uploadButtonText}>
              {uploading ? 'Uploading...' : `Upload ${photos.length} Photo${photos.length !== 1 ? 's' : ''}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Type Selection Modal */}
      <Modal visible={showTypeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Select Photo Type</Text>
            
            {photoTypeOptions.map(option => (
              <TouchableOpacity
                key={option.key}
                style={styles.typeOption}
                onPress={() => {
                  if (selectedPhotoForType) {
                    setPhotoType(selectedPhotoForType, option.key as any);
                  }
                }}
              >
                <Ionicons name={option.icon as any} size={20} color={option.color} />
                <Text style={styles.typeOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowTypeModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Caption Modal */}
      <Modal visible={showCaptionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Caption</Text>
            
            <TextInput
              style={styles.captionInput}
              value={tempCaption}
              onChangeText={setTempCaption}
              placeholder="Enter photo caption..."
              multiline
              maxLength={200}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCaptionModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  if (selectedPhotoForCaption) {
                    setPhotoCaption(selectedPhotoForCaption, tempCaption)
                  }
                }}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    top: spacing.xs,
    left: spacing.xs,
    borderRadius: borderRadius.sm,
    padding: 4,
  },
  primaryBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    padding: 4,
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: colors.white,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  errorOverlay: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    padding: 4,
  },
  photoActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: spacing.xs,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginHorizontal: 2,
  },
  actionButtonActive: {
    backgroundColor: colors.primary,
  },
  removeButton: {
    backgroundColor: '#EF4444',
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: spacing.sm,
  },
  captionText: {
    color: colors.white,
    fontSize: 12,
    lineHeight: 16,
  },
  addPhotoButton: {
    width: '48%',
    aspectRatio: 16 / 9,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
  },
  addPhotoText: {
    ...typography.body,
    color: colors.primary,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  uploadSection: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.offWhite,
  },
  uploadButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  uploadButtonDisabled: {
    backgroundColor: colors.lightGrey,
  },
  uploadButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    ...typography.heading1,
    fontSize: 18,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.offWhite,
  },
  typeOptionText: {
    ...typography.body,
    marginLeft: spacing.md,
    flex: 1,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.lightGrey,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.darkGrey,
  },
  saveButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
}); 