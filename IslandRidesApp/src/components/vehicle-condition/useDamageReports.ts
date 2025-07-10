import { useState, useEffect, useCallback } from 'react';
import { VehicleDamageReport } from '../../types';
import { vehicleFeatureService } from '../../services/vehicleFeatureService';
import { notificationService } from '../../services/notificationService';

interface DamageReportInput {
  vehicleId: number;
  bookingId?: number;
  reportedBy: number;
  damageType: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
  repairCost?: number;
  photos?: string[];
  insuranceClaimNumber?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export const useDamageReports = (vehicleId: number) => {
  const [reports, setReports] = useState<VehicleDamageReport[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const damage = await vehicleFeatureService.getVehicleDamageReports(vehicleId);
      setReports(damage);
    } catch (error) {
      console.error('Failed to load damage reports:', error);
      notificationService.error('Failed to load damage reports');
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const addReport = async (report: DamageReportInput) => {
    try {
      const newReport = await vehicleFeatureService.reportVehicleDamage(vehicleId, report);
      setReports(prev => [newReport, ...prev]);
      notificationService.success('Damage report submitted successfully');
      return newReport;
    } catch (error) {
      console.error('Failed to report damage:', error);
      notificationService.error('Failed to submit damage report');
      throw error;
    }
  };

  return { reports, loading, refresh: fetchReports, addReport };
};