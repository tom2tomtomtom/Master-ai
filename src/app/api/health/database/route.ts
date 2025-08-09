import { NextResponse } from 'next/server';
import { checkDatabaseHealth, ensureConnection } from '@/lib/prisma';

export async function GET() {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Starting database health check...');
    
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
      console.log('✅ Database health check passed');
      return NextResponse.json({
        status: 'healthy',
        database: 'connected',
        connectionTime: `${connectionTime}ms`,
        queryTime: `${queryTime}ms`,
        totalTime: `${totalTime}ms`,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('❌ Database health check failed');
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
    console.error('💥 Database health check error:', error);
    
    return NextResponse.json({
      status: 'error',
      database: 'error',
      totalTime: `${totalTime}ms`,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}