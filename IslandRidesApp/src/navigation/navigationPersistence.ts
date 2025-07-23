import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationState, PartialState } from '@react-navigation/native';

const PERSISTENCE_KEY = 'NAVIGATION_STATE_V1';
const PERSISTENCE_TIMEOUT = 2000; // 2 seconds timeout for loading state

interface NavigationPersistenceConfig {
  persistenceKey?: string;
  timeout?: number;
  enableInDevelopment?: boolean;
  enableInProduction?: boolean;
}

class NavigationPersistence {
  private config: Required<NavigationPersistenceConfig>;
  private isReady = false;
  private initialState: NavigationState | undefined;

  constructor(config: NavigationPersistenceConfig = {}) {
    this.config = {
      persistenceKey: config.persistenceKey || PERSISTENCE_KEY,
      timeout: config.timeout || PERSISTENCE_TIMEOUT,
      enableInDevelopment: config.enableInDevelopment ?? true,
      enableInProduction: config.enableInProduction ?? true,
    };
  }

  /**
   * Check if persistence is enabled for current environment
   */
  private isPersistenceEnabled(): boolean {
    if (__DEV__) {
      return this.config.enableInDevelopment;
    }
    return this.config.enableInProduction;
  }

  /**
   * Restore navigation state from AsyncStorage
   */
  async restoreState(): Promise<NavigationState | undefined> {
    if (!this.isPersistenceEnabled()) {
      console.log('🧭 Navigation persistence disabled for current environment');
      this.isReady = true;
      return undefined;
    }

    try {
      console.log('🧭 Restoring navigation state...');
      
      const savedStateString = await Promise.race([
        AsyncStorage.getItem(this.config.persistenceKey),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), this.config.timeout)
        )
      ]);

      if (savedStateString) {
        const state = JSON.parse(savedStateString);
        console.log('🧭 Navigation state restored successfully');
        this.initialState = state;
        return state;
      } else {
        console.log('🧭 No saved navigation state found');
      }
    } catch (error) {
      console.warn('🧭 Failed to restore navigation state:', error);
      // Clear corrupted state
      await this.clearState();
    } finally {
      this.isReady = true;
    }

    return undefined;
  }

  /**
   * Save navigation state to AsyncStorage
   */
  async saveState(state: NavigationState | PartialState<NavigationState>): Promise<void> {
    if (!this.isPersistenceEnabled()) {
      return;
    }

    try {
      const stateString = JSON.stringify(state);
      await AsyncStorage.setItem(this.config.persistenceKey, stateString);
      console.log('🧭 Navigation state saved successfully');
    } catch (error) {
      console.warn('🧭 Failed to save navigation state:', error);
    }
  }

  /**
   * Clear saved navigation state
   */
  async clearState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.config.persistenceKey);
      console.log('🧭 Navigation state cleared');
    } catch (error) {
      console.warn('🧭 Failed to clear navigation state:', error);
    }
  }

  /**
   * Get initial state (call after restoreState)
   */
  getInitialState(): NavigationState | undefined {
    return this.initialState;
  }

  /**
   * Check if persistence is ready
   */
  getIsReady(): boolean {
    return this.isReady;
  }

  /**
   * Reset persistence state (useful for testing)
   */
  reset(): void {
    this.isReady = false;
    this.initialState = undefined;
  }

  /**
   * Validate navigation state structure
   */
  private isValidNavigationState(state: any): state is NavigationState {
    return (
      state &&
      typeof state === 'object' &&
      typeof state.index === 'number' &&
      Array.isArray(state.routes) &&
      state.routes.length > 0
    );
  }

  /**
   * Sanitize navigation state before saving
   */
  private sanitizeState(state: NavigationState | PartialState<NavigationState>): any {
    // Remove any non-serializable data
    const sanitized = JSON.parse(JSON.stringify(state));
    
    // Remove sensitive data if needed
    // This is where you could filter out sensitive route parameters
    
    return sanitized;
  }
}

// Create singleton instance
export const navigationPersistence = new NavigationPersistence({
  enableInDevelopment: true,
  enableInProduction: true,
  timeout: 2000,
});

// Export utilities
export const restoreNavigationState = () => navigationPersistence.restoreState();
export const saveNavigationState = (state: NavigationState | PartialState<NavigationState>) => 
  navigationPersistence.saveState(state);
export const clearNavigationState = () => navigationPersistence.clearState();
export const getInitialNavigationState = () => navigationPersistence.getInitialState();
export const isNavigationReady = () => navigationPersistence.getIsReady();

export default navigationPersistence;
