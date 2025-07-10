import { useState, useEffect, useCallback } from 'react';
import { VehicleMaintenance } from '../../types';
import { vehicleFeatureService } from '../../services/vehicleFeatureService';
import { notificationService } from '../../services/notificationService';

export const useMaintenanceRecords = (vehicleId: number) => {
  const [records, setRecords] = useState<VehicleMaintenance[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const maintenance = await vehicleFeatureService.getVehicleMaintenance(vehicleId);
      setRecords(maintenance);
    } catch (error) {
      console.error('Failed to load maintenance records:', error);
      notificationService.error('Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const addRecord = async (record: Omit<VehicleMaintenance, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newRecord = await vehicleFeatureService.addMaintenanceRecord(vehicleId, record);
      setRecords(prev => [newRecord, ...prev]);
      notificationService.success('Maintenance record added successfully');
      return newRecord;
    } catch (error) {
      console.error('Failed to add maintenance record:', error);
      throw error;
    }
  };

  return { records, loading, refresh: fetchRecords, addRecord };
};