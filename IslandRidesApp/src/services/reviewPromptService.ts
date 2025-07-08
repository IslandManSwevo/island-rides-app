import { apiService } from './apiService';
import { notificationService } from './notificationService';
import { storageService } from './storageService';
import { navigationRef } from '../navigation/navigationRef';
import { ROUTES } from '../navigation/routes';
import * as Notifications from 'expo-notifications';

export interface ReviewPrompt {
  id: string;
  bookingId: number;
  userId: number;
  vehicleId: number;
  promptDate: string;
  status: 'pending' | 'sent' | 'completed' | 'dismissed';
  reminderCount: number;
  lastReminderDate?: string;
  createdAt: string;
}

export interface BookingForReview {
  id: number;
  vehicle: {
    id: number;
    make: string;
    model: string;
    year: number;
  };
  startDate: string;
  endDate: string;
  status: string;
}

class ReviewPromptService {
  private readonly STORAGE_KEY = 'review_prompts';
  private readonly DISMISSED_KEY = 'dismissed_review_prompts';
  private readonly MAX_REMINDERS = 3;
  private readonly PROMPT_DELAY_HOURS = 2; // Hours after booking completion to send first prompt
  private readonly REMINDER_INTERVAL_DAYS = 3; // Days between reminder prompts

  /**
   * Schedule a review prompt for a completed booking
   */
  async scheduleReviewPrompt(booking: BookingForReview): Promise<void> {
    try {
      const promptId = `review_${booking.id}_${Date.now()}`;
      const promptDate = new Date();
      promptDate.setHours(promptDate.getHours() + this.PROMPT_DELAY_HOURS);

      const reviewPrompt: ReviewPrompt = {
        id: promptId,
        bookingId: booking.id,
        userId: 0, // Will be set by current user
        vehicleId: booking.vehicle.id,
        promptDate: promptDate.toISOString(),
        status: 'pending',
        reminderCount: 0,
        createdAt: new Date().toISOString()
      };

      // Store locally
      await this.storeReviewPrompt(reviewPrompt);

      // Schedule local notification
      await this.scheduleNotification(reviewPrompt, booking);

      console.log(`📝 Review prompt scheduled for booking ${booking.id}`);
    } catch (error) {
      console.error('Failed to schedule review prompt:', error);
    }
  }

  /**
   * Check for completed bookings that need review prompts
   */
  async checkForCompletedBookings(): Promise<void> {
    try {
      // Check if user is authenticated first
      const token = await apiService.getToken();
      if (!token) {
        console.log('📝 Review service: No authentication token, skipping completed bookings check');
        return;
      }

      const completedBookings = await this.getCompletedBookingsNeedingReviews();
      
      for (const booking of completedBookings) {
        // Check if we already have a prompt for this booking
        const existingPrompt = await this.getPromptForBooking(booking.id);
        if (!existingPrompt) {
          await this.scheduleReviewPrompt(booking);
        }
      }
      
      console.log(`📝 Checked ${completedBookings.length} completed bookings for review prompts`);
    } catch (error) {
      console.error('Failed to check for completed bookings:', error);
    }
  }

  /**
   * Get completed bookings that need reviews
   */
  private async getCompletedBookingsNeedingReviews(): Promise<BookingForReview[]> {
    try {
      // Check if user is authenticated before making API call
      const token = await apiService.getToken();
      if (!token) {
        console.log('📝 Review service: No auth token available, skipping API call');
        return [];
      }

      const response = await apiService.get<{ bookings: BookingForReview[] }>('/api/bookings/completed-without-reviews');
      return response.bookings || [];
    } catch (error) {
      console.error('Failed to fetch completed bookings:', error);
      return [];
    }
  }

  /**
   * Send immediate review prompt to user
   */
  async sendReviewPrompt(booking: BookingForReview): Promise<void> {
    try {
      const isDismissed = await this.isBookingDismissed(booking.id);
      if (isDismissed) {
        return;
      }

      const vehicleName = `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`;
      
      notificationService.info(
        `How was your experience with the ${vehicleName}?`,
        {
          title: 'Share Your Experience',
          duration: 8000,
          action: {
            label: 'Write Review',
            handler: () => this.navigateToWriteReview(booking)
          },
          persistent: true
        }
      );

      // Update prompt status
      const prompt = await this.getPromptForBooking(booking.id);
      if (prompt) {
        prompt.status = 'sent';
        await this.updateReviewPrompt(prompt);
      }

    } catch (error) {
      console.error('Failed to send review prompt:', error);
    }
  }

