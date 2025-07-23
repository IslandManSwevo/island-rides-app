import React, { useEffect, useState } from 'react';
import { Platform, Alert, DevSettings, View, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ReduxProvider } from './src/store/provider';
import { AuthProvider } from './src/context/AuthContext';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { linking } from './src/navigation/linking';
import { navigationPersistence } from './src/navigation/navigationPersistence';
import { onNavigationStateChange } from './src/navigation/navigationAccessibility';
import { apiService } from './src/services/apiService';
import { useAuth } from './src/context/AuthContext';
import NotificationContainer from './src/components/NotificationContainer';
import ErrorBoundary from './src/components/ErrorBoundary';
import { notificationService } from './src/services/notificationService';
import { navigationRef } from './src/navigation/navigationRef';
import Constants from 'expo-constants';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { gluestackUIConfig } from './src/config/gluestackTheme';

// Debug component that has access to AuthContext
const DebugClearButton = () => {
  const { logout } = useAuth();

  const handleClearAuth = async () => {
    try {
      console.log('🧹 DEBUG: Clear Auth button clicked!');
      console.log('🧹 Clearing authentication tokens and state...');
      
      // Clear AuthContext state first
      await logout();
      console.log('🧹 AuthContext state cleared');
      
      // Clear API service tokens
      await apiService.clearToken();
      
      // Clear localStorage/AsyncStorage for web
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        console.log('🧹 Clearing localStorage...');
        localStorage.clear();
      }
      
      // Clear AsyncStorage completely
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.clear();
        console.log('🧹 AsyncStorage cleared');
      } catch (storageError) {
        console.log('🧹 AsyncStorage not available, using localStorage fallback');
      }
      
      console.log('🧹 All auth data cleared successfully');
      Alert.alert('Success', 'Authentication and all stored data cleared! The app will reload.', [
        {
          text: 'OK',
          onPress: () => {
            console.log('🧹 Reloading app...');
            // Force page reload in web environment
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              window.location.reload();
            } else if (__DEV__) {
              DevSettings.reload();
            }
          }
        }
      ]);
    } catch (error) {
      console.error('🧹 Failed to clear auth:', error);
      Alert.alert('Error', 'Failed to clear authentication: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (!__DEV__) return null;

  return (
    <View style={{
      position: 'absolute',
      bottom: 50,
      right: 20,
      zIndex: 1000,
    }}>
      <TouchableOpacity 
        style={{
          backgroundColor: '#ff4444',
          paddingHorizontal: 15,
          paddingVertical: 10,
          borderRadius: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
        onPress={handleClearAuth}
      >
        <Text style={{
          color: 'white',
          fontSize: 12,
          fontWeight: 'bold',
        }}>🧹 Clear Auth (Debug)</Text>
      </TouchableOpacity>
    </View>
  );
};

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [initProgress, setInitProgress] = useState('Starting...');

  const initializeApp = async () => {
    try {
      console.log('🚀 Starting simplified app initialization...');
      setInitProgress('Initializing core services...');
      
      // Skip complex service initialization for now to get to login screen
      console.log('⚠️ Using simplified startup to bypass service initialization issues');
      
      setInitProgress('Almost ready...');
      
      // Short delay to show progress
      await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
      
      setIsInitialized(true);
      console.log('✅ App initialized successfully (simplified mode)');
      
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      setInitError(error instanceof Error ? error.message : 'Unknown initialization error');
    }
  };

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      console.log('✅ App is now ready - navigation should be working');
      // Skip notification setup for now to avoid service dependency issues
      // notificationService.setupNotificationListeners(navigationRef);
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
      <GluestackUIProvider config={gluestackUIConfig}>
        <ReduxProvider>
          <ErrorBoundary onError={handleError}>
            {!isInitialized ? (
              <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading KeyLo...</Text>
                <Text style={styles.progressText}>{initProgress}</Text>
              </SafeAreaView>
            ) : (
              <NavigationContainer
                ref={navigationRef}
                linking={linking}
                onReady={() => {
                  console.log('🧭 Navigation ready with deep linking');
                }}
                onStateChange={(state) => {
                  console.log('🧭 Navigation state changed:', state);
                  // Save navigation state for persistence
                  if (state) {
                    navigationPersistence.saveState(state);
                  }
                  // Handle accessibility announcements
                  onNavigationStateChange(state);
                }}
              >
                <AuthProvider>
                  <NotificationContainer />
                  <DebugClearButton />
                  <AppNavigator />
                </AuthProvider>
              </NavigationContainer>
            )}
          </ErrorBoundary>
        </ReduxProvider>
      </GluestackUIProvider>
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
