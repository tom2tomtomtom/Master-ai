import { NextRequest, NextResponse } from 'next/server';

// Event tracking endpoint for analytics
export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json();
    
    // Basic validation
    if (!eventData.name || !eventData.type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Log event for analytics (in production, send to analytics service)
    console.log('Analytics Event:', {
      type: eventData.type,
      name: eventData.name,
      data: eventData.data,
      userId: eventData.userId,
      sessionId: eventData.sessionId,
      timestamp: eventData.timestamp,
      clientIP,
    });

    // In production, you would send this to your analytics service
    // await sendToAnalyticsService(eventData);

    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error('Event tracking endpoint failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}