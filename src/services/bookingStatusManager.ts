/**
 * Booking Status Manager
 * Manages real-time booking status updates and notifications
 */

import { realTimeService, BookingStatusUpdate } from './realTimeService';
import { loggingService } from './LoggingService';
import { analyticsService } from './analyticsService';
import { notificationService } from './notificationService';

export interface BookingDetails {
  id: string;
  vehicleId: string;
  vehicleName: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'processing' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  totalAmount: number;
  pickupLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  dropoffLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  estimatedPickupTime?: string;
  actualPickupTime?: string;
  estimatedReturnTime?: string;
  actualReturnTime?: string;
  lastUpdated: string;
  statusHistory: BookingStatusUpdate[];
}

export interface BookingNotificationSettings {
  enabled: boolean;
  showStatusUpdates: boolean;
  showLocationUpdates: boolean;
  showTimeUpdates: boolean;
  soundEnabled: boolean;
}

type BookingUpdateCallback = (booking: BookingDetails) => void;
type BookingListUpdateCallback = (bookings: BookingDetails[]) => void;

class BookingStatusManager {
  private activeBookings: Map<string, BookingDetails> = new Map();
  private bookingUpdateCallbacks: Set<BookingUpdateCallback> = new Set();
  private bookingListCallbacks: Set<BookingListUpdateCallback> = new Set();
  private subscribedBookings: Set<string> = new Set();
  
  private notificationSettings: BookingNotificationSettings = {
    enabled: true,
    showStatusUpdates: true,
    showLocationUpdates: true,
    showTimeUpdates: true,
    soundEnabled: true,
  };

  constructor() {
    this.setupRealTimeListeners();
  }

  /**
   * Setup real-time event listeners
   */
  private setupRealTimeListeners(): void {
    realTimeService.subscribe<BookingStatusUpdate>(
      'booking_status_update',
      this.handleBookingStatusUpdate.bind(this)
    );

    realTimeService.subscribe('connection_status', (status) => {
      if (status.connected && this.subscribedBookings.size > 0) {
        // Re-subscribe to bookings after reconnection
        this.resubscribeToBookings();
      }
    });
  }

  /**
   * Handle incoming booking status updates
   */
  private handleBookingStatusUpdate(update: BookingStatusUpdate): void {
    const booking = this.activeBookings.get(update.bookingId);
    
    if (!booking) {
      loggingService.warn('Received update for unknown booking', { 
        bookingId: update.bookingId 
      });
      return;
    }

    const previousStatus = booking.status;
    const newStatus = update.status;

    // Update booking details
    booking.status = newStatus;
    booking.lastUpdated = new Date().toISOString();
    
    if (update.message) {
      // Store status message in history
      booking.statusHistory.push(update);
    }

    if (update.estimatedTime) {
      this.updateEstimatedTime(booking, update);
    }

    if (update.location) {
      this.updateLocation(booking, update);
    }

    this.activeBookings.set(update.bookingId, booking);

    // Notify callbacks
    this.bookingUpdateCallbacks.forEach(callback => {
      try {
        callback({ ...booking });
      } catch (error) {
        loggingService.error('Error in booking update callback', error as Error);
      }
    });

    // Update booking list callbacks
    this.notifyBookingListCallbacks();

    // Show user notification
    this.showBookingNotification(booking, previousStatus, newStatus, update);

    // Track analytics
    analyticsService.trackEvent('booking_status_updated', {
      bookingId: update.bookingId,
      vehicleId: booking.vehicleId,
      previousStatus,
      newStatus,
      hasLocation: !!update.location,
      hasEstimatedTime: !!update.estimatedTime,
    });

    loggingService.info('Booking status updated', {
      bookingId: update.bookingId,
      previousStatus,
      newStatus,
    });
  }

  /**
   * Update estimated time based on status
   */
  private updateEstimatedTime(booking: BookingDetails, update: BookingStatusUpdate): void {
    switch (booking.status) {
      case 'confirmed':
      case 'processing':
        booking.estimatedPickupTime = update.estimatedTime;
        break;
      case 'active':
        booking.estimatedReturnTime = update.estimatedTime;
        break;
    }
  }

  /**
   * Update location information
   */
  private updateLocation(booking: BookingDetails, update: BookingStatusUpdate): void {
    if (!update.location) return;

    switch (booking.status) {
      case 'confirmed':
      case 'processing':
        booking.pickupLocation = {
          latitude: update.location.latitude,
          longitude: update.location.longitude,
          address: update.location.address || booking.pickupLocation?.address || 'Pickup Location',
        };
        break;
      case 'active':
        // Could be current vehicle location or return location
        break;
    }
  }

