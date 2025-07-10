import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';

interface PhotoTypeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectType: (type: 'exterior' | 'interior' | 'engine' | 'dashboard' | 'trunk' | 'other') => void;
  allowedTypes: ('exterior' | 'interior' | 'engine' | 'dashboard' | 'trunk' | 'other')[];
}

const photoTypeOptions = [
  { key: 'exterior', label: 'Exterior', icon: 'car-outline', color: '#3B82F6' },
  { key: 'interior', label: 'Interior', icon: 'car-seat', color: '#10B981' },
  { key: 'engine', label: 'Engine', icon: 'hardware-chip-outline', color: '#F59E0B' },
  { key: 'dashboard', label: 'Dashboard', icon: 'speedometer-outline', color: '#8B5CF6' },
  { key: 'trunk', label: 'Trunk', icon: 'cube-outline', color: '#EF4444' },
  { key: 'other', label: 'Other', icon: 'image-outline', color: '#6B7280' }
];

export const PhotoTypeModal: React.FC<PhotoTypeModalProps> = ({ visible, onClose, onSelectType, allowedTypes }) => {
  const filteredOptions = photoTypeOptions.filter(option => allowedTypes.includes(option.key as any));

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Select Photo Type</Text>
          
          {filteredOptions.map(option => (
            <TouchableOpacity
              key={option.key}
              style={styles.typeOption}
              onPress={() => onSelectType(option.key as any)}
            >
              <Ionicons name={option.icon as any} size={20} color={option.color} />
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    ...typography.heading2,
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
    ...typography.button,
    color: colors.primary,
  },
});