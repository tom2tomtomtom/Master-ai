import { NextResponse } from 'next/server';
import { getAvailableOAuthProviders } from '@/lib/auth-config';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const providers = getAvailableOAuthProviders();
    
    return NextResponse.json({
      success: true,
      providers: providers.map(p => ({
        id: p.id,
        name: p.name,
      })),
    });
  } catch (error) {
    console.error('Error getting auth providers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get auth providers',
        providers: []
      },
      { status: 500 }
    );
  }
}