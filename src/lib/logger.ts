/**
 * Comprehensive Structured Logging System
 * 
 * This module provides a centralized logging system with structured JSON logs,
 * multiple log levels, request correlation, and production-ready features.
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { NextRequest } from 'next/server';
import { ExtendedUser } from './supabase-auth-middleware';

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Log levels with priority
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  trace: 5
};

// Colors for console output in development
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
  trace: 'gray'
};

// Custom log format for JSON structure
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Create Winston logger instance
const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  levels: logLevels,
  format: jsonFormat,
  defaultMeta: {
    service: 'master-ai-saas',
    environment: process.env.NODE_ENV,
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    nodeVersion: process.version
  },
  transports: []
});

// Add colors to Winston
winston.addColors(logColors);

// Configure transports based on environment
if (isProduction) {
  // Production: File logging with rotation
  logger.add(
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'info'
    })
  );

  logger.add(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '90d',
      level: 'error'
    })
  );

  // Also log to console in production for container logs
  logger.add(
    new winston.transports.Console({
      format: jsonFormat,
      level: 'info'
    })
  );
} else if (isDevelopment) {
  // Development: Console logging with colors
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug'
    })
  );
} else if (isTest) {
  // Test: Minimal logging
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
      level: 'error',
      silent: true
    })
  );
}

// Request correlation tracking
const requestContext = new Map<string, any>();

/**
 * Generate a unique request ID for correlation
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Set request context for correlation
 */
export function setRequestContext(requestId: string, context: any) {
  requestContext.set(requestId, context);
}

/**
 * Get request context
 */
export function getRequestContext(requestId: string) {
  return requestContext.get(requestId);
}

/**
 * Clear request context (memory cleanup)
 */
export function clearRequestContext(requestId: string) {
  requestContext.delete(requestId);
}

/**
 * Extract request metadata for logging
 */
export function extractRequestMetadata(request: NextRequest, user?: ExtendedUser | null) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('remote-addr');
  const ip = forwardedFor?.split(',')[0].trim() || realIP || remoteAddr || 'unknown';

  return {
    method: request.method,
    url: request.url,
    path: request.nextUrl?.pathname,
    query: Object.fromEntries(request.nextUrl?.searchParams || []),
    ip,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    contentType: request.headers.get('content-type'),
    contentLength: request.headers.get('content-length'),
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
    origin: request.headers.get('origin')
  };
}

/**
 * Sanitize log data to remove sensitive information
 */
function sanitizeLogData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
    'session',
    'csrf',
    'api_key',
    'access_token',
    'refresh_token',
    'credit_card',
    'ssn',
    'social_security'
  ];

  const sanitized = { ...data };

  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  });

  return sanitized;
}

/**
 * Log Categories with structured formatting
 */
export class StructuredLogger {
  private baseLogger = logger;

  /**
   * Security Events
   */
  security = {
    loginSuccess: (user: ExtendedUser, requestMeta: any) => {
      this.baseLogger.info('User login successful', {
        category: 'security',
        event: 'login_success',
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        ...sanitizeLogData(requestMeta)
      });
    },

    loginFailure: (email: string, reason: string, requestMeta: any) => {
      this.baseLogger.warn('User login failed', {
        category: 'security',
        event: 'login_failure',
        email: email,
        reason,
        ...sanitizeLogData(requestMeta)
      });
    },

    logout: (user: ExtendedUser, requestMeta: any) => {
      this.baseLogger.info('User logged out', {
        category: 'security',
        event: 'logout',
        userId: user.id,
        userEmail: user.email,
        ...sanitizeLogData(requestMeta)
      });
    },

    passwordResetRequested: (email: string, requestMeta: any) => {
      this.baseLogger.info('Password reset requested', {
        category: 'security',
        event: 'password_reset_requested',
        email,
        ...sanitizeLogData(requestMeta)
      });
    },

    passwordResetCompleted: (user: ExtendedUser, requestMeta: any) => {
      this.baseLogger.info('Password reset completed', {
        category: 'security',
        event: 'password_reset_completed',
        userId: user.id,
        userEmail: user.email,
        ...sanitizeLogData(requestMeta)
      });
    },

    xssAttemptBlocked: (attempt: string, requestMeta: any) => {
      this.baseLogger.warn('XSS attempt blocked', {
        category: 'security',
        event: 'xss_attempt_blocked',
        attempt: attempt.substring(0, 200), // Limit size
        ...sanitizeLogData(requestMeta)
      });
    },

    unauthorizedAccess: (resource: string, user: ExtendedUser | null, requestMeta: any) => {
      this.baseLogger.warn('Unauthorized access attempt', {
        category: 'security',
        event: 'unauthorized_access',
        resource,
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
        ...sanitizeLogData(requestMeta)
      });
    },

    rateLimitExceeded: (identifier: string, endpoint: string, requestMeta: any) => {
      this.baseLogger.warn('Rate limit exceeded', {
        category: 'security',
        event: 'rate_limit_exceeded',
        identifier,
        endpoint,
        ...sanitizeLogData(requestMeta)
      });
    }
  };

