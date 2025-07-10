export abstract class BaseService {
  private static readonly instances = new Map<string, BaseService>();
  private static readonly initialized = new Set<string>();
  private static readonly initializationPromises = new Map<string, Promise<void>>();
  
  constructor() {
    const name = this.constructor.name;
    if (BaseService.instances.has(name)) {
      return BaseService.instances.get(name)!;
    }
    BaseService.instances.set(name, this);
  }
  
  static getInstance<T extends BaseService>(this: { new(): T }): T {
    const name = this.name;
    
    // Create instance if it doesn't exist
    if (!BaseService.instances.has(name)) {
      const instance = new this();
      
      // Start initialization if not already started and service has onInit method
      if (!BaseService.initializationPromises.has(name) && instance.onInit) {
        const initPromise = instance.onInit()
          .then(() => {
            BaseService.initialized.add(name);
          })
          .catch(error => {
            console.error(`Failed to initialize ${name}:`, error);
            // Remove the failed promise so it can be retried
            BaseService.initializationPromises.delete(name);
            throw error;
          });
        
        BaseService.initializationPromises.set(name, initPromise);
      }
    }
    
    return BaseService.instances.get(name) as T;
  }

  static async getInstanceAsync<T extends BaseService>(this: { new(): T }): Promise<T> {
    const name = this.name;
    
    // Create instance if it doesn't exist
    if (!BaseService.instances.has(name)) {
      const instance = new this();
      
      // Start initialization if not already started and service has onInit method
      if (!BaseService.initializationPromises.has(name) && instance.onInit) {
        const initPromise = instance.onInit()
          .then(() => {
            BaseService.initialized.add(name);
          })
          .catch(error => {
            console.error(`Failed to initialize ${name}:`, error);
            // Remove the failed promise so it can be retried
            BaseService.initializationPromises.delete(name);
            throw error;
          });
        
        BaseService.initializationPromises.set(name, initPromise);
      }
    }
    
    // Wait for initialization to complete if it's in progress
    const initPromise = BaseService.initializationPromises.get(name);
    if (initPromise) {
      await initPromise;
    }
    
    return BaseService.instances.get(name) as T;
  }

  protected onInit?(): Promise<void>;
  
  public isInitialized(): boolean {
    return BaseService.initialized.has(this.constructor.name);
  }
  
  public async waitForInitialization(): Promise<void> {
    const name = this.constructor.name;
    
    // If already initialized, return immediately
    if (this.isInitialized()) {
      return;
    }
    
    // If initialization is in progress, wait for it
    const initPromise = BaseService.initializationPromises.get(name);
    if (initPromise) {
      await initPromise;
      return;
    }
    
    // If no initialization is in progress and service is not initialized,
    // it means the service doesn't have an onInit method or wasn't properly initialized
    // In this case, we consider it ready
    return;
  }
}


