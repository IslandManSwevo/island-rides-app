import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { RootStackParamList } from '../navigation/routes';
import { BookingService } from '../services/bookingService';
import { BookingResponse } from '../types';
import { notificationService } from '../services/notificationService';

type MyBookingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MyBookings'>;

interface MyBookingsScreenProps {
  navigation: MyBookingsScreenNavigationProp;
}

interface BookingWithDetails extends BookingResponse {
  booking: BookingResponse['booking'] & {
    canCancel?: boolean;
  };
}

export const MyBookingsScreen: React.FC<MyBookingsScreenProps> = ({ navigation }) => {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState<number | null>(null);

  const loadBookings = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await BookingService.getBookings();
      
      // Add cancellation eligibility to each booking
      const bookingsWithCancelInfo = response.map(booking => {
        const startDate = new Date(booking.booking.startDate);
        const now = new Date();
        const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        return {
          ...booking,
          booking: {
            ...booking.booking,
            canCancel: hoursUntilStart > 24 && 
                      booking.booking.status !== 'cancelled' && 
                      booking.booking.status !== 'completed'
          }
        };
      });
      
      setBookings(bookingsWithCancelInfo);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      notificationService.error('Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBookings(false);
  }, [loadBookings]);

  const handleCancelBooking = (booking: BookingWithDetails) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your booking for ${booking.booking.vehicle.make} ${booking.booking.vehicle.model}?\n\nThis action cannot be undone.`,
      [
        {
          text: 'Keep Booking',
          style: 'cancel',
        },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: () => confirmCancelBooking(booking.booking.id),
        },
      ]
    );
  };

  const confirmCancelBooking = async (bookingId: number) => {
    try {
      setCancellingBookingId(bookingId);
      await BookingService.cancelBooking(bookingId.toString());
      
      notificationService.success('Booking cancelled successfully');
      
      // Refresh the bookings list
      loadBookings(false);
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      notificationService.error(
        error instanceof Error ? error.message : 'Failed to cancel booking'
      );
    } finally {
      setCancellingBookingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'completed':
        return colors.primary;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'completed':
        return 'checkmark-done-circle';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderBookingCard = (booking: BookingWithDetails) => {
    const { booking: bookingData } = booking;
    const isCancelling = cancellingBookingId === bookingData.id;

    return (
      <View key={bookingData.id} style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleName}>
              {bookingData.vehicle.make} {bookingData.vehicle.model}
            </Text>
            <Text style={styles.vehicleYear}>{bookingData.vehicle.year}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(bookingData.status) }]}>
            <Ionicons 
              name={getStatusIcon(bookingData.status)} 
              size={12} 
              color="white" 
              style={styles.statusIcon}
            />
            <Text style={styles.statusText}>
              {bookingData.status.charAt(0).toUpperCase() + bookingData.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar" size={16} color={colors.textSecondary} />
            <Text style={styles.dateText}>
              {formatDate(bookingData.startDate)} - {formatDate(bookingData.endDate)}
            </Text>
          </View>
          
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={colors.textSecondary} />
            <Text style={styles.locationText}>{bookingData.vehicle.location}</Text>
          </View>
          
          <View style={styles.priceRow}>
            <Ionicons name="card" size={16} color={colors.textSecondary} />
            <Text style={styles.priceText}>${bookingData.totalAmount}</Text>
          </View>
        </View>

        <View style={styles.bookingActions}>
          <TouchableOpacity 
            style={styles.viewButton}
            onPress={() => {
              // Navigate to booking details if needed
              console.log('View booking details:', bookingData.id);
            }}
          >
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
          
          {bookingData.canCancel && (
            <TouchableOpacity 
              style={[styles.cancelButton, isCancelling && styles.cancelButtonDisabled]}
              onPress={() => handleCancelBooking(booking)}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.cancelButtonText}>Cancel</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Bookings</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Bookings Yet</Text>
            <Text style={styles.emptyMessage}>
              When you book a vehicle, your reservations will appear here.
            </Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => navigation.navigate('IslandSelection')}
            >
              <Text style={styles.browseButtonText}>Browse Vehicles</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bookingsList}>
            {bookings.map(renderBookingCard)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTitle: {
    ...typography.heading2,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    ...typography.heading3,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  browseButtonText: {
    ...typography.button,
    color: 'white',
  },
  bookingsList: {
    padding: spacing.md,
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    ...typography.heading4,
    color: colors.text,
  },
  vehicleYear: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusIcon: {
    marginRight: spacing.xs,
  },
  statusText: {
    ...typography.caption,
    color: 'white',
    fontWeight: '600',
  },
  bookingDetails: {
    marginBottom: spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dateText: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  locationText: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    ...typography.heading4,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewButton: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  viewButtonText: {
    ...typography.button,
    color: colors.text,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: colors.error,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    ...typography.button,
    color: 'white',
  },
});