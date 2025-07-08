import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { AppHeader } from '../components/AppHeader';

interface FinancialData {
  period: {
    startDate: string;
    endDate: string;
  };
  earnings: {
    dailyBreakdown: Array<{
      date: string;
      grossRevenue: number;
      platformFees: number;
      netEarnings: number;
      bookingCount: number;
    }>;
    summary: {
      grossRevenue: number;
      platformFees: number;
      netEarnings: number;
      profitAfterExpenses: number;
    };
  };
  expenses: {
    byCategory: Array<{
      expenseType: string;
      totalAmount: number;
      transactionCount: number;
    }>;
    total: number;
  };
}

interface Expense {
  id?: number;
  vehicleId: number;
  expenseType: string;
  amount: number;
  description: string;
  expenseDate: string;
  receiptUrl?: string;
  taxDeductible: boolean;
  category?: string;
  subcategory?: string;
}

interface FinancialReportsScreenProps {
  navigation: any;
}

export const FinancialReportsScreen: React.FC<FinancialReportsScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [vehicles, setVehicles] = useState<Array<{ id: number; make: string; model: string; year: number }>>([]);
  const [newExpense, setNewExpense] = useState<Expense>({
    vehicleId: 0,
    expenseType: 'maintenance',
    amount: 0,
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    taxDeductible: false,
  });

  const expenseTypes = [
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Insurance', value: 'insurance' },
    { label: 'Fuel', value: 'fuel' },
    { label: 'Cleaning', value: 'cleaning' },
    { label: 'Repairs', value: 'repairs' },
    { label: 'Registration', value: 'registration' },
    { label: 'Other', value: 'other' },
  ];

  function getDefaultStartDate() {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  }

  function getDefaultEndDate() {
    return new Date().toISOString().split('T')[0];
  }

  useEffect(() => {
    loadFinancialData();
    loadVehicles();
  }, [startDate, endDate]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.get(
        `/owner/reports/financial?start_date=${startDate}&end_date=${endDate}`
      );
      
      if (response.success) {
        setFinancialData(response.data);
      } else {
        throw new Error('Failed to load financial data');
      }
    } catch (error) {
      console.error('Financial data error:', error);
      notificationService.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      const response = await apiService.get('/owner/vehicles/performance');
      if (response.success) {
        setVehicles(response.data.map((v: any) => ({
          id: v.id,
          make: v.make,
          model: v.model,
          year: v.year,
        })));
      }
    } catch (error) {
      console.error('Vehicles error:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFinancialData();
    setRefreshing(false);
  }, [startDate, endDate]);

  const handleAddExpense = async () => {
    try {
      if (!newExpense.vehicleId || !newExpense.amount || !newExpense.description) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const response = await apiService.post(
        `/owner/vehicles/${newExpense.vehicleId}/expenses`,
        newExpense
      );
      
      if (response.success) {
        setShowExpenseModal(false);
        setNewExpense({
          vehicleId: 0,
          expenseType: 'maintenance',
          amount: 0,
          description: '',
          expenseDate: new Date().toISOString().split('T')[0],
          taxDeductible: false,
        });
        await loadFinancialData();
        notificationService.success('Expense added successfully');
      } else {
        throw new Error('Failed to add expense');
      }
    } catch (error) {
      console.error('Add expense error:', error);
      notificationService.error('Failed to add expense');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getExpenseTypeColor = (type: string) => {
    const colors_map: { [key: string]: string } = {
      maintenance: '#FF6B6B',
      insurance: '#4ECDC4',
      fuel: '#45B7D1',
      cleaning: '#96CEB4',
      repairs: '#FFEAA7',
      registration: '#DDA0DD',
      other: '#A8A8A8',
    };
    return colors_map[type] || colors.lightGrey;
  };

  const renderSummaryCards = () => {
    if (!financialData) return null;

    const { summary } = financialData.earnings;

    return (
      <View style={styles.summaryCards}>
        <View style={[styles.summaryCard, { borderLeftColor: colors.success }]}>
          <Text style={styles.summaryLabel}>Gross Revenue</Text>
          <Text style={[styles.summaryValue, { color: colors.success }]}>
            {formatCurrency(summary.grossRevenue)}
          </Text>
        </View>

        <View style={[styles.summaryCard, { borderLeftColor: colors.warning }]}>
          <Text style={styles.summaryLabel}>Platform Fees</Text>
          <Text style={[styles.summaryValue, { color: colors.warning }]}>
            {formatCurrency(summary.platformFees)}
          </Text>
        </View>

        <View style={[styles.summaryCard, { borderLeftColor: colors.primary }]}>
          <Text style={styles.summaryLabel}>Net Earnings</Text>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>
            {formatCurrency(summary.netEarnings)}
          </Text>
        </View>

        <View style={[styles.summaryCard, { borderLeftColor: colors.error }]}>
          <Text style={styles.summaryLabel}>Total Expenses</Text>
          <Text style={[styles.summaryValue, { color: colors.error }]}>
            {formatCurrency(financialData.expenses.total)}
          </Text>
        </View>

        <View style={[styles.summaryCard, { borderLeftColor: colors.info }]}>
          <Text style={styles.summaryLabel}>Profit After Expenses</Text>
          <Text style={[styles.summaryValue, { color: colors.info }]}>
            {formatCurrency(summary.profitAfterExpenses)}
          </Text>
        </View>
      </View>
    );
  };

  const renderDateSelector = () => (
    <View style={styles.dateSelector}>
      <Text style={styles.sectionTitle}>Report Period</Text>
      <View style={styles.dateRow}>
        <View style={styles.dateInput}>
          <Text style={styles.dateLabel}>From</Text>
          <TextInput
            style={styles.dateValue}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
          />
        </View>
        <View style={styles.dateInput}>
          <Text style={styles.dateLabel}>To</Text>
          <TextInput
            style={styles.dateValue}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
          />
        </View>
      </View>
    </View>
  );

  const renderRevenueBreakdown = () => {
    if (!financialData?.earnings.dailyBreakdown.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Revenue Breakdown</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: 80 }]}>Date</Text>
              <Text style={[styles.tableHeaderText, { width: 80 }]}>Bookings</Text>
              <Text style={[styles.tableHeaderText, { width: 100 }]}>Gross Revenue</Text>
              <Text style={[styles.tableHeaderText, { width: 100 }]}>Platform Fees</Text>
              <Text style={[styles.tableHeaderText, { width: 100 }]}>Net Earnings</Text>
            </View>
            {financialData.earnings.dailyBreakdown.map((day, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCellText, { width: 80 }]}>
                  {new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}
                </Text>
                <Text style={[styles.tableCellText, { width: 80 }]}>
                  {day.bookingCount}
                </Text>
                <Text style={[styles.tableCellText, { width: 100 }]}>
                  {formatCurrency(day.grossRevenue)}
                </Text>
                <Text style={[styles.tableCellText, { width: 100 }]}>
                  {formatCurrency(day.platformFees)}
                </Text>
                <Text style={[styles.tableCellText, { width: 100 }]}>
                  {formatCurrency(day.netEarnings)}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderExpenseBreakdown = () => {
    if (!financialData?.expenses.byCategory.length) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Expense Breakdown</Text>
          <TouchableOpacity onPress={() => setShowExpenseModal(true)}>
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {financialData.expenses.byCategory.map((expense, index) => (
          <View key={index} style={styles.expenseCard}>
            <View style={styles.expenseHeader}>
              <View style={styles.expenseInfo}>
                <View style={[
                  styles.expenseColorBadge,
                  { backgroundColor: getExpenseTypeColor(expense.expenseType) }
                ]} />
                <Text style={styles.expenseType}>
                  {expense.expenseType.charAt(0).toUpperCase() + expense.expenseType.slice(1)}
                </Text>
              </View>
              <Text style={styles.expenseAmount}>
                {formatCurrency(expense.totalAmount)}
              </Text>
            </View>
            <Text style={styles.expenseCount}>
              {expense.transactionCount} transactions
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderExpenseModal = () => (
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
          <TextInput
            style={styles.input}
            value={newExpense.expenseDate}
            onChangeText={(text) => setNewExpense({ ...newExpense, expenseDate: text })}
            placeholder="YYYY-MM-DD"
          />

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading financial reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Financial Reports" navigation={navigation} showBackButton />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderDateSelector()}
        {renderSummaryCards()}
        {renderRevenueBreakdown()}
        {renderExpenseBreakdown()}
      </ScrollView>

      {renderExpenseModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  dateSelector: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateInput: {
    flex: 1,
  },
  dateLabel: {
    ...typography.caption,
    color: colors.darkGrey,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  dateValue: {
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
  },
  summaryCards: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.darkGrey,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  summaryValue: {
    ...typography.heading1,
    fontSize: 24,
  },
  section: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.heading2,
    color: colors.black,
  },
  table: {
    gap: spacing.xs,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    marginBottom: spacing.sm,
  },
  tableHeaderText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  tableCellText: {
    ...typography.caption,
    color: colors.darkGrey,
    textAlign: 'center',
  },
  expenseCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.offWhite,
    marginBottom: spacing.sm,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  expenseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  expenseColorBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  expenseType: {
    ...typography.body,
    fontWeight: '600',
    color: colors.black,
  },
  expenseAmount: {
    ...typography.body,
    fontWeight: '600',
    color: colors.error,
  },
  expenseCount: {
    ...typography.caption,
    color: colors.lightGrey,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    ...typography.heading2,
    color: colors.black,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.body,
    color: colors.darkGrey,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: spacing.lg,
    maxHeight: 150,
  },
  pickerOption: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.offWhite,
  },
  pickerOptionSelected: {
    backgroundColor: colors.primary,
  },
  pickerOptionText: {
    ...typography.body,
    color: colors.darkGrey,
  },
  pickerOptionTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  checkboxLabel: {
    ...typography.body,
    color: colors.darkGrey,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.lightGrey,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.darkGrey,
  },
  addButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  addButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
}); 