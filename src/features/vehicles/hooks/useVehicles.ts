import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  fetchVehicles,
  fetchVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  selectVehicles,
  selectCurrentVehicle,
  selectVehicleLoading,
  selectVehicleError,
  selectVehiclePagination,
  setCurrentVehicle,
  clearError,
  type Vehicle,
} from '../../../store/slices/vehicleSlice';
import type { VehicleFilters } from '../../../types';

export const useVehicles = () => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const vehicles = useAppSelector(selectVehicles);
  const currentVehicle = useAppSelector(selectCurrentVehicle);
  const isLoading = useAppSelector(selectVehicleLoading);
  const error = useAppSelector(selectVehicleError);
  const pagination = useAppSelector(selectVehiclePagination);

  // Actions
  const loadVehicles = useCallback(async (params: {
    page?: number;
    limit?: number;
    filters?: VehicleFilters;
    refresh?: boolean;
  } = {}) => {
    const result = await dispatch(fetchVehicles(params));
    return result;
  }, [dispatch]);

  const loadVehicleById = useCallback(async (vehicleId: string) => {
    const result = await dispatch(fetchVehicleById(vehicleId));
    return result;
  }, [dispatch]);

  const addVehicle = useCallback(async (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = await dispatch(createVehicle(vehicleData));
    return result;
  }, [dispatch]);

  const editVehicle = useCallback(async (vehicleId: string, updates: Partial<Vehicle>) => {
    const result = await dispatch(updateVehicle({ vehicleId, updates }));
    return result;
  }, [dispatch]);

  const removeVehicle = useCallback(async (vehicleId: string) => {
    const result = await dispatch(deleteVehicle(vehicleId));
    return result;
  }, [dispatch]);

  const selectVehicle = useCallback((vehicle: Vehicle | null) => {
    dispatch(setCurrentVehicle(vehicle));
  }, [dispatch]);

  const clearVehicleError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const refreshVehicles = useCallback(async (filters?: VehicleFilters) => {
    return loadVehicles({ page: 1, refresh: true, filters });
  }, [loadVehicles]);

  const loadMoreVehicles = useCallback(async (filters?: VehicleFilters) => {
    if (pagination.hasMore && !isLoading) {
      return loadVehicles({ 
        page: pagination.page + 1, 
        filters,
        refresh: false 
      });
    }
  }, [loadVehicles, pagination, isLoading]);

  return {
    // State
    vehicles,
    currentVehicle,
    isLoading,
    error,
    pagination,
    
    // Actions
    loadVehicles,
    loadVehicleById,
    addVehicle,
    editVehicle,
    removeVehicle,
    selectVehicle,
    clearVehicleError,
    refreshVehicles,
    loadMoreVehicles,
  };
};