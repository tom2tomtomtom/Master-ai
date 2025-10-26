/**
 * Database Connection Monitoring
 *
 * Provides utilities for monitoring database health and connectivity.
 * Implements periodic health checks to detect database issues proactively
 * and alert through the logging system.
 */

import { appLogger } from '@/lib/logger';
import type { LoggedPrismaClient } from './client';

/**
 * Monitor database connections with periodic health checks
 *
 * Sets up a monitoring loop that performs health checks on the database
 * at regular intervals (default: 30 seconds). Logs any health check
 * failures or monitoring errors to the application logger.
 *
 * This function is designed for long-running processes (servers) and
 * will perform an initial check immediately, then continue checking
 * periodically until the process exits.
 *
 * @param prisma - LoggedPrismaClient instance to monitor
 * @returns The monitor function that can be called manually if needed
 *
 * @example
 * ```ts
 * import { LoggedPrismaClient, monitorDatabaseConnections } from '@/lib/prisma';
 *
 * const prisma = new LoggedPrismaClient();
 *
 * // Start monitoring (runs in background)
 * monitorDatabaseConnections(prisma);
 *
 * // Application continues...
 * ```
 */
export function monitorDatabaseConnections(prisma: LoggedPrismaClient) {
  const checkInterval = 30000; // 30 seconds

  /**
   * Perform a single health check
   *
   * @private
   */
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