  /**
   * Send reminder prompt for existing review requests
   */
  async sendReminderPrompt(booking: BookingForReview): Promise<void> {
    try {
      const prompt = await this.getPromptForBooking(booking.id);
      if (!prompt || prompt.status === 'completed' || prompt.reminderCount >= this.MAX_REMINDERS) {
        return;
      }

      const isDismissed = await this.isBookingDismissed(booking.id);
      if (isDismissed) {
        return;
      }

      const vehicleName = `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`;
      
      notificationService.warning(
        `Don't forget to review your ${vehicleName} rental experience!`,
        {
          title: 'Review Reminder',
          duration: 6000,
          action: {
            label: 'Write Review',
            handler: () => this.navigateToWriteReview(booking)
          }
        }
      );

      // Update reminder count
      prompt.reminderCount += 1;
      prompt.lastReminderDate = new Date().toISOString();
      await this.updateReviewPrompt(prompt);

    } catch (error) {
      console.error('Failed to send reminder prompt:', error);
    }
  }

  /**
   * Mark review as completed
   */
  async markReviewCompleted(bookingId: number): Promise<void> {
    try {
      const prompt = await this.getPromptForBooking(bookingId);
      if (prompt) {
        prompt.status = 'completed';
        await this.updateReviewPrompt(prompt);
      }

      // Cancel any pending notifications
      await this.cancelNotificationsForBooking(bookingId);

      console.log(`✅ Review completed for booking ${bookingId}`);
    } catch (error) {
      console.error('Failed to mark review as completed:', error);
    }
  }

  /**
   * Dismiss review prompts for a booking
   */
  async dismissReviewPrompts(bookingId: number): Promise<void> {
    try {
      // Add to dismissed list
      const dismissedPrompts = await storageService.get<number[]>(this.DISMISSED_KEY) || [];
      if (!dismissedPrompts.includes(bookingId)) {
        dismissedPrompts.push(bookingId);
        await storageService.set(this.DISMISSED_KEY, dismissedPrompts);
      }

      // Update prompt status
      const prompt = await this.getPromptForBooking(bookingId);
      if (prompt) {
        prompt.status = 'dismissed';
        await this.updateReviewPrompt(prompt);
      }

      // Cancel notifications
      await this.cancelNotificationsForBooking(bookingId);

      console.log(`🚫 Review prompts dismissed for booking ${bookingId}`);
    } catch (error) {
      console.error('Failed to dismiss review prompts:', error);
    }
  }

