import { Request, Response, NextFunction } from 'express';
import { AppError, createAppError } from '../utils/errors/AppError';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Async handler wrapper to catch async errors
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(
    `Cannot ${req.method} ${req.originalUrl}`,
    404,
    'NOT_FOUND' as any,
    true
  );
  next(error);
};

// Global error handler
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Generate error ID for tracking
  const errorId = uuidv4();
  
  // Convert to AppError if needed
  const appError = createAppError(err);
  
  // Log error details
  const logData = {
    errorId,
    code: appError.code,
    message: appError.message,
    statusCode: appError.statusCode,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: (req as any).user?.id,
    details: appError.details,
    stack: appError.stack,
  };
  
  // Log based on error type
  if (appError.isOperational) {
    logger.warn('Operational error', logData);
  } else {
    logger.error('System error', logData);
  }
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    appError.statusCode = 400;
    appError.message = 'Validation Error';
  }
  
  if (err.name === 'CastError') {
    appError.statusCode = 400;
    appError.message = 'Invalid ID format';
  }
  
  if (err.name === 'JsonWebTokenError') {
    appError.statusCode = 401;
    appError.message = 'Invalid token';
  }
  
  if (err.name === 'TokenExpiredError') {
    appError.statusCode = 401;
    appError.message = 'Token expired';
  }
  
  // Prepare response
  const response: any = {
    error: {
      id: errorId,
      code: appError.code,
      message: appError.message,
      statusCode: appError.statusCode,
    },
  };
  
  // Add details in development
  if (process.env.NODE_ENV === 'development') {
    response.error.details = appError.details;
    response.error.stack = appError.stack;
  }
  
  // Send error response
  res.status(appError.statusCode).json(response);
};

// Shutdown handler for graceful shutdown
export const shutdownHandler = (server: any) => {
  return (signal: string) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    
    server.close(() => {
      logger.info('HTTP server closed');
      
      // Close database connections
      // prisma.$disconnect();
      
      // Close Redis connections
      // redisClient.quit();
      
      process.exit(0);
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };
};

// Unhandled rejection handler
export const unhandledRejectionHandler = (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection', {
    reason,
    promise,
    stack: reason?.stack,
  });
  
  // In production, exit the process
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
};

// Uncaught exception handler
export const uncaughtExceptionHandler = (error: Error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  
  // Exit the process
  process.exit(1);
};
