export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  
  // Business logic errors
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  FEATURE_NOT_AVAILABLE = 'FEATURE_NOT_AVAILABLE',
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: any;
  
  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    isOperational = true,
    details?: any
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    
    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
    
    // Set prototype explicitly
    Object.setPrototypeOf(this, AppError.prototype);
  }
  
  toJSON() {
    return {
      error: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }
}

// Pre-defined error types
export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details?: any) {
    super(message, 400, ErrorCode.BAD_REQUEST, true, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details?: any) {
    super(message, 401, ErrorCode.UNAUTHORIZED, true, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details?: any) {
    super(message, 403, ErrorCode.FORBIDDEN, true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: any) {
    super(message, 404, ErrorCode.NOT_FOUND, true, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', details?: any) {
    super(message, 409, ErrorCode.CONFLICT, true, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: any) {
    super(message, 422, ErrorCode.VALIDATION_ERROR, true, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', details?: any) {
    super(message, 429, ErrorCode.RATE_LIMIT_EXCEEDED, true, details);
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error', details?: any) {
    super(message, 500, ErrorCode.INTERNAL_ERROR, false, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database error', details?: any) {
    super(message, 500, ErrorCode.DATABASE_ERROR, false, details);
  }
}

export class ExternalAPIError extends AppError {
  constructor(message = 'External API error', details?: any) {
    super(message, 502, ErrorCode.EXTERNAL_API_ERROR, false, details);
  }
}

// Helper function to create errors from unknown errors
export const createAppError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new InternalError(error.message, { originalError: error.name });
  }
  
  return new InternalError('An unknown error occurred', { error });
};
