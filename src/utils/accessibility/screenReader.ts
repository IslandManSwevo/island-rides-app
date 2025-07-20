import { AccessibilityInfo } from 'react-native';

class ScreenReaderManager {
  private isEnabled: boolean = false;
  private listeners: ((enabled: boolean) => void)[] = [];

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      this.isEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      this.setupListeners();
    } catch (error) {
      console.warn('Failed to initialize screen reader manager:', error);
    }
  }

  private subscription?: { remove: () => void };
  private setupListeners() {
    this.subscription = AccessibilityInfo.addEventListener('screenReaderChanged', this.handleScreenReaderChange);
  }

  private handleScreenReaderChange = (enabled: boolean) => {
    this.isEnabled = enabled;
    this.listeners.forEach(listener => listener(enabled));
  };

  /**
   * Check if screen reader is currently enabled
   */
  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Subscribe to screen reader state changes
   */
  public subscribe(listener: (enabled: boolean) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Announce message to screen reader
   */
  public announce(message: string, options?: { priority?: 'low' | 'high' }): void {
    if (!this.isEnabled) return;

    try {
      AccessibilityInfo.announceForAccessibility(message);
    } catch (error) {
      console.warn('Failed to announce message:', error);
    }
  }

  /**
   * Announce with delay to ensure previous announcements complete
   */
  public announceWithDelay(message: string, delay: number = 500): void {
    setTimeout(() => {
      this.announce(message);
    }, delay);
  }

  /**
   * Announce multiple messages in sequence
   */
  public announceSequence(messages: string[], interval: number = 1000): void {
    if (!this.isEnabled) return;

    messages.forEach((message, index) => {
      setTimeout(() => {
        this.announce(message);
      }, index * interval);
    });
  }

  /**
   * Announce form validation errors
   */
  public announceFormErrors(errors: Record<string, string>): void {
    if (!this.isEnabled || Object.keys(errors).length === 0) return;

    const errorCount = Object.keys(errors).length;
    const countMessage = errorCount === 1 
      ? 'There is 1 error in the form' 
      : `There are ${errorCount} errors in the form`;

    this.announce(countMessage);

    // Announce each error with delay
    let delay = 1000;
    Object.entries(errors).forEach(([field, error]) => {
      this.announceWithDelay(`${field}: ${error}`, delay);
      delay += 1000;
    });
  }

  /**
   * Announce navigation changes
   */
  public announceNavigation(screenName: string, context?: string): void {
    if (!this.isEnabled) return;

    let message = `Navigated to ${screenName}`;
    if (context) {
      message += ` ${context}`;
    }

    this.announceWithDelay(message, 300);
  }

  /**
   * Announce loading states
   */
  public announceLoading(isLoading: boolean, context?: string): void {
    if (!this.isEnabled) return;

    const message = isLoading
      ? `Loading${context ? ` ${context}` : ''}`
      : `Finished loading${context ? ` ${context}` : ''}`;

    this.announce(message);
  }

  /**
   * Announce search results
   */
  public announceSearchResults(count: number, query?: string): void {
    if (!this.isEnabled) return;

    let message = '';
    if (count === 0) {
      message = 'No results found';
    } else if (count === 1) {
      message = '1 result found';
    } else {
      message = `${count} results found`;
    }

    if (query) {
      message += ` for "${query}"`;
    }

    this.announce(message);
  }

  /**
   * Announce list updates
   */
  public announceListUpdate(action: 'added' | 'removed' | 'updated', itemName: string): void {
    if (!this.isEnabled) return;

    const message = `${itemName} ${action}`;
    this.announce(message);
  }

  /**
   * Announce modal/dialog state
   */
  public announceModal(isOpen: boolean, title?: string): void {
    if (!this.isEnabled) return;

    if (isOpen) {
      const message = title ? `${title} dialog opened` : 'Dialog opened';
      this.announce(message);
    } else {
      this.announce('Dialog closed');
    }
  }

  /**
   * Announce progress updates
   */
  public announceProgress(current: number, total: number, description?: string): void {
    if (!this.isEnabled) return;

    const percentage = Math.round((current / total) * 100);
    let message = `Progress: ${percentage}%`;
    
    if (description) {
      message = `${description}: ${message}`;
    }

    this.announce(message);
  }

  /**
   * Cleanup listeners
   */
  public cleanup(): void {
    this.subscription?.remove();
    this.listeners = [];
  }
}

export const screenReader = new ScreenReaderManager();