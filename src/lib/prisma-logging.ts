/**
 * Prisma Logging Extension
 * 
 * This module extends Prisma client with automatic query logging,
 * performance monitoring, and error tracking for all database operations.
 */

import { Prisma, PrismaClient } from '@prisma/client';
import { appLogger, createTimer } from './logger';

// Interface for query metadata
interface QueryMetadata {
  model?: string;
  operation: string;
  duration: number;
  args?: any;
  result?: any;
  error?: Error;
}

/**
 * Prisma extension that adds comprehensive logging to all database operations
 */
export const prismaLoggingExtension = Prisma.defineExtension({
  name: 'logging',
  query: {
    // Apply to all models
    $allModels: {
      // Apply to all operations
      $allOperations: async ({ model, operation, args, query }) => {
        const timer = createTimer(`db_query:${model}:${operation}`);
        const startTime = Date.now();
        
        try {
          const result = await query(args);
          const timerResult = timer.end();
          const duration = typeof timerResult === 'number' ? timerResult : timerResult.duration;
          
          // Determine result count
          let resultCount: number | undefined;
          if (Array.isArray(result)) {
            resultCount = result.length;
          } else if (result && typeof result === 'object') {
            resultCount = 1;
          }
          
          // Log successful query
          appLogger.performance.databaseQuery(
            operation,
            model || 'unknown',
            duration,
            resultCount
          );
          
          // Log slow queries with more detail
          if (duration > 1000) {
            appLogger.warn('Slow database query detected', {
              category: 'performance',
              event: 'slow_query',
              model,
              operation,
              duration,
              resultCount,
              args: sanitizeArgs(args)
            });
          }
          
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          const dbError = error instanceof Error ? error : new Error(String(error));
          
          appLogger.errors.databaseError(
            `${operation}:${model}`,
            dbError,
            {
              duration,
              args: sanitizeArgs(args)
            }
          );
          
          throw error;
        }
      },
    },
  },
});

/**
 * Sanitize query arguments to remove sensitive data from logs
 */
function sanitizeArgs(args: any): any {
  if (!args || typeof args !== 'object') return args;

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'creditCard',
    'ssn',
    'socialSecurity',
    'stripeCustomerId',
    'stripeSubscriptionId'
  ];

  const sanitized = JSON.parse(JSON.stringify(args));

  const sanitizeObject = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;

    Object.keys(obj).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        obj[key] = sanitizeObject(obj[key]);
      }
    });

    return obj;
  };

  return sanitizeObject(sanitized);
}

/**
 * Enhanced Prisma client with logging
 */
export class LoggedPrismaClient extends PrismaClient {
  constructor(options?: Prisma.PrismaClientOptions) {
    super({
      ...options,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'info' },
      ],
    });

    // Set up Prisma event listeners
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Query logging  
    try {
      // Use type assertion to handle Prisma event types
      (this as any).$on('query', (e: any) => {
        const duration = Number(e.duration);
        
        if (duration > 100) { // Log queries taking more than 100ms
          appLogger.debug('Prisma query executed', {
            category: 'database',
            event: 'prisma_query',
            query: this.sanitizeQuery(e.query),
            params: e.params,
            duration,
            target: e.target,
            slow: duration > 500
          });
        }
      });
    } catch (error) {
      // Query event listener not supported
      appLogger.debug('Query event listener not available');
    }

    // Error logging
    try {
      (this as any).$on('error', (e: any) => {
        appLogger.logError('Prisma error', {
          category: 'database',
          event: 'prisma_error',
          message: e.message,
          target: e.target,
          timestamp: e.timestamp
        });
      });
    } catch (error) {
      // Error event listener not supported
      appLogger.debug('Error event listener not available');
    }

    // Warning logging
    try {
      (this as any).$on('warn', (e: any) => {
        appLogger.warn('Prisma warning', {
          category: 'database',
          event: 'prisma_warning',
          message: e.message,
          target: e.target,
          timestamp: e.timestamp
        });
      });
    } catch (error) {
      // Warning event listener not supported
      appLogger.debug('Warning event listener not available');
    }

    // Info logging
    try {
      (this as any).$on('info', (e: any) => {
        appLogger.info('Prisma info', {
          category: 'database',
          event: 'prisma_info',
          message: e.message,
          target: e.target,
          timestamp: e.timestamp
        });
      });
    } catch (error) {
      // Info event listener not supported
      appLogger.debug('Info event listener not available');
    }
  }

  private sanitizeQuery(query: string): string {
    // Basic sanitization of SQL queries for logging
    // Remove potential sensitive data patterns
    return query
      .replace(/password\s*=\s*'[^']*'/gi, "password = '[REDACTED]'")
      .replace(/password\s*=\s*"[^"]*"/gi, 'password = "[REDACTED]"')
      .replace(/token\s*=\s*'[^']*'/gi, "token = '[REDACTED]'")
      .replace(/token\s*=\s*"[^"]*"/gi, 'token = "[REDACTED]"')
      .replace(/secret\s*=\s*'[^']*'/gi, "secret = '[REDACTED]'")
      .replace(/secret\s*=\s*"[^"]*"/gi, 'secret = "[REDACTED]"');
  }

  /**
   * Enhanced transaction method with logging
   */
  async loggedTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: { maxWait?: number; timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel }
  ): Promise<T> {
    const timer = createTimer('database_transaction');
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    appLogger.debug('Database transaction started', {
      category: 'database',
      event: 'transaction_start',
      transactionId
    });

    try {
      const result = await this.$transaction(fn, options);
      const duration = timer.end();
      
      appLogger.info('Database transaction completed', {
        category: 'database',
        event: 'transaction_success',
        transactionId,
        duration
      });
      
      return result;
    } catch (error) {
      const duration = timer.end();
      const dbError = error instanceof Error ? error : new Error(String(error));
      
      appLogger.logError('Database transaction failed', {
        category: 'database',
        event: 'transaction_failure',
        transactionId,
        duration,
        error: dbError.message,
        stack: dbError.stack
      });
      
      throw error;
    }
  }

  /**
   * Batch operation logging
   */
  async loggedBatch<T>(
    queries: Array<Promise<T>>,
    operation: string = 'batch_operation'
  ): Promise<T[]> {
    const timer = createTimer(`database_batch:${operation}`);
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    appLogger.debug('Database batch operation started', {
      category: 'database',
      event: 'batch_start',
      batchId,
      operation,
      queryCount: queries.length
    });

    try {
      const results = await Promise.all(queries);
      const duration = timer.end();
      
      appLogger.info('Database batch operation completed', {
        category: 'database',
        event: 'batch_success',
        batchId,
        operation,
        queryCount: queries.length,
        duration
      });
      
      return results;
    } catch (error) {
      const duration = timer.end();
      const dbError = error instanceof Error ? error : new Error(String(error));
      
      appLogger.logError('Database batch operation failed', {
        category: 'database',
        event: 'batch_failure',
        batchId,
        operation,
        queryCount: queries.length,
        duration,
        error: dbError.message,
        stack: dbError.stack
      });
      
      throw error;
    }
  }

  /**
   * Health check method with logging
   */
  async healthCheck(): Promise<boolean> {
    const timer = createTimer('database_health_check');
    
    try {
      await this.$queryRaw`SELECT 1`;
      const duration = timer.end();
      
      appLogger.system.healthCheck('healthy', {
        component: 'database',
        duration,
        timestamp: new Date()
      });
      
      return true;
    } catch (error) {
      const duration = timer.end();
      const dbError = error instanceof Error ? error : new Error(String(error));
      
      appLogger.system.healthCheck('unhealthy', {
        component: 'database',
        duration,
        error: dbError.message,
        timestamp: new Date()
      });
      
      return false;
    }
  }
}

