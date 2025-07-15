import React, { Component, ErrorInfo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthError } from '../services/authService';
import { ApiErrorCode, ErrorBoundaryProps } from '../types';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { navigationRef } from '../navigation/navigationRef';
import { colors } from '../styles/Theme';

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRetrying: boolean;
}

export class ApiErrorBoundary extends Component<ErrorBoundaryProps, State> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      isRetrying: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log error to your error tracking service
    console.error('API Error Boundary caught an error:', error, errorInfo);
    
    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);

    if (error instanceof AuthError) {
      this.handleAuthError(error);
    }
  }

  private async handleAuthError(error: AuthError): Promise<void> {
    const code = error.code as ApiErrorCode;
    
    switch (code) {
      case 'TOKEN_EXPIRED':
        await this.handleTokenRefresh();
        break;
      
      case 'UNAUTHORIZED':
        this.redirectToLogin();
        break;
      
      case 'RATE_LIMITED':
        this.showRateLimitError(error.message);
        break;
      
      case 'MAINTENANCE_MODE':
        this.showMaintenanceMessage();
        break;
      
      default:
        this.showErrorNotification(error.message);
    }
  }

  private async handleTokenRefresh(): Promise<void> {
    try {
      this.setState({ isRetrying: true });
      await apiService.refreshToken();
      // Reset error state to retry the failed request
      this.setState({ 
        hasError: false, 
        error: null, 
        errorInfo: null,
        isRetrying: false 
      });
    } catch (error) {
      this.redirectToLogin();
    }
  }

  private async redirectToLogin(): Promise<void> {
    // Clear auth state
    await apiService.clearToken();
    
    // Use your navigation method here
    if (navigationRef.isReady()) {
      navigationRef.navigate('Login' as never);
    }
    
    // For now, just reset the error state
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  }

  private showErrorNotification(message: string): void {
    notificationService.error(message, {
      persistent: true,
      closable: true
    });
  }

  private showRateLimitError(message: string): void {
    notificationService.warning(message, {
      persistent: true,
      closable: true,
      duration: 10000
    });
  }

  private showMaintenanceMessage(): void {
    notificationService.info('System is under maintenance. Please try again later.', {
      persistent: true,
      closable: true
    });
  }

  private retry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    this.props.onReset?.();
  };

  render(): React.ReactNode {
    const { hasError, error, isRetrying } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) {
      return children;
    }

    if (fallback) {
      return fallback;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Oops! Something went wrong.</Text>
        <Text style={styles.message}>{error?.message}</Text>
        {!isRetrying && (
          <TouchableOpacity style={styles.button} onPress={this.retry}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: colors.grey,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
