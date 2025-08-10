import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withApiLogging, ApiLogContext } from '@/lib/api-logging-middleware';
import { appLogger } from '@/lib/logger';

async function errorLoggingHandler(request: NextRequest, context: ApiLogContext) {
  try {
    const body = await request.json();
    
    // Handle both single error and batch of logs
    const errors = Array.isArray(body.logs) ? body.logs : [body];
    
    for (const errorData of errors) {
      // Basic validation
      if (!errorData.category && !errorData.name) {
        continue; // Skip invalid entries
      }

      // Determine if it's a client error or structured log entry
      if (errorData.error || errorData.name) {
        // Handle client error
        const clientError = errorData.error ? 
          new Error(errorData.error.message) : 
          new Error(errorData.message || 'Client error');
        
        if (errorData.error?.stack) {
          clientError.stack = errorData.error.stack;
        }

        appLogger.errors.unhandledError(clientError, {
          requestId: context.requestId,
          source: 'client',
          category: errorData.category || 'client_error',
          event: errorData.event || errorData.name,
          url: errorData.url,
          userAgent: errorData.userAgent,
          userId: errorData.userId,
          sessionId: errorData.sessionId,
          context: errorData.context,
          timestamp: errorData.timestamp
        });
      } else if (errorData.category && errorData.event) {
        // Handle structured log entry
        switch (errorData.level) {
          case 'error':
            appLogger.logError(errorData.message, {
              requestId: context.requestId,
              category: errorData.category,
              event: errorData.event,
              ...errorData.metadata
            });
            break;
          case 'warn':
            appLogger.warn(errorData.message, {
              requestId: context.requestId,
              category: errorData.category,
              event: errorData.event,
              ...errorData.metadata
            });
            break;
          default:
            appLogger.info(errorData.message, {
              requestId: context.requestId,
              category: errorData.category,
              event: errorData.event,
              ...errorData.metadata
            });
        }
      }

      // Store critical errors in database for analysis
      if (shouldStoreError(errorData)) {
        await prisma.stripeWebhookEvent.create({
          data: {
            stripeEventId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'client_error',
            data: errorData,
            processed: true,
          },
        });
      }
    }

    return NextResponse.json({ 
      success: true,
      processed: errors.length
    }, { status: 200 });
    
  } catch (error) {
    appLogger.errors.apiError(
      '/api/monitoring/errors',
      error instanceof Error ? error : new Error(String(error)),
      { requestId: context.requestId },
      context.user || undefined
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function shouldStoreError(errorData: any): boolean {
  // Store critical errors that need investigation
  const criticalErrors = [
    'payment_error',
    'authentication_error', 
    'database_error',
    'subscription_error',
    'security_violation',
    'data_corruption'
  ];
  
  const errorText = (errorData.name || '') + ' ' + (errorData.message || '') + ' ' + (errorData.event || '');
  
  return criticalErrors.some(critical => 
    errorText.toLowerCase().includes(critical.toLowerCase())
  );
}

export const POST = withApiLogging(errorLoggingHandler);