  /**
   * Performance Events
   */
  performance = {
    apiRequest: (endpoint: string, duration: number, status: number, requestMeta: any, user?: ExtendedUser) => {
      const level = duration > 5000 ? 'warn' : status >= 400 ? 'warn' : 'info';
      
      this.baseLogger.log(level, 'API request completed', {
        category: 'performance',
        event: 'api_request',
        endpoint,
        duration,
        status,
        userId: user?.id,
        slow: duration > 3000,
        ...sanitizeLogData(requestMeta)
      });
    },

    databaseQuery: (operation: string, table: string, duration: number, recordCount?: number) => {
      const level = duration > 1000 ? 'warn' : 'debug';
      
      this.baseLogger.log(level, 'Database query executed', {
        category: 'performance',
        event: 'database_query',
        operation,
        table,
        duration,
        recordCount,
        slow: duration > 500
      });
    },

    slowOperation: (operation: string, duration: number, context?: any) => {
      this.baseLogger.warn('Slow operation detected', {
        category: 'performance',
        event: 'slow_operation',
        operation,
        duration,
        ...sanitizeLogData(context)
      });
    },

    cacheHit: (key: string, operation: string) => {
      this.baseLogger.debug('Cache hit', {
        category: 'performance',
        event: 'cache_hit',
        key,
        operation
      });
    },

    cacheMiss: (key: string, operation: string) => {
      this.baseLogger.debug('Cache miss', {
        category: 'performance',
        event: 'cache_miss',
        key,
        operation
      });
    }
  };

  /**
   * User Activity Events
   */
  userActivity = {
    profileUpdated: (user: ExtendedUser, changes: string[], requestMeta: any) => {
      this.baseLogger.info('User profile updated', {
        category: 'user_activity',
        event: 'profile_updated',
        userId: user.id,
        userEmail: user.email,
        changes,
        ...sanitizeLogData(requestMeta)
      });
    },

    lessonStarted: (user: ExtendedUser, lessonId: string, lessonTitle: string) => {
      this.baseLogger.info('User started lesson', {
        category: 'user_activity',
        event: 'lesson_started',
        userId: user.id,
        lessonId,
        lessonTitle
      });
    },

    lessonCompleted: (user: ExtendedUser, lessonId: string, lessonTitle: string, duration: number) => {
      this.baseLogger.info('User completed lesson', {
        category: 'user_activity',
        event: 'lesson_completed',
        userId: user.id,
        lessonId,
        lessonTitle,
        duration
      });
    },

    subscriptionChanged: (user: ExtendedUser, oldTier: string, newTier: string, requestMeta: any) => {
      this.baseLogger.info('User subscription changed', {
        category: 'user_activity',
        event: 'subscription_changed',
        userId: user.id,
        userEmail: user.email,
        oldTier,
        newTier,
        ...sanitizeLogData(requestMeta)
      });
    }
  };

  /**
   * System Events
   */
  system = {
    startup: (config: any) => {
      this.baseLogger.info('Application started', {
        category: 'system',
        event: 'application_startup',
        config: sanitizeLogData(config)
      });
    },

    shutdown: (reason?: string) => {
      this.baseLogger.info('Application shutting down', {
        category: 'system',
        event: 'application_shutdown',
        reason
      });
    },

    configurationChanged: (key: string, oldValue: any, newValue: any) => {
      this.baseLogger.info('Configuration changed', {
        category: 'system',
        event: 'configuration_changed',
        key,
        oldValue: sanitizeLogData(oldValue),
        newValue: sanitizeLogData(newValue)
      });
    },

    healthCheck: (status: 'healthy' | 'unhealthy', details: any) => {
      const level = status === 'healthy' ? 'info' : 'error';
      this.baseLogger.log(level, 'Health check performed', {
        category: 'system',
        event: 'health_check',
        status,
        details
      });
    }
  };

  /**
   * Error Events
   */
  errors = {
    unhandledError: (error: Error, context?: any) => {
      this.baseLogger.error('Unhandled error occurred', {
        category: 'error',
        event: 'unhandled_error',
        message: error.message,
        stack: error.stack,
        name: error.name,
        context: sanitizeLogData(context)
      });
    },

    apiError: (endpoint: string, error: Error, requestMeta: any, user?: ExtendedUser) => {
      this.baseLogger.error('API error', {
        category: 'error',
        event: 'api_error',
        endpoint,
        message: error.message,
        stack: error.stack,
        name: error.name,
        userId: user?.id,
        ...sanitizeLogData(requestMeta)
      });
    },

    databaseError: (operation: string, error: Error, context?: any) => {
      this.baseLogger.error('Database error', {
        category: 'error',
        event: 'database_error',
        operation,
        message: error.message,
        stack: error.stack,
        name: error.name,
        context: sanitizeLogData(context)
      });
    },

    validationError: (endpoint: string, errors: any[], requestMeta: any) => {
      this.baseLogger.warn('Validation error', {
        category: 'error',
        event: 'validation_error',
        endpoint,
        errors,
        ...sanitizeLogData(requestMeta)
      });
    },

    externalServiceError: (service: string, operation: string, error: Error, context?: any) => {
      this.baseLogger.error('External service error', {
        category: 'error',
        event: 'external_service_error',
        service,
        operation,
        message: error.message,
        stack: error.stack,
        context: sanitizeLogData(context)
      });
    }
  };

  /**
   * Generic logging methods
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
}

// Export singleton instance
export const appLogger = new StructuredLogger();

// Export Winston logger for advanced usage
export { logger as winstonLogger };

// Utility function for performance timing
export class PerformanceTimer {
  private startTime: number;
  private operation: string;

  constructor(operation: string) {
    this.operation = operation;
    this.startTime = Date.now();
  }

  end(context?: any) {
    const duration = Date.now() - this.startTime;
    
    if (duration > 1000) {
      appLogger.performance.slowOperation(this.operation, duration, context);
    }
    
    return duration;
  }
}

export function createTimer(operation: string): PerformanceTimer {
  return new PerformanceTimer(operation);
}