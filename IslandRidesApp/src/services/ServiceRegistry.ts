import { BaseService } from './base/BaseService';
import { platformService } from './PlatformService';
import { environmentService } from './EnvironmentService';
import { storageService } from './storageService';
import { loggingService } from './LoggingService';
import { apiService } from './apiService';
import { authService } from './authService';
import { ErrorRecoveryManager } from './errors/ErrorRecoveryManager';
import { SessionRecoveryStrategy } from './errors/RecoveryStrategy';

class ServiceRegistry extends BaseService {
  private initializedServices: Set<string> = new Set();
  private readonly SERVICE_INIT_TIMEOUT = 10000; // 10 seconds

  private async timeout<T>(promise: Promise<T>, serviceName: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Service '${serviceName}' initialization timed out`));
      }, this.SERVICE_INIT_TIMEOUT);

      try {
        const result = await promise;
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  async initializeServices(): Promise<void> {
    try {
      const servicesToInitialize = [
        { name: 'platform', init: this.initializePlatform.bind(this) },
        { name: 'environment', init: this.initializeEnvironment.bind(this) },
        { name: 'storage', init: this.initializeStorage.bind(this) },
        { name: 'logging', init: this.initializeLogging.bind(this) },
        { name: 'api', init: this.initializeApi.bind(this) },
        { name: 'auth', init: this.initializeAuth.bind(this) },
        { name: 'errorRecovery', init: this.initializeErrorRecovery.bind(this) },
      ];

      for (const service of servicesToInitialize) {
        await this.timeout(service.init(), service.name);
      }

      // Mark initialization as complete
      this.initializedServices.add('core');
    } catch (error) {
      console.error('Failed to initialize services:', error);
      throw error;
    }
  }

  private async initializePlatform(): Promise<void> {
    try {
      await platformService.waitForInitialization();
      this.initializedServices.add('platform');
    } catch (error) {
      console.error('Failed to initialize platform service:', error);
      throw error;
    }
  }

  private async initializeEnvironment(): Promise<void> {
    try {
      await environmentService.waitForInitialization();
      this.initializedServices.add('environment');
    } catch (error) {
      console.error('Failed to initialize environment service:', error);
      throw error;
    }
  }

    private async initializeStorage(): Promise<void> {
    try {
      await storageService.waitForInitialization();
      this.initializedServices.add('storage');
    } catch (error) {
      console.error('Failed to initialize storage service:', error);
      throw error;
    }
  }

    private async initializeLogging(): Promise<void> {
    try {
      await loggingService.waitForInitialization();
      this.initializedServices.add('logging');
      loggingService.info('Logging service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize logging service:', error);
      throw error;
    }
  }

  private async initializeApi(): Promise<void> {
    try {
      await apiService.waitForInitialization();
      this.initializedServices.add('api');
    } catch (error) {
      console.error('Failed to initialize API service:', error);
      throw error;
    }
  }

  private async initializeAuth(): Promise<void> {
    try {
      await authService.waitForInitialization();
      this.initializedServices.add('auth');
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
      throw error;
    }
  }

  private async initializeErrorRecovery(): Promise<void> {
    try {
      const errorManager = ErrorRecoveryManager.getInstance();
      errorManager.registerStrategy(new SessionRecoveryStrategy());
      this.initializedServices.add('errorRecovery');
    } catch (error) {
      console.error('Failed to initialize error recovery:', error);
      throw error;
    }
  }

  isServiceInitialized(service: string): boolean {
    return this.initializedServices.has(service);
  }

  getInitializedServices(): string[] {
    return Array.from(this.initializedServices);
  }
}

export const serviceRegistry = ServiceRegistry.getInstance<ServiceRegistry>();
