/**
 * Global Error Handler Middleware for Next.js API Routes
 * Provides comprehensive error handling with logging, monitoring, and response formatting
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  AppError, 
  ErrorCode, 
  ErrorSeverity, 
  isAppError, 
  isOperationalError,
  isHighSeverityError,
  ErrorContext
} from '@/utils/errors/AppError';
import { appLogger } from '@/lib/logger';

export interface ErrorHandlerConfig {
  enableStackTrace?: boolean;
  enableErrorLogging?: boolean;
  enableMonitoring?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}

const DEFAULT_CONFIG: Required<ErrorHandlerConfig> = {
  enableStackTrace: process.env.NODE_ENV === 'development',
  enableErrorLogging: true,
  enableMonitoring: process.env.NODE_ENV === 'production',
  logLevel: 'error',
};

/**
 * Extract request context for error logging
 */
function extractRequestContext(request: NextRequest): ErrorContext {
  return {
    method: request.method,
    url: request.url,
    ip: getClientIp(request),
    userAgent: request.headers.get('user-agent') || undefined,
    requestId: request.headers.get('x-request-id') || generateRequestId(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get client IP address
 */
function getClientIp(request: NextRequest): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');
  
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIp) return realIp.trim();
  if (cfIp) return cfIp.trim();
  
  return undefined;
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert unknown error to AppError
 */
function normalizeError(error: any, context: ErrorContext): AppError {
  if (isAppError(error)) {
    // Update context if not already set by creating a new instance
    if (!error.context.requestId) {
      return new AppError(
        error.message,
        error.code,
        error.statusCode,
        error.severity,
        error.isOperational,
        { ...error.context, ...context }
      );
    }
    return error;
  }

  // Handle specific error types
  if (error.name === 'ValidationError' || error.name === 'ZodError') {
    return new AppError(
      'Validation failed',
      ErrorCode.VALIDATION_ERROR,
      400,
      ErrorSeverity.LOW,
      true,
      { ...context, metadata: { originalError: error.message } }
    );
  }

  if (error.name === 'PrismaClientKnownRequestError') {
    let message = 'Database operation failed';
    let code = ErrorCode.DATABASE_ERROR;
    
    // Handle specific Prisma errors
    switch (error.code) {
      case 'P2002':
        message = 'Record already exists';
        code = ErrorCode.DUPLICATE_ENTRY;
        break;
      case 'P2025':
        message = 'Record not found';
        code = ErrorCode.RECORD_NOT_FOUND;
        break;
      case 'P2003':
        message = 'Foreign key constraint failed';
        code = ErrorCode.BUSINESS_RULE_VIOLATION;
        break;
    }

    return new AppError(
      message,
      code,
      error.code === 'P2025' ? 404 : 400,
      ErrorSeverity.MEDIUM,
      true,
      { ...context, metadata: { prismaCode: error.code, originalError: error.message } }
    );
  }

  if (error.name === 'TypeError' || error.name === 'ReferenceError') {
    return new AppError(
      process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      ErrorCode.INTERNAL_SERVER_ERROR,
      500,
      ErrorSeverity.HIGH,
      false,
      { ...context, metadata: { originalError: error.message }, stackTrace: error.stack }
    );
  }

  // Default system error
  return new AppError(
    process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    ErrorCode.INTERNAL_SERVER_ERROR,
    500,
    ErrorSeverity.CRITICAL,
    false,
    { ...context, metadata: { originalError: error.message }, stackTrace: error.stack }
  );
}

/**
 * Log error with appropriate level
 */
function logError(error: AppError, config: Required<ErrorHandlerConfig>): void {
  if (!config.enableErrorLogging) return;

  const logData = {
    ...error.toJSON(),
    environment: process.env.NODE_ENV,
    service: 'master-ai-saas',
  };

  // Remove stack trace in production unless it's a system error
  if (process.env.NODE_ENV === 'production' && error.isOperational && logData.context) {
    delete logData.context.stackTrace;
  }

  // Choose log level based on severity
  switch (error.severity) {
    case ErrorSeverity.CRITICAL:
      appLogger.logError('Critical error occurred', logData);
      break;
    case ErrorSeverity.HIGH:
      appLogger.logError('High severity error occurred', logData);
      break;
    case ErrorSeverity.MEDIUM:
      appLogger.warn('Medium severity error occurred', logData);
      break;
    case ErrorSeverity.LOW:
      appLogger.info('Low severity error occurred', logData);
      break;
    default:
      appLogger.logError('Unknown severity error occurred', logData);
  }
}

/**
 * Send error to monitoring service (placeholder)
 */
function sendToMonitoring(error: AppError): void {
  // This would integrate with services like Sentry, DataDog, etc.
  if (process.env.NODE_ENV === 'production' && isHighSeverityError(error)) {
    // Integrated with structured logging system for monitoring
    // This will be picked up by log aggregation services (DataDog, Splunk, etc.)
    appLogger.errors.unhandledError(error, {
      errorCode: error.code,
      severity: error.severity,
      requestId: error.requestId,
      timestamp: error.timestamp,
      operational: isOperationalError(error),
      context: error.context,
      monitoringAlert: true, // Flag for alerting systems
    });
  }
}

/**
 * Format error response
 */
function formatErrorResponse(error: AppError, config: Required<ErrorHandlerConfig>): any {
  const baseResponse = error.toSafeJSON();

  // Add stack trace in development
  if (config.enableStackTrace && process.env.NODE_ENV === 'development') {
    baseResponse.stack = error.stack;
  }

  // Add additional context for debugging in development
  if (process.env.NODE_ENV === 'development') {
    baseResponse.context = error.context;
  }

  return baseResponse;
}

/**
 * Create error handler middleware
 */
export function createErrorHandler(config: ErrorHandlerConfig = {}) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  return function errorHandler(
    error: any,
    request: NextRequest,
    context: ErrorContext = {}
  ): NextResponse {
    // Extract request context
    const requestContext = {
      ...extractRequestContext(request),
      ...context,
    };

    // Normalize error to AppError
    const appError = normalizeError(error, requestContext);

    // Log error
    logError(appError, fullConfig);

    // Send to monitoring
    if (fullConfig.enableMonitoring) {
      sendToMonitoring(appError);
    }

    // Format response
    const responseData = formatErrorResponse(appError, fullConfig);

    // Create response with appropriate headers
    const response = NextResponse.json(responseData, {
      status: appError.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': appError.requestId,
        'X-Error-Code': appError.code,
      },
    });

    // Add CORS headers if needed
    if (request.headers.get('origin')) {
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    }

    return response;
  };
}

