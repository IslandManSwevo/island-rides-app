import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { styles } from '../styles';

interface MaintenanceModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (description: string) => void;
}

const MaintenanceModal: React.FC<MaintenanceModalProps> = ({ visible, onClose, onSubmit }) => {
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (description.trim()) {
      onSubmit(description);
      setDescription('');
    } else {
      Alert.alert('Error', 'Please provide a description of the maintenance issue.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Request Maintenance</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Describe the issue..."
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity style={styles.modalButton} onPress={onClose}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.modalSubmitButton]} onPress={handleSubmit}>
              <Text style={[styles.modalButtonText, styles.modalSubmitButtonText]}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default MaintenanceModal;