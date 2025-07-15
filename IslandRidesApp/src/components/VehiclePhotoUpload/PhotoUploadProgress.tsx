import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../styles/Theme';
import { formatCountWithWord } from '../../utils/formatters';

interface PhotoUploadProgressProps {
  uploading: boolean;
  photoCount: number;
  onUpload: () => void;
}

export const PhotoUploadProgress: React.FC<PhotoUploadProgressProps> = ({ uploading, photoCount, onUpload }) => {
  if (photoCount === 0) {
    return null;
  }

  return (
    <View style={styles.uploadSection}>
      <TouchableOpacity
        style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
        onPress={onUpload}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Ionicons name="cloud-upload-outline" size={20} color={colors.white} />
        )}
        <Text style={styles.uploadButtonText}>
          {uploading ? 'Uploading...' : `Upload ${formatCountWithWord(photoCount, 'Photo')}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  uploadSection: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.offWhite,
  },
  uploadButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: colors.lightGrey,
  },
  uploadButtonText: {
    ...typography.button,
    color: colors.white,
    marginLeft: spacing.md,
  },
});