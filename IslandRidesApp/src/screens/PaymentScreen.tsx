import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { colors, typography, spacing } from '../styles/theme';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  processingTime: string;
}

interface PaymentMethodsResponse {
  methods: PaymentMethod[];
}

interface PaymentIntentResponse {
  paymentUrl?: string;
  instructions?: any;
  reference?: string;
  walletAddress?: string;
  amount?: number;
  currency?: string;
  qrCode?: string;
}

type RootStackParamList = {
  Payment: {
    booking: {
      id: number;
      total_amount: number;
      start_date: string;
      end_date: string;
      vehicle: any;
    };
  };
  BookingConfirmed: { booking: any };
  BankTransferInstructions: any;
  CryptoPayment: any;
};

type PaymentScreenProps = StackScreenProps<RootStackParamList, 'Payment'>;

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ route, navigation }) => {
  const { booking } = route.params;
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await apiService.get<PaymentMethodsResponse>('/payments/methods');
      setPaymentMethods(response.methods);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const handlePaymentMethodSelect = async (methodId: string) => {
    setSelectedMethod(methodId);
    setLoading(true);

    try {
      const response = await apiService.post<PaymentIntentResponse>('/payments/create-intent', {
        bookingId: booking.id,
        paymentMethod: methodId
      });

      if (methodId === 'card' && response.paymentUrl) {
        setPaymentUrl(response.paymentUrl);
      } else if (methodId === 'bank_transfer') {
        navigation.navigate('BankTransferInstructions', {
          instructions: response.instructions,
          reference: response.reference,
          booking
        });
      } else if (methodId === 'crypto') {
        navigation.navigate('CryptoPayment', {
          walletAddress: response.walletAddress,
          amount: response.amount,
          currency: response.currency,
          qrCode: response.qrCode,
          booking
        });
      }
    } catch (error) {
      notificationService.error('Failed to initialize payment', {
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewNavigationChange = (navState: any) => {
    if (navState.url.includes('/booking-confirmed')) {
      notificationService.success('Payment successful!', {
        duration: 5000
      });
      navigation.navigate('BookingConfirmed', { booking });
    } else if (navState.url.includes('/checkout') && navState.canGoBack) {
      setPaymentUrl(null);
      notificationService.info('Payment cancelled', {
        duration: 3000
      });
    }
  };

  if (paymentUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.webViewHeader}>
          <TouchableOpacity 
            onPress={() => setPaymentUrl(null)}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.webViewTitle}>Complete Payment</Text>
        </View>
        <WebView
          source={{ uri: paymentUrl }}
          onNavigationStateChange={handleWebViewNavigationChange}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Payment Method</Text>
        <Text style={styles.subtitle}>
          Complete your booking for {booking.vehicle.make} {booking.vehicle.model}
        </Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <Text style={styles.summaryValue}>${booking.total_amount} USD</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Rental Period</Text>
          <Text style={styles.summaryValue}>
            {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.methodsContainer}>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodCard,
              selectedMethod === method.id && styles.methodCardSelected
            ]}
            onPress={() => handlePaymentMethodSelect(method.id)}
            disabled={loading}
          >
            <Ionicons 
              name={method.icon as any} 
              size={32} 
              color={selectedMethod === method.id ? colors.primary : colors.darkGrey} 
            />
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{method.name}</Text>
              <Text style={styles.methodTime}>{method.processingTime}</Text>
            </View>
            {loading && selectedMethod === method.id && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.securityInfo}>
        <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
        <Text style={styles.securityText}>
          Your payment information is secure and encrypted
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  title: {
    ...typography.heading1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.lightGrey,
  },
  summary: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.lightGrey,
  },
  summaryValue: {
    ...typography.body,
    fontWeight: '600',
  },
  methodsContainer: {
    padding: spacing.md,
  },
  methodCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardSelected: {
    borderColor: colors.primary,
  },
  methodInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  methodName: {
    ...typography.subheading,
    marginBottom: spacing.xs,
  },
  methodTime: {
    ...typography.body,
    fontSize: 14,
    color: colors.lightGrey,
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  backButton: {
    marginRight: spacing.md,
  },
  webViewTitle: {
    ...typography.subheading,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  securityText: {
    ...typography.body,
    fontSize: 14,
    color: colors.lightGrey,
    marginLeft: spacing.sm,
  },
}); 