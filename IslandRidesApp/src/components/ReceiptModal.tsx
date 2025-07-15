import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../styles/Theme';
import { receiptService, Receipt } from '../services/receiptService';
import { notificationService } from '../services/notificationService';

interface ReceiptModalProps {
  visible: boolean;
  bookingId: number;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  visible,
  bookingId,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (visible && bookingId) {
      loadReceipt();
    }
  }, [visible, bookingId]);

  const loadReceipt = async () => {
    setLoading(true);
    try {
      const receiptData = await receiptService.getReceipt(bookingId);
      setReceipt(receiptData);
    } catch (error) {
      notificationService.error('Failed to load receipt');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!receipt) return;
    
    setActionLoading('share');
    try {
      await receiptService.shareReceipt(receipt);
    } catch (error) {
      // Error handling is done in the service
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = async () => {
    if (!receipt) return;
    
    setActionLoading('download');
    try {
      await receiptService.downloadReceipt(receipt);
    } catch (error) {
      // Error handling is done in the service
    } finally {
      setActionLoading(null);
    }
  };

  const handlePrint = async () => {
    if (!receipt) return;
    
    setActionLoading('print');
    try {
      await receiptService.printReceipt(receipt);
    } catch (error) {
      // Error handling is done in the service
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Receipt</Text>
          <View style={styles.placeholder} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading receipt...</Text>
          </View>
        ) : receipt ? (
          <>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Company Header */}
              <View style={styles.companySection}>
                <Text style={styles.companyName}>{receipt.company.name}</Text>
                <Text style={styles.companyAddress}>{receipt.company.address}</Text>
                <Text style={styles.companyContact}>
                  {receipt.company.phone} • {receipt.company.email}
                </Text>
              </View>

              {/* Receipt Info */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Receipt Information</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Receipt #:</Text>
                  <Text style={styles.value}>#{receipt.booking.id.toString().padStart(6, '0')}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Transaction ID:</Text>
                  <Text style={styles.value}>{receipt.payment.transactionId || 'N/A'}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Payment Date:</Text>
                  <Text style={styles.value}>
                    {formatDate(receipt.payment.date || receipt.booking.createdAt)}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Payment Method:</Text>
                  <Text style={styles.value}>{receipt.payment.method || 'Transfi'}</Text>
                </View>
              </View>

              {/* Customer Info */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Customer Information</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Name:</Text>
                  <Text style={styles.value}>
                    {receipt.customer.firstName} {receipt.customer.lastName}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Email:</Text>
                  <Text style={styles.value}>{receipt.customer.email}</Text>
                </View>
              </View>

              {/* Vehicle Info */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Vehicle & Rental Details</Text>
                <View style={styles.vehicleCard}>
                  <Text style={styles.vehicleName}>
                    {receipt.vehicle.make} {receipt.vehicle.model} {receipt.vehicle.year}
                  </Text>
                  <Text style={styles.vehicleLocation}>📍 {receipt.vehicle.location}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Rental Start:</Text>
                  <Text style={styles.value}>{formatDate(receipt.booking.startDate)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Rental End:</Text>
                  <Text style={styles.value}>{formatDate(receipt.booking.endDate)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Duration:</Text>
                  <Text style={styles.value}>
                    {receipt.booking.duration} day{receipt.booking.duration !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Daily Rate:</Text>
                  <Text style={styles.value}>{formatCurrency(receipt.vehicle.dailyRate)}</Text>
                </View>
              </View>

              {/* Payment Summary */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Summary</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>
                    Subtotal ({receipt.booking.duration} × {formatCurrency(receipt.vehicle.dailyRate)}):
                  </Text>
                  <Text style={styles.value}>
                    {formatCurrency(receipt.booking.duration * receipt.vehicle.dailyRate)}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Paid:</Text>
                  <Text style={styles.totalValue}>{formatCurrency(receipt.booking.totalAmount)}</Text>
                </View>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Thank you for choosing {receipt.company.name}!</Text>
                <Text style={styles.footerContact}>
                  Questions? Contact us at {receipt.company.email}
                </Text>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}
                disabled={actionLoading === 'share'}
              >
                {actionLoading === 'share' ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="share-outline" size={20} color={colors.primary} />
                )}
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDownload}
                disabled={actionLoading === 'download'}
              >
                {actionLoading === 'download' ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="download-outline" size={20} color={colors.primary} />
                )}
                <Text style={styles.actionText}>Download</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handlePrint}
                disabled={actionLoading === 'print'}
              >
                {actionLoading === 'print' ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="print-outline" size={20} color={colors.primary} />
                )}
                <Text style={styles.actionText}>Print</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  closeButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.heading1,
    fontSize: 18,
  },
  placeholder: {
    width: 40,
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
  content: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  companySection: {
    backgroundColor: colors.primary,
    padding: spacing.xl,
    alignItems: 'center',
  },
  companyName: {
    ...typography.heading1,
    color: colors.white,
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  companyAddress: {
    ...typography.body,
    color: colors.white,
    opacity: 0.9,
  },
  companyContact: {
    ...typography.body,
    color: colors.white,
    opacity: 0.9,
    fontSize: 12,
  },
  section: {
    backgroundColor: colors.white,
    margin: spacing.md,
    marginBottom: 0,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.body,
    color: colors.lightGrey,
    flex: 1,
  },
  value: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  vehicleCard: {
    backgroundColor: colors.offWhite,
    padding: spacing.lg,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  vehicleName: {
    ...typography.subheading,
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  vehicleLocation: {
    ...typography.body,
    color: colors.lightGrey,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
  },
  totalLabel: {
    ...typography.body,
    fontWeight: '700',
    fontSize: 16,
  },
  totalValue: {
    ...typography.body,
    fontWeight: '700',
    fontSize: 18,
    color: colors.primary,
  },
  footer: {
    backgroundColor: colors.white,
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  footerText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  footerContact: {
    ...typography.body,
    fontSize: 12,
    color: colors.lightGrey,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    padding: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.offWhite,
    backgroundColor: colors.white,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
  },
  actionText: {
    ...typography.body,
    color: colors.primary,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
}); 