// Vehicle feature exports
// TODO: Add these exports when directories are implemented
// export * from './components';
export * from './hooks';
// export * from './types';
// export * from './utils';

// Re-export relevant store items
export {
  fetchVehicles,
  fetchVehicleById,
  searchVehicles,
  checkVehicleAvailability,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  selectVehicles,
  selectCurrentVehicle,
  selectVehicleFilters,
  selectVehicleLoading,
  selectVehicleError,
  setFilters,
  clearFilters,
  setCurrentVehicle,
} from '../../store/slices/vehicleSlice';