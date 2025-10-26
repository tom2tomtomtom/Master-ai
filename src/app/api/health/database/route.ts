import { NextResponse } from 'next/server';
import { checkDatabaseHealth, ensureConnection } from '@/lib/prisma';
import { appLogger } from '@/lib/logger';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  
  try {
    appLogger.info('database-health-check-start', {
      endpoint: '/api/health/database'
    });
    
    // Test connection establishment
    const canConnect = await ensureConnection();
    const connectionTime = Date.now() - startTime;
    
    if (!canConnect) {
      return NextResponse.json({
        status: 'unhealthy',
        database: 'disconnected',
        connectionTime: `${connectionTime}ms`,
        timestamp: new Date().toISOString(),
        error: 'Cannot establish database connection'
      }, { status: 503 });
    }
    
    // Test actual query execution
    const healthCheckStart = Date.now();
    const isHealthy = await checkDatabaseHealth();
    const queryTime = Date.now() - healthCheckStart;
    const totalTime = Date.now() - startTime;
    
    if (isHealthy) {
      appLogger.info('database-health-check-success', {
        endpoint: '/api/health/database',
        connectionTime,
        queryTime,
        totalTime
      });
      return NextResponse.json({
        status: 'healthy',
        database: 'connected',
        connectionTime: `${connectionTime}ms`,
        queryTime: `${queryTime}ms`,
        totalTime: `${totalTime}ms`,
        timestamp: new Date().toISOString()
      });
    } else {
      appLogger.errors.databaseError('database-health-check-failed', new Error('Database queries failing'), {
        endpoint: '/api/health/database',
        connectionTime,
        queryTime,
        totalTime
      });
      return NextResponse.json({
        status: 'unhealthy',
        database: 'query_failed',
        connectionTime: `${connectionTime}ms`,
        queryTime: `${queryTime}ms`,
        totalTime: `${totalTime}ms`,
        timestamp: new Date().toISOString(),
        error: 'Database queries failing'
      }, { status: 503 });
    }
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    appLogger.errors.apiError('database-health-check', error as Error, {
      endpoint: '/api/health/database',
      totalTime
    });
    
    return NextResponse.json({
      status: 'error',
      database: 'error',
      totalTime: `${totalTime}ms`,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}