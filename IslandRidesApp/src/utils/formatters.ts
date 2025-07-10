export const formatCurrency = (
  amount: number,
  locale: string = 'en-US',
  currency: string = 'USD'
): string => {
  // Input validation
  if (amount == null || !Number.isFinite(amount)) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(0);
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Formats a percentage value as a string with one decimal place
 * @param percentage - A whole percentage value (0-100), e.g., 25 for 25%
 * @returns Formatted percentage string, e.g., "25.0%"
 */
export const formatPercentage = (percentage: number): string => {
  // Input validation
  if (percentage == null || !Number.isFinite(percentage)) {
    return '0.0%';
  }

  // Clamp percentage to valid range (0-100)
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  
  return `${clampedPercentage.toFixed(1)}%`;
};

export const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Invalid date string provided to formatDate:', dateString);
    return 'Invalid Date';
  }
};