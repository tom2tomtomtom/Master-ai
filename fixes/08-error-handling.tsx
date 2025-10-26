// Global error handler and error boundary
import React from 'react';
import * as Sentry from '@sentry/nextjs';
import { appLogger } from '@/lib/logger';

// Custom error types
export class ApplicationError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, context?: any) {
    super(message, 400, true, context);
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication required', context?: any) {
    super(message, 401, true, context);
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Insufficient permissions', context?: any) {
    super(message, 403, true, context);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string = 'Resource not found', context?: any) {
    super(message, 404, true, context);
  }
}

export class RateLimitError extends ApplicationError {
  constructor(message: string = 'Too many requests', context?: any) {
    super(message, 429, true, context);
  }
}

// Error handler for API routes
export async function handleApiError(
  error: any,
  path: string,
  userId?: string
): Promise<Response> {
  // Log the error
  appLogger.errors.apiError(path, error, { userId });

  // Report to Sentry if not operational
  if (error instanceof ApplicationError && !error.isOperational) {
    Sentry.captureException(error, {
      tags: { path, userId },
      extra: error.context,
    });
  } else if (!(error instanceof ApplicationError)) {
    Sentry.captureException(error, {
      tags: { path, userId },
    });
  }

  // Prepare error response
  const statusCode = error instanceof ApplicationError ? error.statusCode : 500;
  const message = error instanceof ApplicationError 
    ? error.message 
    : 'An unexpected error occurred';

  return new Response(
    JSON.stringify({
      error: message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        context: error.context,
      }),
    }),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// React Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    appLogger.errors.clientError(error, {
      componentStack: errorInfo.componentStack,
    });

    // Report to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Oops! Something went wrong
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                We're sorry for the inconvenience. Please try refreshing the page.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 p-4 bg-red-50 rounded-md">
                  <summary className="cursor-pointer text-sm font-medium text-red-800">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 overflow-auto">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}
              <button
                onClick={() => window.location.reload()}
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Async error handler wrapper for API routes
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      const [request] = args;
      const path = request?.url || 'unknown';
      return handleApiError(error, path);
    }
  }) as T;
}
