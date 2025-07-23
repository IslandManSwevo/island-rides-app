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
    if (fetchVehicles.fulfilled.match(result)) {
      return result.payload;
    }
    throw new Error(result.payload as string);
  }, [dispatch]);

  const loadVehicleById = useCallback(async (vehicleId: string) => {
    const result = await dispatch(fetchVehicleById(vehicleId));
    if (fetchVehicleById.fulfilled.match(result)) {
      return result.payload;
    }
    throw new Error(result.payload as string);
  }, [dispatch]);

  const addVehicle = useCallback(async (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = await dispatch(createVehicle(vehicleData));
    if (createVehicle.fulfilled.match(result)) {
      return result.payload;
    }
    throw new Error(result.payload as string);
  }, [dispatch]);

  const editVehicle = useCallback(async (vehicleId: string, updates: Partial<Vehicle>) => {
    const result = await dispatch(updateVehicle({ vehicleId, updates }));
    if (updateVehicle.fulfilled.match(result)) {
      return result.payload;
    }
    throw new Error(result.payload as string);
  }, [dispatch]);

  const removeVehicle = useCallback(async (vehicleId: string) => {
    const result = await dispatch(deleteVehicle(vehicleId));
    if (deleteVehicle.fulfilled.match(result)) {
      return result.payload;
    }
    throw new Error(result.payload as string);
  }, [dispatch]);

  const selectVehicle = useCallback((vehicle: Vehicle | null) => {
    dispatch(setCurrentVehicle(vehicle));
  }, [dispatch]);

  const clearVehicleError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const refreshVehicles = useCallback((filters?: VehicleFilters) => {
    return loadVehicles({ page: 1, refresh: true, filters });
  }, [loadVehicles]);

  const loadMoreVehicles = useCallback((filters?: VehicleFilters) => {
    if (pagination.hasMore && !isLoading) {
      return loadVehicles({
        page: pagination.page + 1,
        filters,
        refresh: false
      });
    }
    return Promise.resolve(); // Return a resolved promise when conditions aren't met
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