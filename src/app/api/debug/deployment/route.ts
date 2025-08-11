import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    gitCommit: process.env.VERCEL_GIT_COMMIT_SHA || 'local-development',
    nodeVersion: process.version,
    nextjsVersion: process.env.npm_package_dependencies_next || 'unknown',
    buildId: process.env.NEXT_RUNTIME || 'nodejs',
    environment: process.env.NODE_ENV || 'development',
    vercelUrl: process.env.VERCEL_URL || 'localhost',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  };

  return NextResponse.json(deploymentInfo, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}