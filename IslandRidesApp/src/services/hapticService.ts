import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic Feedback Service for Island Rides App
 * Provides consistent haptic feedback across the application
 */

export type HapticType = 
  | 'light'           // Light touch feedback
  | 'medium'          // Medium impact feedback  
  | 'heavy'           // Heavy impact feedback
  | 'selection'       // UI selection feedback
  | 'success'         // Success action feedback
  | 'warning'         // Warning/caution feedback
  | 'error'           // Error feedback
  | 'notification';   // Notification arrival

export interface HapticPattern {
  type: Haptics.ImpactFeedbackStyle | Haptics.NotificationFeedbackType;
  delay?: number;
}

class HapticService {
  private isEnabled: boolean = true;
  private isSupported: boolean = false;

  constructor() {
    this.checkSupport();
  }

  /**
   * Check if haptic feedback is supported on the current platform
   */
  private async checkSupport(): Promise<void> {
    try {
      // Haptics are primarily supported on iOS and some Android devices
      this.isSupported = Platform.OS === 'ios' || Platform.OS === 'android';
      
      if (this.isSupported && Platform.OS === 'ios') {
        // Additional check for iOS haptic support
        this.isSupported = await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          .then(() => true)
          .catch(() => false);
      }
    } catch (error) {
      console.debug('Haptic support check failed:', error);
      this.isSupported = false;
    }
  }

  /**
   * Enable or disable haptic feedback
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if haptics are currently enabled and supported
   */
  isAvailable(): boolean {
    return this.isEnabled && this.isSupported;
  }

  /**
   * Trigger haptic feedback based on interaction type
   */
  async trigger(type: HapticType): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
          
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
          
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
          
        case 'selection':
          await Haptics.selectionAsync();
          break;
          
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
          
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
          
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
          
        case 'notification':
          // Custom pattern for notifications
          await this.customPattern([
            { type: Haptics.ImpactFeedbackStyle.Light },
            { type: Haptics.ImpactFeedbackStyle.Medium, delay: 100 }
          ]);
          break;
      }
    } catch (error) {
      console.debug(`Haptic feedback failed for type "${type}":`, error);
    }
  }

  /**
   * Execute a custom haptic pattern
   */
  async customPattern(pattern: HapticPattern[]): Promise<void> {
    if (!this.isAvailable()) return;

    for (const step of pattern) {
      if (step.delay) {
        await new Promise<void>(resolve => setTimeout(() => resolve(), step.delay));
      }

      try {
        if (Object.values(Haptics.ImpactFeedbackStyle).includes(step.type as any)) {
          await Haptics.impactAsync(step.type as Haptics.ImpactFeedbackStyle);
        } else if (Object.values(Haptics.NotificationFeedbackType).includes(step.type as any)) {
          await Haptics.notificationAsync(step.type as Haptics.NotificationFeedbackType);
        }
      } catch (error) {
        console.debug('Custom haptic pattern step failed:', error);
      }
    }
  }

  /**
   * Haptic feedback for specific app interactions
   */
  async bookingConfirmed(): Promise<void> {
    await this.customPattern([
      { type: Haptics.ImpactFeedbackStyle.Medium },
      { type: Haptics.NotificationFeedbackType.Success, delay: 200 }
    ]);
  }

  async vehicleSelected(): Promise<void> {
    await this.trigger('selection');
  }

  async filterChanged(): Promise<void> {
    await this.trigger('light');
  }

  async buttonPressed(): Promise<void> {
    await this.trigger('medium');
  }

  async actionCompleted(): Promise<void> {
    await this.trigger('success');
  }

  async errorOccurred(): Promise<void> {
    await this.trigger('error');
  }

  async searchStarted(): Promise<void> {
    await this.customPattern([
      { type: Haptics.ImpactFeedbackStyle.Light },
      { type: Haptics.ImpactFeedbackStyle.Light, delay: 50 }
    ]);
  }

  async paymentProcessing(): Promise<void> {
    await this.customPattern([
      { type: Haptics.ImpactFeedbackStyle.Light },
      { type: Haptics.ImpactFeedbackStyle.Medium, delay: 300 },
      { type: Haptics.ImpactFeedbackStyle.Heavy, delay: 300 }
    ]);
  }
}

// Export singleton instance
export const hapticService = new HapticService();

// Export for use in components
export default hapticService;