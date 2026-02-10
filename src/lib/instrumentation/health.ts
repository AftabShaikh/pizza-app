/**
 * Health monitoring and system metrics collection
 */

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  metrics: {
    memory?: {
      used: number;
      total: number;
      percentage: number;
    };
    performance?: {
      averageResponseTime: number;
      slowQueries: number;
      errorRate: number;
    };
    api?: {
      totalRequests: number;
      successRate: number;
      averageLatency: number;
    };
    storage?: {
      localStorageUsage: number;
      sessionStorageUsage: number;
    };
  };
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration: number;
  metadata?: Record<string, any>;
}

type HealthCheckFunction = () => Promise<HealthCheck> | HealthCheck;

class HealthMonitor {
  private checks: Map<string, HealthCheckFunction> = new Map();
  private lastHealth?: SystemHealth;
  private checkInterval?: NodeJS.Timeout;

  constructor() {
    // Register default health checks
    this.registerCheck('memory', this.checkMemoryUsage.bind(this));
    this.registerCheck('localStorage', this.checkLocalStorage.bind(this));
    this.registerCheck('api', this.checkApiHealth.bind(this));
  }

  /**
   * Register a health check
   */
  registerCheck(name: string, checkFn: HealthCheckFunction): void {
    this.checks.set(name, checkFn);
  }

  /**
   * Remove a health check
   */
  removeCheck(name: string): void {
    this.checks.delete(name);
  }

  /**
   * Run all health checks and return system health
   */
  async checkHealth(): Promise<SystemHealth> {
    const timestamp = new Date().toISOString();
    const checks: HealthCheck[] = [];

    // Run all registered checks
    for (const [name, checkFn] of this.checks) {
      const startTime = performance.now();
      try {
        const result = await checkFn();
        checks.push({
          ...result,
          name,
          duration: performance.now() - startTime,
        });
      } catch (error) {
        checks.push({
          name,
          status: 'fail',
          message: error instanceof Error ? error.message : 'Unknown error',
          duration: performance.now() - startTime,
        });
      }
    }

    // Determine overall status
    const hasFailures = checks.some(check => check.status === 'fail');
    const hasWarnings = checks.some(check => check.status === 'warn');
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (hasFailures) {
      status = 'unhealthy';
    } else if (hasWarnings) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    // Collect metrics
    const metrics = await this.collectMetrics();

    const health: SystemHealth = {
      status,
      timestamp,
      metrics,
      checks,
    };

    this.lastHealth = health;
    return health;
  }

  /**
   * Get the last health check result
   */
  getLastHealth(): SystemHealth | undefined {
    return this.lastHealth;
  }

