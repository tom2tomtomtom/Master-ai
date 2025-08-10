/**
 * API Logging Middleware
 * 
 * This middleware provides comprehensive logging for all API routes including
 * request/response logging, performance tracking, and error handling.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  appLogger, 
  generateRequestId, 
  setRequestContext, 
  clearRequestContext, 
  extractRequestMetadata,
  createTimer,
  PerformanceTimer 
} from './logger';
import { getAuthenticatedUser, ExtendedUser } from './supabase-auth-middleware';
import { validateAPIRequest } from './security';

export interface ApiLogContext {
  requestId: string;
  user: ExtendedUser | null;
  startTime: number;
  timer: PerformanceTimer;
  endpoint: string;
}

/**
 * Higher-order function that wraps API handlers with comprehensive logging
 */
export function withApiLogging<T extends any[]>(
  handler: (request: NextRequest, context: ApiLogContext, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    const endpoint = request.nextUrl?.pathname || 'unknown';
    const timer = createTimer(`api_request:${endpoint}`);
    
    // Get authenticated user (if available)
    let user: ExtendedUser | null = null;
    try {
      user = await getAuthenticatedUser();
    } catch (error) {
      // User not authenticated or error getting user - continue without user context
      appLogger.debug('Could not get authenticated user in logging middleware', { error: error instanceof Error ? error.message : 'unknown' });
    }

    const requestMeta = extractRequestMetadata(request, user);
    
    // Set request context for correlation
    const context: ApiLogContext = {
      requestId,
      user,
      startTime,
      timer,
      endpoint
    };
    
    setRequestContext(requestId, context);

    // Log incoming request
    appLogger.info('API request started', {
      requestId,
      category: 'api',
      event: 'request_started',
      endpoint,
      method: request.method,
      userId: user?.id,
      userRole: user?.role,
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent
    });

    let response: NextResponse = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    let error: Error | null = null;

    try {
      // Validate request
      const validation = await validateAPIRequest(request);
      if (!validation.valid) {
        appLogger.security.rateLimitExceeded(
          requestMeta.ip, 
          endpoint, 
          { requestId, reason: validation.error }
        );
        
        response = NextResponse.json(
          { error: validation.error },
          { status: 429 }
        );
      } else {
        // Call the actual handler
        response = await handler(request, context, ...args);
      }
    } catch (handlerError) {
      error = handlerError instanceof Error ? handlerError : new Error(String(handlerError));
      
      // Log the error
      appLogger.errors.apiError(endpoint, error, { requestId, ...requestMeta }, user || undefined);
      
      // Return error response
      response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    } finally {
      const duration = timer.end();
      const status = response?.status || 500;
      
      // Log request completion
      appLogger.performance.apiRequest(
        endpoint,
        duration,
        status,
        { requestId, ...requestMeta },
        user || undefined
      );
      
      // Log specific security events
      if (status === 401) {
        appLogger.security.unauthorizedAccess(endpoint, user, { requestId, ...requestMeta });
      } else if (status === 403) {
        appLogger.security.unauthorizedAccess(endpoint, user, { requestId, ...requestMeta });
      }
      
      // Clean up request context
      clearRequestContext(requestId);
    }

    // Add request ID to response headers for tracing
    if (response) {
      response.headers.set('X-Request-ID', requestId);
    }

    return response;
  };
}

/**
 * Middleware specifically for authentication-related endpoints
 */