/**
 * Async wrapper for API routes
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  config: ErrorHandlerConfig = {}
) {
  const errorHandler = createErrorHandler(config);

  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Extract request from arguments (assumes first argument is NextRequest)
      const request = args[0] as NextRequest;
      return errorHandler(error, request);
    }
  };
}

/**
 * Try-catch wrapper for API route handlers
 */
export async function handleApiRoute(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: ErrorHandlerConfig = {}
): Promise<NextResponse> {
  const errorHandler = createErrorHandler(config);

  try {
    return await handler(request);
  } catch (error) {
    return errorHandler(error, request);
  }
}

/**
 * Default error handler instance
 */
export const defaultErrorHandler = createErrorHandler();

/**
 * Type for error boundary props
 */
export interface ErrorBoundaryProps {
  error: Error;
  reset: () => void;
}

/**
 * Utility to check if error should trigger alert
 */
export const shouldAlertError = (error: any): boolean => {
  return isAppError(error) && 
    (error.severity === ErrorSeverity.CRITICAL || 
     error.code === ErrorCode.SUSPICIOUS_ACTIVITY);
};

/**
 * Utility to check if error should be retried
 */
export const shouldRetryError = (error: any): boolean => {
  if (!isAppError(error)) return false;
  
  return [
    ErrorCode.TIMEOUT_ERROR,
    ErrorCode.SERVICE_UNAVAILABLE,
    ErrorCode.CONNECTION_ERROR,
  ].includes(error.code);
};