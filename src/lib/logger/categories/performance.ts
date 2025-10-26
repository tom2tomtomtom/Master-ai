/**
 * Performance Logging Category
 * 
 * Handles performance-related logging events
 */

import winston from 'winston';
import { ExtendedUser } from '../../supabase-auth-middleware';
import { sanitizeLogData } from '../utils';

export class PerformanceLogger {
  constructor(private logger: winston.Logger) {}

  apiRequest(endpoint: string, duration: number, status: number, requestMeta: any, user?: ExtendedUser) {
    const level = duration > 5000 ? 'warn' : status >= 400 ? 'warn' : 'info';
    
    this.logger.log(level, 'API request completed', {
      category: 'performance',
      event: 'api_request',
      endpoint,
      duration,
      status,
      userId: user?.id,
      slow: duration > 3000,
      ...sanitizeLogData(requestMeta)
    });
  }

  databaseQuery(operation: string, table: string, duration: number, recordCount?: number) {
    const level = duration > 1000 ? 'warn' : 'debug';
    
    this.logger.log(level, 'Database query executed', {
      category: 'performance',
      event: 'database_query',
      operation,
      table,
      duration,
      recordCount,
      slow: duration > 500
    });
  }

  slowOperation(operation: string, duration: number, context?: any) {
    this.logger.warn('Slow operation detected', {
      category: 'performance',
      event: 'slow_operation',
      operation,
      duration,
      ...sanitizeLogData(context)
    });
  }

  cacheHit(key: string, operation: string) {
    this.logger.debug('Cache hit', {
      category: 'performance',
      event: 'cache_hit',
      key,
      operation
    });
  }

  cacheMiss(key: string, operation: string) {
    this.logger.debug('Cache miss', {
      category: 'performance',
      event: 'cache_miss',
      key,
      operation
    });
  }
}