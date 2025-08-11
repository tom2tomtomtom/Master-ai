/**
 * Comprehensive Error Handling System
 * Custom error classes with hierarchical structure for better error management
 */

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  
  // External Services
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Security
  CSRF_TOKEN_MISSING = 'CSRF_TOKEN_MISSING',
  CSRF_TOKEN_INVALID = 'CSRF_TOKEN_INVALID',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  
  // Business Logic
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // System
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE_ERROR = 'SERVICE_UNAVAILABLE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  timestamp?: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
}

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly severity: ErrorSeverity;
  public readonly isOperational: boolean;
  public readonly context: ErrorContext;
  public readonly requestId: string;
  public readonly timestamp: string;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    statusCode: number = 500,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    isOperational: boolean = true,
    context: ErrorContext = {}
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.severity = severity;
    this.isOperational = isOperational;
    this.context = {
      timestamp: new Date().toISOString(),
      stackTrace: this.stack,
      ...context,
    };
    this.requestId = context.requestId || this.generateRequestId();
    this.timestamp = new Date().toISOString();

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convert error to JSON for logging/API responses
   */
  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      severity: this.severity,
      isOperational: this.isOperational,
      requestId: this.requestId,
      timestamp: this.timestamp,
      context: this.context,
    };
  }

  /**
   * Convert error to safe API response (excludes sensitive data)
   */
  public toSafeJSON(): Record<string, any> {
    return {
      error: this.message,
      code: this.code,
      requestId: this.requestId,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Authentication/Authorization errors
 */
export class AuthError extends AppError {
  constructor(
    message: string = 'Authentication failed',
    code: ErrorCode = ErrorCode.UNAUTHORIZED,
    context: ErrorContext = {}
  ) {
    super(message, code, 401, ErrorSeverity.MEDIUM, true, context);
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message: string = 'Access forbidden',
    context: ErrorContext = {}
  ) {
    super(message, ErrorCode.FORBIDDEN, 403, ErrorSeverity.MEDIUM, true, context);
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  public readonly fields: Record<string, string[]>;

  constructor(
    message: string = 'Validation failed',
    fields: Record<string, string[]> = {},
    context: ErrorContext = {}
  ) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, ErrorSeverity.LOW, true, context);
    this.fields = fields;
  }

  public toSafeJSON(): Record<string, any> {
    return {
      ...super.toSafeJSON(),
      fields: this.fields,
    };
  }
}

/**
 * Database errors
 */
export class DatabaseError extends AppError {
  constructor(
    message: string = 'Database operation failed',
    code: ErrorCode = ErrorCode.DATABASE_ERROR,
    context: ErrorContext = {}
  ) {
    super(message, code, 500, ErrorSeverity.HIGH, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(
    message: string = 'Resource not found',
    context: ErrorContext = {}
  ) {
    super(message, ErrorCode.RECORD_NOT_FOUND, 404, ErrorSeverity.LOW, true, context);
  }
}

/**
 * External service errors
 */
export class ExternalServiceError extends AppError {
  public readonly serviceName: string;

  constructor(
    serviceName: string,
    message: string = 'External service error',
    code: ErrorCode = ErrorCode.EXTERNAL_SERVICE_ERROR,
    context: ErrorContext = {}
  ) {
    super(message, code, 502, ErrorSeverity.MEDIUM, true, context);
    this.serviceName = serviceName;
  }

  public toSafeJSON(): Record<string, any> {
    return {
      ...super.toSafeJSON(),
      serviceName: this.serviceName,
    };
  }
}

/**
 * Security errors
 */
export class SecurityError extends AppError {
  constructor(
    message: string = 'Security violation',
    code: ErrorCode = ErrorCode.SUSPICIOUS_ACTIVITY,
    context: ErrorContext = {}
  ) {
    super(message, code, 403, ErrorSeverity.HIGH, true, context);
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter: number = 60,
    context: ErrorContext = {}
  ) {
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, ErrorSeverity.LOW, true, context);
    this.retryAfter = retryAfter;
  }

  public toSafeJSON(): Record<string, any> {
    return {
      ...super.toSafeJSON(),
      retryAfter: this.retryAfter,
    };
  }
}

/**
 * Business logic errors
 */
export class BusinessError extends AppError {
  constructor(
    message: string = 'Business rule violation',
    code: ErrorCode = ErrorCode.BUSINESS_RULE_VIOLATION,
    context: ErrorContext = {}
  ) {
    super(message, code, 400, ErrorSeverity.MEDIUM, true, context);
  }
}

/**
 * System errors
 */
export class SystemError extends AppError {
  constructor(
    message: string = 'Internal system error',
    code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    context: ErrorContext = {}
  ) {
    super(message, code, 500, ErrorSeverity.CRITICAL, false, context);
  }
}

export class TimeoutError extends AppError {
  constructor(
    message: string = 'Operation timed out',
    context: ErrorContext = {}
  ) {
    super(message, ErrorCode.TIMEOUT_ERROR, 408, ErrorSeverity.MEDIUM, true, context);
  }
}

/**
 * Error factory functions
 */
export const ErrorFactory = {
  unauthorized: (message?: string, context?: ErrorContext) => 
    new AuthError(message, ErrorCode.UNAUTHORIZED, context),

  forbidden: (message?: string, context?: ErrorContext) => 
    new ForbiddenError(message, context),

  notFound: (message?: string, context?: ErrorContext) => 
    new NotFoundError(message, context),

  validation: (message?: string, fields?: Record<string, string[]>, context?: ErrorContext) => 
    new ValidationError(message, fields, context),

  database: (message?: string, context?: ErrorContext) => 
    new DatabaseError(message, ErrorCode.DATABASE_ERROR, context),

  externalService: (serviceName: string, message?: string, context?: ErrorContext) => 
    new ExternalServiceError(serviceName, message, ErrorCode.EXTERNAL_SERVICE_ERROR, context),

  rateLimit: (message?: string, retryAfter?: number, context?: ErrorContext) => 
    new RateLimitError(message, retryAfter, context),

  security: (message?: string, context?: ErrorContext) => 
    new SecurityError(message, ErrorCode.SUSPICIOUS_ACTIVITY, context),

  business: (message?: string, context?: ErrorContext) => 
    new BusinessError(message, ErrorCode.BUSINESS_RULE_VIOLATION, context),

  system: (message?: string, context?: ErrorContext) => 
    new SystemError(message, ErrorCode.INTERNAL_SERVER_ERROR, context),

  timeout: (message?: string, context?: ErrorContext) => 
    new TimeoutError(message, context),
};

/**
 * Type guards
 */
export const isAppError = (error: any): error is AppError => {
  return error instanceof AppError;
};

export const isOperationalError = (error: any): boolean => {
  return isAppError(error) && error.isOperational;
};

export const isHighSeverityError = (error: any): boolean => {
  return isAppError(error) && 
    (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL);
};