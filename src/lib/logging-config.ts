/**
 * Logging Configuration and Initialization
 * 
 * This module provides centralized configuration for all logging systems
 * and ensures proper initialization across the application.
 */

import { appLogger } from './logger';

export interface LoggingConfig {
  environment: 'development' | 'production' | 'test';
  enableFileLogging: boolean;
  enableConsoleLogging: boolean;
  enableClientLogging: boolean;
  enableDatabaseLogging: boolean;
  enablePerformanceLogging: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  retentionDays: number;
  maxFileSize: string;
  enableSanitization: boolean;
}

const defaultConfig: LoggingConfig = {
  environment: (process.env.NODE_ENV as any) || 'development',
  enableFileLogging: process.env.NODE_ENV === 'production',
  enableConsoleLogging: true,
  enableClientLogging: true,
  enableDatabaseLogging: true,
  enablePerformanceLogging: process.env.NODE_ENV === 'production',
  logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  retentionDays: 30,
  maxFileSize: '20m',
  enableSanitization: true
};

let isInitialized = false;

/**
 * Initialize the logging system with configuration
 */
export function initializeLogging(config: Partial<LoggingConfig> = {}) {
  if (isInitialized) return;

  const finalConfig = { ...defaultConfig, ...config };
  
  // Log the initialization
  appLogger.system.startup({
    component: 'logging_system',
    config: finalConfig,
    timestamp: new Date().toISOString()
  });

  // Set up global error handlers in Node.js environment
  if (typeof window === 'undefined') {
    setupNodeErrorHandlers();
  }

  // Mark as initialized
  isInitialized = true;

  return finalConfig;
}

/**
 * Set up Node.js process error handlers
 */
function setupNodeErrorHandlers() {
  // Uncaught exceptions
  process.on('uncaughtException', (error) => {
    appLogger.errors.unhandledError(error, {
      source: 'uncaughtException',
      pid: process.pid
    });
    
    // Give time for logs to flush before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    
    appLogger.errors.unhandledError(error, {
      source: 'unhandledRejection',
      promise: promise.toString(),
      pid: process.pid
    });
  });

  // Process warnings
  process.on('warning', (warning) => {
    appLogger.warn('Process warning', {
      category: 'system',
      event: 'process_warning',
      name: warning.name,
      message: warning.message,
      stack: warning.stack
    });
  });

  // Graceful shutdown
  const gracefulShutdown = (signal: string) => {
    appLogger.system.shutdown(`Received ${signal} signal`);
    
    // Give time for logs to flush
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

/**
 * Validate logging configuration
 */
export function validateLoggingConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check environment variables
  const requiredEnvVars = ['NODE_ENV'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Check log directory permissions in production
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
    try {
      const fs = require('fs');
      const path = require('path');
      const logDir = path.join(process.cwd(), 'logs');
      
      // Try to create logs directory if it doesn't exist
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      // Test write permissions
      const testFile = path.join(logDir, 'test.log');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    } catch (error) {
      errors.push('Cannot write to logs directory. Check permissions.');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get current logging statistics
 */
export function getLoggingStats() {
  const stats = {
    initialized: isInitialized,
    environment: process.env.NODE_ENV,
    uptime: process.uptime?.() || 0,
    memoryUsage: process.memoryUsage?.() || {},
    nodeVersion: process.version,
    platform: process.platform
  };

  appLogger.debug('Logging statistics requested', {
    category: 'system',
    event: 'logging_stats',
    stats
  });

  return stats;
}

/**
 * Test logging system functionality
 */
export async function testLoggingSystem(): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    // Test each log level
    appLogger.trace('Logging system test: trace level');
    appLogger.debug('Logging system test: debug level');
    appLogger.info('Logging system test: info level');
    appLogger.warn('Logging system test: warn level');
    appLogger.errors.unhandledError(new Error('Logging system test: error level'), {
      test: true,
      level: 'error'
    });

    // Test structured logging
    appLogger.security.loginSuccess(
      { id: 'test-user', email: 'test@example.com', role: 'USER' } as any,
      { test: true, requestId: 'test-request' }
    );

    appLogger.performance.apiRequest(
      '/test/logging',
      100,
      200,
      { test: true },
      { id: 'test-user', email: 'test@example.com' } as any
    );

    // Test error logging
    appLogger.errors.unhandledError(
      new Error('Test error for logging system'),
      { test: true, component: 'logging_test' }
    );

    return { success: true, errors: [] };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error during logging test');
    return { success: false, errors };
  }
}

/**
 * Performance monitoring for logging system
 */
export class LoggingPerformanceMonitor {
  private static metrics = new Map<string, number[]>();
  private static maxSamples = 100;

  static recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep only recent samples
    if (values.length > this.maxSamples) {
      values.shift();
    }
  }

  static getMetrics() {
    const result: Record<string, any> = {};

    this.metrics.forEach((values, name) => {
      if (values.length === 0) return;

      const sorted = [...values].sort((a, b) => a - b);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;

      result[name] = {
        count: values.length,
        avg: Math.round(avg * 100) / 100,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
      };
    });

    return result;
  }

  static reset() {
    this.metrics.clear();
  }
}

/**
 * Log rotation and cleanup utilities
 */
export class LogRotationManager {
  private static isRunning = false;

  static startRotation(intervalHours: number = 24) {
    if (this.isRunning || typeof window !== 'undefined') return;

    this.isRunning = true;
    const intervalMs = intervalHours * 60 * 60 * 1000;

    setInterval(() => {
      this.performRotation();
    }, intervalMs);

    // Initial rotation check
    setTimeout(() => this.performRotation(), 5000);
  }

  private static async performRotation() {
    // Only perform log rotation on server side
    if (typeof window !== 'undefined') return;
    
    try {
      const fs = require('fs');
      const path = require('path');
      const logDir = path.join(process.cwd(), 'logs');

      if (!fs.existsSync(logDir)) return;

      const files = fs.readdirSync(logDir);
      const now = Date.now();
      const retentionMs = 30 * 24 * 60 * 60 * 1000; // 30 days

      let deletedCount = 0;
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(logDir, file);
        const stats = fs.statSync(filePath);

        totalSize += stats.size;

        // Delete old files
        if (now - stats.mtime.getTime() > retentionMs) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      appLogger.system.healthCheck('healthy', {
        component: 'log_rotation',
        deletedFiles: deletedCount,
        totalLogSize: totalSize,
        logDirectory: logDir
      });
    } catch (error) {
      appLogger.errors.unhandledError(
        error instanceof Error ? error : new Error(String(error)),
        { component: 'log_rotation' }
      );
    }
  }
}

// Export singleton functions
export { appLogger as logger };
export { clientLogger } from './client-logger';