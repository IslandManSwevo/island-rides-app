import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { styles } from './styles';
import { VehicleDamageReport } from '../../types';
import { colors } from '../../styles/Theme';

// Utility function to parse numeric input
const parseNumericInput = (text: string): number | undefined => {
  const parsedValue = parseFloat(text);
  return isNaN(parsedValue) ? undefined : parsedValue;
};

// Form data interface for creating new damage reports
interface DamageReportFormData {
  damageType: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
  repairCost?: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (report: DamageReportFormData) => void;
}

export const DamageReportModal: React.FC<Props> = ({ visible, onClose, onSave }) => {
  const [damageType, setDamageType] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'minor' | 'moderate' | 'major'>('minor');
  const [repairCost, setRepairCost] = useState<number | undefined>();

  const handleSave = () => {
    if (!damageType || !description) {
      Alert.alert('Error', 'Please fill in damage type and description.');
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
          <View style={{marginTop: 15}}>
            <Text style={{marginBottom: 5, color: colors.grey, fontWeight: '500'}}>Severity</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity 
                style={{ flex: 1, padding: 12, borderRadius: 6, backgroundColor: severity === 'minor' ? colors.primary : colors.inputBackground, alignItems: 'center', marginRight: 5 }}
                onPress={() => setSeverity('minor')}
              >
                <Text style={{ color: severity === 'minor' ? colors.white : colors.darkText, fontWeight: '600' }}>Minor</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ flex: 1, padding: 12, borderRadius: 6, backgroundColor: severity === 'moderate' ? colors.primary : colors.inputBackground, alignItems: 'center', marginHorizontal: 5 }}
                onPress={() => setSeverity('moderate')}
              >
                <Text style={{ color: severity === 'moderate' ? colors.white : colors.darkText, fontWeight: '600' }}>Moderate</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ flex: 1, padding: 12, borderRadius: 6, backgroundColor: severity === 'major' ? colors.primary : colors.inputBackground, alignItems: 'center', marginLeft: 5 }}
                onPress={() => setSeverity('major')}
              >
                <Text style={{ color: severity === 'major' ? colors.white : colors.darkText, fontWeight: '600' }}>Major</Text>
              </TouchableOpacity>
            </View>
          </View>
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