  /**
   * Start periodic health monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    this.stopMonitoring(); // Clear any existing interval
    
    this.checkInterval = setInterval(async () => {
      try {
        await this.checkHealth();
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, intervalMs);

    // Run initial check
    this.checkHealth();
  }

  /**
   * Stop periodic health monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }

  /**
   * Collect system metrics
   */
  private async collectMetrics(): Promise<SystemHealth['metrics']> {
    const metrics: SystemHealth['metrics'] = {};

    // Memory metrics (browser only)
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      const memory = (window as any).performance.memory;
      metrics.memory = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
      };
    }

    // Storage metrics (browser only)
    if (typeof window !== 'undefined') {
      try {
        const localStorageUsage = JSON.stringify(localStorage).length;
        const sessionStorageUsage = JSON.stringify(sessionStorage).length;
        
        metrics.storage = {
          localStorageUsage,
          sessionStorageUsage,
        };
      } catch (error) {
        // Storage access might be blocked
      }
    }

    return metrics;
  }

  /**
   * Default health check: Memory usage
   */
  private checkMemoryUsage(): HealthCheck {
    if (typeof window === 'undefined' || !(window as any).performance?.memory) {
      return {
        name: 'memory',
        status: 'warn',
        message: 'Memory metrics not available',
        duration: 0,
      };
    }

    const memory = (window as any).performance.memory;
    const percentage = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;

    let status: 'pass' | 'warn' | 'fail';
    let message: string;

    if (percentage > 90) {
      status = 'fail';
      message = `High memory usage: ${percentage.toFixed(1)}%`;
    } else if (percentage > 70) {
      status = 'warn';
      message = `Moderate memory usage: ${percentage.toFixed(1)}%`;
    } else {
      status = 'pass';
      message = `Memory usage normal: ${percentage.toFixed(1)}%`;
    }

    return {
      name: 'memory',
      status,
      message,
      duration: 0,
      metadata: {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage,
      },
    };
  }

  /**
   * Default health check: Local storage
   */
  private checkLocalStorage(): HealthCheck {
    if (typeof window === 'undefined') {
      return {
        name: 'localStorage',
        status: 'warn',
        message: 'localStorage not available (server-side)',
        duration: 0,
      };
    }

    try {
      // Try to write and read from localStorage
      const testKey = 'health-check-test';
      const testValue = 'test';
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (retrieved === testValue) {
        return {
          name: 'localStorage',
          status: 'pass',
          message: 'localStorage working correctly',
          duration: 0,
        };
      } else {
        return {
          name: 'localStorage',
          status: 'fail',
          message: 'localStorage read/write test failed',
          duration: 0,
        };
      }
    } catch (error) {
      return {
        name: 'localStorage',
        status: 'fail',
        message: `localStorage error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 0,
      };
    }
  }

  /**
   * Default health check: API connectivity
   */
  private async checkApiHealth(): HealthCheck {
    try {
      const startTime = performance.now();
      
      // Test a lightweight API endpoint
      const response = await fetch('/api/pizzas', {
        method: 'HEAD', // Use HEAD for minimal overhead
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const duration = performance.now() - startTime;

      if (response.ok) {
        return {
          name: 'api',
          status: duration > 2000 ? 'warn' : 'pass',
          message: duration > 2000 ? `API slow: ${duration.toFixed(0)}ms` : `API healthy: ${duration.toFixed(0)}ms`,
          duration,
          metadata: {
            status: response.status,
            latency: duration,
          },
        };
      } else {
        return {
          name: 'api',
          status: 'fail',
          message: `API error: ${response.status} ${response.statusText}`,
          duration,
          metadata: {
            status: response.status,
            statusText: response.statusText,
          },
        };
      }
    } catch (error) {
      return {
        name: 'api',
        status: 'fail',
        message: `API unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 0,
      };
    }
  }
}

// Global health monitor instance
export const healthMonitor = new HealthMonitor();

/**
 * Custom health check for cart functionality
 */
export function createCartHealthCheck(): HealthCheck {
  try {
    // Check if cart context is working
    const cartData = localStorage.getItem('pizza-cart');
    const isValidJson = cartData ? JSON.parse(cartData) : [];
    
    return {
      name: 'cart',
      status: 'pass',
      message: 'Cart functionality healthy',
      duration: 0,
      metadata: {
        cartItems: Array.isArray(isValidJson) ? isValidJson.length : 0,
      },
    };
  } catch (error) {
    return {
      name: 'cart',
      status: 'fail',
      message: `Cart health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: 0,
    };
  }
}

/**
 * Custom health check for user session
 */
export function createUserHealthCheck(): HealthCheck {
  try {
    const userData = localStorage.getItem('pizza-user');
    const user = userData ? JSON.parse(userData) : null;
    
    return {
      name: 'userSession',
      status: 'pass',
      message: user ? 'User session active' : 'No active user session',
      duration: 0,
      metadata: {
        hasUser: !!user,
        userId: user?.id,
      },
    };
  } catch (error) {
    return {
      name: 'userSession',
      status: 'fail',
      message: `User session check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: 0,
    };
  }
}