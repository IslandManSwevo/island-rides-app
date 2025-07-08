import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../services/notificationService';
import { reviewPromptService } from '../services/reviewPromptService';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { Button } from '../components/Button';
import { ReceiptModal } from '../components/ReceiptModal';
import { Vehicle } from '../types';

export const BookingConfirmedScreen = ({ navigation, route }: any) => {
  const { booking, vehicle } = route.params;
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    // Show success notification
    notificationService.success('Your booking has been confirmed!', {
      title: 'Booking Successful',
      duration: 5000,
      action: {
        label: 'View Receipt',
        handler: () => setShowReceipt(true)
      }
    });

    // If this is a completed booking, schedule review prompt
    if (booking.status === 'completed') {
      const bookingForReview = {
        id: booking.id,
        vehicle: {
          id: booking.vehicle.id,
          make: booking.vehicle.make,
          model: booking.vehicle.model,
          year: booking.vehicle.year
        },
        startDate: booking.start_date,
        endDate: booking.end_date,
        status: booking.status
      };
      
      reviewPromptService.scheduleReviewPrompt(bookingForReview);
    }
  }, [booking]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleBackToHome = () => {
    navigation.navigate('IslandSelection');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color={colors.primary} />
        </View>
        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.subtitle}>
          Your reservation has been successfully created
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booking Details</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Booking ID:</Text>
          <Text style={styles.detailValue}>#{booking.id}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status:</Text>
          <Text style={[styles.detailValue, styles.statusText]}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Amount:</Text>
          <Text style={[styles.detailValue, styles.totalAmount]}>
            ${booking.total_amount.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Information</Text>
        
        <View style={styles.vehicleHeader}>
          <Text style={styles.vehicleName}>
            {booking.vehicle.make} {booking.vehicle.model}
          </Text>
          <View style={[
            styles.driveBadge,
            vehicle.drive_side === 'LHD' ? styles.lhdBadge : styles.rhdBadge
          ]}>
            <Ionicons 
              name="car-outline" 
              size={16} 
              color={colors.white} 
            />
            <Text style={styles.badgeText}>{vehicle.drive_side}</Text>
          </View>
        </View>
        
        <Text style={styles.vehicleYear}>{booking.vehicle.year}</Text>
        <Text style={styles.vehicleLocation}>📍 {booking.vehicle.location}</Text>
        <Text style={styles.dailyRate}>${booking.vehicle.daily_rate}/day</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rental Period</Text>
        
        <View style={styles.dateInfo}>
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>Pick-up</Text>
            <Text style={styles.dateValue}>{formatDate(booking.start_date)}</Text>
          </View>
          
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>Drop-off</Text>
            <Text style={styles.dateValue}>{formatDate(booking.end_date)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Next Steps</Text>
        <Text style={styles.nextStepsText}>
          • You will receive a confirmation email and push notification{'\n'}
          • Please bring a valid driver's license and credit card{'\n'}
          • Arrive 15 minutes early for vehicle inspection{'\n'}
          • We'll send you a reminder notification the day before{'\n'}
          • Contact support if you need to modify your booking
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="View Receipt"
          onPress={() => setShowReceipt(true)}
        />
        <Button
          title="Back to Home"
          onPress={handleBackToHome}
          variant="secondary"
        />
      </View>

      <ReceiptModal
        visible={showReceipt}
        bookingId={booking.id}
        onClose={() => setShowReceipt(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.white,
  },
  successIcon: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading1,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  section: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  sectionTitle: {
    ...typography.subheading,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  detailValue: {
    ...typography.body,
  },
  statusText: {
    color: colors.primary,
    fontWeight: '600',
  },
  totalAmount: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 18,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  vehicleName: {
    ...typography.subheading,
    flex: 1,
  },
  driveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  lhdBadge: {
    backgroundColor: colors.primary,
  },
  rhdBadge: {
    backgroundColor: '#E74C3C',
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  vehicleYear: {
    ...typography.body,
    marginBottom: 4,
  },
  vehicleLocation: {
    ...typography.body,
    marginBottom: 4,
  },
  dailyRate: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
  },
  dateInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateBlock: {
    flex: 0.48,
  },
  dateLabel: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  dateValue: {
    ...typography.body,
  },
  nextStepsText: {
    ...typography.body,
    lineHeight: 22,
  },
  buttonContainer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
});
