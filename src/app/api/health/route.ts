import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Health check endpoint for monitoring systems
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check if this is a detailed health check
    const url = new URL(request.url);
    const detailed = url.searchParams.get('detailed') === 'true';
    
    const healthData: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    };

    // Basic health check - just return OK
    if (!detailed) {
      return NextResponse.json(healthData, { status: 200 });
    }

    // Detailed health checks
    const checks = await Promise.allSettled([
      // Database connectivity check
      checkDatabase(),
      
      // External services check
      checkExternalServices(),
      
      // System resources check
      checkSystemResources(),
    ]);

    // Process check results
    healthData.checks = {
      database: checks[0].status === 'fulfilled' ? checks[0].value : { status: 'unhealthy', error: (checks[0] as PromiseRejectedResult).reason },
      external: checks[1].status === 'fulfilled' ? checks[1].value : { status: 'unhealthy', error: (checks[1] as PromiseRejectedResult).reason },
      system: checks[2].status === 'fulfilled' ? checks[2].value : { status: 'unhealthy', error: (checks[2] as PromiseRejectedResult).reason },
    };

    // Calculate response time
    healthData.responseTime = Date.now() - startTime;

    // Determine overall health
    const allHealthy = Object.values(healthData.checks).every(
      (check: any) => check.status === 'healthy'
    );

    if (!allHealthy) {
      healthData.status = 'degraded';
      return NextResponse.json(healthData, { status: 503 });
    }

    return NextResponse.json(healthData, { status: 200 });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime,
    }, { status: 503 });
  }
}

async function checkDatabase() {
  const startTime = Date.now();
  
  try {
    // Simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Check connection pool status
    const connectionTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      connectionTime,
      message: 'Database connection successful',
    };
  } catch (error) {
    throw new Error(`Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function checkExternalServices() {
  const startTime = Date.now();
  
  try {
    const checks = await Promise.allSettled([
      // Check Stripe API (if configured)
      checkStripeApi(),
      
      // Check email service (if configured) 
      checkEmailService(),
    ]);

    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      services: {
        stripe: checks[0].status === 'fulfilled' ? 'healthy' : 'degraded',
        email: checks[1].status === 'fulfilled' ? 'healthy' : 'degraded',
      },
    };
  } catch (error) {
    throw new Error(`External services check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function checkStripeApi() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { status: 'not_configured' };
  }

  try {
    // Simple Stripe API check - retrieve account info
    const response = await fetch('https://api.stripe.com/v1/account', {
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Stripe API returned ${response.status}`);
    }

    return { status: 'healthy' };
  } catch (error) {
    throw new Error(`Stripe API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function checkEmailService() {
  // For now, just check if email service is configured
  const hasResend = !!process.env.RESEND_API_KEY;
  
  if (!hasResend) {
    return { status: 'not_configured' };
  }

  // In a real implementation, you might make a test API call to your email service
  return { status: 'healthy', configured: true };
}

async function checkSystemResources() {
  try {
    // Memory usage check
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    };

    // Check if memory usage is reasonable (< 512MB total)
    const isMemoryHealthy = memoryUsageMB.rss < 512;

    return {
      status: isMemoryHealthy ? 'healthy' : 'warning',
      memory: memoryUsageMB,
      uptime: Math.round(process.uptime()),
      nodeVersion: process.version,
    };
  } catch (error) {
    throw new Error(`System resources check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Also handle HEAD requests for basic health checks
export async function HEAD() {
  try {
    // Quick database check
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}