import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Testing basic API function...');
    
    return NextResponse.json({
      success: true,
      message: 'Basic API working',
      environment: process.env.NODE_ENV,
      hasDbUrl: !!process.env.DATABASE_URL,
      hasDirectDbUrl: !!process.env.DIRECT_DATABASE_URL,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Basic test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV,
    }, { status: 500 });
  }
}