export function withAuthLogging<T extends any[]>(
  handler: (request: NextRequest, context: ApiLogContext, ...args: T) => Promise<NextResponse>
) {
  return withApiLogging(async (request: NextRequest, context: ApiLogContext, ...args: T) => {
    const response = await handler(request, context, ...args);
    
    // Log authentication events based on endpoint and response
    const endpoint = context.endpoint;
    const status = response.status;
    const requestMeta = extractRequestMetadata(request, context.user);
    
    if (endpoint.includes('/auth/signin')) {
      if (status === 200) {
        // Login success - we'll need to get user from response or context
        appLogger.security.loginSuccess(
          context.user || { id: 'unknown', email: 'unknown' } as ExtendedUser,
          { requestId: context.requestId, ...requestMeta }
        );
      } else {
        // Try to get email from request body for failed login
        try {
          const requestClone = request.clone();
          const body = await requestClone.json();
          appLogger.security.loginFailure(
            body.email || 'unknown',
            'Invalid credentials',
            { requestId: context.requestId, ...requestMeta }
          );
        } catch (err) {
          appLogger.security.loginFailure(
            'unknown',
            'Invalid credentials',
            { requestId: context.requestId, ...requestMeta }
          );
        }
      }
    }
    
    if (endpoint.includes('/auth/signup') && status === 201) {
      try {
        const responseData = await response.clone().json();
        appLogger.security.loginSuccess(
          responseData.user || { id: 'unknown', email: 'unknown' } as ExtendedUser,
          { requestId: context.requestId, ...requestMeta }
        );
      } catch (err) {
        // Could not parse response
      }
    }
    
    if (endpoint.includes('/auth/forgot-password')) {
      try {
        const requestClone = request.clone();
        const body = await requestClone.json();
        appLogger.security.passwordResetRequested(
          body.email || 'unknown',
          { requestId: context.requestId, ...requestMeta }
        );
      } catch (err) {
        // Could not parse request
      }
    }
    
    if (endpoint.includes('/auth/reset-password') && status === 200) {
      appLogger.security.passwordResetCompleted(
        context.user || { id: 'unknown', email: 'unknown' } as ExtendedUser,
        { requestId: context.requestId, ...requestMeta }
      );
    }
    
    return response;
  });
}

/**
 * Middleware for database operations logging
 */
export function withDatabaseLogging<T>(
  operation: string,
  table: string,
  fn: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const timer = createTimer(`db_operation:${operation}:${table}`);
    
    try {
      const result = await fn();
      const duration = timer.end();
      
      // Determine record count if result is an array
      const recordCount = Array.isArray(result) ? result.length : undefined;
      
      appLogger.performance.databaseQuery(operation, table, duration, recordCount);
      
      resolve(result);
    } catch (error) {
      const duration = timer.end();
      
      appLogger.errors.databaseError(
        `${operation}:${table}`,
        error instanceof Error ? error : new Error(String(error))
      );
      
      reject(error);
    }
  });
}

/**
 * Utility function to log user activity events
 */
export function logUserActivity(
  user: ExtendedUser,
  activity: 'profile_updated' | 'lesson_started' | 'lesson_completed' | 'subscription_changed',
  details: any,
  requestId?: string
) {
  const baseLog = {
    requestId,
    userId: user.id,
    userEmail: user.email,
    userRole: user.role
  };

  switch (activity) {
    case 'profile_updated':
      appLogger.userActivity.profileUpdated(user, details.changes || [], baseLog);
      break;
    case 'lesson_started':
      appLogger.userActivity.lessonStarted(user, details.lessonId, details.lessonTitle);
      break;
    case 'lesson_completed':
      appLogger.userActivity.lessonCompleted(user, details.lessonId, details.lessonTitle, details.duration);
      break;
    case 'subscription_changed':
      appLogger.userActivity.subscriptionChanged(user, details.oldTier, details.newTier, baseLog);
      break;
  }
}

/**
 * Utility function to log XSS attempts
 */
export function logXSSAttempt(suspiciousContent: string, request: NextRequest, user?: ExtendedUser | null) {
  const requestId = generateRequestId();
  const requestMeta = extractRequestMetadata(request, user);
  
  appLogger.security.xssAttemptBlocked(
    suspiciousContent,
    { requestId, ...requestMeta }
  );
}

/**
 * Utility function to log external service calls
 */
export function logExternalServiceCall(
  service: 'stripe' | 'supabase' | 'resend' | 'other',
  operation: string,
  success: boolean,
  duration: number,
  error?: Error,
  context?: any
) {
  if (success) {
    appLogger.info(`External service call successful`, {
      category: 'external_service',
      event: 'service_call_success',
      service,
      operation,
      duration,
      ...context
    });
  } else {
    appLogger.errors.externalServiceError(service, operation, error || new Error('Unknown error'), context);
  }
}