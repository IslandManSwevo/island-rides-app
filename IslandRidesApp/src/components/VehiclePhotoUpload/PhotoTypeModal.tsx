import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../styles/Theme';
import { PhotoType, photoTypeOptions } from '../../constants/photoTypes';

interface PhotoTypeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectType: (type: PhotoType) => void;
  allowedTypes: PhotoType[];
}

export const PhotoTypeModal: React.FC<PhotoTypeModalProps> = ({ visible, onClose, onSelectType, allowedTypes }) => {
  const filteredOptions = photoTypeOptions.filter(option => allowedTypes.includes(option.key));

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Select Photo Type</Text>
          
          {filteredOptions.map(option => (
            <TouchableOpacity
              key={option.key}
              style={styles.typeOption}
              onPress={() => onSelectType(option.key)}
            >
              <Ionicons name={option.icon} size={20} color={option.color} />
              <Text style={styles.typeOptionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    ...typography.heading1,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  typeOptionText: {
    ...typography.body,
    marginLeft: spacing.md,
  },
  cancelButton: {
    marginTop: spacing.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.primary,
  },
});