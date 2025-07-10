import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { styles } from './styles';
import { parseNumericInput } from '../../utils/inputUtils';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (report: any) => void;
}

export const DamageReportModal: React.FC<Props> = ({ visible, onClose, onSave }) => {
  const [damageType, setDamageType] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('minor');
  const [repairCost, setRepairCost] = useState<number | undefined>();

  const handleSave = () => {
    if (!damageType || !description) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    onSave({ damageType, description, severity, repairCost });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Report Damage</Text>
          <TextInput
            style={styles.input}
            placeholder="Damage Type (e.g., Scratch, Dent)"
            value={damageType}
            onChangeText={setDamageType}
          />
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
          />
          <TextInput
            style={styles.input}
            placeholder="Repair Cost"
            value={repairCost?.toString() || ''}
            onChangeText={(text) => setRepairCost(parseNumericInput(text))}
            keyboardType="numeric"
          />
          {/* A more sophisticated severity selector could be implemented here */}
          <TextInput
            style={styles.input}
            placeholder="Severity (minor, moderate, major)"
            value={severity}
            onChangeText={setSeverity}
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