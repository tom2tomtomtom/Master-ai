import { NextRequest, NextResponse } from 'next/server';
import { appLogger } from '@/lib/logger';
import { PerformanceMetricData, ApiSuccessResponse, ApiErrorResponse } from '@/types/api';

// Performance metrics endpoint

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest): Promise<NextResponse<ApiSuccessResponse<{ success: true }> | ApiErrorResponse>> {
  let metricData: PerformanceMetricData | null = null;
  try {
    metricData = await request.json() as PerformanceMetricData;
    
    // Basic validation
    if (!metricData.name || typeof metricData.value !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log performance metric
    appLogger.info('Performance metric recorded', {
      metricName: metricData.name,
      value: metricData.value,
      unit: metricData.unit,
      tags: metricData.tags,
      timestamp: metricData.timestamp,
    });

    // In production, you would send this to your monitoring service
    // await sendToMonitoringService(metricData);
    
    // Alert on critical performance issues
    if (shouldAlert(metricData)) {
      appLogger.warn('Performance alert triggered', {
        metricName: metricData.name,
        value: metricData.value,
        threshold: getAlertThreshold(metricData.name),
        tags: metricData.tags
      });
      // await sendPerformanceAlert(metricData);
    }

    return NextResponse.json({ success: true, data: { success: true } }, { status: 200 });
    
  } catch (error) {
    appLogger.errors.apiError('monitoring/performance', error as Error, {
      context: 'performance_tracking_endpoint',
      metricData: metricData || null
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getAlertThreshold(metricName: string): number | undefined {
  const alertThresholds = {
    'LCP': 4000, // Largest Contentful Paint > 4s
    'FID': 300,  // First Input Delay > 300ms
    'CLS': 0.25, // Cumulative Layout Shift > 0.25
    'page_load_time': 10000, // Page load > 10s
    'slow_resource_load': 5000, // Resource load > 5s
  };
  
  return alertThresholds[metricName as keyof typeof alertThresholds];
}

function shouldAlert(metricData: PerformanceMetricData): boolean {
  const threshold = getAlertThreshold(metricData.name);
  return Boolean(threshold && metricData.value > threshold);
}