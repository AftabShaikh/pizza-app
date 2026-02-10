/**
 * Application logging utilities with structured logging support
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, any>;
  userId?: string;
  requestId?: string;
  performance?: {
    duration?: number;
    memory?: number;
  };
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStoredLogs: number;
  includeStackTrace: boolean;
}

class Logger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableStorage: typeof window !== 'undefined',
      maxStoredLogs: 1000,
      includeStackTrace: false,
      ...config,
    };
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: string,
    metadata?: Record<string, any>
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata,
    };

    // Add memory usage if available
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      const memory = (window as any).performance.memory;
      entry.performance = {
        memory: memory.usedJSHeapSize,
      };
    }

    return entry;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private writeLog(entry: LogEntry): void {
    // Store in memory if enabled
    if (this.config.enableStorage) {
      this.logs.push(entry);
      if (this.logs.length > this.config.maxStoredLogs) {
        this.logs = this.logs.slice(-this.config.maxStoredLogs);
      }
    }

    // Console output if enabled
    if (this.config.enableConsole) {
      const levelName = LogLevel[entry.level];
      const contextStr = entry.context ? `[${entry.context}] ` : '';
      const metadataStr = entry.metadata ? JSON.stringify(entry.metadata) : '';
      
      const fullMessage = `${entry.timestamp} ${levelName} ${contextStr}${entry.message} ${metadataStr}`.trim();

      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(fullMessage);
          break;
        case LogLevel.INFO:
          console.info(fullMessage);
          break;
        case LogLevel.WARN:
          console.warn(fullMessage);
          break;
        case LogLevel.ERROR:
          console.error(fullMessage);
          if (this.config.includeStackTrace) {
            console.trace();
          }
          break;
      }
    }
  }

  debug(message: string, context?: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.writeLog(this.formatMessage(LogLevel.DEBUG, message, context, metadata));
    }
  }

  info(message: string, context?: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.writeLog(this.formatMessage(LogLevel.INFO, message, context, metadata));
    }
  }

  warn(message: string, context?: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.writeLog(this.formatMessage(LogLevel.WARN, message, context, metadata));
    }
  }

  error(message: string, context?: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.writeLog(this.formatMessage(LogLevel.ERROR, message, context, metadata));
    }
  }

  /**
   * Get all stored logs with optional filtering
   */
  getLogs(filter?: {
    level?: LogLevel;
    context?: string;
    since?: Date;
    limit?: number;
  }): LogEntry[] {
    let results = this.logs;

    if (filter) {
      results = results.filter(log => {
        if (filter.level !== undefined && log.level < filter.level) return false;
        if (filter.context && log.context !== filter.context) return false;
        if (filter.since && new Date(log.timestamp) < filter.since) return false;
        return true;
      });

      if (filter.limit) {
        results = results.slice(-filter.limit);
      }
    }

    return results;
  }

  /**
   * Get error logs only
   */
  getErrors(limit?: number): LogEntry[] {
    return this.getLogs({ level: LogLevel.ERROR, limit });
  }

  /**
   * Get logs statistics
   */
  getStats(): {
    total: number;
    debug: number;
    info: number;
    warn: number;
    error: number;
  } {
    return {
      total: this.logs.length,
      debug: this.logs.filter(l => l.level === LogLevel.DEBUG).length,
      info: this.logs.filter(l => l.level === LogLevel.INFO).length,
      warn: this.logs.filter(l => l.level === LogLevel.WARN).length,
      error: this.logs.filter(l => l.level === LogLevel.ERROR).length,
    };
  }

  /**
   * Clear all stored logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }
}

// Create global logger instances
export const logger = new Logger({
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  includeStackTrace: process.env.NODE_ENV === 'development',
});

// Context-specific loggers
export const apiLogger = new Logger({
  level: LogLevel.INFO,
  enableStorage: true,
});

export const performanceLogger = new Logger({
  level: LogLevel.INFO,
  enableStorage: true,
});

/**
 * Structured logging for API requests
 */
export function logApiRequest(
  method: string,
  url: string,
  status?: number,
  duration?: number,
  error?: string
): void {
  const metadata = {
    method,
    url,
    status,
    duration,
    error,
  };

  if (error) {
    apiLogger.error(`API request failed: ${method} ${url}`, 'API', metadata);
  } else if (status && status >= 400) {
    apiLogger.warn(`API request error: ${method} ${url}`, 'API', metadata);
  } else {
    apiLogger.info(`API request: ${method} ${url}`, 'API', metadata);
  }
}

/**
 * Log performance metrics
 */
export function logPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, any>
): void {
  performanceLogger.info(`Performance: ${operation}`, 'PERFORMANCE', {
    duration,
    ...metadata,
  });
}

/**
 * Log user actions for analytics
 */
export function logUserAction(
  action: string,
  userId?: string,
  metadata?: Record<string, any>
): void {
  logger.info(`User action: ${action}`, 'USER', {
    userId,
    ...metadata,
  });
}

/**
 * Log application errors with context
 */
export function logError(
  error: Error | string,
  context?: string,
  metadata?: Record<string, any>
): void {
  const message = error instanceof Error ? error.message : error;
  const stack = error instanceof Error ? error.stack : undefined;
  
  logger.error(message, context, {
    stack,
    ...metadata,
  });
}