  /**
   * Show booking status notification
   */
  private showBookingNotification(
    booking: BookingDetails,
    previousStatus: string,
    newStatus: string,
    update: BookingStatusUpdate
  ): void {
    if (!this.notificationSettings.enabled || !this.notificationSettings.showStatusUpdates) {
      return;
    }

    let message = '';
    let notificationType: 'success' | 'info' | 'warning' | 'error' = 'info';

    switch (newStatus) {
      case 'confirmed':
        message = `✅ Booking confirmed for ${booking.vehicleName}`;
        notificationType = 'success';
        break;
      case 'processing':
        message = `🔄 Your ${booking.vehicleName} is being prepared`;
        notificationType = 'info';
        break;
      case 'active':
        message = `🚗 Your ${booking.vehicleName} rental is now active`;
        notificationType = 'success';
        break;
      case 'completed':
        message = `✨ Rental completed for ${booking.vehicleName}`;
        notificationType = 'success';
        break;
      case 'cancelled':
        message = `❌ Booking cancelled for ${booking.vehicleName}`;
        notificationType = 'error';
        break;
    }

    // Add additional context from update message
    if (update.message && message) {
      message += ` - ${update.message}`;
    }

    // Add estimated time if available
    if (update.estimatedTime && this.notificationSettings.showTimeUpdates) {
      const time = new Date(update.estimatedTime).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      message += ` (Est. ${time})`;
    }

    if (message) {
      notificationService.show(message, {
        type: notificationType,
        duration: 6000,
        sound: this.notificationSettings.soundEnabled,
        action: {
          label: 'View Booking',
          handler: () => {
            analyticsService.trackEvent('booking_notification_clicked', {
              bookingId: booking.id,
              status: newStatus,
            });
          }
        }
      });
    }
  }

  /**
   * Add booking to tracking
   */
  addBooking(booking: BookingDetails): void {
    this.activeBookings.set(booking.id, booking);
    
    // Subscribe to real-time updates
    if (!this.subscribedBookings.has(booking.id)) {
      this.subscribedBookings.add(booking.id);
      realTimeService.subscribeToBookingUpdates([booking.id]);
    }

    this.notifyBookingListCallbacks();

    analyticsService.trackEvent('booking_tracking_started', {
      bookingId: booking.id,
      vehicleId: booking.vehicleId,
      status: booking.status,
    });
  }

  /**
   * Remove booking from tracking
   */
  removeBooking(bookingId: string): void {
    this.activeBookings.delete(bookingId);
    
    if (this.subscribedBookings.has(bookingId)) {
      this.subscribedBookings.delete(bookingId);
      // Note: We don't unsubscribe from real-time service here
      // as the booking might still be relevant for a short time
    }

    this.notifyBookingListCallbacks();
  }

  /**
   * Get booking by ID
   */
  getBooking(bookingId: string): BookingDetails | null {
    return this.activeBookings.get(bookingId) || null;
  }

  /**
   * Get all active bookings
   */
  getAllBookings(): BookingDetails[] {
    return Array.from(this.activeBookings.values())
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }

  /**
   * Get bookings by status
   */
  getBookingsByStatus(status: BookingDetails['status']): BookingDetails[] {
    return this.getAllBookings().filter(booking => booking.status === status);
  }

  /**
   * Re-subscribe to bookings after reconnection
   */
  private resubscribeToBookings(): void {
    if (this.subscribedBookings.size > 0) {
      const bookingIds = Array.from(this.subscribedBookings);
      realTimeService.subscribeToBookingUpdates(bookingIds);
      
      loggingService.info('Re-subscribed to bookings after reconnection', {
        bookingCount: bookingIds.length,
      });
    }
  }

  /**
   * Notify booking list callbacks
   */
  private notifyBookingListCallbacks(): void {
    const bookings = this.getAllBookings();
    
    this.bookingListCallbacks.forEach(callback => {
      try {
        callback([...bookings]);
      } catch (error) {
        loggingService.error('Error in booking list callback', error as Error);
      }
    });
  }

  /**
   * Subscribe to booking updates
   */
  onBookingUpdate(callback: BookingUpdateCallback): () => void {
    this.bookingUpdateCallbacks.add(callback);
    
    return () => {
      this.bookingUpdateCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to booking list updates
   */
  onBookingListUpdate(callback: BookingListUpdateCallback): () => void {
    this.bookingListCallbacks.add(callback);
    
    return () => {
      this.bookingListCallbacks.delete(callback);
    };
  }

  /**
   * Update notification settings
   */
  updateNotificationSettings(settings: Partial<BookingNotificationSettings>): void {
    this.notificationSettings = {
      ...this.notificationSettings,
      ...settings,
    };

    analyticsService.trackEvent('booking_notification_settings_updated', {
      enabled: this.notificationSettings.enabled,
      showStatusUpdates: this.notificationSettings.showStatusUpdates,
      soundEnabled: this.notificationSettings.soundEnabled,
    });
  }

  /**
   * Get notification settings
   */
  getNotificationSettings(): BookingNotificationSettings {
    return { ...this.notificationSettings };
  }

  /**
   * Get booking statistics
   */
  getBookingStats(): {
    totalBookings: number;
    activeBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    subscribedBookings: number;
  } {
    const bookings = this.getAllBookings();
    
    return {
      totalBookings: bookings.length,
      activeBookings: bookings.filter(b => ['confirmed', 'processing', 'active'].includes(b.status)).length,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      subscribedBookings: this.subscribedBookings.size,
    };
  }

  /**
   * Clear all bookings and subscriptions
   */
  clearAll(): void {
    // Unsubscribe from all bookings
    if (this.subscribedBookings.size > 0) {
      const bookingIds = Array.from(this.subscribedBookings);
      // Note: In a real implementation, we'd call unsubscribe
      // realTimeService.unsubscribeFromBookingUpdates(bookingIds);
    }

    this.activeBookings.clear();
    this.subscribedBookings.clear();
    this.bookingUpdateCallbacks.clear();
    this.bookingListCallbacks.clear();

    loggingService.info('Booking status manager cleared');
  }
}

export const bookingStatusManager = new BookingStatusManager();
