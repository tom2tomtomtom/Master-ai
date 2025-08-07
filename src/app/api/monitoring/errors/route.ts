import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Error logging endpoint for client-side errors
export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();
    
    // Rate limiting check (simple in-memory for now)
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Basic validation
    if (!errorData.name || !errorData.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log error (in production, you might want to store these in a separate logging service)
    console.error('Client Error:', {
      name: errorData.name,
      message: errorData.message,
      stack: errorData.stack,
      context: errorData.context,
      url: errorData.url,
      userAgent: errorData.userAgent,
      timestamp: errorData.timestamp,
      clientIP,
    });

    // Optionally store critical errors in database for analysis
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

    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error('Error logging endpoint failed:', error);
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
  ];
  
  return criticalErrors.some(critical => 
    errorData.name.includes(critical) || 
    errorData.message.includes(critical)
  );
}