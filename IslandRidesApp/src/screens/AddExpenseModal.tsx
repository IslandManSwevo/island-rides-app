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
import { colors } from '../styles/Theme';

interface Expense {
  vehicleId: number;
  expenseType: string;
  amount: number | null;
  description: string;
  expenseDate: string;
  taxDeductible: boolean;
}

interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
}

interface ExpenseType {
  label: string;
  value: string;
}

interface AddExpenseModalProps {
  showExpenseModal: boolean;
  setShowExpenseModal: (value: boolean) => void;
  newExpense: Expense;
  setNewExpense: React.Dispatch<React.SetStateAction<Expense>>;
  vehicles: Vehicle[];
  expenseTypes: ExpenseType[];
  handleAddExpense: () => void;
  styles: any;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ 
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
                accessibilityLabel={`Select vehicle ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
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
                accessibilityLabel={`Select expense type ${type.label}`}
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
            value={newExpense.amount !== null ? String(newExpense.amount) : ''}
            onChangeText={(text) => {
              if (text.trim() === '') {
                setNewExpense({ ...newExpense, amount: null });
                return;
              }
              const num = Number(text);
              if (!isNaN(num)) {
                setNewExpense({ ...newExpense, amount: num });
              }
            }}
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
              value={(() => {
                const date = new Date(newExpense.expenseDate);
                return isNaN(date.getTime()) ? new Date() : date;
              })()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate && !isNaN(selectedDate.getTime())) {
                  setNewExpense({ ...newExpense, expenseDate: selectedDate.toISOString().split('T')[0] });
                } else {
                  // Fallback to current date if selectedDate is invalid
                  const fallbackDate = new Date();
                  setNewExpense({ ...newExpense, expenseDate: fallbackDate.toISOString().split('T')[0] });
                }
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