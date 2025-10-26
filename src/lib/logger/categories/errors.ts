/**
 * Error Logging Category
 * 
 * Handles error logging events
 */

import winston from 'winston';
import { ExtendedUser } from '../../supabase-auth-middleware';
import { sanitizeLogData } from '../utils';

export class ErrorLogger {
  constructor(private logger: winston.Logger) {}

  unhandledError(error: Error, context?: any) {
    this.logger.error('Unhandled error occurred', {
      category: 'error',
      event: 'unhandled_error',
      message: error.message,
      stack: error.stack,
      name: error.name,
      context: sanitizeLogData(context)
    });
  }

  apiError(endpoint: string, error: Error, requestMeta: any, user?: ExtendedUser) {
    this.logger.error('API error', {
      category: 'error',
      event: 'api_error',
      endpoint,
      message: error.message,
      stack: error.stack,
      name: error.name,
      userId: user?.id,
      ...sanitizeLogData(requestMeta)
    });
  }

  databaseError(operation: string, error: Error, context?: any) {
    this.logger.error('Database error', {
      category: 'error',
      event: 'database_error',
      operation,
      message: error.message,
      stack: error.stack,
      name: error.name,
      context: sanitizeLogData(context)
    });
  }

  validationError(endpoint: string, errors: any[], requestMeta: any) {
    this.logger.warn('Validation error', {
      category: 'error',
      event: 'validation_error',
      endpoint,
      errors,
      ...sanitizeLogData(requestMeta)
    });
  }

  externalServiceError(service: string, operation: string, error: Error, context?: any) {
    this.logger.error('External service error', {
      category: 'error',
      event: 'external_service_error',
      service,
      operation,
      message: error.message,
      stack: error.stack,
      context: sanitizeLogData(context)
    });
  }

  clientError(source: string, error: Error, context?: any) {
    this.logger.error('Client-side error', {
      category: 'error',
      event: 'client_error',
      source,
      message: error.message,
      stack: error.stack,
      name: error.name,
      digest: (error as any).digest,
      context: sanitizeLogData(context)
    });
  }
}