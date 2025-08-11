import { NextRequest } from 'next/server';
import { handleCSRFToken } from '@/middleware/csrf';

export async function GET(request: NextRequest) {
  return handleCSRFToken(request);
}