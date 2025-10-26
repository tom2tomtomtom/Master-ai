/**
 * Prisma Logging Extension
 *
 * Defines a Prisma client extension that automatically logs all database
 * operations, tracks query performance, and identifies slow queries.
 * This extension is applied to all models and operations transparently.
 */

import { Prisma } from '@prisma/client';
import { appLogger, createTimer } from '@/lib/logger';
import { sanitizeArgs } from './sanitizer';

/**
 * Prisma extension that adds comprehensive logging to all database operations
 *
 * This extension wraps all Prisma queries to:
 * - Track query execution time
 * - Log query details with sanitized arguments
 * - Identify and warn about slow queries (>1000ms)
 * - Log errors with context for debugging
 *
 * The extension is automatically applied to all models and operations
 * when used with: `prisma.$extends(prismaLoggingExtension)`
 *
 * @example
 * ```ts
 * import { PrismaClient } from '@prisma/client';
 * import { prismaLoggingExtension } from '@/lib/prisma';
 *
 * const prisma = new PrismaClient().$extends(prismaLoggingExtension);
 *
 * // All queries are now automatically logged
 * const users = await prisma.user.findMany();
 * ```
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
