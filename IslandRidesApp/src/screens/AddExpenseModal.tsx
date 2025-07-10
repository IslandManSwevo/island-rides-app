import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../styles/theme';

const AddExpenseModal = ({ 
  showExpenseModal, 
  setShowExpenseModal, 
  newExpense, 
  setNewExpense, 
  vehicles, 
  expenseTypes, 
  handleAddExpense, 
  styles 
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  return (
    <Modal visible={showExpenseModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Add Expense</Text>
          
          <Text style={styles.inputLabel}>Vehicle</Text>
          <View style={styles.pickerContainer}>
            {vehicles.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.pickerOption,
                  newExpense.vehicleId === vehicle.id && styles.pickerOptionSelected
                ]}
                onPress={() => setNewExpense({ ...newExpense, vehicleId: vehicle.id })}
              >
                <Text style={[
                  styles.pickerOptionText,
                  newExpense.vehicleId === vehicle.id && styles.pickerOptionTextSelected
                ]}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Expense Type</Text>
          <View style={styles.pickerContainer}>
            {expenseTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.pickerOption,
                  newExpense.expenseType === type.value && styles.pickerOptionSelected
                ]}
                onPress={() => setNewExpense({ ...newExpense, expenseType: type.value })}
              >
                <Text style={[
                  styles.pickerOptionText,
                  newExpense.expenseType === type.value && styles.pickerOptionTextSelected
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Amount</Text>
          <TextInput
            style={styles.input}
            value={newExpense.amount.toString()}
            onChangeText={(text) => setNewExpense({ ...newExpense, amount: parseFloat(text) || 0 })}
            placeholder="Enter amount"
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={styles.input}
            value={newExpense.description}
            onChangeText={(text) => setNewExpense({ ...newExpense, description: text })}
            placeholder="Enter description"
            multiline
          />

          <Text style={styles.inputLabel}>Date</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
            <Text>{newExpense.expenseDate}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(newExpense.expenseDate)}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                const currentDate = selectedDate || new Date(newExpense.expenseDate);
                setShowDatePicker(false);
                setNewExpense({ ...newExpense, expenseDate: currentDate.toISOString().split('T')[0] });
              }}
            />
          )}

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setNewExpense({ 
              ...newExpense, 
              taxDeductible: !newExpense.taxDeductible 
            })}
          >
            <Ionicons 
              name={newExpense.taxDeductible ? 'checkbox' : 'square-outline'} 
              size={20} 
              color={colors.primary} 
            />
            <Text style={styles.checkboxLabel}>Tax deductible</Text>
          </TouchableOpacity>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowExpenseModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddExpense}
            >
              <Text style={styles.addButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddExpenseModal;