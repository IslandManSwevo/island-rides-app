/**
 * Component Rendering Performance Monitor
 * Tracks component render times, re-renders, and identifies performance bottlenecks
 */

import React from 'react';

interface ComponentTiming {
  name: string;
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  lastRenderTime: number;
  slowRenders: number; // renders > 16ms
  verySlowRenders: number; // renders > 50ms
  firstRenderTime?: number;
  mountTime?: number;
  isCurrentlyRendering: boolean;
  renderHistory: Array<{ timestamp: number; duration: number; props?: any }>;
}

export class ComponentRenderMonitor {
  private static instance: ComponentRenderMonitor;
  private componentTimings: Map<string, ComponentTiming> = new Map();
  private renderDepth: number = 0;
  private totalComponents: number = 0;

  static getInstance(): ComponentRenderMonitor {
    if (!ComponentRenderMonitor.instance) {
      ComponentRenderMonitor.instance = new ComponentRenderMonitor();
    }
    return ComponentRenderMonitor.instance;
  }

  /**
   * Start monitoring React component rendering
   */
  startComponentMonitoring() {
    console.log('🔍 [RENDER MONITOR] Starting component rendering monitoring...');
    
    // Wrap React.createElement to monitor component creation
    this.wrapReactCreateElement();
    
    // Set up performance observer for React DevTools integration
    this.setupPerformanceObserver();
    
    // Set up periodic reporting
    this.setupPeriodicReporting();
  }

  private wrapReactCreateElement() {
    if (typeof React !== 'undefined' && React.createElement) {
      const originalCreateElement = React.createElement;
      
      React.createElement = ((type: any, props: Record<string, unknown>, ...children: unknown[]) => {
        const componentName = this.getComponentName(type);
        const startTime = performance.now();
        
        try {
          // Track render start
          this.trackRenderStart(componentName, props);
          
          const element = originalCreateElement(type, props, ...(children as React.ReactNode[]));
          
          const renderTime = performance.now() - startTime;
          this.trackRenderComplete(componentName, renderTime, props);
          
          return element;
        } catch (error) {
          const renderTime = performance.now() - startTime;
          this.trackRenderError(componentName, renderTime, error);
          throw error;
        }
      }) as any;
    }
  }

  private getComponentName(type: any): string {
    if (typeof type === 'string') return type; // HTML elements
    if (typeof type === 'function') return type.displayName || type.name || 'Anonymous';
    if (type && typeof type === 'object') {
      if (type.displayName) return type.displayName;
      if (type.name) return type.name;
      if (type.type && type.type.name) return type.type.name;
    }
    return 'Unknown';
  }

  private trackRenderStart(componentName: string, props?: any) {
    this.renderDepth++;
    
    let timing = this.componentTimings.get(componentName);
    if (!timing) {
      timing = {
        name: componentName,
        renderCount: 0,
        totalRenderTime: 0,
        averageRenderTime: 0,
        lastRenderTime: 0,
        slowRenders: 0,
        verySlowRenders: 0,
        isCurrentlyRendering: true,
        renderHistory: []
      };
      this.componentTimings.set(componentName, timing);
      this.totalComponents++;
    }
    
    timing.isCurrentlyRendering = true;
  }

  private trackRenderComplete(componentName: string, renderTime: number, props?: any) {
    this.renderDepth--;
    
    const timing = this.componentTimings.get(componentName);
    if (!timing) return;
    
    timing.renderCount++;
    timing.totalRenderTime += renderTime;
    timing.averageRenderTime = timing.totalRenderTime / timing.renderCount;
    timing.lastRenderTime = renderTime;
    timing.isCurrentlyRendering = false;
    
    // Track first render separately
    if (timing.renderCount === 1) {
      timing.firstRenderTime = renderTime;
      timing.mountTime = performance.now();
    }
    
    // Categorize render performance
    if (renderTime > 16) timing.slowRenders++;
    if (renderTime > 50) timing.verySlowRenders++;
    
    // Store render history (keep last 10 renders)
    timing.renderHistory.push({
      timestamp: performance.now(),
      duration: renderTime,
      props: this.sanitizeProps(props)
    });
    
    if (timing.renderHistory.length > 10) {
      timing.renderHistory.shift();
    }
    
    // Alert on performance issues
    this.checkRenderPerformance(componentName, renderTime, timing);
  }

  private trackRenderError(componentName: string, renderTime: number, error: Error | unknown) {
    console.error(`❌ [RENDER MONITOR] Render error in ${componentName} after ${renderTime.toFixed(2)}ms:`, error);
    
    const timing = this.componentTimings.get(componentName);
    if (timing) {
      timing.isCurrentlyRendering = false;
    }
  }

