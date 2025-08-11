/**
 * Logger Utilities
 * 
 * Utility functions for logging operations
 */

import { NextRequest } from 'next/server';
import { ExtendedUser } from '../supabase-auth-middleware';

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
export function sanitizeLogData(data: any): any {
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
 * Utility function for performance timing
 */
export class PerformanceTimer {
  private startTime: number;
  private operation: string;

  constructor(operation: string) {
    this.operation = operation;
    this.startTime = Date.now();
  }

  end(context?: any) {
    const duration = Date.now() - this.startTime;
    return { duration, operation: this.operation, context };
  }
}

export function createTimer(operation: string): PerformanceTimer {
  return new PerformanceTimer(operation);
}