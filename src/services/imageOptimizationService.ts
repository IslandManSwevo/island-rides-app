/**
 * Image Optimization Service
 * Handles lazy loading, compression, WebP format support, and caching for images
 */

import { Image, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { performanceMonitor } from './PerformanceMonitor';
import { loggingService } from './LoggingService';
import { analyticsService } from './analyticsService';

export interface ImageOptimizationConfig {
  enableWebP: boolean;
  enableLazyLoading: boolean;
  compressionQuality: number; // 0-1
  maxCacheSize: number; // in MB
  cacheTTL: number; // in milliseconds
  preloadDistance: number; // pixels from viewport
  placeholderColor: string;
  enableProgressiveLoading: boolean;
}

export interface OptimizedImageProps {
  source: { uri: string } | number;
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  placeholder?: string;
  fallback?: string;
  onLoad?: () => void;
  onError?: (error: any) => void;
  lazy?: boolean;
  priority?: 'low' | 'normal' | 'high';
  sizes?: string; // For responsive images
}

export interface ImageCacheEntry {
  uri: string;
  localPath: string;
  size: number;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

class ImageOptimizationService {
  private config: ImageOptimizationConfig = {
    enableWebP: Platform.OS === 'android', // WebP support varies by platform
    enableLazyLoading: true,
    compressionQuality: 0.8,
    maxCacheSize: 100, // 100MB
    cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
    preloadDistance: 200,
    placeholderColor: '#f0f0f0',
    enableProgressiveLoading: true,
  };

  private imageCache: Map<string, ImageCacheEntry> = new Map();
  private loadingImages: Set<string> = new Set();
  private preloadQueue: Set<string> = new Set();
  private intersectionObserver: any = null;

  constructor() {
    this.initializeCache();
    this.setupIntersectionObserver();
  }

  /**
   * Initialize image cache from storage
   */
  private async initializeCache(): Promise<void> {
    try {
      const cacheData = await AsyncStorage.getItem('image_cache_metadata');
      if (cacheData) {
        const entries: ImageCacheEntry[] = JSON.parse(cacheData);
        entries.forEach(entry => {
          this.imageCache.set(entry.uri, entry);
        });
        
        // Clean expired entries
        await this.cleanExpiredCache();
      }
    } catch (error) {
      loggingService.warn('Failed to initialize image cache', error as Error);
    }
  }

  /**
   * Setup intersection observer for lazy loading
   */
  private setupIntersectionObserver(): void {
    // Note: React Native doesn't have IntersectionObserver
    // This would be implemented using onLayout and scroll events
    // For now, we'll use a simplified approach
  }

  /**
   * Optimize image URL for best format and size
   */
  optimizeImageUrl(originalUrl: string, width?: number, height?: number): string {
    if (!originalUrl) return originalUrl;

    let optimizedUrl = originalUrl;

    // Add WebP format if supported
    if (this.config.enableWebP && !originalUrl.includes('.webp')) {
      // Assume the image service supports format conversion
      const separator = originalUrl.includes('?') ? '&' : '?';
      optimizedUrl += `${separator}format=webp`;
    }

    // Add size parameters if provided
    if (width || height) {
      const separator = optimizedUrl.includes('?') ? '&' : '?';
      const sizeParams = [];
      if (width) sizeParams.push(`w=${Math.round(width)}`);
      if (height) sizeParams.push(`h=${Math.round(height)}`);
      optimizedUrl += `${separator}${sizeParams.join('&')}`;
    }

    // Add quality parameter
    if (this.config.compressionQuality < 1) {
      const separator = optimizedUrl.includes('?') ? '&' : '?';
      optimizedUrl += `${separator}q=${Math.round(this.config.compressionQuality * 100)}`;
    }

    return optimizedUrl;
  }

  /**
   * Preload image
   */
  async preloadImage(uri: string, priority: 'low' | 'normal' | 'high' = 'normal'): Promise<void> {
    if (this.preloadQueue.has(uri) || this.loadingImages.has(uri)) {
      return;
    }

    this.preloadQueue.add(uri);

    try {
      const startTime = Date.now();
      
      // Check if already cached
      const cached = this.imageCache.get(uri);
      if (cached && this.isCacheValid(cached)) {
        this.preloadQueue.delete(uri);
        return;
      }

      // Preload the image
      await new Promise<void>((resolve, reject) => {
        Image.prefetch(uri)
          .then(() => {
            const loadTime = Date.now() - startTime;
            
            // Track metrics
            performanceMonitor.recordMetric('image_preload_time', loadTime);
            analyticsService.trackEvent('image_preloaded', {
              uri,
              loadTime,
              priority,
            });
            
            resolve();
          })
          .catch(reject);
      });

    } catch (error) {
      loggingService.warn('Failed to preload image', error as Error, { uri });
    } finally {
      this.preloadQueue.delete(uri);
    }
  }

  /**
   * Load image with optimization
   */
  async loadOptimizedImage(
    uri: string,
    width?: number,
    height?: number,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<string> {
    const optimizedUri = this.optimizeImageUrl(uri, width, height);
    
    // Check cache first
    const cached = this.imageCache.get(optimizedUri);
    if (cached && this.isCacheValid(cached)) {
      this.updateCacheAccess(optimizedUri);
      return cached.localPath || optimizedUri;
    }

    // Load image
    if (this.loadingImages.has(optimizedUri)) {
      // Wait for existing load to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.loadingImages.has(optimizedUri)) {
            clearInterval(checkInterval);
            const entry = this.imageCache.get(optimizedUri);
            resolve(entry?.localPath || optimizedUri);
          }
        }, 100);
      });
    }

    this.loadingImages.add(optimizedUri);

    try {
      const startTime = Date.now();
      
      // For React Native, we'll use the optimized URI directly
      // In a real implementation, you might download and cache locally
      const loadTime = Date.now() - startTime;
      
      // Cache the result
      const cacheEntry: ImageCacheEntry = {
        uri: optimizedUri,
        localPath: optimizedUri, // In RN, we use the URI directly
        size: 0, // Would calculate actual size in real implementation
        timestamp: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now(),
      };
      
      this.imageCache.set(optimizedUri, cacheEntry);
      await this.saveCacheMetadata();
      
      // Track metrics
      performanceMonitor.recordMetric('image_load_time', loadTime);
      analyticsService.trackEvent('image_loaded', {
        uri: optimizedUri,
        loadTime,
        priority,
        fromCache: false,
      });
      
      return optimizedUri;
      
    } catch (error) {
      loggingService.error('Failed to load optimized image', error as Error, { uri: optimizedUri });
      throw error;
    } finally {
      this.loadingImages.delete(optimizedUri);
    }
  }

  /**
   * Generate responsive image sizes
   */
  generateResponsiveSizes(baseWidth: number, baseHeight: number): Array<{width: number, height: number, density: string}> {
    const densities = ['1x', '2x', '3x'];
    const sizes = [];
    
    for (const density of densities) {
      const multiplier = parseFloat(density);
      sizes.push({
        width: Math.round(baseWidth * multiplier),
        height: Math.round(baseHeight * multiplier),
        density,
      });
    }
    
    return sizes;
  }

  /**
   * Create placeholder image data URL
   */
  createPlaceholder(width: number, height: number, color: string = this.config.placeholderColor): string {
    // Create a simple colored rectangle as base64 data URL
    // This is a simplified version - in practice, you might generate actual image data
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${color}"/>
      </svg>
    `)}`;
  }

  /**
   * Batch preload images
   */
  async batchPreloadImages(uris: string[], priority: 'low' | 'normal' | 'high' = 'normal'): Promise<void> {
    const batchSize = 3; // Limit concurrent preloads
    const batches = [];
    
    for (let i = 0; i < uris.length; i += batchSize) {
      batches.push(uris.slice(i, i + batchSize));
    }
    
    for (const batch of batches) {
      await Promise.allSettled(
        batch.map(uri => this.preloadImage(uri, priority))
      );
    }
    
    analyticsService.trackEvent('batch_preload_completed', {
      totalImages: uris.length,
      batchSize,
      priority,
    });
  }

  /**
   * Check if cache entry is valid
   */
  private isCacheValid(entry: ImageCacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < this.config.cacheTTL;
  }

  /**
   * Update cache access statistics
   */
  private updateCacheAccess(uri: string): void {
    const entry = this.imageCache.get(uri);
    if (entry) {
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      this.imageCache.set(uri, entry);
    }
  }

  /**
   * Clean expired cache entries
   */
  private async cleanExpiredCache(): Promise<void> {
    const now = Date.now();
    const expiredEntries: string[] = [];
    
    for (const [uri, entry] of this.imageCache.entries()) {
      if (!this.isCacheValid(entry)) {
        expiredEntries.push(uri);
      }
    }
    
    expiredEntries.forEach(uri => {
      this.imageCache.delete(uri);
    });
    
    if (expiredEntries.length > 0) {
      await this.saveCacheMetadata();
      loggingService.info('Cleaned expired image cache entries', { count: expiredEntries.length });
    }
  }

  /**
   * Save cache metadata to storage
   */
  private async saveCacheMetadata(): Promise<void> {
    try {
      const entries = Array.from(this.imageCache.values());
      await AsyncStorage.setItem('image_cache_metadata', JSON.stringify(entries));
    } catch (error) {
      loggingService.warn('Failed to save image cache metadata', error as Error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const entries = Array.from(this.imageCache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const timestamps = entries.map(entry => entry.timestamp);
    
    return {
      totalEntries: entries.length,
      totalSize,
      hitRate: totalAccess > 0 ? (entries.length / totalAccess) * 100 : 0,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0,
    };
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    this.imageCache.clear();
    await AsyncStorage.removeItem('image_cache_metadata');
    
    analyticsService.trackEvent('image_cache_cleared', {
      timestamp: new Date().toISOString(),
    });
    
    loggingService.info('Image cache cleared');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ImageOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    analyticsService.trackEvent('image_optimization_config_updated', {
      config: this.config,
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): ImageOptimizationConfig {
    return { ...this.config };
  }
}

export const imageOptimizationService = new ImageOptimizationService();
