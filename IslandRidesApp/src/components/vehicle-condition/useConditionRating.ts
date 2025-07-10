import { useState, useEffect, useCallback } from 'react';
import { vehicleService } from '../../services/vehicleService';

export const useConditionRating = (vehicleId: string) => {
  const [rating, setRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRating = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedRating = await vehicleService.getConditionRating(vehicleId);
      setRating(fetchedRating);
    } catch (error) { 
      console.error('Failed to fetch condition rating:', error);
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    fetchRating();
  }, [fetchRating]);

  return { rating, isLoading, refresh: fetchRating };
};