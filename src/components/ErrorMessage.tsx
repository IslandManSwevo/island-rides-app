import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import Theme from '../styles/theme';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  style?: ViewStyle;
  retryText?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  style,
  retryText = 'Try Again',
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: Theme.typography.body.fontSize,
    color: Theme.colors.error,
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
  },
  retryButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
  },
  retryText: {
    color: Theme.colors.white,
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '600',
  },
});

export default ErrorMessage;