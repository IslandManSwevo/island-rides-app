import { createMockApiService, createMockAsyncStorage } from './test-utils';

// Jest globals are available through @types/jest
/// <reference types="jest" />

// Template for service tests
// Copy this template and adapt it for your services

// Placeholder class for template compilation
class ServiceName {
  isInitialized = false;
  config = { timeout: 10000, retries: 1 };
  constructor(public api: MockApiService, public storage: MockAsyncStorage, config?: Partial<ServiceConfig>) {
    if (config) this.config = { ...this.config, ...config };
  }
  async initialize() { this.isInitialized = true; }
  async fetchData(options?: Record<string, unknown>) { return []; }
  async storeData(key: string, data: Record<string, unknown>) {}
  async getData(key: string) { return null; }
  async clearData(key: string) {}
  async createItem(item: Record<string, unknown>) { return {}; }
  async updateItem(id: number, updates: Record<string, unknown>) { return {}; }
  async deleteItem(id: number) { return {}; }
  subscribe(event: string, callback: Function) {}
  unsubscribe(event: string, callback: Function) {}
  emit(event: string, data: Record<string, unknown>) {}
  destroy() { this.isInitialized = false; }
  debouncedMethod = jest.fn();
  rateLimitedMethod = jest.fn();
}

// Mock API and Storage interfaces
interface MockApiService {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
}

interface MockAsyncStorage {
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
}

interface ServiceConfig {
  timeout: number;
  retries: number;
}

