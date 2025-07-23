import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { 
  handleError, 
  safeAsync, 
  withRetry, 
  globalCircuitBreaker,
  ErrorAnalytics,
  ErrorType,
  createError
} from '../utils/errorHandler';
import ErrorDisplay from '../components/ErrorDisplay';
import { colors, spacing } from '../styles/theme';

/**
 * Comprehensive Error Handling Example
 * Demonstrates all error handling patterns in action
 */
export const ErrorHandlingExample: React.FC = () => {
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  // Clear previous results and errors
  const clearState = useCallback(() => {
    setError(null);
    setResults([]);
  }, []);

  // Example 1: Basic error handling with user-friendly messages
  const handleBasicError = useCallback(async () => {
    clearState();
    setLoading(true);

    try {
      // Simulate API call that fails
      throw new Error('Network connection failed');
    } catch (err) {
      const appError = handleError(err, 'ErrorHandlingExample.handleBasicError', {
        showAlert: false // We'll show it in the component instead
      });
      setError(appError);
    } finally {
      setLoading(false);
    }
  }, [clearState]);

  // Example 2: Safe async wrapper
  const handleSafeAsync = useCallback(async () => {
    clearState();
    setLoading(true);

    const safeOperation = safeAsync(
      async () => {
        // Simulate random success/failure
        if (Math.random() > 0.5) {
          throw createError(ErrorType.SERVER, 'Server temporarily unavailable');
        }
        return 'Safe async operation completed successfully!';
      },
      'ErrorHandlingExample.handleSafeAsync',
      {
        defaultValue: 'Operation failed, but app continues normally',
        onError: (error) => {
          setResults(prev => [...prev, `Error caught: ${error.message}`]);
        }
      }
    );

    const result = await safeOperation();
    setResults(prev => [...prev, result || 'No result']);
    setLoading(false);
  }, [clearState]);

  // Example 3: Retry with exponential backoff
  const handleRetryExample = useCallback(async () => {
    clearState();
    setLoading(true);

    try {
      let attemptCount = 0;
      
      const result = await withRetry(
        async () => {
          attemptCount++;
          setResults(prev => [...prev, `Attempt ${attemptCount}`]);
          
          // Fail first 2 attempts, succeed on 3rd
          if (attemptCount < 3) {
            throw createError(ErrorType.NETWORK, `Network error on attempt ${attemptCount}`);
          }
          
          return `Success on attempt ${attemptCount}!`;
        },
        {
          maxRetries: 3,
          delay: 500,
          backoffMultiplier: 2,
          context: 'ErrorHandlingExample.handleRetryExample'
        }
      );

      setResults(prev => [...prev, result]);
    } catch (err) {
      const appError = handleError(err, 'ErrorHandlingExample.handleRetryExample', {
        showAlert: false
      });
      setError(appError);
    } finally {
      setLoading(false);
    }
  }, [clearState]);

  // Example 4: Circuit breaker pattern
  const handleCircuitBreakerExample = useCallback(async () => {
    clearState();
    setLoading(true);

    try {
      const result = await globalCircuitBreaker.execute(
        async () => {
          // Simulate service that fails randomly
          if (Math.random() > 0.3) {
            throw new Error('Service unavailable');
          }
          return 'Circuit breaker operation successful!';
        },
        'ErrorHandlingExample.handleCircuitBreakerExample'
      );

      setResults(prev => [...prev, result]);
      
      // Show circuit breaker state
      const state = globalCircuitBreaker.getState();
      setResults(prev => [...prev, `Circuit breaker state: ${state.state} (failures: ${state.failures})`]);
      
    } catch (err) {
      const appError = handleError(err, 'ErrorHandlingExample.handleCircuitBreakerExample', {
        showAlert: false
      });
      setError(appError);
      
      // Show circuit breaker state even on error
      const state = globalCircuitBreaker.getState();
      setResults(prev => [...prev, `Circuit breaker state: ${state.state} (failures: ${state.failures})`]);
    } finally {
      setLoading(false);
    }
  }, [clearState]);

  // Example 5: Error analytics
  const handleErrorAnalytics = useCallback(() => {
    clearState();
    
    // Generate some sample errors for analytics
    const errors = [
      createError(ErrorType.NETWORK, 'Connection timeout'),
      createError(ErrorType.VALIDATION, 'Invalid email format'),
      createError(ErrorType.SERVER, 'Internal server error'),
      createError(ErrorType.AUTHENTICATION, 'Token expired')
    ];

    errors.forEach((error, index) => {
      ErrorAnalytics.logError(error, `Example${index + 1}`);
    });

    // Get and display error stats
    const stats = ErrorAnalytics.getErrorStats();
    const statsArray = Object.entries(stats).map(([key, count]) => `${key}: ${count}`);
    
    setResults([
      'Error analytics logged:',
      ...statsArray,
      '',
      'Check browser console for detailed error logs'
    ]);
  }, [clearState]);

  // Clear error analytics
  const clearAnalytics = useCallback(() => {
    ErrorAnalytics.clearErrorStats();
    setResults(prev => [...prev, 'Error analytics cleared']);
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Error Handling Patterns Demo</Text>
      
      <Text style={styles.description}>
        This demo showcases comprehensive error handling patterns including 
        basic error handling, safe async operations, retry logic with exponential 
        backoff, circuit breaker pattern, and error analytics.
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={handleBasicError}
          disabled={loading}
        >
          <Text style={styles.buttonText}>1. Basic Error Handling</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={handleSafeAsync}
          disabled={loading}
        >
          <Text style={styles.buttonText}>2. Safe Async Wrapper</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={handleRetryExample}
          disabled={loading}
        >
          <Text style={styles.buttonText}>3. Retry with Backoff</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={handleCircuitBreakerExample}
          disabled={loading}
        >
          <Text style={styles.buttonText}>4. Circuit Breaker</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={handleErrorAnalytics}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>5. Error Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={clearAnalytics}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>Clear Analytics</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

      {error && (
        <ErrorDisplay
          error={error}
          onRetry={() => setError(null)}
          onDismiss={() => setError(null)}
          showDetails={true}
        />
      )}

      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Results:</Text>
          {results.map((result, index) => (
            <Text key={index} style={styles.resultText}>
              {result}
            </Text>
          ))}
        </View>
      )}

      <TouchableOpacity 
        style={[styles.button, styles.clearButton]} 
        onPress={clearState}
      >
        <Text style={styles.clearButtonText}>Clear All</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24, // typography.sizes.xl equivalent
    fontWeight: '700' as const, // typography.weights.bold equivalent
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center' as const,
  },
  description: {
    fontSize: 16, // typography.sizes.md equivalent
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
    textAlign: 'center' as const,
  },
  buttonContainer: {
    marginBottom: spacing.lg,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearButton: {
    backgroundColor: colors.error,
    marginTop: spacing.lg,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16, // typography.sizes.md equivalent
    fontWeight: '500' as const, // typography.weights.medium equivalent
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16, // typography.sizes.md equivalent
    fontWeight: '500' as const, // typography.weights.medium equivalent
  },
  clearButtonText: {
    color: colors.white,
    fontSize: 16, // typography.sizes.md equivalent
    fontWeight: '500' as const, // typography.weights.medium equivalent
  },
  loadingContainer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16, // typography.sizes.md equivalent
    color: colors.textSecondary,
  },
  resultsContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  resultsTitle: {
    fontSize: 18, // typography.sizes.lg equivalent
    fontWeight: '600' as const, // typography.weights.semibold equivalent
    color: colors.text,
    marginBottom: spacing.sm,
  },
  resultText: {
    fontSize: 12, // typography.sizes.sm equivalent
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontFamily: 'monospace',
  },
});

export default ErrorHandlingExample;
