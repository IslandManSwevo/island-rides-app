import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { reviewPromptService } from '../services/reviewPromptService';
import { colors, typography, spacing, borderRadius } from '../styles/Theme';
import { RootStackParamList, ROUTES } from '../navigation/routes';

type WriteReviewScreenProps = StackScreenProps<RootStackParamList, typeof ROUTES.WRITE_REVIEW>;

interface UploadResponse {
  url: string;
}

export const WriteReviewScreen: React.FC<WriteReviewScreenProps> = ({ navigation, route }) => {
  const { booking } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleStarPress = (starRating: number) => {
    setRating(starRating);
  };

  const pickImage = async () => {
    if (photos.length >= 3) {
      notificationService.warning('You can add up to 3 photos', { duration: 3000 });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true, // Request base64 for size validation
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      // Validate image format
      const fileExtension = asset.uri.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'jpeg' && fileExtension !== 'jpg' && fileExtension !== 'png') {
        notificationService.warning('Unsupported image format. Please use JPEG or PNG.', { duration: 4000 });
        return;
      }

      // Validate image size (e.g., max 5MB)
      if (asset.base64 && (asset.base64.length * 0.75) > 5 * 1024 * 1024) {
        notificationService.warning('Image size exceeds 5MB limit.', { duration: 4000 });
        return;
      }

      setPhotos([...photos, asset.uri]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const uploadPhoto = async (uri: string): Promise<string> => {
    const formData = new FormData();
    const fileType = uri.split('.').pop();
    formData.append('photo', {
      uri,
      name: `photo.${fileType}`,
      type: `image/${fileType}`,
    } as any);

    const response = await apiService.uploadFile<UploadResponse>('/upload', formData);

    return response.url; // Assuming the API returns the URL of the uploaded photo
  };

  const submitReview = async () => {
    if (rating === 0) {
      notificationService.warning('Please select a rating of at least 1 star.', { duration: 4000 });
      return;
    }

    const trimmedComment = comment.trim();
    if (trimmedComment.length < 10) {
      notificationService.warning(`Your comment has ${trimmedComment.length} characters. A minimum of 10 is required.`, { duration: 4000 });
      return;
    }

    setLoading(true);
    try {
      const uploadedPhotoUrls = await Promise.all(photos.map(uploadPhoto));

      const reviewData = {
        bookingId: booking.id,
        rating,
        comment: comment.trim(),
        photos: uploadedPhotoUrls,
      };

      await apiService.post('/reviews', reviewData);

      // Mark review as completed in the prompt service
      await reviewPromptService.markReviewCompleted(booking.id);

      notificationService.success('Review submitted successfully!', {
        duration: 4000,
        action: {
          label: 'View Booking',
          handler: () => navigation.navigate('Profile'),
        },
      });

      navigation.goBack();
    } catch (error: any) {
      console.error('Review submission error:', error);

      if (error?.response?.status === 400) {
        notificationService.error(error.response.data.error || 'Invalid review data', {
          duration: 4000,
        });
      } else {
        notificationService.error('Failed to submit review', {
          duration: 4000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleStarPress(star)}
            style={styles.starButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={40}
              color={star <= rating ? colors.warning : colors.lightGrey}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderRatingText = () => {
    const ratingTexts = [
      '',
      'Poor',
      'Fair', 
      'Good',
      'Very Good',
      'Excellent'
    ];
    
    return rating > 0 ? (
      <Text style={styles.ratingText}>{ratingTexts[rating]}</Text>
    ) : null;
  };

  const renderPhotos = () => {
    return (
      <View style={styles.photosSection}>
        <Text style={styles.sectionTitle}>Add Photos (Optional)</Text>
        <Text style={styles.sectionSubtitle}>Share your experience with photos</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: photo }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => removePhoto(index)}
              >
                <Ionicons name="close-circle" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          
          {photos.length < 3 && (
            <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
              <Ionicons name="camera" size={32} color={colors.primary} />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.white}}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Write a Review</Text>
        <Text style={styles.subtitle}>
          How was your experience with the {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}?
        </Text>
      </View>

      <View style={styles.vehicleInfo}>
        <View style={styles.vehicleDetails}>
          <Text style={styles.vehicleName}>
            {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
          </Text>
          <Text style={styles.rentalDates}>
            {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.ratingSection}>
        <Text style={styles.sectionTitle}>Rate Your Experience</Text>
        {renderStars()}
        {renderRatingText()}
      </View>

      <View style={styles.commentSection}>
        <Text style={styles.sectionTitle}>Write Your Review</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Share your experience with this vehicle. What did you like? What could be improved?"
          placeholderTextColor={colors.lightGrey}
          multiline
          numberOfLines={6}
          maxLength={1000}
          value={comment}
          onChangeText={setComment}
          textAlignVertical="top"
        />
        <Text style={styles.characterCount}>
          {comment.length}/1000 characters
        </Text>
      </View>

      {renderPhotos()}

      <View style={styles.submitSection}>
        <TouchableOpacity
          style={[styles.submitButton, (!rating || comment.length < 10) && styles.submitButtonDisabled]}
          onPress={submitReview}
          disabled={loading || !rating || comment.length < 10}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={colors.white} style={styles.buttonIcon} />
              <Text style={styles.submitButtonText}>Submit Review</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
   </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.heading1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.lightGrey,
    lineHeight: 22,
  },
  vehicleInfo: {
    backgroundColor: colors.white,
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  vehicleDetails: {
    alignItems: 'center',
  },
  vehicleName: {
    ...typography.heading1,
    fontSize: 20,
    marginBottom: spacing.sm,
  },
  rentalDates: {
    ...typography.body,
    color: colors.lightGrey,
  },
  ratingSection: {
    backgroundColor: colors.white,
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.subheading,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.lightGrey,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  starButton: {
    padding: spacing.sm,
  },
  ratingText: {
    ...typography.subheading,
    color: colors.primary,
    fontSize: 18,
  },
  commentSection: {
    backgroundColor: colors.white,
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 120,
    backgroundColor: colors.offWhite,
  },
  characterCount: {
    ...typography.body,
    fontSize: 12,
    color: colors.lightGrey,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  photosSection: {
    backgroundColor: colors.white,
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  photosScroll: {
    marginTop: spacing.md,
  },
  photoContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    ...typography.body,
    fontSize: 12,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  submitSection: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  submitButtonDisabled: {
    backgroundColor: colors.lightGrey,
  },
  submitButtonText: {
    ...typography.subheading,
    color: colors.white,
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  cancelButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.lightGrey,
    fontSize: 16,
  },
});
