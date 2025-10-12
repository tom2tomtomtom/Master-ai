import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { rateLimiters } from './src/middleware/rate-limit';
import { csrfProtection } from './src/middleware/csrf';
import { defaultSecurityHeaders, securityHeaders } from './src/middleware/security-headers';
import { requestIdMiddleware } from './src/middleware/request-id';
import { defaultErrorHandler } from './src/middleware/error-handler';

export async function middleware(request: NextRequest) {
  // Skip rate limiting for static files, images, and other assets
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Apply different rate limits based on path
  const pathname = request.nextUrl.pathname;

  try {
    let response = NextResponse.next();

    // Refresh Supabase session for authenticated requests
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    // Refresh session if expired - required for Server Components
    await supabase.auth.getUser();

    // Add request ID tracking
    response = requestIdMiddleware(request, response);

    // Authentication routes
    if (pathname.startsWith('/api/auth') || pathname.includes('signin') || pathname.includes('signup')) {
      const limitResult = await rateLimiters.auth(request, response);
      if (limitResult) return limitResult;
    }
    // Password reset routes
    else if (pathname.includes('reset-password') || pathname.includes('forgot-password')) {
      const limitResult = await rateLimiters.passwordReset(request, response);
      if (limitResult) return limitResult;
    }
    // Upload routes
    else if (pathname.includes('upload')) {
      const limitResult = await rateLimiters.upload(request, response);
      if (limitResult) return limitResult;
    }
    // Search routes
    else if (pathname.includes('search')) {
      const limitResult = await rateLimiters.search(request, response);
      if (limitResult) return limitResult;
    }
    // General API routes
    else if (pathname.startsWith('/api/')) {
      const limitResult = await rateLimiters.api(request, response);
      if (limitResult) return limitResult;
    }

    // Apply CSRF protection to API routes
    if (pathname.startsWith('/api/')) {
      const csrfResult = await csrfProtection(request, response);
      if (csrfResult) return csrfResult;
    }

    // Apply security headers
    if (pathname.startsWith('/api/')) {
      response = securityHeaders.api(request, response);
    } else {
      response = defaultSecurityHeaders(request, response);
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    // Use error handler for middleware errors
    return defaultErrorHandler(error, request);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};