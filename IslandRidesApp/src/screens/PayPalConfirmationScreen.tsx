import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { colors, typography, spacing } from '../styles/theme';
import { RootStackParamList } from '../navigation/routes';

type PayPalConfirmationScreenProps = StackScreenProps<RootStackParamList, 'PayPalConfirmation'>;

export const PayPalConfirmationScreen: React.FC<PayPalConfirmationScreenProps> = ({ route, navigation }) => {
  const { orderId, booking } = route.params;
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    capturePayPalPayment();
  }, []);

  const capturePayPalPayment = async () => {
    try {
      setLoading(true);
      const response = await apiService.post('/payments/paypal/capture', {
        orderId
      });

      if ((response as any).success) {
        setSuccess(true);
        notificationService.success('Payment successful!', {
          duration: 5000
        });
        
        // Navigate to booking confirmation after a short delay
        setTimeout(() => {
          const transformedBooking = {
            id: booking.id,
            start_date: booking.startDate,
            end_date: booking.endDate,
            status: 'confirmed',
            total_amount: booking.totalAmount,
            vehicle: {
              id: booking.vehicle.id,
              make: booking.vehicle.make,
              model: booking.vehicle.model,
              year: booking.vehicle.year,
              location: booking.vehicle.location,
              daily_rate: booking.vehicle.dailyRate
            }
          };
          
          navigation.replace('BookingConfirmed', { 
            booking: transformedBooking,
            vehicle: {
              id: booking.vehicle.id,
              make: booking.vehicle.make,
              model: booking.vehicle.model,
              year: booking.vehicle.year,
              ownerId: 0,
              location: booking.vehicle.location,
              dailyRate: booking.vehicle.dailyRate,
              available: true,
              driveSide: 'LHD' as const,
              createdAt: new Date().toISOString()
            }
          });
        }, 2000);
      } else {
        throw new Error('Payment capture failed');
      }
    } catch (error) {
      console.error('PayPal capture error:', error);
      setError('Payment verification failed. Please contact support.');
      notificationService.error('Payment verification failed', {
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    capturePayPalPayment();
  };

  const handleGoBack = () => {
    Alert.alert(
      'Cancel Payment Verification',
      'Are you sure you want to go back? Your payment may still be processing.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Go Back', style: 'destructive', onPress: () => navigation.goBack() }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {loading && (
          <>
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            <Text style={styles.title}>Verifying Payment</Text>
            <Text style={styles.subtitle}>
              Please wait while we confirm your PayPal payment...
            </Text>
          </>
        )}

        {success && (
          <>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color={colors.success} />
            </View>
            <Text style={styles.title}>Payment Successful!</Text>
            <Text style={styles.subtitle}>
              Your booking has been confirmed. Redirecting you now...
            </Text>
          </>
        )}

        {error && (
          <>
            <View style={styles.errorIcon}>
              <Ionicons name="close-circle" size={80} color={colors.error} />
            </View>
            <Text style={styles.title}>Payment Verification Failed</Text>
            <Text style={styles.subtitle}>{error}</Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                <Text style={styles.backButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loader: {
    marginBottom: spacing.xl,
  },
  successIcon: {
    marginBottom: spacing.xl,
  },
  errorIcon: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.heading1,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.lightGrey,
    lineHeight: 24,
  },
  buttonContainer: {
    marginTop: spacing.xl,
    width: '100%',
  },
  retryButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  retryButtonText: {
    ...typography.subheading,
    color: colors.white,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: 'transparent',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  backButtonText: {
    ...typography.subheading,
    color: colors.darkGrey,
    textAlign: 'center',
  },
});