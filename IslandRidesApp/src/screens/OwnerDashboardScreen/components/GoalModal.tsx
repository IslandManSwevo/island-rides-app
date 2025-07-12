import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Alert } from 'react-native';
import { styles } from '../styles';
import { NewGoal } from '../../../types';
import { goalTypes } from '../../../constants/goalTypes';
import { capitalize } from '../../../utils/stringUtils';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (goal: NewGoal) => void;
}

const GoalModal: React.FC<Props> = ({ visible, onClose, onCreate }) => {
  const [newGoal, setNewGoal] = useState<NewGoal>({
    goalType: 'monthly_revenue',
    targetValue: '',
    targetPeriod: 'monthly',
  });

  const handleCreate = () => {
    if (!newGoal.targetValue) {
      Alert.alert('Error', 'Please enter a target value');
      return;
    }
    onCreate(newGoal);
    setNewGoal({
      goalType: 'monthly_revenue',
      targetValue: '',
      targetPeriod: 'monthly',
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Create New Goal</Text>

          <Text style={styles.inputLabel}>Goal Type</Text>
          <View style={styles.pickerContainer}>
            {goalTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.pickerOption,
                  newGoal.goalType === type.value && styles.pickerOptionSelected,
                ]}
                onPress={() => setNewGoal({ ...newGoal, goalType: type.value })}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    newGoal.goalType === type.value && styles.pickerOptionTextSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Target Value</Text>
          <TextInput
            style={styles.input}
            value={newGoal.targetValue}
            onChangeText={(text) => setNewGoal({ ...newGoal, targetValue: text })}
            placeholder="Enter target value"
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>Time Period</Text>
          <View style={styles.pickerContainer}>
            {['monthly', 'quarterly', 'yearly'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.pickerOption,
                  newGoal.targetPeriod === period && styles.pickerOptionSelected,
                ]}
                onPress={() => setNewGoal({ ...newGoal, targetPeriod: period as 'monthly' | 'quarterly' | 'yearly' })}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    newGoal.targetPeriod === period && styles.pickerOptionTextSelected,
                  ]}
                >
                  {capitalize(period)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
              <Text style={styles.createButtonText}>Create Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default GoalModal;