/**
 * Database connection monitoring
 */
export function monitorDatabaseConnections(prisma: LoggedPrismaClient) {
  const checkInterval = 30000; // 30 seconds
  
  const monitor = async () => {
    try {
      const isHealthy = await prisma.healthCheck();
      
      if (!isHealthy) {
        appLogger.logError('Database health check failed', {
          category: 'system',
          event: 'database_unhealthy'
        });
      }
    } catch (error) {
      appLogger.logError('Database monitoring error', {
        category: 'system',
        event: 'database_monitor_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Initial check
  monitor();

  // Set up periodic checks
  if (typeof setInterval !== 'undefined') {
    setInterval(monitor, checkInterval);
  }

  return monitor;
}

/**
 * Query performance analyzer
 */
export class QueryPerformanceAnalyzer {
  private queryTimes: Map<string, number[]> = new Map();
  private maxSamples = 100;

  recordQuery(query: string, duration: number) {
    const queryKey = this.normalizeQuery(query);
    
    if (!this.queryTimes.has(queryKey)) {
      this.queryTimes.set(queryKey, []);
    }
    
    const times = this.queryTimes.get(queryKey)!;
    times.push(duration);
    
    // Keep only the most recent samples
    if (times.length > this.maxSamples) {
      times.shift();
    }
    
    // Check for performance regressions
    if (times.length > 10) {
      const recent = times.slice(-10);
      const older = times.slice(-20, -10);
      
      if (older.length > 0) {
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        
        if (recentAvg > olderAvg * 1.5) { // 50% performance regression
          appLogger.warn('Query performance regression detected', {
            category: 'performance',
            event: 'query_regression',
            query: queryKey,
            recentAvg,
            olderAvg,
            regression: ((recentAvg - olderAvg) / olderAvg * 100).toFixed(2) + '%'
          });
        }
      }
    }
  }

  private normalizeQuery(query: string): string {
    // Normalize query by removing variable parts
    return query
      .replace(/\$\d+/g, '$?') // Replace parameter placeholders
      .replace(/\d+/g, '?') // Replace numbers
      .replace(/'\w+'/g, "'?'") // Replace string literals
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  getQueryStats(query: string) {
    const queryKey = this.normalizeQuery(query);
    const times = this.queryTimes.get(queryKey) || [];
    
    if (times.length === 0) return null;
    
    const sorted = [...times].sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    
    return {
      query: queryKey,
      count: times.length,
      avg: Math.round(avg),
      p50: Math.round(p50),
      p95: Math.round(p95),
      p99: Math.round(p99),
      min: Math.round(sorted[0]),
      max: Math.round(sorted[sorted.length - 1])
    };
  }

  getAllStats() {
    return Array.from(this.queryTimes.keys()).map(query => this.getQueryStats(query)).filter(Boolean);
  }
}

export const queryAnalyzer = new QueryPerformanceAnalyzer();