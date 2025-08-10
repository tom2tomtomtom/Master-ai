import { NextRequest, NextResponse } from 'next/server';

// Performance metrics endpoint

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  try {
    const metricData = await request.json();
    
    // Basic validation
    if (!metricData.name || typeof metricData.value !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log performance metric
    console.log('Performance Metric:', {
      name: metricData.name,
      value: metricData.value,
      unit: metricData.unit,
      tags: metricData.tags,
      timestamp: metricData.timestamp,
    });

    // In production, you would send this to your monitoring service
    // await sendToMonitoringService(metricData);
    
    // Alert on critical performance issues
    if (shouldAlert(metricData)) {
      console.warn('Performance Alert:', metricData);
      // await sendPerformanceAlert(metricData);
    }

    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error('Performance tracking endpoint failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function shouldAlert(metricData: any): boolean {
  // Define thresholds for performance alerts
  const alertThresholds = {
    'LCP': 4000, // Largest Contentful Paint > 4s
    'FID': 300,  // First Input Delay > 300ms
    'CLS': 0.25, // Cumulative Layout Shift > 0.25
    'page_load_time': 10000, // Page load > 10s
    'slow_resource_load': 5000, // Resource load > 5s
  };
  
  const threshold = alertThresholds[metricData.name as keyof typeof alertThresholds];
  return Boolean(threshold && metricData.value > threshold);
}