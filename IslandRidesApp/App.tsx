import React, { useEffect, useState } from 'react';
import { DevSettings, View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import NotificationContainer from './src/components/NotificationContainer';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { notificationService } from './src/services/notificationService';
import { serviceRegistry } from './src/services/ServiceRegistry';
import { loggingService } from './src/services/LoggingService';
import { navigationRef } from './src/navigation/navigationRef';
import { reviewPromptService } from './src/services/reviewPromptService';
import runSetupTests from './src/utils/setupTest';
import Constants from 'expo-constants';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [initProgress, setInitProgress] = useState('Starting...');

  const initializeApp = async () => {
    try {
      console.log('Starting app initialization...');
      setInitProgress('Initializing services...');
      
      // Initialize core services first
      await serviceRegistry.initializeServices();
      console.log('Service registry initialized successfully');
      
      setInitProgress('Setting up notifications...');
      
      // Only register for push notifications if not in Expo Go
      const isExpoGo = Constants.appOwnership === 'expo';
      if (!isExpoGo) {
        try {
          await notificationService.registerForPushNotifications();
        } catch (error) {
          console.warn('Push notification registration failed:', error);
        }
      }

      setInitProgress('Initializing review system...');
      
      // Initialize review prompt service (non-blocking)
      try {
        await reviewPromptService.initialize();
      } catch (error) {
        console.warn('Review prompt service initialization failed:', error);
      }

      setInitProgress('Finalizing...');

      // Run setup tests in development mode
      if (__DEV__) {
        setInitProgress('Running setup verification...');
        try {
          await runSetupTests();
        } catch (error) {
          console.warn('Setup tests failed (non-critical):', error);
        }
      }
      
      setIsInitialized(true);
      console.log('App initialized successfully');

      // Show welcome message
      setTimeout(() => {
        notificationService.info('Welcome to Island Rides! 🏝️', {
          duration: 3000,
          action: {
            label: 'Get Started',
            handler: () => {
              // Navigation will be handled by AppNavigator
            }
          }
        });
      }, 1000);
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setInitError(error instanceof Error ? error.message : 'Unknown initialization error');
      
      // Try to log the error if logging service is available
      try {
        loggingService.error('Failed to initialize app', error as Error);
      } catch (logError) {
        console.warn('Failed to log error:', logError);
      }
    }
  };

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        notificationService.setupNotificationListeners(navigationRef);
      } catch (error) {
        console.warn('Failed to setup notification listeners:', error);
      }
    }
  }, [isInitialized]);

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('App Error:', error, errorInfo);
    try {
      notificationService.error('An unexpected error occurred', {
        title: 'Application Error',
        duration: 5000
      });
    } catch (notifError) {
      console.warn('Failed to show error notification:', notifError);
    }
  };

  const handleRetry = () => {
    setInitError(null);
    setIsInitialized(false);
    setInitProgress('Restarting...');
    
    // Use DevSettings.reload() for development
    if (__DEV__) {
      DevSettings.reload();
    } else {
      // For production, just re-initialize
      setTimeout(() => {
        setInitProgress('Starting...');
        initializeApp();
      }, 500);
    }
  };

  if (initError) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Initialization Error</Text>
          <Text style={styles.errorMessage}>{initError}</Text>
          <Text style={styles.retryButton} onPress={handleRetry}>
            Tap to Retry
          </Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary onError={handleError}>
        {!isInitialized ? (
          <SafeAreaView style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading Island Rides...</Text>
            <Text style={styles.progressText}>{initProgress}</Text>
          </SafeAreaView>
        ) : (
          <NavigationContainer ref={navigationRef}>
            <AuthProvider>
              <NotificationContainer />
              <AppNavigator />
            </AuthProvider>
          </NavigationContainer>
        )}
      </ErrorBoundary>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    padding: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
  },
});

export default App;