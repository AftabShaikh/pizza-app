/**
 * Performance monitoring utilities for tracking method execution times
 * and identifying long-running operations that could cause delays
 */

export interface PerformanceMetric {
  id: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'running' | 'completed' | 'error';
  error?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceThresholds {
  warning: number;  // ms
  critical: number; // ms
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private completedMetrics: PerformanceMetric[] = [];
  private thresholds: PerformanceThresholds;
  private maxRetainedMetrics: number;

  constructor(
    thresholds: PerformanceThresholds = { warning: 1000, critical: 3000 },
    maxRetainedMetrics: number = 1000
  ) {
    this.thresholds = thresholds;
    this.maxRetainedMetrics = maxRetainedMetrics;
  }

  /**
   * Start tracking a method execution
   */
  startTracking(method: string, metadata?: Record<string, any>): string {
    const id = `${method}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metric: PerformanceMetric = {
      id,
      method,
      startTime: performance.now(),
      status: 'running',
      metadata,
    };

    this.metrics.set(id, metric);
    
    // Log start if in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 [SRE] Started tracking: ${method}`, { id, metadata });
    }

    return id;
  }

  /**
   * Stop tracking a method execution
   */
  stopTracking(id: string, error?: string): PerformanceMetric | null {
    const metric = this.metrics.get(id);
    if (!metric) {
      console.warn(`[SRE] Metric with id ${id} not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    const completedMetric: PerformanceMetric = {
      ...metric,
      endTime,
      duration,
      status: error ? 'error' : 'completed',
      error,
    };

    this.metrics.delete(id);
    this.completedMetrics.push(completedMetric);

    // Clean up old metrics if we exceed the limit
    if (this.completedMetrics.length > this.maxRetainedMetrics) {
      this.completedMetrics = this.completedMetrics.slice(-this.maxRetainedMetrics);
    }

    // Log completion and check thresholds
    this.logMetric(completedMetric);

    return completedMetric;
  }

  /**
   * Get all running metrics
   */
  getRunningMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get completed metrics with optional filtering
   */
  getCompletedMetrics(filter?: {
    method?: string;
    minDuration?: number;
    maxDuration?: number;
    status?: 'completed' | 'error';
  }): PerformanceMetric[] {
    let results = this.completedMetrics;

    if (filter) {
      results = results.filter(metric => {
        if (filter.method && metric.method !== filter.method) return false;
        if (filter.status && metric.status !== filter.status) return false;
        if (filter.minDuration && (metric.duration ?? 0) < filter.minDuration) return false;
        if (filter.maxDuration && (metric.duration ?? 0) > filter.maxDuration) return false;
        return true;
      });
    }

    return results;
  }

  /**
   * Get slow methods that exceed thresholds
   */
  getSlowMethods(): {
    warning: PerformanceMetric[];
    critical: PerformanceMetric[];
  } {
    const warning = this.completedMetrics.filter(
      m => m.duration && m.duration > this.thresholds.warning && m.duration < this.thresholds.critical
    );
    const critical = this.completedMetrics.filter(
      m => m.duration && m.duration >= this.thresholds.critical
    );

    return { warning, critical };
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    totalMethods: number;
    runningMethods: number;
    averageDuration: number;
    slowMethods: number;
    errorRate: number;
  } {
    const total = this.completedMetrics.length;
    const running = this.metrics.size;
    const errors = this.completedMetrics.filter(m => m.status === 'error').length;
    const totalDuration = this.completedMetrics.reduce((sum, m) => sum + (m.duration ?? 0), 0);
    const slowMethods = this.completedMetrics.filter(
      m => m.duration && m.duration > this.thresholds.warning
    ).length;

    return {
      totalMethods: total,
      runningMethods: running,
      averageDuration: total > 0 ? totalDuration / total : 0,
      slowMethods,
      errorRate: total > 0 ? (errors / total) * 100 : 0,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.completedMetrics = [];
  }

  /**
   * Log metric with appropriate level based on performance
   */
  private logMetric(metric: PerformanceMetric): void {
    if (process.env.NODE_ENV !== 'development') return;

    const duration = metric.duration ?? 0;
    const baseMessage = `[SRE] ${metric.method} completed in ${duration.toFixed(2)}ms`;

    if (metric.status === 'error') {
      console.error(`❌ ${baseMessage} with error:`, metric.error);
    } else if (duration >= this.thresholds.critical) {
      console.error(`🚨 ${baseMessage} (CRITICAL SLOW)`);
    } else if (duration >= this.thresholds.warning) {
      console.warn(`⚠️  ${baseMessage} (slow)`);
    } else {
      console.log(`✅ ${baseMessage}`);
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for automatic method tracking
 */
export function trackPerformance(method?: string) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const methodName = method || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function(...args: any[]) {
      const trackingId = performanceMonitor.startTracking(methodName, {
        args: args.length,
        className: target.constructor.name,
      });

      try {
        const result = await originalMethod.apply(this, args);
        performanceMonitor.stopTracking(trackingId);
        return result;
      } catch (error) {
        performanceMonitor.stopTracking(trackingId, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Hook for tracking React component rendering performance
 */
export function usePerformanceTracking(componentName: string, dependencies?: any[]) {
  if (typeof window === 'undefined') return; // Skip on server

  const React = require('react');
  
  React.useEffect(() => {
    const trackingId = performanceMonitor.startTracking(`React.${componentName}.render`);
    
    return () => {
      performanceMonitor.stopTracking(trackingId);
    };
  }, dependencies);
}

/**
 * Utility to track async operations manually
 */
export async function trackAsyncOperation<T>(
  methodName: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const trackingId = performanceMonitor.startTracking(methodName, metadata);
  
  try {
    const result = await operation();
    performanceMonitor.stopTracking(trackingId);
    return result;
  } catch (error) {
    performanceMonitor.stopTracking(trackingId, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Utility to track synchronous operations
 */
export function trackSyncOperation<T>(
  methodName: string,
  operation: () => T,
  metadata?: Record<string, any>
): T {
  const trackingId = performanceMonitor.startTracking(methodName, metadata);
  
  try {
    const result = operation();
    performanceMonitor.stopTracking(trackingId);
    return result;
  } catch (error) {
    performanceMonitor.stopTracking(trackingId, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}