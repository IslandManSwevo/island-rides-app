import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { v4 as uuidv4 } from 'uuid';
import { VehiclePhotoService } from '../../services/VehiclePhotoService';
import { notificationService } from '../../services/notificationService';
import { VehiclePhoto } from '../../types';

export interface PhotoUpload {
  id: string;
  uri: string;
  type: 'exterior' | 'interior' | 'engine' | 'dashboard' | 'trunk' | 'other';
  caption: string;
  isPrimary: boolean;
  isUploading: boolean;
  uploadProgress: number;
  error?: string;
}

interface ImageProcessingOptions {
  aspectRatio?: [number, number];
  quality?: number;
  resizeWidth?: number;
  compressQuality?: number;
}

interface UsePhotoUploadProps {
  vehicleId: number;
  existingPhotos?: VehiclePhoto[];
  onPhotosUpdated?: (photos: VehiclePhoto[]) => void;
  maxPhotos?: number;
  imageOptions?: ImageProcessingOptions;
}

export const usePhotoUpload = ({
  vehicleId,
  existingPhotos = [],
  onPhotosUpdated,
  maxPhotos = 10,
  imageOptions = {
    aspectRatio: [16, 9],
    quality: 0.8,
    resizeWidth: 1200,
    compressQuality: 0.8,
  },
}: UsePhotoUploadProps) => {
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [serverPhotos, setServerPhotos] = useState<VehiclePhoto[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const initializePhotos = async () => {
      await requestPermissions();
      await loadExistingPhotos();
    };
    initializePhotos();
  });

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

  const loadExistingPhotos = useCallback(async () => {
    try {
      const vehiclePhotos = await VehiclePhotoService.getVehiclePhotos(vehicleId);
      const photos = vehiclePhotos ?? [];
      setServerPhotos(photos);
      onPhotosUpdated?.(photos);
    } catch (error) {
      console.error('Failed to load existing photos:', error);
      notificationService.error('Failed to load existing photos');
    }
  }, [vehicleId, onPhotosUpdated]);

  const generatePhotoId = () => `photo_${uuidv4()}`;

  const checkPhotoLimit = (): boolean => {
    if (photos.length + serverPhotos.length >= maxPhotos) {
      Alert.alert('Maximum Photos', `You can only upload up to ${maxPhotos} photos.`);
      return false;
    }
    return true;
  };

  const handleImageResult = async (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets && result.assets[0]) {
      await processAndAddPhoto(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    if (!checkPhotoLimit()) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: imageOptions.aspectRatio,
        quality: imageOptions.quality,
        allowsMultipleSelection: false,
      });
      await handleImageResult(result);
    } catch (error) {
      console.error('Error picking image:', error);
      notificationService.error('Failed to pick image');
    }
  };

  const takePhoto = async () => {
    if (!checkPhotoLimit()) return;

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: imageOptions.aspectRatio,
        quality: imageOptions.quality,
      });
      await handleImageResult(result);
    } catch (error) {
      console.error('Error taking photo:', error);
      notificationService.error('Failed to take photo');
    }
  };

  const processAndAddPhoto = async (uri: string) => {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: imageOptions.resizeWidth } }],
        { compress: imageOptions.compressQuality, format: ImageManipulator.SaveFormat.JPEG }
      );

      const photoId = generatePhotoId();
      const newPhoto: PhotoUpload = {
        id: photoId,
        uri: manipulatedImage.uri,
        type: 'exterior',
        caption: '',
        isPrimary: serverPhotos.length === 0 && photos.length === 0,
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
              await VehiclePhotoService.deleteVehiclePhoto(vehicleId, photoId);
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
  };

  const setPhotoCaption = (photoId: string, caption: string) => {
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, caption } : p));
  };

  const setPrimaryPhoto = (photoId: string) => {
    setPhotos(prev => prev.map(p => ({ ...p, isPrimary: p.id === photoId })));
  };

  const setServerPrimaryPhoto = async (photoId: number) => {
    try {
      await VehiclePhotoService.setPrimaryPhoto(vehicleId, photoId);
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
      setPhotos(prev => prev.map(p => 
        p.id === photo.id ? { ...p, isUploading: true, uploadProgress: 0 } : p
      ));

      const formData = new FormData();
      formData.append('photo', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: `vehicle_${vehicleId}_${photo.id}.jpg`,
      } as unknown as Blob); // React Native file object for FormData
      formData.append('photoType', photo.type);
      formData.append('caption', photo.caption);
      formData.append('isPrimary', photo.isPrimary.toString());

      await VehiclePhotoService.uploadVehiclePhoto(vehicleId, formData);

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

  return {
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
  };
};