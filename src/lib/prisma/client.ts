/**
 * Logged Prisma Client
 *
 * Enhanced Prisma client with built-in logging, event listeners,
 * and additional helper methods for transactions, batch operations,
 * and health checks. This class extends PrismaClient with logging
 * capabilities for all database operations.
 */

import { Prisma, PrismaClient } from '@prisma/client';
import { appLogger, createTimer } from '@/lib/logger';
import { sanitizeQuery } from './sanitizer';

/**
 * Enhanced Prisma client with comprehensive logging and monitoring
 *
 * Extends the standard PrismaClient with:
 * - Event listeners for query, error, warn, and info events
 * - Enhanced transaction method with logging
 * - Batch operation logging
 * - Database health check method
 *
 * All Prisma log levels are enabled and forwarded to the application logger
 * with proper categorization and metadata.
 *
 * @example
 * ```ts
 * const prisma = new LoggedPrismaClient();
 *
 * // Use like normal PrismaClient - all operations are logged
 * const user = await prisma.user.findUnique({ where: { id: 1 } });
 *
 * // Enhanced transaction with logging
 * await prisma.loggedTransaction(async (tx) => {
 *   await tx.user.create({ data: { email: 'test@example.com' } });
 *   await tx.profile.create({ data: { userId: 1 } });
 * });
 *
 * // Health check
 * const isHealthy = await prisma.healthCheck();
 * ```
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

  /**
   * Set up event listeners for Prisma log events
   *
   * Configures handlers for query, error, warn, and info events
   * from Prisma. Each handler uses try-catch to gracefully handle
   * environments where event listeners may not be available.
   *
   * @private
   */
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
            query: sanitizeQuery(e.query),
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

  /**
   * Enhanced transaction method with logging
   *
   * Wraps Prisma's $transaction with comprehensive logging including:
   * - Transaction start/end events
   * - Duration tracking
   * - Unique transaction IDs for correlation
   * - Error logging with context
   *
   * @param fn - Transaction function that receives a transaction client
   * @param options - Transaction options (maxWait, timeout, isolationLevel)
   * @returns Promise resolving to transaction result
   *
   * @example
   * ```ts
   * const result = await prisma.loggedTransaction(async (tx) => {
   *   const user = await tx.user.create({ data: { email: 'test@example.com' } });
   *   const profile = await tx.profile.create({ data: { userId: user.id } });
   *   return { user, profile };
   * });
   * ```
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
   *
   * Executes multiple Prisma queries in parallel with comprehensive logging.
   * Tracks the entire batch as a unit with unique batch ID.
   *
   * @param queries - Array of Prisma query promises to execute
   * @param operation - Optional operation name for logging (default: 'batch_operation')
   * @returns Promise resolving to array of query results
   *
   * @example
   * ```ts
   * const results = await prisma.loggedBatch([
   *   prisma.user.findMany(),
   *   prisma.lesson.findMany(),
   *   prisma.module.findMany()
   * ], 'fetch_all_data');
   * ```
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
   *
   * Performs a simple database query to verify connectivity and
   * responsiveness. Logs results to the system health check logger.
   *
   * @returns Promise resolving to true if healthy, false otherwise
   *
   * @example
   * ```ts
   * const isHealthy = await prisma.healthCheck();
   * if (!isHealthy) {
   *   console.error('Database is not healthy!');
   * }
   * ```
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