  /**
   * Process pending review prompts
   */
  async processPendingPrompts(): Promise<void> {
    try {
      const allPrompts = await this.getAllReviewPrompts();
      const now = new Date();

      for (const prompt of allPrompts) {
        if (prompt.status === 'pending' && new Date(prompt.promptDate) <= now) {
          const booking = await this.getBookingDetails(prompt.bookingId);
          if (booking) {
            await this.sendReviewPrompt(booking);
          }
        } else if (prompt.status === 'sent' && prompt.reminderCount < this.MAX_REMINDERS) {
          const lastReminder = prompt.lastReminderDate ? new Date(prompt.lastReminderDate) : new Date(prompt.promptDate);
          const daysSinceLastReminder = (now.getTime() - lastReminder.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysSinceLastReminder >= this.REMINDER_INTERVAL_DAYS) {
            const booking = await this.getBookingDetails(prompt.bookingId);
            if (booking) {
              await this.sendReminderPrompt(booking);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to process pending prompts:', error);
    }
  }

  /**
   * Initialize the review prompt system
   */
  async initialize(): Promise<void> {
    try {
      // Check for completed bookings on app start
      await this.checkForCompletedBookings();
      
      // Process any pending prompts
      await this.processPendingPrompts();

      // Set up periodic checking (every hour)
      setInterval(() => {
        this.processPendingPrompts();
      }, 60 * 60 * 1000); // 1 hour

      console.log('📝 Review prompt service initialized');
    } catch (error) {
      console.error('Failed to initialize review prompt service:', error);
    }
  }

  /**
   * Get statistics about review prompts
   */
  async getPromptStats(): Promise<{
    total: number;
    pending: number;
    sent: number;
    completed: number;
    dismissed: number;
    completionRate: number;
  }> {
    try {
      const prompts = await this.getAllReviewPrompts();
      const stats = {
        total: prompts.length,
        pending: prompts.filter(p => p.status === 'pending').length,
        sent: prompts.filter(p => p.status === 'sent').length,
        completed: prompts.filter(p => p.status === 'completed').length,
        dismissed: prompts.filter(p => p.status === 'dismissed').length,
        completionRate: 0
      };

      const totalProcessed = stats.completed + stats.dismissed;
      if (totalProcessed > 0) {
        stats.completionRate = (stats.completed / totalProcessed) * 100;
      }

      return stats;
    } catch (error) {
      console.error('Failed to get prompt stats:', error);
      return { total: 0, pending: 0, sent: 0, completed: 0, dismissed: 0, completionRate: 0 };
    }
  }

  // Private helper methods

  private async storeReviewPrompt(prompt: ReviewPrompt): Promise<void> {
    const prompts = await this.getAllReviewPrompts();
    prompts.push(prompt);
    await storageService.set(this.STORAGE_KEY, prompts);
  }

  private async updateReviewPrompt(updatedPrompt: ReviewPrompt): Promise<void> {
    const prompts = await this.getAllReviewPrompts();
    const index = prompts.findIndex(p => p.id === updatedPrompt.id);
    if (index !== -1) {
      prompts[index] = updatedPrompt;
      await storageService.set(this.STORAGE_KEY, prompts);
    }
  }

  private async getAllReviewPrompts(): Promise<ReviewPrompt[]> {
    return await storageService.get<ReviewPrompt[]>(this.STORAGE_KEY) || [];
  }

  private async getPromptForBooking(bookingId: number): Promise<ReviewPrompt | null> {
    const prompts = await this.getAllReviewPrompts();
    return prompts.find(p => p.bookingId === bookingId) || null;
  }

  private async isBookingDismissed(bookingId: number): Promise<boolean> {
    const dismissedPrompts = await storageService.get<number[]>(this.DISMISSED_KEY) || [];
    return dismissedPrompts.includes(bookingId);
  }

  private async getBookingDetails(bookingId: number): Promise<BookingForReview | null> {
    try {
      const response = await apiService.get<{ booking: BookingForReview }>(`/bookings/${bookingId}`);
      return response.booking;
    } catch (error) {
      console.error(`Failed to get booking details for ${bookingId}:`, error);
      return null;
    }
  }

  private navigateToWriteReview(booking: BookingForReview): void {
    if (navigationRef.current) {
      (navigationRef.current as any).navigate(ROUTES.WRITE_REVIEW, { booking });
    }
  }

  private async scheduleNotification(prompt: ReviewPrompt, booking: BookingForReview): Promise<void> {
    try {
      const vehicleName = `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`;
      
      await Notifications.scheduleNotificationAsync({
        identifier: `review_prompt_${prompt.bookingId}`,
        content: {
          title: 'Share Your Experience',
          body: `How was your experience with the ${vehicleName}?`,
          data: {
            type: 'review_prompt',
            bookingId: booking.id,
            screen: 'WriteReview',
            booking: booking
          },
        },
        trigger: { 
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(prompt.promptDate) 
        },
      });
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }

  private async cancelNotificationsForBooking(bookingId: number): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(`review_prompt_${bookingId}`);
      
      // Also cancel reminder notifications
      for (let i = 1; i <= this.MAX_REMINDERS; i++) {
        await Notifications.cancelScheduledNotificationAsync(`review_reminder_${bookingId}_${i}`);
      }
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  }
}

export const reviewPromptService = new ReviewPromptService();
