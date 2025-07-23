/**
 * PerformanceMonitor - Tracks and analyzes performance metrics
 * Part of Initiative 2: Performance Baseline & Monitoring
 */
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();
  
  /**
   * Start a timer for an operation
   * @param operation - The operation name to track
   * @returns Function to call when operation completes
   */
  startTimer(operation: string): () => void {
    const start = Date.now();
    const sessionId = `${operation}_${start}_${Math.random()}`;
    this.startTimes.set(sessionId, start);
    
    return () => {
      const startTime = this.startTimes.get(sessionId);
      if (startTime) {
        const duration = Date.now() - startTime;
        this.recordMetric(operation, duration);
        this.startTimes.delete(sessionId);
        
        // Alert on slow operations
        if (duration > 500) {
          console.warn(`🐌 Slow operation detected: ${operation} took ${duration}ms`);
          
          // Log additional context for very slow operations
          if (duration > 1000) {
            console.warn(`⚠️ Very slow operation: ${operation} took ${duration}ms - consider optimization`);
          }
        }
      }
    };
  }
  
  /**
   * Record a metric value
   * @param operation - The operation name
   * @param duration - The duration in milliseconds
   */
  recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const metrics = this.metrics.get(operation)!;
    metrics.push(duration);
    
    // Keep only the last 100 measurements to avoid memory issues
    if (metrics.length > 100) {
      metrics.shift();
    }
  }
  
  /**
   * Get average time for an operation
   * @param operation - The operation name
   * @returns Average duration in milliseconds
   */
  getAverageTime(operation: string): number {
    const times = this.metrics.get(operation) || [];
    if (times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }
  
  /**
   * Get median time for an operation
   * @param operation - The operation name
   * @returns Median duration in milliseconds
   */
  getMedianTime(operation: string): number {
    const times = this.metrics.get(operation) || [];
    if (times.length === 0) return 0;
    
    const sorted = [...times].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 !== 0 
      ? sorted[mid] 
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }
  
  /**
   * Get 95th percentile time for an operation
   * @param operation - The operation name
   * @returns 95th percentile duration in milliseconds
   */
  getP95Time(operation: string): number {
    const times = this.metrics.get(operation) || [];
    if (times.length === 0) return 0;
    
    const sorted = [...times].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[Math.max(0, index)];
  }
  
  /**
   * Get performance statistics for an operation
   * @param operation - The operation name
   * @returns Performance statistics object
   */
  getStats(operation: string): {
    operation: string;
    count: number;
    average: number;
    median: number;
    p95: number;
    min: number;
    max: number;
  } {
    const times = this.metrics.get(operation) || [];
    
    return {
      operation,
      count: times.length,
      average: this.getAverageTime(operation),
      median: this.getMedianTime(operation),
      p95: this.getP95Time(operation),
      min: times.length > 0 ? Math.min(...times) : 0,
      max: times.length > 0 ? Math.max(...times) : 0,
    };
  }
  
  /**
   * Get all tracked operations
   * @returns Array of operation names
   */
  getTrackedOperations(): string[] {
    return Array.from(this.metrics.keys());
  }
  
  /**
   * Get all performance statistics
   * @returns Array of performance statistics for all operations
   */
  getAllStats(): ReturnType<typeof this.getStats>[] {
    return this.getTrackedOperations().map(operation => this.getStats(operation));
  }
  
  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }
  
  /**
   * Clear metrics for a specific operation
   * @param operation - The operation name to clear
   */
  clearOperation(operation: string): void {
    this.metrics.delete(operation);
  }
  
  /**
   * Log performance summary to console
   */
  logSummary(): void {
    const stats = this.getAllStats();
    
    if (stats.length === 0) {
      console.log('📊 Performance Monitor: No metrics recorded yet');
      return;
    }
    
    console.log('📊 Performance Monitor Summary:');
    console.log('================================');
    
    stats
      .sort((a, b) => b.average - a.average) // Sort by average time, slowest first
      .forEach(stat => {
        console.log(
          `🔹 ${stat.operation}: avg: ${Math.round(stat.average)}ms, ` +
          `median: ${Math.round(stat.median)}ms, ` +
          `p95: ${Math.round(stat.p95)}ms, ` +
          `count: ${stat.count}`
        );
      });
  }
  
  /**
   * Get slow operations (above threshold)
   * @param threshold - Threshold in milliseconds (default: 500ms)
   * @returns Array of operations with average time above threshold
   */
  getSlowOperations(threshold: number = 500): ReturnType<typeof this.getStats>[] {
    return this.getAllStats().filter(stat => stat.average > threshold);
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Export the class for testing
export { PerformanceMonitor };