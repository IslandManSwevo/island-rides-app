import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { receiptService, PaymentHistory } from '../services/receiptService';
import { ReceiptModal } from '../components/ReceiptModal';
import { notificationService } from '../services/notificationService';
import { AppHeader } from '../components/AppHeader';

interface PaymentHistoryScreenProps {
  navigation: any;
}

export const PaymentHistoryScreen: React.FC<PaymentHistoryScreenProps> = ({ navigation }) => {
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const response = await receiptService.getPaymentHistory(1, 20);
      setPayments(response.payments);
    } catch (error) {
      notificationService.error('Failed to load payment history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPaymentHistory(false);
  };

  const handleViewReceipt = (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setShowReceipt(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'card':
        return 'card-outline';
      case 'bank_transfer':
        return 'business-outline';
      case 'crypto':
        return 'logo-bitcoin';
      default:
        return 'wallet-outline';
    }
  };

  const renderPaymentItem = ({ item }: { item: PaymentHistory }) => (
    <TouchableOpacity
      style={styles.paymentCard}
      onPress={() => handleViewReceipt(item.bookingId)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>
            {item.make} {item.model} {item.year}
          </Text>
          <Text style={styles.bookingId}>Booking #{item.bookingId}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>{formatCurrency(item.totalAmount)}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.lightGrey} />
            <Text style={styles.detailText}>
              {formatDate(item.startDate)} - {formatDate(item.endDate)}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons 
              name={getPaymentMethodIcon(item.paymentMethod) as any} 
              size={16} 
              color={colors.lightGrey} 
            />
            <Text style={styles.detailText}>
              {item.paymentMethod || 'Transfi'} • {formatDate(item.paymentDate)}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.receiptButton}
            onPress={() => handleViewReceipt(item.bookingId)}
          >
            <Ionicons name="receipt-outline" size={16} color={colors.primary} />
            <Text style={styles.receiptButtonText}>Receipt</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color={colors.lightGrey} />
      <Text style={styles.emptyTitle}>No Payment History</Text>
      <Text style={styles.emptyMessage}>
        Your completed bookings and payment receipts will appear here.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Payment History" navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading payment history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Payment History" navigation={navigation} />
      
      <FlatList
        data={payments}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item.bookingId.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {selectedBookingId && (
        <ReceiptModal
          visible={showReceipt}
          bookingId={selectedBookingId}
          onClose={() => {
            setShowReceipt(false);
            setSelectedBookingId(null);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
    color: colors.lightGrey,
  },
  listContainer: {
    padding: spacing.md,
  },
  paymentCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    ...typography.subheading,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  bookingId: {
    ...typography.body,
    fontSize: 12,
    color: colors.lightGrey,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    ...typography.body,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statusBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...typography.body,
    fontSize: 10,
    color: colors.white,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardBody: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    ...typography.body,
    fontSize: 12,
    color: colors.lightGrey,
    marginLeft: spacing.xs,
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  receiptButtonText: {
    ...typography.body,
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
  },
  emptyTitle: {
    ...typography.heading1,
    fontSize: 20,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    ...typography.body,
    textAlign: 'center',
    color: colors.lightGrey,
    lineHeight: 22,
  },
}); 