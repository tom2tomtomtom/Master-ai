// CSRF protection middleware
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * CSRF protection middleware
 */
export async function csrfProtection(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const method = request.method.toUpperCase();
  
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return handler(request);
  }

  const cookieStore = cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  // Validate CSRF token
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }

  // Process request
  const response = await handler(request);
  
  // Refresh CSRF token for next request
  const newToken = generateCSRFToken();
  response.cookies.set(CSRF_COOKIE_NAME, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}

/**
 * Hook to get CSRF token on client side
 */
export function useCSRFToken(): { token: string | null; refreshToken: () => Promise<void> } {
  if (typeof window === 'undefined') {
    return { token: null, refreshToken: async () => {} };
  }

  const getToken = () => {
    const match = document.cookie.match(new RegExp(`(^| )${CSRF_COOKIE_NAME}=([^;]+)`));
    return match ? match[2] : null;
  };

  const refreshToken = async () => {
    const response = await fetch('/api/csrf-token');
    if (response.ok) {
      const data = await response.json();
      return data.token;
    }
    return null;
  };

  return {
    token: getToken(),
    refreshToken,
  };
}

/**
 * Client-side fetch wrapper with CSRF token
 */
export async function fetchWithCSRF(url: string, options: RequestInit = {}): Promise<Response> {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${CSRF_COOKIE_NAME}=`))
    ?.split('=')[1];

  const headers = new Headers(options.headers);
  if (token) {
    headers.set(CSRF_HEADER_NAME, token);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

// API route to get CSRF token
export async function GET() {
  const token = generateCSRFToken();
  
  const response = NextResponse.json({ token });
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}