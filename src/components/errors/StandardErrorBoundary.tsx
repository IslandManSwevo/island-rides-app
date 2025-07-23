import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '../../styles/theme';
import { ErrorHandlingService } from '../../services/errors/ErrorHandlingService';
import { loggingService } from '../../services/LoggingService';
import { notificationService } from '../../services/notificationService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
  context?: string;
  showNotification?: boolean;
  enableRetry?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

/**
 * Standardized Error Boundary Component
 * 
 * Provides consistent error handling across the application with:
 * - Automatic error logging and tracking
 * - User-friendly error display
 * - Retry functionality
 * - Context-aware error handling
 * - Integration with notification system
 */
export class StandardErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });

    const context = this.props.context || 'StandardErrorBoundary';
    
    // Create structured error using ErrorHandlingService
    const appError = ErrorHandlingService.handleApiError(error);
    
    // Log error with context
    ErrorHandlingService.logError(appError, context, {
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
    });

    // Log to logging service
    loggingService.error(`Error boundary caught error in ${context}`, error, {
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
    });

    // Show notification if enabled
    if (this.props.showNotification !== false) {
      notificationService.error('An unexpected error occurred', {
        title: 'Application Error',
        duration: 5000,
        closable: true,
      });
    }

    // Call onError callback if provided
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = (): void => {
    const newRetryCount = this.state.retryCount + 1;
    
    if (newRetryCount <= this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: newRetryCount,
      });
      
      this.props.onReset?.();
      
      // Log retry attempt
      loggingService.info(`Error boundary retry attempt ${newRetryCount}`, {
        context: this.props.context,
        maxRetries: this.maxRetries,
      });
    } else {
      // Max retries reached, show persistent error
      notificationService.error('Maximum retry attempts reached', {
        title: 'Persistent Error',
        duration: 0,
        closable: true,
        action: {
          label: 'Contact Support',
          handler: this.handleContactSupport,
        },
      });
    }
  };

  private handleContactSupport = (): void => {
    // This could open a support form, email client, or chat
    console.log('Contact support requested');
  };

  private getErrorMessage(): string {
    const { error } = this.state;
    
    if (!error) return 'An unexpected error occurred';
    
    // Use ErrorHandlingService to get user-friendly message
    const appError = ErrorHandlingService.handleApiError(error);
    return appError.userMessage || error.message || 'An unexpected error occurred';
  }

  private canRetry(): boolean {
    return (
      this.props.enableRetry !== false && 
      this.state.retryCount < this.maxRetries
    );
  }

  override render(): ReactNode {
    const { hasError } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) {
      return children;
    }

    // Use custom fallback if provided
    if (fallback) {
      return fallback;
    }

    // Default error UI
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.getErrorMessage()}</Text>
          
          {this.canRetry() && (
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={this.handleRetry}
            >
              <Text style={styles.retryButtonText}>
                Try Again ({this.maxRetries - this.state.retryCount} attempts left)
              </Text>
            </TouchableOpacity>
          )}
          
          <Text style={styles.supportText}>
            If this problem persists, please contact support.
          </Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.heading2.fontSize,
    fontWeight: typography.heading2.fontWeight,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: typography.button.fontSize,
    fontWeight: typography.button.fontWeight,
    textAlign: 'center',
  },
  supportText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default StandardErrorBoundary;