  private sanitizeProps(props: Record<string, unknown>): any {
    if (!props) return undefined;
    
    // Only keep primitive values to avoid circular references
    const sanitized: any = {};
    Object.keys(props).forEach(key => {
      const value = props[key];
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        sanitized[key] = `Array(${value.length})`;
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = `Object`;
      } else if (typeof value === 'function') {
        sanitized[key] = `Function`;
      }
    });
    
    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }

  private checkRenderPerformance(componentName: string, renderTime: number, timing: ComponentTiming) {
    // Alert on very slow renders (>50ms)
    if (renderTime > 50) {
      console.warn(`🐌 [RENDER MONITOR] VERY SLOW RENDER: ${componentName} took ${renderTime.toFixed(2)}ms
        Average: ${timing.averageRenderTime.toFixed(2)}ms
        Total Renders: ${timing.renderCount}
        Slow Renders: ${timing.verySlowRenders}/${timing.renderCount}
      `);
      
      this.suggestOptimizations(componentName, timing);
    }
    
    // Alert on frequent slow renders
    if (timing.renderCount >= 5 && timing.slowRenders / timing.renderCount > 0.5) {
      console.warn(`⚠️ [RENDER MONITOR] FREQUENT SLOW RENDERS: ${componentName}
        ${timing.slowRenders}/${timing.renderCount} renders > 16ms
        Consider optimization strategies
      `);
    }
    
    // Alert on excessive re-renders
    if (timing.renderCount > 20 && timing.renderCount % 10 === 0) {
      console.warn(`🔄 [RENDER MONITOR] EXCESSIVE RE-RENDERS: ${componentName}
        Render Count: ${timing.renderCount}
        This may indicate unnecessary re-renders
      `);
    }
  }

  private suggestOptimizations(componentName: string, timing: ComponentTiming) {
    const suggestions = [];
    
    if (timing.averageRenderTime > 30) {
      suggestions.push('- Consider React.memo() to prevent unnecessary re-renders');
      suggestions.push('- Use useMemo() for expensive calculations');
      suggestions.push('- Use useCallback() for event handlers');
    }
    
    if (timing.renderCount > 50) {
      suggestions.push('- Check for prop changes causing re-renders');
      suggestions.push('- Consider component splitting for better granularity');
    }
    
    if (timing.slowRenders > 10) {
      suggestions.push('- Profile component with React DevTools Profiler');
      suggestions.push('- Look for expensive operations in render method');
      suggestions.push('- Consider virtualizing long lists');
    }
    
    if (suggestions.length > 0) {
      console.log(`💡 [RENDER MONITOR] OPTIMIZATION SUGGESTIONS for ${componentName}:
        ${suggestions.join('\n        ')}
      `);
    }
  }

  private setupPerformanceObserver() {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name.includes('React') || entry.name.includes('render')) {
              console.log(`📊 [RENDER MONITOR] Performance entry: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
            }
          });
        });
        
        observer.observe({ entryTypes: ['measure', 'mark'] });
      } catch (error) {
        console.warn('⚠️ [RENDER MONITOR] Could not set up PerformanceObserver:', error);
      }
    }
  }

  private setupPeriodicReporting() {
    // Report every 30 seconds during development
    if (__DEV__) {
      setInterval(() => {
        this.generatePerformanceReport();
      }, 30000);
    }
  }

  private generatePerformanceReport() {
    const components = Array.from(this.componentTimings.values())
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime);
    
    const slowComponents = components.filter(c => c.averageRenderTime > 16);
    const frequentComponents = components.filter(c => c.renderCount > 10);
    const problematicComponents = components.filter(c => c.verySlowRenders > 0);
    
    console.log(`📊 [RENDER MONITOR] PERIODIC PERFORMANCE REPORT:
      Total Components Tracked: ${this.totalComponents}
      Currently Rendering: ${components.filter(c => c.isCurrentlyRendering).length}
      
      SLOW COMPONENTS (avg >16ms):
      ${slowComponents.slice(0, 5).map(c => 
        `  ${c.name}: ${c.averageRenderTime.toFixed(2)}ms avg (${c.renderCount} renders)`
      ).join('\n      ')}
      
      FREQUENT RENDERERS (>10 renders):
      ${frequentComponents.slice(0, 5).map(c => 
        `  ${c.name}: ${c.renderCount} renders, ${c.averageRenderTime.toFixed(2)}ms avg`
      ).join('\n      ')}
      
      PROBLEMATIC COMPONENTS (renders >50ms):
      ${problematicComponents.map(c => 
        `  ${c.name}: ${c.verySlowRenders} very slow renders`
      ).join('\n      ')}
    `);
  }

  /**
   * Get real-time component metrics
   */
  getMetrics() {
    const components = Array.from(this.componentTimings.values());
    
    return {
      totalComponents: this.totalComponents,
      currentlyRendering: components.filter(c => c.isCurrentlyRendering).length,
      renderDepth: this.renderDepth,
      slowComponents: components.filter(c => c.averageRenderTime > 16).length,
      problematicComponents: components.filter(c => c.verySlowRenders > 0).length,
      topSlowComponents: components
        .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
        .slice(0, 10)
        .map(c => ({
          name: c.name,
          averageRenderTime: c.averageRenderTime,
          renderCount: c.renderCount,
          slowRenders: c.slowRenders,
          verySlowRenders: c.verySlowRenders
        })),
      summary: {
        totalRenders: components.reduce((sum, c) => sum + c.renderCount, 0),
        totalRenderTime: components.reduce((sum, c) => sum + c.totalRenderTime, 0),
        averageRenderTime: components.length > 0 
          ? components.reduce((sum, c) => sum + c.averageRenderTime, 0) / components.length 
          : 0
      }
    };
  }

  /**
   * Get detailed metrics for a specific component
   */
  getComponentMetrics(componentName: string) {
    return this.componentTimings.get(componentName);
  }

  /**
   * Manually track a component render (for custom monitoring)
   */
  trackManualRender(componentName: string, renderTime: number, props?: any) {
    this.trackRenderStart(componentName, props);
    this.trackRenderComplete(componentName, renderTime, props);
  }
}

// Auto-initialize when module loads
const componentRenderMonitor = ComponentRenderMonitor.getInstance();
export default componentRenderMonitor;