import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../styles/theme';

interface PickerOption {
  label: string;
  value: string;
}

interface PickerProps {
  label: string;
  value: string;
  options: PickerOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export const Picker: React.FC<PickerProps> = ({
  label,
  value,
  options,
  onValueChange,
  placeholder = 'Select an option',
  error
}) => {
  const [modalVisible, setModalVisible] = React.useState(false);
  
  const selectedOption = options.find(option => option.value === value);
  
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.picker, error && styles.pickerError]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.pickerText, !selectedOption && styles.placeholder]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
    color: colors.darkGrey,
  },
  picker: {
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  pickerError: {
    borderColor: colors.error,
  },
  pickerText: {
    ...typography.body,
    color: colors.darkGrey,
  },
  placeholder: {
    color: colors.lightGrey,
  },
  errorText: {
    ...typography.body,
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '80%',
    maxHeight: '60%',
  },
  modalTitle: {
    ...typography.subheading,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  option: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey + '30',
  },
  optionText: {
    ...typography.body,
    color: colors.darkGrey,
  },
  cancelButton: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.lightGrey + '20',
    borderRadius: borderRadius.md,
  },
  cancelText: {
    ...typography.body,
    textAlign: 'center',
    color: colors.darkGrey,
  },
});
