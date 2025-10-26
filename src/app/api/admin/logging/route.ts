import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/supabase-auth-middleware';
// Dynamic imports to prevent client-side bundling of server modules

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

async function loggingDashboardHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'stats';

  switch (action) {
    case 'stats':
      return handleLoggingStats();
    
    case 'config':
      return handleConfigValidation();
    
    case 'test':
      return handleLoggingTest();
    
    case 'performance':
      return handlePerformanceMetrics();
    
    case 'query-stats':
      return handleQueryStats();
    
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

async function handleLoggingStats() {
  try {
    const { getLoggingStats } = await import('@/lib/logging-config');
    const stats = getLoggingStats();
    
    // Add additional system information
    const systemStats = {
      ...stats,
      logLevels: ['error', 'warn', 'info', 'debug', 'trace'],
      categories: [
        'security',
        'performance', 
        'user_activity',
        'system',
        'error',
        'database',
        'api'
      ],
      features: {
        structuredLogging: true,
        requestCorrelation: true,
        databaseLogging: true,
        clientLogging: true,
        performanceMonitoring: true,
        errorTracking: true,
        xssDetection: true,
        rateLimitLogging: true
      }
    };

    return NextResponse.json({
      success: true,
      data: systemStats
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get logging statistics'
    }, { status: 500 });
  }
}

async function handleConfigValidation() {
  try {
    const { validateLoggingConfig } = await import('@/lib/logging-config');
    const validation = validateLoggingConfig();
    
    return NextResponse.json({
      success: true,
      data: {
        valid: validation.valid,
        errors: validation.errors,
        environment: process.env.NODE_ENV,
        configuredFeatures: {
          winston: true,
          dailyRotateFile: true,
          prismaLogging: true,
          apiMiddleware: true,
          clientLogging: true,
          xssDetection: true,
          performanceTracking: true
        }
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to validate logging configuration'
    }, { status: 500 });
  }
}

async function handleLoggingTest() {
  try {
    const { testLoggingSystem } = await import('@/lib/logging-config');
    const testResult = await testLoggingSystem();
    
    return NextResponse.json({
      success: testResult.success,
      data: {
        testsPassed: testResult.success,
        errors: testResult.errors,
        timestamp: new Date().toISOString(),
        testCategories: [
          'structured_logging',
          'security_events',
          'performance_metrics', 
          'error_handling',
          'database_logging'
        ]
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to run logging system tests'
    }, { status: 500 });
  }
}

async function handlePerformanceMetrics() {
  try {
    const { LoggingPerformanceMonitor } = await import('@/lib/logging-config');
    const metrics = LoggingPerformanceMonitor.getMetrics();
    
    return NextResponse.json({
      success: true,
      data: {
        metrics,
        timestamp: new Date().toISOString(),
        description: 'Performance metrics for logging operations'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get performance metrics'
    }, { status: 500 });
  }
}

async function handleQueryStats() {
  try {
    const { queryAnalyzer } = await import('@/lib/prisma-logging');
    const queryStats = queryAnalyzer.getAllStats();
    
    return NextResponse.json({
      success: true,
      data: {
        totalQueries: queryStats.length,
        queries: queryStats.slice(0, 20), // Limit to top 20
        timestamp: new Date().toISOString(),
        description: 'Database query performance statistics'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get query statistics'
    }, { status: 500 });
  }
}

export const GET = withAdminAuth(loggingDashboardHandler);