describe('ServiceName', () => {
  let service: ServiceName;
  let mockApiService: MockApiService;
  let mockAsyncStorage: MockAsyncStorage;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Create mock dependencies
    mockApiService = createMockApiService();
    mockAsyncStorage = createMockAsyncStorage();
    
    // Initialize service with mocked dependencies
    service = new ServiceName(mockApiService, mockAsyncStorage);
  });

  describe('Initialization', () => {
    it('initializes correctly', () => {
      expect(service).toBeDefined();
      expect(service.isInitialized).toBe(false);
    });

    it('initializes with dependencies', async () => {
      await service.initialize();
      
      expect(service.isInitialized).toBe(true);
    });

    it('handles initialization errors', async () => {
      mockApiService.get.mockRejectedValue(new Error('Init error'));
      
      await expect(service.initialize()).rejects.toThrow('Init error');
    });
  });

  describe('Data Fetching', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('fetches data successfully', async () => {
      const mockData = [{ id: 1, name: 'Test Item' }];
      mockApiService.get.mockResolvedValue(mockData);
      
      const result = await service.fetchData();
      
      expect(result).toEqual(mockData);
      expect(mockApiService.get).toHaveBeenCalledWith('/api/data');
    });

    it('handles fetch errors', async () => {
      const mockError = new Error('Fetch error');
      mockApiService.get.mockRejectedValue(mockError);
      
      await expect(service.fetchData()).rejects.toThrow('Fetch error');
    });

    it('implements caching', async () => {
      const mockData = [{ id: 1, name: 'Test Item' }];
      mockApiService.get.mockResolvedValue(mockData);
      
      // First call should fetch from API
      const result1 = await service.fetchData();
      expect(mockApiService.get).toHaveBeenCalledTimes(1);
      
      // Second call should use cache
      const result2 = await service.fetchData();
      expect(mockApiService.get).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });

    it('invalidates cache when specified', async () => {
      const mockData = [{ id: 1, name: 'Test Item' }];
      mockApiService.get.mockResolvedValue(mockData);
      
      await service.fetchData();
      await service.fetchData({ forceRefresh: true });
      
      expect(mockApiService.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Data Persistence', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('stores data locally', async () => {
      const testData = { id: 1, name: 'Test Item' };
      
      await service.storeData('test-key', testData);
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testData)
      );
    });

    it('retrieves stored data', async () => {
      const testData = { id: 1, name: 'Test Item' };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(testData));
      
      const result = await service.getData('test-key');
      
      expect(result).toEqual(testData);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('test-key');
    });

    it('handles missing data gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      
      const result = await service.getData('missing-key');
      
      expect(result).toBeNull();
    });

    it('clears stored data', async () => {
      await service.clearData('test-key');
      
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('test-key');
    });
  });

  describe('API Operations', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('creates new items', async () => {
      const newItem = { name: 'New Item' };
      const createdItem = { id: 1, ...newItem };
      mockApiService.post.mockResolvedValue(createdItem);
      
      const result = await service.createItem(newItem);
      
      expect(result).toEqual(createdItem);
      expect(mockApiService.post).toHaveBeenCalledWith('/api/items', newItem);
    });

    it('updates existing items', async () => {
      const itemId = 1;
      const updates = { name: 'Updated Item' };
      const updatedItem = { id: itemId, ...updates };
      mockApiService.put.mockResolvedValue(updatedItem);
      
      const result = await service.updateItem(itemId, updates);
      
      expect(result).toEqual(updatedItem);
      expect(mockApiService.put).toHaveBeenCalledWith(`/api/items/${itemId}`, updates);
    });

    it('deletes items', async () => {
      const itemId = 1;
      mockApiService.delete.mockResolvedValue({ success: true });
      
      const result = await service.deleteItem(itemId);
      
      expect(result).toEqual({ success: true });
      expect(mockApiService.delete).toHaveBeenCalledWith(`/api/items/${itemId}`);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('handles network errors', async () => {
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      mockApiService.get.mockRejectedValue(networkError);
      
      await expect(service.fetchData()).rejects.toThrow('Network error');
    });

    it('handles API errors with status codes', async () => {
      const apiError = new Error('Not found') as Error & { response: { status: number; data: { message: string } } };
      apiError.response = { status: 404, data: { message: 'Not found' } };
      mockApiService.get.mockRejectedValue(apiError);
      
      await expect(service.fetchData()).rejects.toThrow('Not found');
    });

    it('handles validation errors', async () => {
      const validationError = new Error('Validation failed') as Error & { response: { status: number; data: { errors: Record<string, string> } } };
      validationError.response = { 
        status: 422, 
        data: { errors: { name: 'Name is required' } }
      };
      mockApiService.post.mockRejectedValue(validationError);
      
      await expect(service.createItem({})).rejects.toThrow('Validation failed');
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('subscribes to events', () => {
      const mockCallback = jest.fn();
      
      service.subscribe('data-updated', mockCallback);
      service.emit('data-updated', { id: 1, name: 'Updated Item' });
      
      expect(mockCallback).toHaveBeenCalledWith({ id: 1, name: 'Updated Item' });
    });

    it('unsubscribes from events', () => {
      const mockCallback = jest.fn();
      
      service.subscribe('data-updated', mockCallback);
      service.unsubscribe('data-updated', mockCallback);
      service.emit('data-updated', { id: 1, name: 'Updated Item' });
      
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('cleans up resources on destroy', async () => {
      await service.initialize();
      
      service.destroy();
      
      expect(service.isInitialized).toBe(false);
      // Add specific cleanup assertions based on your service
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('implements debouncing for frequent calls', async () => {
      const mockCallback = jest.fn();
      
      // Make multiple rapid calls
      service.debouncedMethod('param1');
      service.debouncedMethod('param2');
      service.debouncedMethod('param3');
      
      // Wait for debounce delay - fix the setTimeout callback signature
      await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith('param3');
    });

    it('implements rate limiting', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(service.rateLimitedMethod());
      }
      
      await Promise.all(promises);
      
      // Should only make allowed number of calls
      expect(mockApiService.get).toHaveBeenCalledTimes(5); // Assuming rate limit of 5
    });
  });

  describe('Configuration', () => {
    it('accepts custom configuration', () => {
      const customConfig = { timeout: 5000, retries: 3 };
      const serviceWithConfig = new ServiceName(mockApiService, mockAsyncStorage, customConfig);
      
      expect(serviceWithConfig.config).toEqual(customConfig);
    });

    it('uses default configuration when none provided', () => {
      expect(service.config).toEqual({
        timeout: 10000,
        retries: 1,
        // Other default values
      });
    });
  });
});