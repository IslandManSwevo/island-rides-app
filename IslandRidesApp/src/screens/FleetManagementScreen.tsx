import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Switch,
  TextInput,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { AppHeader } from '../components/AppHeader';

import { FleetVehicleCard } from '../components/FleetVehicleCard';

type IconName = keyof typeof Ionicons.glyphMap;

interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  dailyRate: number;
  available: boolean;
  verificationStatus: string;
  conditionRating: number;
  location: string;
  mileage: number;
  nextMaintenanceDate: string | null;
  activeBookings: number;
  upcomingBookings: number;
  lastCleaned: string | null;
  insuranceExpiry: string | null;
  registrationExpiry: string | null;
}

interface BulkAction {
  action: string;
  label: string;
  icon: IconName;
  color: string;
}

interface FleetManagementScreenProps {
  navigation: any;
}

export const FleetManagementScreen: React.FC<FleetManagementScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<Set<number>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceVehicleId, setMaintenanceVehicleId] = useState<number | null>(null);
  const [maintenanceDate, setMaintenanceDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  type FilterStatus = 'all' | 'available' | 'unavailable' | 'maintenance';
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const bulkActions: BulkAction[] = [
    { action: 'toggle_availability', label: 'Toggle Availability', icon: 'swap-horizontal', color: colors.primary },
    { action: 'update_rates', label: 'Update Rates', icon: 'pricetag', color: colors.warning },
    { action: 'schedule_maintenance', label: 'Schedule Maintenance', icon: 'build', color: colors.info },
    { action: 'mark_unavailable', label: 'Mark Unavailable', icon: 'close-circle', color: colors.error },
    { action: 'mark_available', label: 'Mark Available', icon: 'checkmark-circle', color: colors.success },
  ];

  useEffect(() => {
    loadFleetData();
  }, []);

  const loadFleetData = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.get('/owner/fleet');
      
      if (response.success) {
        setVehicles(response.data || []);
      } else {
        throw new Error('Failed to load fleet data');
      }
    } catch (error) {
      console.error('Fleet data error:', error);
      notificationService.error('Failed to load fleet data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFleetData();
    setRefreshing(false);
  }, []);

  const toggleVehicleSelection = (vehicleId: number) => {
    const newSelection = new Set(selectedVehicles);
    if (newSelection.has(vehicleId)) {
      newSelection.delete(vehicleId);
    } else {
      newSelection.add(vehicleId);
    }
    setSelectedVehicles(newSelection);
  };

  const selectAllVehicles = () => {
    const filteredVehicles = getFilteredVehicles();
    const allIds = new Set(filteredVehicles.map(v => v.id));
    setSelectedVehicles(allIds);
  };

  const clearSelection = () => {
    setSelectedVehicles(new Set());
    setSelectionMode(false);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedVehicles.size === 0) {
      Alert.alert('Error', 'Please select at least one vehicle');
      return;
    }

    try {
      const vehicleIds = Array.from(selectedVehicles);
      
      switch (action) {
        case 'toggle_availability':
          await apiService.post('/owner/fleet/bulk/toggle-availability', { vehicleIds });
          break;
        case 'mark_available':
          await apiService.post('/owner/fleet/bulk/availability', { vehicleIds, available: true });
          break;
        case 'mark_unavailable':
          await apiService.post('/owner/fleet/bulk/availability', { vehicleIds, available: false });
          break;
        case 'schedule_maintenance':
          setShowMaintenanceModal(true);
          setShowBulkModal(false);
          return;
        case 'update_rates':
          navigation.navigate('BulkRateUpdate', { vehicleIds });
          setShowBulkModal(false);
          return;
      }

      await loadFleetData();
      clearSelection();
      setShowBulkModal(false);
      notificationService.success('Bulk action completed successfully');
    } catch (error) {
      console.error('Bulk action error:', error);
      notificationService.error('Failed to perform bulk action');
    }
  };

  // Extracted function to handle vehicle availability toggle
  const handleToggleAvailability = async (vehicleId: number, currentAvailability: boolean) => {
    try {
      await apiService.put(`/owner/vehicles/${vehicleId}`, {
        available: !currentAvailability
      });
      
      await loadFleetData();
      notificationService.success('Availability updated');
    } catch (error) {
      console.error('Toggle availability error:', error);
      notificationService.error('Failed to update availability');
    }
  };

  const handleScheduleMaintenance = async () => {
    try {
      const vehicleIds = Array.from(selectedVehicles);
      const formattedDate = maintenanceDate.toISOString().split('T')[0];
      
      await apiService.post('/owner/fleet/bulk/maintenance', {
        vehicleIds,
        maintenanceDate: formattedDate,
      });

      await loadFleetData();
      clearSelection();
      setShowMaintenanceModal(false);
      notificationService.success('Maintenance scheduled successfully');
    } catch (error) {
      console.error('Schedule maintenance error:', error);
      notificationService.error('Failed to schedule maintenance');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setMaintenanceDate(selectedDate);
    }
  };

  const getFilteredVehicles = () => {
    return vehicles.filter(vehicle => {
      switch (filterStatus) {
        case 'available':
          return vehicle.available;
        case 'unavailable':
          return !vehicle.available;
        case 'maintenance':
          return vehicle.nextMaintenanceDate && new Date(vehicle.nextMaintenanceDate) <= new Date();
        default:
          return true;
      }
    });
  };



  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      {[
        { key: 'all', label: 'All' },
        { key: 'available', label: 'Available' },
        { key: 'unavailable', label: 'Unavailable' },
        { key: 'maintenance', label: 'Maintenance Due' },
      ].map(filter => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.filterButton,
            filterStatus === filter.key && styles.filterButtonActive
          ]}
          onPress={() => setFilterStatus(filter.key as FilterStatus)}
        >
          <Text style={[
            styles.filterButtonText,
            filterStatus === filter.key && styles.filterButtonTextActive
          ]}>
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSelectionControls = () => {
    if (!selectionMode) return null;

    return (
      <View style={styles.selectionControls}>
        <Text style={styles.selectionCount}>
          {selectedVehicles.size} selected
        </Text>
        <View style={styles.selectionActions}>
          <TouchableOpacity onPress={selectAllVehicles}>
            <Text style={styles.selectionAction}>Select All</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearSelection}>
            <Text style={styles.selectionAction}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setShowBulkModal(true)}
            disabled={selectedVehicles.size === 0}
          >
            <Text style={[
              styles.selectionAction,
              { color: selectedVehicles.size > 0 ? colors.primary : colors.lightGrey }
            ]}>
              Actions
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderVehicleCard = (vehicle: Vehicle) => (
    <FleetVehicleCard
      key={vehicle.id}
      vehicle={vehicle}
      isSelected={selectedVehicles.has(vehicle.id)}
      selectionMode={selectionMode}
      onPress={() => {
        if (selectionMode) {
          toggleVehicleSelection(vehicle.id);
        } else {
          navigation.navigate('VehicleDetail', { 
            vehicle: {
              id: vehicle.id,
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              dailyRate: vehicle.dailyRate,
              available: vehicle.available,
              verificationStatus: vehicle.verificationStatus,
              conditionRating: vehicle.conditionRating,
            }
          });
        }
      }}
      onLongPress={() => {
        if (!selectionMode) {
          setSelectionMode(true);
          toggleVehicleSelection(vehicle.id);
        }
      }}
      onToggleAvailability={() => handleToggleAvailability(vehicle.id, vehicle.available)}
      navigation={navigation}
    />
  );

  const renderBulkModal = () => (
    <Modal visible={showBulkModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Bulk Actions</Text>
          <Text style={styles.modalSubtitle}>
            {selectedVehicles.size} vehicles selected
          </Text>
          
          {bulkActions.map((action) => (
            <TouchableOpacity
              key={action.action}
              style={styles.bulkActionButton}
              onPress={() => handleBulkAction(action.action)}
            >
              <Ionicons name={action.icon} size={20} color={action.color} />
              <Text style={styles.bulkActionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowBulkModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderMaintenanceModal = () => (
    <Modal visible={showMaintenanceModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Schedule Maintenance</Text>
          
          <Text style={styles.inputLabel}>Maintenance Date</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.datePickerText}>
              {maintenanceDate.toLocaleDateString()}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={maintenanceDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowMaintenanceModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.scheduleButton}
              onPress={handleScheduleMaintenance}
            >
              <Text style={styles.scheduleButtonText}>Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading fleet...</Text>
      </View>
    );
  }

  const filteredVehicles = getFilteredVehicles();

  return (
    <View style={styles.container}>
      <AppHeader 
        title="Fleet Management" 
        navigation={navigation} 
        showBackButton 
        rightComponent={
          <TouchableOpacity onPress={() => setSelectionMode(!selectionMode)}>
            <Ionicons 
              name={selectionMode ? 'close' : 'checkmark-circle-outline'} 
              size={24} 
              color={colors.white} 
            />
          </TouchableOpacity>
        }
      />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderFilterButtons()}
        {renderSelectionControls()}

        {filteredVehicles.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color={colors.lightGrey} />
            <Text style={styles.emptyStateTitle}>No vehicles found</Text>
            <Text style={styles.emptyStateText}>
              {vehicles.length === 0 
                ? 'Add your first vehicle to start managing your fleet'
                : `No vehicles match the current filter: ${filterStatus}`
              }
            </Text>
          </View>
        ) : (
          <View style={styles.vehiclesList}>
            {filteredVehicles.map(renderVehicleCard)}
          </View>
        )}
      </ScrollView>

      {renderBulkModal()}
      {renderMaintenanceModal()}
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
  },
  filterContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    ...typography.caption,
    color: colors.darkGrey,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  selectionControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
  },
  selectionCount: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  selectionAction: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  vehiclesList: {
    padding: spacing.md,
    gap: spacing.md,
  },
  vehicleCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  vehicleCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  selectionCheckbox: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 1,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    ...typography.heading3,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  licensePlate: {
    ...typography.caption,
    color: colors.lightGrey,
    fontFamily: 'monospace',
  },
  vehicleStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  statusText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 10,
  },
  dailyRate: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  vehicleMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metricText: {
    ...typography.caption,
    color: colors.lightGrey,
  },
  bookingInfo: {
    marginBottom: spacing.md,
  },
  bookingText: {
    ...typography.caption,
    color: colors.darkGrey,
  },
  alerts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  alertText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 10,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.md,
  },
  quickActionText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyStateTitle: {
    ...typography.heading2,
    color: colors.darkGrey,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.lightGrey,
    textAlign: 'center',
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
  },
  modalTitle: {
    ...typography.heading2,
    color: colors.black,
    marginBottom: spacing.sm,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.lightGrey,
    marginBottom: spacing.lg,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.md,
  },
  bulkActionText: {
    ...typography.body,
    color: colors.black,
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
  scheduleButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  scheduleButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
  },
  datePickerText: {
    ...typography.body,
    color: colors.darkGrey,
  },
});