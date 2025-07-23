import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, typography, spacing } from '../../styles/theme';

export interface ErrorState {
  message: string;
  code?: string;
  type?: 'network' | 'validation' | 'authentication' | 'server' | 'unknown';
  retryable?: boolean;
  timestamp?: number;
}

interface ErrorStateDisplayProps {
  error: ErrorState | string | null;
  loading?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
  showTimestamp?: boolean;
  retryText?: string;
  emptyStateText?: string;
  emptyStateIcon?: string;
}

/**
 * Reusable Error State Display Component
 * 
 * Displays error states consistently across the application with:
 * - Support for different error types with appropriate styling
 * - Retry functionality for retryable errors
 * - Compact mode for inline error display
 * - Loading state integration
 * - Empty state handling
 */
export const ErrorStateDisplay: React.FC<ErrorStateDisplayProps> = ({
  error,
  loading = false,
  onRetry,
  onDismiss,
  compact = false,
  showTimestamp = false,
  retryText = 'Try Again',
  emptyStateText = 'No data available',
  emptyStateIcon = '📭',
}) => {
  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // No error and no loading - could be empty state
  if (!error) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <Text style={styles.emptyIcon}>{emptyStateIcon}</Text>
        <Text style={styles.emptyText}>{emptyStateText}</Text>
      </View>
    );
  }

  // Parse error
  const errorObj: ErrorState = typeof error === 'string' 
    ? { message: error, type: 'unknown' }
    : error;

  const getErrorIcon = (type?: string): string => {
    switch (type) {
      case 'network':
        return '📡';
      case 'authentication':
        return '🔐';
      case 'validation':
        return '⚠️';
      case 'server':
        return '🔧';
      default:
        return '❌';
    }
  };

  const getErrorColor = (type?: string): string => {
    switch (type) {
      case 'network':
        return colors.warning;
      case 'authentication':
        return colors.error;
      case 'validation':
        return colors.warning;
      case 'server':
        return colors.error;
      default:
        return colors.error;
    }
  };

  const formatTimestamp = (timestamp?: number): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const errorColor = getErrorColor(errorObj.type);
  const errorIcon = getErrorIcon(errorObj.type);

  if (compact) {
    return (
      <View style={[styles.compactError, { borderLeftColor: errorColor }]}>
        <Text style={styles.compactIcon}>{errorIcon}</Text>
        <View style={styles.compactContent}>
          <Text style={styles.compactMessage}>{errorObj.message}</Text>
          {showTimestamp && errorObj.timestamp && (
            <Text style={styles.compactTimestamp}>
              {formatTimestamp(errorObj.timestamp)}
            </Text>
          )}
        </View>
        <View style={styles.compactActions}>
          {onRetry && errorObj.retryable !== false && (
            <TouchableOpacity onPress={onRetry} style={styles.compactRetryButton}>
              <Text style={styles.compactRetryText}>Retry</Text>
            </TouchableOpacity>
          )}
          {onDismiss && (
            <TouchableOpacity onPress={onDismiss} style={styles.compactDismissButton}>
              <Text style={styles.compactDismissText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.errorContainer, { borderColor: errorColor }]}>
      <View style={styles.errorHeader}>
        <Text style={styles.errorIcon}>{errorIcon}</Text>
        <View style={styles.errorHeaderText}>
          <Text style={[styles.errorTitle, { color: errorColor }]}>
            {errorObj.type ? `${errorObj.type.charAt(0).toUpperCase() + errorObj.type.slice(1)} Error` : 'Error'}
          </Text>
          {errorObj.code && (
            <Text style={styles.errorCode}>Code: {errorObj.code}</Text>
          )}
        </View>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.errorMessage}>{errorObj.message}</Text>

      {showTimestamp && errorObj.timestamp && (
        <Text style={styles.timestamp}>
          Occurred at {formatTimestamp(errorObj.timestamp)}
        </Text>
      )}

      <View style={styles.errorActions}>
        {onRetry && errorObj.retryable !== false && (
          <TouchableOpacity 
            onPress={onRetry} 
            style={[styles.actionButton, styles.retryButton]}
          >
            <Text style={styles.retryButtonText}>{retryText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  compactContainer: {
    flex: 0,
    padding: spacing.md,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  compactError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderRadius: 4,
    padding: spacing.sm,
    marginVertical: spacing.xs,
  },
  compactIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  compactContent: {
    flex: 1,
  },
  compactMessage: {
    fontSize: typography.caption.fontSize,
    color: colors.text,
  },
  compactTimestamp: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  compactActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactRetryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  compactRetryText: {
    color: colors.white,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  compactDismissButton: {
    padding: spacing.xs,
  },
  compactDismissText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    margin: spacing.sm,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  errorIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  errorHeaderText: {
    flex: 1,
  },
  errorTitle: {
    fontSize: typography.subtitle.fontSize,
    fontWeight: typography.subtitle.fontWeight,
  },
  errorCode: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dismissButton: {
    padding: spacing.xs,
  },
  dismissText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  errorMessage: {
    fontSize: typography.body.fontSize,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  timestamp: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    marginLeft: spacing.sm,
  },
  retryButton: {
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: typography.button.fontSize,
    fontWeight: typography.button.fontWeight,
  },
});

export default ErrorStateDisplay;
