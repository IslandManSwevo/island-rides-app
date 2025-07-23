import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppError, ErrorType } from '../utils/errorHandler';
import { colors, typography, spacing } from '../styles/theme';

interface ErrorDisplayProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  compact?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  compact = false
}) => {
  const getErrorIcon = (type: ErrorType): string => {
    switch (type) {
      case ErrorType.NETWORK:
        return '📡';
      case ErrorType.AUTHENTICATION:
        return '🔐';
      case ErrorType.AUTHORIZATION:
        return '🚫';
      case ErrorType.VALIDATION:
        return '⚠️';
      case ErrorType.NOT_FOUND:
        return '🔍';
      case ErrorType.SERVER:
        return '🔧';
      default:
        return '❌';
    }
  };

  const getErrorColor = (type: ErrorType): string => {
    switch (type) {
      case ErrorType.NETWORK:
        return colors.warning;
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return colors.info;
      case ErrorType.VALIDATION:
        return colors.warning;
      case ErrorType.SERVER:
      case ErrorType.UNKNOWN:
        return colors.error;
      default:
        return colors.error;
    }
  };

  const getUserFriendlyMessage = (error: AppError): string => {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'Please check your internet connection and try again.';
      case ErrorType.AUTHENTICATION:
        return 'Please log in to continue.';
      case ErrorType.AUTHORIZATION:
        return "You don't have permission to perform this action.";
      case ErrorType.VALIDATION:
        return error.message || 'Please check your input and try again.';
      case ErrorType.NOT_FOUND:
        return 'The requested item could not be found.';
      case ErrorType.SERVER:
        return 'Server is temporarily unavailable. Please try again later.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const errorColor = getErrorColor(error.type);
  const icon = getErrorIcon(error.type);
  const message = getUserFriendlyMessage(error);

  if (compact) {
    return (
      <View style={[styles.compactContainer, { borderLeftColor: errorColor }]}>
        <Text style={styles.compactIcon}>{icon}</Text>
        <Text style={styles.compactMessage}>{message}</Text>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.compactRetryButton}>
            <Text style={styles.compactRetryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderColor: errorColor }]}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.title, { color: errorColor }]}>
          {error.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} Error
        </Text>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.message}>{message}</Text>

      {showDetails && error.details && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Details:</Text>
          <Text style={styles.detailsText}>
            {typeof error.details === 'string' 
              ? error.details 
              : JSON.stringify(error.details, null, 2)
            }
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={[styles.button, styles.retryButton]}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
        
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={[styles.button, styles.dismissActionButton]}>
            <Text style={styles.dismissActionText}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>

      {showDetails && (
        <View style={styles.metadata}>
          <Text style={styles.metadataText}>
            Error Code: {error.code || 'UNKNOWN'}
          </Text>
          <Text style={styles.metadataText}>
            Time: {new Date(error.timestamp).toLocaleTimeString()}
          </Text>
          {error.context && (
            <Text style={styles.metadataText}>
              Context: {error.context}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md,
    margin: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    padding: spacing.sm,
    marginVertical: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  icon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  compactIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: typography.heading3.fontSize,
    fontWeight: typography.heading3.fontWeight,
  },
  message: {
    fontSize: typography.body.fontSize,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  compactMessage: {
    flex: 1,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text,
  },
  detailsContainer: {
    backgroundColor: colors.background,
    borderRadius: 4,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  detailsTitle: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: typography.bodySmall.fontWeight,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  detailsText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: typography.button.fontSize,
    fontWeight: typography.button.fontWeight,
  },
  compactRetryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  compactRetryText: {
    color: colors.white,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  dismissButton: {
    padding: spacing.xs,
  },
  dismissText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  dismissActionButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dismissActionText: {
    color: colors.text,
    fontSize: typography.button.fontSize,
    fontWeight: typography.button.fontWeight,
  },
  metadata: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metadataText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
});

export default ErrorDisplay;
