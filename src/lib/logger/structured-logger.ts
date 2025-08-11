/**
 * Structured Logger
 * 
 * Main structured logging class with categorized logging methods
 */

import winston from 'winston';
import { SecurityLogger } from './categories/security';
import { PerformanceLogger } from './categories/performance';
import { UserActivityLogger } from './categories/user-activity';
import { SystemLogger } from './categories/system';
import { ErrorLogger } from './categories/errors';
import { sanitizeLogData, PerformanceTimer } from './utils';

export class StructuredLogger {
  private baseLogger: winston.Logger;
  
  // Category loggers
  public readonly security: SecurityLogger;
  public readonly performance: PerformanceLogger;
  public readonly userActivity: UserActivityLogger;
  public readonly system: SystemLogger;
  public readonly errors: ErrorLogger;

  constructor(logger: winston.Logger) {
    this.baseLogger = logger;
    
    // Initialize category loggers
    this.security = new SecurityLogger(logger);
    this.performance = new PerformanceLogger(logger);
    this.userActivity = new UserActivityLogger(logger);
    this.system = new SystemLogger(logger);
    this.errors = new ErrorLogger(logger);
  }

  /**
   * Generic logging methods - maintain backward compatibility
   */
  info(message: string, meta?: any) {
    this.baseLogger.info(message, sanitizeLogData(meta));
  }

  warn(message: string, meta?: any) {
    this.baseLogger.warn(message, sanitizeLogData(meta));
  }

  logError(message: string, meta?: any) {
    this.baseLogger.error(message, sanitizeLogData(meta));
  }

  debug(message: string, meta?: any) {
    this.baseLogger.debug(message, sanitizeLogData(meta));
  }

  trace(message: string, meta?: any) {
    this.baseLogger.log('trace', message, sanitizeLogData(meta));
  }

  /**
   * Get underlying Winston logger for advanced usage
   */
  getWinstonLogger(): winston.Logger {
    return this.baseLogger;
  }
}

/**
 * Enhanced Performance Timer that integrates with logger
 */
export class EnhancedPerformanceTimer extends PerformanceTimer {
  constructor(operation: string, private logger?: StructuredLogger) {
    super(operation);
  }

  end(context?: any) {
    const result = super.end(context);
    
    if (this.logger && result.duration > 1000) {
      this.logger.performance.slowOperation(result.operation, result.duration, result.context);
    }
    
    return result.duration;
  }
}