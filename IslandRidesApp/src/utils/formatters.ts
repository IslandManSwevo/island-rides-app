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

/**
 * Formats a date string to a localized date format
 * @param dateString - The date string to format
 * @returns Formatted date string or fallback for invalid inputs
 */
export const formatDate = (dateString?: string): string => {
  // Explicit type checking for input
  if (typeof dateString !== 'string' || dateString.trim() === '') {
    return 'N/A';
  }
  
  try {
    const date = new Date(dateString);
    
    // Validate the date object after creation
    if (isNaN(date.getTime()) || !isFinite(date.getTime())) {
      console.warn('Invalid date string provided to formatDate:', dateString);
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Error formatting date string:', dateString, error);
    return 'Invalid Date';
  }
};

/**
 * Formats a number with thousands separators using Intl.NumberFormat
 * for consistent cross-platform behavior in React Native
 * @param value - The number to format
 * @param locale - The locale to use for formatting (defaults to 'en-US')
 * @returns Formatted number string with thousands separators
 */
export const formatNumber = (
  value: number,
  locale: string = 'en-US'
): string => {
  // Input validation
  if (value == null || !Number.isFinite(value)) {
    return '0';
  }

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Returns a word with the correct pluralization based on count
 * @param count - The count to determine pluralization
 * @param singular - The singular form of the word
 * @param plural - The plural form of the word (optional, defaults to singular + 's')
 * @returns The correctly pluralized word based on the count
 */
export const pluralize = (count: number, singular: string, plural?: string): string => {
  const pluralForm = plural || `${singular}s`;
  return count === 1 ? singular : pluralForm;
};

/**
 * Returns a count followed by a correctly pluralized word
 * @param count - The count to display and determine pluralization
 * @param singular - The singular form of the word
 * @param plural - The plural form of the word (optional, defaults to singular + 's')
 * @returns A string with the count and correctly pluralized word
 */
export const formatCountWithWord = (count: number, singular: string, plural?: string): string => {
  return `${count} ${pluralize(count, singular, plural)}`;
};