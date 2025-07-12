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
    return new Promise(async (resolve, reject) => {
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
    console.log('🚀 Starting service initialization...');
    
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
        try {
          console.log(`⏳ Initializing ${service.name}...`);
          const startTime = Date.now();
          await this.timeout(service.init(), service.name);
          const duration = Date.now() - startTime;
          console.log(`✅ ${service.name} initialized successfully in ${duration}ms`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage?.includes('timeout')) {
            console.error(`⏰ ${service.name} initialization timed out after ${this.SERVICE_INIT_TIMEOUT}ms`);
          } else {
            console.error(`❌ Failed to initialize ${service.name}:`, error);
          }
          throw new Error(`Service '${service.name}' initialization failed: ${errorMessage}`);
        }
      }

      // Mark initialization as complete
      this.initializedServices.add('core');
      console.log('🎉 All services initialized successfully!');
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
      console.log('🔌 Starting API service initialization...');
      await this.timeout(apiService.waitForInitialization(), 'api');
      this.initializedServices.add('api');
      console.log('🔌 API service initialization completed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('⚠️ API service initialization failed, continuing without backend:', errorMessage);
      // Mark as initialized even if failed to allow app to continue
      this.initializedServices.add('api');
      console.log('🔌 API service marked as initialized (offline mode)');
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
