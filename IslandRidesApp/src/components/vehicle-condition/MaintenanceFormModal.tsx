import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { styles } from './styles';
const parseNumericInput = (text: string): number | undefined => {
  const parsedValue = parseFloat(text);
  return isNaN(parsedValue) ? undefined : parsedValue;
};
import { VehicleMaintenance } from '../../types';

// Interface for the maintenance record form data (without auto-generated fields)
interface MaintenanceFormData {
  maintenanceType: string;
  description: string;
  cost?: number;
  serviceProvider?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (record: MaintenanceFormData) => void;
}

export const MaintenanceFormModal: React.FC<Props> = ({ visible, onClose, onSave }) => {
  const [maintenanceType, setMaintenanceType] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState<number | undefined>();
  const [serviceProvider, setServiceProvider] = useState('');

  const handleSave = () => {
    if (!maintenanceType || !description) {
      Alert.alert('Error', 'Please fill in the maintenance type and description.');
      return;
    }
    onSave({ maintenanceType, description, cost, serviceProvider });
    onClose();
    
    // Reset form state after successful save
    setMaintenanceType('');
    setDescription('');
    setCost(undefined);
    setServiceProvider('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Maintenance Record</Text>
          <TextInput
            style={styles.input}
            placeholder="Maintenance Type (e.g., Oil Change)"
            value={maintenanceType}
            onChangeText={setMaintenanceType}
          />
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
          />
          <TextInput
            style={styles.input}
            placeholder="Cost"
            value={cost?.toString() || ''}
            onChangeText={(text) => setCost(parseNumericInput(text))}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Service Provider"
            value={serviceProvider}
            onChangeText={setServiceProvider}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.button} onPress={handleSave}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};