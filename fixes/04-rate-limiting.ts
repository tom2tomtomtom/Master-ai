// Rate limiting middleware for API routes
import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: NextRequest) => string;
  skip?: (req: NextRequest) => boolean;
  handler?: (req: NextRequest) => NextResponse;
}

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

// Create a global cache for rate limiting
const rateLimitCache = new LRUCache<string, RateLimitInfo>({
  max: 10000, // Maximum number of keys
  ttl: 15 * 60 * 1000, // 15 minutes
});

/**
 * Rate limiting middleware for Next.js API routes
 */
export function rateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message = 'Too many requests, please try again later.',
    keyGenerator = (req) => getClientIp(req) || 'anonymous',
    skip = () => false,
    handler = (req) => {
      return NextResponse.json(
        { error: message },
        { 
          status: 429,
          headers: {
            'Retry-After': String(windowMs / 1000),
            'X-RateLimit-Limit': String(max),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString(),
          }
        }
      );
    }
  } = options;

  return async function rateLimitMiddleware(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    // Skip rate limiting if configured
    if (skip(request)) {
      return handler(request);
    }

    const key = keyGenerator(request);
    const now = Date.now();

    // Get current rate limit info
    let info = rateLimitCache.get(key);

    if (!info || now > info.resetTime) {
      // Create new rate limit window
      info = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    info.count++;
    rateLimitCache.set(key, info);

    // Set rate limit headers
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', String(max));
    headers.set('X-RateLimit-Remaining', String(Math.max(0, max - info.count)));
    headers.set('X-RateLimit-Reset', new Date(info.resetTime).toISOString());

    // Check if limit exceeded
    if (info.count > max) {
      return handler(request);
    }

    // Process request
    const response = await handler(request);
    
    // Add rate limit headers to response
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

/**
 * Extract client IP from request
 */
function getClientIp(req: NextRequest): string | null {
  // Check various headers for client IP
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to remote address
  return req.headers.get('remote-addr') || null;
}

/**
 * Create rate limiter for authentication endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later.',
  keyGenerator: (req) => {
    // Use email if available in body, otherwise IP
    const body = req.body as any;
    return body?.email || getClientIp(req) || 'anonymous';
  },
});

/**
 * Create rate limiter for API endpoints
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});

/**
 * Create strict rate limiter for sensitive operations
 */
export const strictRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Rate limit exceeded for this operation.',
});

// Helper function to wrap route handlers with rate limiting
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  rateLimiter = apiRateLimit
) {
  return (req: NextRequest) => rateLimiter(req, handler);
}
