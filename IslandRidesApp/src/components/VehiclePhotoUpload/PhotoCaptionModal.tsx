import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../styles/Theme';

interface PhotoCaptionModalProps {
  visible: boolean;
  initialCaption: string;
  onClose: () => void;
  onSave: (caption: string) => void;
}

export const PhotoCaptionModal: React.FC<PhotoCaptionModalProps> = ({ visible, initialCaption, onClose, onSave }) => {
  const [caption, setCaption] = useState(initialCaption);

  useEffect(() => {
    setCaption(initialCaption);
  }, [initialCaption]);

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="slide"
      accessibilityViewIsModal={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View 
          style={styles.modal}
          accessible={true}
          accessibilityLabel="Add photo caption dialog"
        >
          <Text style={styles.modalTitle}>Add Caption</Text>
          
          <TextInput
            style={styles.captionInput}
            value={caption}
            onChangeText={setCaption}
            placeholder="Enter photo caption..."
            multiline
            maxLength={200}
            accessible={true}
            accessibilityLabel="Photo caption text input"
            accessibilityHint="Enter a caption for your photo, maximum 200 characters"
          />
          
          <Text 
            style={styles.characterCount}
            accessible={true}
            accessibilityLabel={`Character count: ${caption.length} of 200 characters used`}
          >
            {caption.length}/200
          </Text>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              accessibilityHint="Close the caption dialog without saving"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => onSave(caption)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Save caption"
              accessibilityHint="Save the entered caption for this photo"
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.overlay,
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    ...typography.heading1,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  captionInput: {
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
  },
  cancelButton: {
    padding: spacing.md,
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.lightGrey,
  },
  saveButton: {
    padding: spacing.md,
    marginLeft: spacing.md,
  },
  saveButtonText: {
    ...typography.body,
    color: colors.primary,
  },
});