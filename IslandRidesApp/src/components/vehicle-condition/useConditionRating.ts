import { useState, useEffect, useCallback } from 'react';
import { vehicleService } from '../../services/vehicleService';

export const useConditionRating = (vehicleId: string) => {
  const [rating, setRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRating = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null); // Clear previous errors
      const fetchedRating = await vehicleService.getConditionRating(vehicleId);
      setRating(fetchedRating);
    } catch (error) { 
      console.error('Failed to fetch condition rating:', error);
      setError('Failed to load vehicle condition rating. Please try again.');
      setRating(null); // Clear rating on error
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    fetchRating();
  }, [fetchRating]);

  return { rating, isLoading, error, refresh: fetchRating };
};