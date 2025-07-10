export const calculateDays = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) {
    return 0;
  }
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Check for invalid dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.warn('Invalid date provided to calculateDays');
    return 0;
  }

  // Normalize dates to midnight to avoid timezone issues
  const startOfDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (endOfDay < startOfDay) {
    console.warn('End date is before start date in calculateDays');
    return 0;
  }

  const diffTime = endOfDay.getTime() - startOfDay.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // Rental period is inclusive, so add 1
  return diffDays + 1;
};