import React, { useEffect, useState } from 'react';
import { DevSettings } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import NotificationContainer from './src/components/NotificationContainer';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { notificationService } from './src/services/notificationService';
import { storageService } from './src/services/storageService';
import { webSocketService } from './src/services/webSocketService';
import { serviceRegistry } from './src/services/ServiceRegistry';
import { loggingService } from './src/services/LoggingService';
import { navigationRef } from './src/navigation/navigationRef';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await serviceRegistry.initializeServices();
        setIsInitialized(true);

        // Register for push notifications
        await notificationService.registerForPushNotifications();

        notificationService.info('Welcome to Island Rides! 🏝️', {
          duration: 3000,
          action: {
            label: 'Get Started',
            handler: () => {
              // Navigation will be handled by AppNavigator
            }
          }
        });
      } catch (error) {
        loggingService.error('Failed to initialize app', error as Error);
        notificationService.error('Failed to initialize application', {
          persistent: true,
          action: {
            label: 'Retry',
            handler: () => DevSettings.reload()
          }
        });
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    notificationService.setupNotificationListeners(navigationRef);
  }, []);

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('App Error:', error, errorInfo);
    notificationService.error('An unexpected error occurred', {
      title: 'Application Error',
      duration: 5000
    });
  };

  if (!isInitialized) {
    return null; // Or a loading screen component
  }

  return (
    <ErrorBoundary onError={handleError}>
      <NavigationContainer ref={navigationRef}>
        <AuthProvider>
          <NotificationContainer />
          <AppNavigator />
        </AuthProvider>
      </NavigationContainer>
    </ErrorBoundary>
  );
};

export default App;